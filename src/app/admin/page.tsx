'use client';

/**
 * « Ma journée » — poste de pilotage quotidien de Noctura (refonte Espace
 * unifié 2026-08-22). RDV du jour/demain avec actions directes, alertes
 * actionnables (Interac à confirmer, séances à compléter), compteurs du mois
 * et raccourcis. Remplace l'ancien hub à cartes (les sections vivent dans le
 * menu latéral).
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import CompleteAppointmentButton from '@/app/(holistique)/soins/dashboard/praticien/CompleteAppointmentButton';
import RescheduleButton from '@/app/(holistique)/soins/dashboard/praticien/RescheduleButton';

interface Rdv {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string | null;
  paymentMode: string | null;
  totalAmount: number | null;
  depositAmount: number | null;
  remainingAmount: number | null;
  depositPaidAt: string | null;
  formationEnrollmentId: string | null;
  client: { id: string; firstName: string; lastName: string; phone: string | null };
  payment: { status: string; amountTotal: number } | null;
}
interface Donnees {
  rdvJour: Rdv[];
  interacEnAttente: Rdv[];
  aCompleter: Rdv[];
  stats: { revenusMois: number; completeesMois: number; rdvAVenir: number };
}

function service(notes: string | null): string {
  return notes?.match(/Service\s*:\s*([^\n]+)/)?.[1]?.trim() ?? 'Séance';
}
function fheure(s: string): string {
  return new Intl.DateTimeFormat('fr-CA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Montreal' }).format(new Date(s));
}
function fjour(s: string): string {
  return new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Montreal' }).format(new Date(s));
}

/**
 * Mode de paiement en clair. `paymentMode` null = parcours public Stripe, donc
 * carte de crédit : c'est le cas le plus courant et il n'a pas d'étiquette en
 * base. Sans ça, un RDV « lien de paiement » s'affichait « Interac non
 * confirmé », ce qui est faux.
 */
function modePaiement(r: Rdv): { icone: string; label: string } {
  switch (r.paymentMode) {
    case 'INTERAC': return { icone: '💰', label: 'Virement Interac' };
    case 'STRIPE_LINK': return { icone: '🔗', label: 'Lien de paiement' };
    case 'CASH': return { icone: '💵', label: 'Comptant' };
    case 'FORMATION_CREDIT': return { icone: '🎟️', label: 'Jeton de formation' };
    default: return { icone: '💳', label: 'Carte de crédit' };
  }
}

/** Une ligne du panneau « À régler » : soit l'argent n'est pas entré, soit la séance reste à clôturer. */
type Alerte = { r: Rdv; genre: 'PAIEMENT' | 'COMPLETER' };

export default function MaJourneePage() {
  const [data, setData] = useState<Donnees | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/ma-journee');
    if (res.ok) setData(await res.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  async function marquerInteracRecu(id: string, nom: string) {
    if (!confirm(`Confirmer que le virement Interac de ${nom} a été reçu dans le compte bancaire ?`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/holistique/appointments/${id}/mark-paid`, { method: 'POST' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { alert(j.error ?? 'Échec.'); return; }
      setFlash(`Virement de ${nom} confirmé ✓`);
      setTimeout(() => setFlash(null), 4000);
      await load();
    } finally { setBusy(null); }
  }

  /**
   * Efface le RDV pour de bon (ménage des tests et des réservations fantômes).
   * Double confirmation dès qu'un montant a été encaissé : la suppression
   * emporte aussi les reçus, donc elle touche à la comptabilité.
   */
  async function supprimer(r: Rdv) {
    const nom = `${r.client.firstName} ${r.client.lastName}`;
    const montant = (r.payment?.amountTotal ?? r.totalAmount ?? 0).toFixed(2);
    const encaisse = r.payment?.status === 'PAID' || !!r.depositPaidAt;
    let msg = `EFFACER DÉFINITIVEMENT le rendez-vous de ${nom} du ${fjour(r.startsAt)} (${montant} $) ?\n\n`
      + `Il disparaîtra de « À régler », du calendrier, de la fiche de la cliente et des statistiques. C'est irréversible.`;
    if (encaisse) msg += `\n\n⚠ De l'argent a déjà été encaissé sur ce rendez-vous : les reçus liés seront effacés eux aussi.`;
    if (!confirm(msg)) return;
    if (encaisse && !confirm(`Dernière confirmation : effacer pour de bon le rendez-vous PAYÉ de ${nom} ?`)) return;
    setBusy(r.id);
    try {
      const res = await fetch(`/api/holistique/appointments/${r.id}`, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { alert(j.error ?? 'Échec de la suppression.'); return; }
      setFlash(`Rendez-vous de ${nom} effacé définitivement.`);
      setTimeout(() => setFlash(null), 4000);
      await load();
    } finally { setBusy(null); }
  }

  const card = 'rounded-xl border border-gray-200 bg-white p-5';
  const aujourdHui = new Date(); aujourdHui.setHours(23, 59, 59, 999);
  const rdvAujourdhui = data?.rdvJour.filter((r) => new Date(r.startsAt) <= aujourdHui) ?? [];
  const rdvDemain = data?.rdvJour.filter((r) => new Date(r.startsAt) > aujourdHui) ?? [];

  // « À régler » = les deux problèmes dans une seule liste, dédoublonnée par id
  // au cas où un RDV tomberait dans les deux requêtes du serveur.
  const alertes: Alerte[] = [];
  const vus = new Set<string>();
  for (const r of data?.interacEnAttente ?? []) { if (!vus.has(r.id)) { vus.add(r.id); alertes.push({ r, genre: 'PAIEMENT' }); } }
  for (const r of data?.aCompleter ?? []) { if (!vus.has(r.id)) { vus.add(r.id); alertes.push({ r, genre: 'COMPLETER' }); } }

  function CarteRdv({ r }: { r: Rdv }) {
    const estFormation = !!r.formationEnrollmentId;
    const paye = r.payment?.status === 'PAID';
    const interacPending = (r.paymentMode === 'INTERAC' || r.paymentMode === 'STRIPE_LINK') && !paye;
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
        <div className="min-w-[52px] font-cinzel text-sm font-bold text-[#4A2D7A]">{fheure(r.startsAt)}</div>
        <div className="min-w-[180px] flex-1">
          <Link href={`/admin/clients/${r.client.id}`} className="font-semibold text-gray-800 hover:text-[#6B3FA0]">
            {r.client.firstName} {r.client.lastName}
          </Link>
          <div className="text-sm text-gray-500">
            {estFormation ? '📚 ' : ''}{service(r.notes)}
            {r.status === 'COMPLETED' && <span className="ml-2 text-green-700">✓ complétée</span>}
          </div>
          {interacPending && (
            <div className="mt-1 text-xs font-semibold text-amber-700">
              ⏳ {modePaiement(r).label} — paiement non confirmé, {(r.payment?.amountTotal ?? r.totalAmount ?? 0).toFixed(2)} $
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {interacPending && (
            <button
              type="button"
              disabled={busy === r.id}
              onClick={() => marquerInteracRecu(r.id, r.client.firstName)}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              ✓ {r.paymentMode === 'INTERAC' ? 'Virement reçu' : 'Paiement reçu'}
            </button>
          )}
          {r.status === 'CONFIRMED' && (
            <CompleteAppointmentButton
              appointmentId={r.id}
              clientName={`${r.client.firstName} ${r.client.lastName}`}
              remainingAmount={r.remainingAmount ?? 0}
              depositAmount={r.depositAmount ?? 0}
              totalAmount={r.totalAmount ?? 0}
              onDone={load}
            />
          )}
          {r.status === 'CONFIRMED' && (
            <RescheduleButton appointmentId={r.id} currentStartsAt={r.startsAt} variant="light" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-cinzel text-2xl text-[#2D1B4E]">Ma journée</h1>
          <p className="text-sm capitalize text-gray-500">{fjour(new Date().toISOString())}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/calendrier" className="rounded-lg bg-gradient-to-r from-[#6B3FA0] to-[#4A2D7A] px-4 py-2.5 text-sm font-semibold text-white">
            + Ajouter un RDV
          </Link>
          <Link href="/admin/calendrier" className="rounded-lg border border-[#6B3FA0] px-4 py-2.5 text-sm font-semibold text-[#6B3FA0]">
            Calendrier →
          </Link>
        </div>
      </div>

      {flash && <p className="mb-4 rounded-lg bg-green-100 px-4 py-2.5 text-sm text-green-800">{flash}</p>}

      {/* Compteurs */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { v: `${(data?.stats.revenusMois ?? 0).toFixed(0)} $`, l: 'Revenus ce mois' },
          { v: String(data?.stats.completeesMois ?? '—'), l: 'Séances complétées' },
          { v: String(data?.stats.rdvAVenir ?? '—'), l: 'RDV à venir' },
        ].map((s, i) => (
          <div key={i} className={`${card} text-center`}>
            <div className="font-cinzel text-xl font-bold text-[#4A2D7A]">{s.v}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Alertes — paiements jamais confirmés et séances passées à clôturer */}
      {alertes.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="mb-3 font-cinzel text-sm uppercase tracking-wide text-amber-800">⚠ À régler</h2>
          <div className="flex flex-col gap-2">
            {alertes.map(({ r, genre }) => {
              const mode = modePaiement(r);
              const montant = (r.payment?.amountTotal ?? r.totalAmount ?? 0).toFixed(2);
              const solde = r.remainingAmount ?? 0;
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white/60 px-3 py-2 text-sm text-amber-900">
                  <div className="min-w-[240px] flex-1">
                    <div>
                      <span className="mr-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                        {mode.icone} {mode.label}
                      </span>
                      <strong>{r.client.firstName} {r.client.lastName}</strong>, {montant} $ ({fjour(r.startsAt)})
                    </div>
                    <div className="mt-0.5 text-xs text-amber-700">
                      {genre === 'PAIEMENT'
                        ? '⏳ Paiement jamais confirmé — l’argent n’est peut-être jamais entré'
                        : solde > 0
                          ? `🕐 Séance passée à compléter — solde de ${solde.toFixed(2)} $ à prélever sur la carte`
                          : '🕐 Séance passée à compléter — rien à prélever, tout est déjà payé'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {genre === 'PAIEMENT' ? (
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => marquerInteracRecu(r.id, r.client.firstName)}
                        className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        ✓ {r.paymentMode === 'INTERAC' ? 'Virement reçu' : 'Paiement reçu'}
                      </button>
                    ) : (
                      <CompleteAppointmentButton
                        appointmentId={r.id}
                        clientName={`${r.client.firstName} ${r.client.lastName}`}
                        remainingAmount={solde}
                        depositAmount={r.depositAmount ?? 0}
                        totalAmount={r.totalAmount ?? 0}
                        onDone={load}
                      />
                    )}
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => supprimer(r)}
                      title="Effacer définitivement ce rendez-vous"
                      className="rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      🗑 Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RDV du jour */}
      <div className={`${card} mb-5`}>
        <h2 className="mb-3 font-cinzel text-sm uppercase tracking-wide text-[#2D1B4E]">Aujourd’hui</h2>
        {!data ? <p className="text-sm text-gray-500">Chargement…</p>
          : rdvAujourdhui.length === 0 ? <p className="text-sm text-gray-500">Aucun rendez-vous aujourd’hui 🌙</p>
          : <div className="flex flex-col gap-2">{rdvAujourdhui.map((r) => <CarteRdv key={r.id} r={r} />)}</div>}
      </div>

      {/* RDV de demain */}
      <div className={`${card} mb-5`}>
        <h2 className="mb-3 font-cinzel text-sm uppercase tracking-wide text-[#2D1B4E]">Demain</h2>
        {!data ? <p className="text-sm text-gray-500">Chargement…</p>
          : rdvDemain.length === 0 ? <p className="text-sm text-gray-500">Rien de prévu demain pour l’instant.</p>
          : <div className="flex flex-col gap-2">{rdvDemain.map((r) => <CarteRdv key={r.id} r={r} />)}</div>}
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/admin/eleves', label: 'ᚱ Mes élèves' },
          { href: '/admin/clients', label: 'ᛗ Mes clientes' },
          { href: '/admin/conversations', label: '💬 Messages' },
          { href: '/admin/recus', label: 'ᚠ Reçus' },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm font-semibold text-[#4A2D7A] hover:border-[#6B3FA0]">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
