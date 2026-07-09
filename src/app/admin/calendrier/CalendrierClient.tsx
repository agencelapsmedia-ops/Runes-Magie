'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import type { EventClickArg } from '@fullcalendar/core';
import ManualAppointmentButton from '@/components/holistique/ManualAppointmentButton';

export interface RdvSerialise {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string; // PENDING | CONFIRMED | CANCELLED | COMPLETED
  practitionerId: string;
  practitionerName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  notes: string | null;
  paymentMode: string | null;
  paymentStatus: string | null; // PENDING | PAID | REFUNDED | FAILED
}

export interface PraticienneInfo {
  id: string;
  name: string;
}

export interface PractitionerOption {
  id: string;
  name: string;
  offerings: { id: string; name: string; durationMinutes: number; price: number }[];
}

/** Une couleur stable par praticienne (cycle si plus de couleurs que de praticiennes). */
const COULEURS = ['#6B3FA0', '#2EC4B6', '#C9A84C', '#E4572E', '#3B82F6', '#DB2777', '#059669', '#D97706'];

const STATUT_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING: { label: 'En attente', bg: '#DBEAFE', fg: '#1D4ED8' },
  CONFIRMED: { label: 'Confirmé', bg: '#D1FAE5', fg: '#065F46' },
  CANCELLED: { label: 'Annulé', bg: '#FEE2E2', fg: '#991B1B' },
  COMPLETED: { label: 'Complété', bg: '#E5E7EB', fg: '#374151' },
};

function formatDateComplete(iso: string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function dureeMinutes(rdv: RdvSerialise): number {
  return Math.round((new Date(rdv.endsAt).getTime() - new Date(rdv.startsAt).getTime()) / 60000);
}

export default function CalendrierClient({
  rdvs,
  praticiennes,
  practitionerOptions,
}: {
  rdvs: RdvSerialise[];
  praticiennes: PraticienneInfo[];
  practitionerOptions: PractitionerOption[];
}) {
  const router = useRouter();
  const [filtrePraticienne, setFiltrePraticienne] = useState<string>('toutes');
  const [afficherAnnules, setAfficherAnnules] = useState(false);
  const [rdvOuvert, setRdvOuvert] = useState<RdvSerialise | null>(null);

  // Actions de la fiche RDV (annuler / déplacer / marquer payé / renvoyer lien)
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [showMove, setShowMove] = useState(false);
  const [moveTo, setMoveTo] = useState('');

  /** Exécute une action serveur ; ferme la fiche + rafraîchit si demandé. */
  async function runAction(request: () => Promise<Response>, opts: { closeOnSuccess?: boolean; successMsg?: string }) {
    setActionBusy(true);
    setActionMsg(null);
    try {
      const res = await request();
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionMsg(j.error ?? "Échec de l'action.");
        return;
      }
      router.refresh();
      if (opts.closeOnSuccess) {
        setRdvOuvert(null);
      } else if (opts.successMsg) {
        setActionMsg(opts.successMsg);
      }
    } catch {
      setActionMsg('Impossible de joindre le serveur.');
    } finally {
      setActionBusy(false);
    }
  }

  // Couleur stable par praticienne (ordre de la liste des praticiennes approuvées).
  const couleurPar = useMemo(() => {
    const map = new Map<string, string>();
    praticiennes.forEach((p, i) => map.set(p.id, COULEURS[i % COULEURS.length]));
    return map;
  }, [praticiennes]);

  const rdvParId = useMemo(() => new Map(rdvs.map((r) => [r.id, r])), [rdvs]);

  const events = useMemo(
    () =>
      rdvs
        .filter((r) => (filtrePraticienne === 'toutes' ? true : r.practitionerId === filtrePraticienne))
        .filter((r) => (afficherAnnules ? true : r.status !== 'CANCELLED'))
        .map((r) => {
          const couleur = couleurPar.get(r.practitionerId) ?? '#6B3FA0';
          const annule = r.status === 'CANCELLED';
          const enAttente = r.status === 'PENDING';
          return {
            id: r.id,
            title: `${r.clientName} · ${r.practitionerName.split(' ')[0]}`,
            start: r.startsAt,
            end: r.endsAt,
            backgroundColor: annule ? '#9CA3AF' : couleur,
            borderColor: annule ? '#6B7280' : couleur,
            classNames: [annule ? 'rdv-annule' : '', enAttente ? 'rdv-attente' : ''].filter(Boolean),
          };
        }),
    [rdvs, filtrePraticienne, afficherAnnules, couleurPar],
  );

  function onEventClick(arg: EventClickArg) {
    const rdv = rdvParId.get(arg.event.id);
    if (rdv) {
      setRdvOuvert(rdv);
      setActionMsg(null);
      setShowMove(false);
      setMoveTo('');
    }
  }

  const statut = rdvOuvert ? STATUT_LABELS[rdvOuvert.status] ?? STATUT_LABELS.PENDING : null;

  return (
    <div>
      {/* En-tête */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.6rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '4px' }}>
          Calendrier des rendez-vous
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
          Tous les rendez-vous de toutes les praticiennes — vues mois, semaine et jour.
        </p>
      </div>

      {/* Filtres + légende */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '16px',
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          padding: '14px 18px',
          marginBottom: '16px',
        }}
      >
        <ManualAppointmentButton
          practitioners={practitionerOptions}
          variant="light"
          label="+ Nouveau rendez-vous"
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>
          Praticienne :
          <select
            value={filtrePraticienne}
            onChange={(e) => setFiltrePraticienne(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem', color: '#1F2937', background: '#FFFFFF' }}
          >
            <option value="toutes">Toutes</option>
            {praticiennes.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#374151', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={afficherAnnules}
            onChange={(e) => setAfficherAnnules(e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          Afficher les rendez-vous annulés
        </label>

        {/* Légende couleurs par praticienne */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginLeft: 'auto' }}>
          {praticiennes.map((p) => (
            <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#374151' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: couleurPar.get(p.id), display: 'inline-block' }} />
              {p.name}
            </span>
          ))}
        </div>
      </div>

      {/* Calendrier */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '18px' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={frLocale}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          eventClick={onEventClick}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          nowIndicator
          height="auto"
          dayMaxEventRows={4}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        />
      </div>

      {/* Fiche du rendez-vous cliqué */}
      {rdvOuvert && statut && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setRdvOuvert(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(17, 24, 39, 0.5)', border: 'none', cursor: 'pointer' }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(92vw, 460px)',
              background: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.15rem', fontWeight: 700, color: '#2D1B4E', margin: 0 }}>
                {rdvOuvert.clientName}
              </h2>
              <span style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600, background: statut.bg, color: statut.fg, whiteSpace: 'nowrap' }}>
                  {statut.label}
                </span>
                {rdvOuvert.paymentStatus && (
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      background: rdvOuvert.paymentStatus === 'PAID' ? '#D1FAE5' : '#FEF3C7',
                      color: rdvOuvert.paymentStatus === 'PAID' ? '#065F46' : '#92400E',
                    }}
                  >
                    {rdvOuvert.paymentStatus === 'PAID' ? 'Payé' : 'Paiement en attente'}
                  </span>
                )}
              </span>
            </div>

            <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem', color: '#374151' }}>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#6B3FA0' }}>Quand :</strong> {formatDateComplete(rdvOuvert.startsAt)} ({dureeMinutes(rdvOuvert)} min)
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#6B3FA0' }}>Praticienne :</strong>{' '}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: couleurPar.get(rdvOuvert.practitionerId), display: 'inline-block' }} />
                  {rdvOuvert.practitionerName}
                </span>
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#6B3FA0' }}>Courriel :</strong> {rdvOuvert.clientEmail}
              </p>
              {rdvOuvert.clientPhone && (
                <p style={{ margin: 0 }}>
                  <strong style={{ color: '#6B3FA0' }}>Téléphone :</strong> {rdvOuvert.clientPhone}
                </p>
              )}
              {rdvOuvert.paymentMode && (
                <p style={{ margin: 0 }}>
                  <strong style={{ color: '#6B3FA0' }}>Paiement :</strong>{' '}
                  {rdvOuvert.paymentMode === 'CASH' ? 'Comptant' : rdvOuvert.paymentMode === 'INTERAC' ? 'Interac' : 'Lien Stripe'}
                </p>
              )}
              {rdvOuvert.notes && (
                <p style={{ margin: 0, whiteSpace: 'pre-line', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 12px', fontSize: '0.85rem' }}>
                  {rdvOuvert.notes}
                </p>
              )}
            </div>

            {/* Actions selon l'état du RDV */}
            {actionMsg && (
              <p style={{ margin: '14px 0 0', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', background: actionMsg.includes('✓') ? '#D1FAE5' : '#FEE2E2', color: actionMsg.includes('✓') ? '#065F46' : '#991B1B' }}>
                {actionMsg}
              </p>
            )}
            {(rdvOuvert.status === 'CONFIRMED' || rdvOuvert.status === 'PENDING') && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #E5E7EB' }}>
                {rdvOuvert.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => setShowMove((v) => !v)}
                    style={{ padding: '7px 14px', background: '#FFFFFF', color: '#6B3FA0', border: '1px solid #C4B5FD', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Déplacer
                  </button>
                )}
                {rdvOuvert.paymentMode === 'INTERAC' && rdvOuvert.paymentStatus !== 'PAID' && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() =>
                      runAction(
                        () => fetch(`/api/holistique/appointments/${rdvOuvert.id}/mark-paid`, { method: 'POST' }),
                        { successMsg: 'Virement marqué reçu — courriel de confirmation envoyé ✓' },
                      )
                    }
                    style={{ padding: '7px 14px', background: '#FFFFFF', color: '#065F46', border: '1px solid #6EE7B7', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Marquer virement reçu
                  </button>
                )}
                {rdvOuvert.paymentMode === 'STRIPE_LINK' && rdvOuvert.paymentStatus !== 'PAID' && rdvOuvert.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() =>
                      runAction(
                        () => fetch(`/api/holistique/appointments/${rdvOuvert.id}/resend-payment-link`, { method: 'POST' }),
                        { successMsg: 'Nouveau lien de paiement envoyé par courriel ✓' },
                      )
                    }
                    style={{ padding: '7px 14px', background: '#FFFFFF', color: '#1D4ED8', border: '1px solid #93C5FD', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Renvoyer le lien de paiement
                  </button>
                )}
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => {
                    if (window.confirm(`Annuler le rendez-vous de ${rdvOuvert.clientName} ? La cliente et la praticienne seront avisées par courriel.`)) {
                      runAction(
                        () =>
                          fetch(`/api/holistique/appointments/${rdvOuvert.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'CANCELLED' }),
                          }),
                        { closeOnSuccess: true },
                      );
                    }
                  }}
                  style={{ padding: '7px 14px', background: '#FFFFFF', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler le RDV
                </button>
              </div>
            )}
            {showMove && rdvOuvert.status === 'CONFIRMED' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                <input
                  type="datetime-local"
                  value={moveTo}
                  onChange={(e) => setMoveTo(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', border: '1px solid #C4B5FD', borderRadius: '6px', fontSize: '0.85rem', color: '#1F2937' }}
                />
                <button
                  type="button"
                  disabled={actionBusy || !moveTo}
                  onClick={() =>
                    runAction(
                      () =>
                        fetch(`/api/holistique/appointments/${rdvOuvert.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ startsAt: new Date(moveTo).toISOString() }),
                        }),
                      { closeOnSuccess: true },
                    )
                  }
                  style={{ padding: '8px 14px', background: '#6B3FA0', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', opacity: actionBusy || !moveTo ? 0.6 : 1 }}
                >
                  Confirmer
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' }}>
              <a
                href="/admin/consultations"
                style={{ fontSize: '0.82rem', color: '#6B3FA0', fontWeight: 600, textDecoration: 'none' }}
              >
                Gérer dans Consultations →
              </a>
              <button
                type="button"
                onClick={() => setRdvOuvert(null)}
                style={{ padding: '8px 18px', background: '#2D1B4E', color: '#F5F0E8', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habillage FullCalendar aux couleurs de l'admin */}
      <style>{`
        .fc { font-family: inherit; }
        .fc .fc-button-primary {
          background: #6B3FA0;
          border-color: #6B3FA0;
          text-transform: capitalize;
          font-size: 0.82rem;
        }
        .fc .fc-button-primary:hover { background: #2D1B4E; border-color: #2D1B4E; }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background: #2D1B4E;
          border-color: #2D1B4E;
        }
        .fc .fc-toolbar-title {
          font-family: var(--font-cinzel, serif);
          font-size: 1.15rem;
          color: #2D1B4E;
          text-transform: capitalize;
        }
        .fc .fc-col-header-cell-cushion, .fc .fc-daygrid-day-number { color: #374151; text-decoration: none; }
        .fc .fc-day-today { background: rgba(107, 63, 160, 0.06) !important; }
        .fc-event { cursor: pointer; font-size: 0.76rem; }
        .fc-event.rdv-annule .fc-event-title, .fc-event.rdv-annule .fc-event-time { text-decoration: line-through; }
        .fc-event.rdv-attente { opacity: 0.75; border-style: dashed !important; }
      `}</style>
    </div>
  );
}
