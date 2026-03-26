'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import RuneDivider from '@/components/ui/RuneDivider';

const MONTHS_FR = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];

interface AppointmentData {
  id: string; clientName: string; clientEmail: string; date: string;
  startTime: string; endTime: string; status: string;
  service: { name: string; emoji: string; durationMinutes: number; price: number | null; colorHex: string; };
}

export default function ConfirmationPage() {
  const params = useParams();
  const token = params.token as string;
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    fetch(`/api/public/appointments/${token}`)
      .then((r) => { if (!r.ok) throw new Error('Introuvable'); return r.json(); })
      .then(setAppointment)
      .catch(() => setError('Rendez-vous introuvable'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    if (!confirm('Etes-vous sur de vouloir annuler cette seance?')) return;
    setCancelling(true);
    const res = await fetch(`/api/public/appointments/${token}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Erreur'); setCancelling(false); return; }
    setCancelled(true); setCancelling(false);
  };

  if (loading) return (
    <section className="py-24 px-4 text-center">
      <div className="text-4xl animate-glow-pulse text-or-ancien select-none">&#10022;</div>
      <p className="mt-4 text-parchemin-vieilli/60 font-philosopher italic">Chargement...</p>
    </section>
  );

  if (error) return (
    <section className="py-24 px-4 text-center">
      <h1 className="font-cinzel-decorative text-2xl text-gradient-gold mb-4">Rendez-vous introuvable</h1>
      <p className="text-parchemin-vieilli/60 font-philosopher mb-8">Ce lien n&apos;est pas valide ou le rendez-vous n&apos;existe plus.</p>
      <Link href="/reserver" className="font-cinzel text-sm text-or-ancien hover:text-or-clair transition-colors tracking-wider">Prendre un nouveau rendez-vous</Link>
    </section>
  );

  if (!appointment) return null;

  const [y, m, d] = appointment.date.split('-').map(Number);
  const displayDate = `${d} ${MONTHS_FR[m - 1]} ${y}`;
  const isCancelled = cancelled || appointment.status === 'cancelled';

  const statusMap: Record<string, { text: string; color: string }> = {
    pending: { text: 'En attente', color: 'text-or-ancien' },
    confirmed: { text: 'Confirmee', color: 'text-turquoise-cristal' },
    cancelled: { text: 'Annulee', color: 'text-magenta-rituel' },
    completed: { text: 'Completee', color: 'text-turquoise-cristal' },
  };
  const status = isCancelled ? statusMap.cancelled : statusMap[appointment.status] || statusMap.pending;

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-lg mx-auto text-center">
        <div className="text-5xl text-or-ancien mb-6 select-none animate-glow-pulse">{appointment.service.emoji}</div>
        <h1 className="font-cinzel-decorative text-2xl md:text-3xl text-gradient-gold mb-2">Votre Seance</h1>
        <p className={`font-cinzel text-sm tracking-wider mb-8 ${status.color}`}>{status.text}</p>
        <RuneDivider className="mb-8" />
        <div className="bg-charbon-mystere border border-or-ancien/20 rounded-sm p-8 text-left mb-8">
          <div className="space-y-4 text-base font-cormorant">
            <div className="flex justify-between"><span className="text-parchemin-vieilli/60">Nom</span><span className="text-parchemin">{appointment.clientName}</span></div>
            <div className="h-px bg-violet-royal/15" />
            <div className="flex justify-between"><span className="text-parchemin-vieilli/60">Service</span><span className="text-parchemin font-cinzel text-sm">{appointment.service.name}</span></div>
            <div className="h-px bg-violet-royal/15" />
            <div className="flex justify-between"><span className="text-parchemin-vieilli/60">Date</span><span className="text-parchemin">{displayDate}</span></div>
            <div className="h-px bg-violet-royal/15" />
            <div className="flex justify-between"><span className="text-parchemin-vieilli/60">Heure</span><span className="text-parchemin">{appointment.startTime.replace(':', 'h')} - {appointment.endTime.replace(':', 'h')}</span></div>
            <div className="h-px bg-violet-royal/15" />
            <div className="flex justify-between"><span className="text-parchemin-vieilli/60">Duree</span><span className="text-parchemin">{appointment.service.durationMinutes} min</span></div>
            {appointment.service.price && (
              <><div className="h-px bg-or-ancien/20" /><div className="flex justify-between font-cinzel"><span className="text-or-ancien/70">Prix</span><span className="text-or-ancien">{appointment.service.price.toFixed(2).replace('.', ',')} $</span></div></>
            )}
          </div>
        </div>
        {!isCancelled && appointment.status !== 'completed' && (
          <button type="button" onClick={handleCancel} disabled={cancelling}
            className="px-6 py-3 font-cinzel text-sm tracking-wider text-magenta-rituel/70 border border-magenta-rituel/20 rounded-sm hover:border-magenta-rituel/50 hover:text-magenta-rituel transition-all duration-300">
            {cancelling ? 'Annulation...' : 'Annuler ma seance'}
          </button>
        )}
        <div className="mt-10">
          <Link href="/reserver" className="font-cinzel text-sm text-parchemin-vieilli/40 hover:text-or-ancien transition-colors tracking-wider">Prendre un autre rendez-vous</Link>
        </div>
      </div>
    </section>
  );
}
