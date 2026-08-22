'use client';

/**
 * Admin — fiche élève d'une formation : parcours (terminer/débloquer en 1 clic),
 * banque de crédits, paiements/versements, notes et historique d'audit.
 */
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Course {
  id: string; code: string; title: string; summary: string;
  sessionNumber: number; isExam: boolean; countsAsCredit: boolean;
  isSpecializationSlot: boolean; isOptional: boolean; countsInProgress: boolean;
}
interface Progress {
  id: string; state: string; completedAt: string | null; completedBy: string | null;
  unlockedAt: string | null; origin: string; note: string; chosenCourseId: string | null;
  course: Course;
}
interface Payment { id: string; amount: number; paidAt: string; method: string; status: string; installmentNo: number | null; note: string }
interface CreditTxn { id: string; delta: number; type: string; reason: string; createdBy: string | null; createdAt: string }
interface AuditLog { id: string; actor: string; action: string; detail: string; createdAt: string }
interface Fiche {
  enrollment: {
    id: string; status: string; totalPrice: number | null; adminNotes: string; startedAt: string;
    client: { id: string; firstName: string; lastName: string; email: string; phone: string | null };
    formation: { code: string; title: string; pricePerCourse: number | null; pricePerBlock10: number | null };
    progress: Progress[];
    payments: Payment[];
    auditLogs: AuditLog[];
  };
  credits: number;
  creditHistory: CreditTxn[];
  optionalCourses: { id: string; code: string; title: string }[];
  totalPaid: number;
  balance: number | null;
}

const STATUS_FR: Record<string, string> = {
  ACTIVE: 'Active', PAYMENT_DUE: 'Paiement dû', SUSPENDED: 'Suspendue',
  COMPLETED: 'Complétée', DIPLOMA_ELIGIBLE: 'Admissible au diplôme', DIPLOMA_AWARDED: 'Diplômée 🎓',
};
const METHOD_FR: Record<string, string> = { INTERAC: 'Interac', CARD: 'Carte', CASH: 'Comptant', OTHER: 'Autre' };

function fdate(s: string | null): string {
  if (!s) return '—';
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeZone: 'America/Montreal' }).format(new Date(s));
}

export default function FicheElevePage() {
  const { id } = useParams<{ id: string }>();
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // courseId en cours d'action
  const [flash, setFlash] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [openCredit, setOpenCredit] = useState(false);
  const [openPaiement, setOpenPaiement] = useState(false);
  const [creditDelta, setCreditDelta] = useState('10');
  const [creditReason, setCreditReason] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('INTERAC');
  const [payDate, setPayDate] = useState('');
  const [payNote, setPayNote] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [showHistorique, setShowHistorique] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/formations/eleves/${id}`);
    if (res.ok) {
      const j = await res.json();
      setFiche(j);
      setNotesDraft(j.enrollment.adminNotes ?? '');
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function action(courseId: string, act: string) {
    setBusy(courseId); setErreur(null);
    try {
      const res = await fetch(`/api/admin/formations/eleves/${id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, action: act }),
      });
      const j = await res.json();
      if (!res.ok) { setErreur(j.error ?? 'Échec.'); return; }
      setFlash(Array.isArray(j.journal) ? j.journal.join(' · ') : 'Fait ✓');
      setTimeout(() => setFlash(null), 5000);
      await load();
    } catch { setErreur('Erreur réseau.'); } finally { setBusy(null); }
  }

  async function ajusterCredits() {
    const delta = parseInt(creditDelta, 10);
    setErreur(null);
    const res = await fetch(`/api/admin/formations/eleves/${id}/credits`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta, reason: creditReason }),
    });
    const j = await res.json();
    if (!res.ok) { setErreur(j.error ?? 'Échec.'); return; }
    setOpenCredit(false); setCreditReason('');
    await load();
  }

  async function ajouterPaiement() {
    setErreur(null);
    const res = await fetch(`/api/admin/formations/eleves/${id}/payments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(payAmount.replace(',', '.')),
        method: payMethod,
        paidAt: payDate || undefined,
        note: payNote,
      }),
    });
    const j = await res.json();
    if (!res.ok) { setErreur(j.error ?? 'Échec.'); return; }
    setOpenPaiement(false); setPayAmount(''); setPayNote('');
    await load();
  }

  async function sauverNotes() {
    await fetch(`/api/admin/formations/eleves/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes: notesDraft }),
    });
    setFlash('Notes sauvegardées ✓'); setTimeout(() => setFlash(null), 3000);
  }

  async function changerStatut(status: string) {
    await fetch(`/api/admin/formations/eleves/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  if (!fiche) return <p style={{ color: '#6B7280' }}>Chargement…</p>;
  const e = fiche.enrollment;
  const base = e.progress.filter((p) => !p.course.isOptional);
  const comptes = base.filter((p) => p.course.countsInProgress);
  const done = comptes.filter((p) => p.state === 'COMPLETED').length;
  const current = base.find((p) => p.state === 'UNLOCKED');
  const sessions = Array.from(new Set(base.map((p) => p.course.sessionNumber))).sort();

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '16px' };
  const btnSm = (bg: string): React.CSSProperties => ({ padding: '6px 12px', borderRadius: '6px', border: 'none', background: bg, color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' });
  const field: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.9rem', color: '#111827', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: '900px' }}>
      <Link href="/admin/eleves" style={{ color: '#6B3FA0', fontSize: '0.85rem', textDecoration: 'none' }}>← Toutes les élèves</Link>

      <div style={{ ...card, marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.4rem', color: '#2D1B4E', margin: 0 }}>
              {e.client.firstName} {e.client.lastName}
            </h1>
            <p style={{ color: '#6B7280', margin: '4px 0 0', fontSize: '0.85rem' }}>
              {e.formation.title} · depuis le {fdate(e.startedAt)} ·{' '}
              <Link href={`/admin/clients/${e.client.id}`} style={{ color: '#6B3FA0' }}>fiche client</Link>
            </p>
          </div>
          <select value={e.status} onChange={(ev) => changerStatut(ev.target.value)} style={{ ...field, width: 'auto', fontWeight: 600 }}>
            {Object.entries(STATUS_FR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '18px' }}>
          <div style={{ background: 'rgba(107,63,160,0.07)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#4A2D7A' }}>{done} / {comptes.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Progression</div>
          </div>
          <div style={{ background: 'rgba(6,95,70,0.07)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: fiche.credits > 0 ? '#065F46' : '#991B1B' }}>{fiche.credits}</div>
            <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Crédits de cours</div>
          </div>
          <div style={{ background: 'rgba(201,168,76,0.1)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#92400E' }}>{fiche.totalPaid.toFixed(2)} $</div>
            <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Payé{fiche.balance != null ? ` — reste ${fiche.balance.toFixed(2)} $` : ''}</div>
          </div>
          <div style={{ background: 'rgba(46,196,182,0.08)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F766E' }}>{current ? current.course.code : '—'}</div>
            <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Cours actuel</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          {current && (
            <button type="button" disabled={busy === current.course.id} onClick={() => action(current.course.id, 'complete')} style={btnSm('linear-gradient(135deg,#059669,#065F46)')}>
              ✓ Terminer {current.course.code}
            </button>
          )}
          <button type="button" onClick={() => setOpenCredit(true)} style={btnSm('linear-gradient(135deg,#6B3FA0,#4A2D7A)')}>± Ajuster la banque</button>
          <button type="button" onClick={() => setOpenPaiement(true)} style={btnSm('linear-gradient(135deg,#B45309,#92400E)')}>+ Ajouter un paiement</button>
          <button type="button" onClick={() => setShowHistorique(!showHistorique)} style={{ ...btnSm('#fff'), color: '#6B3FA0', border: '1px solid #6B3FA0' }}>
            {showHistorique ? 'Masquer' : 'Voir'} l’historique
          </button>
        </div>
        {flash && <p style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem', background: '#D1FAE5', color: '#065F46' }}>{flash}</p>}
        {erreur && <p style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem', background: '#FEE2E2', color: '#991B1B' }}>{erreur}</p>}
      </div>

      {showHistorique && (
        <div style={card}>
          <h2 style={{ fontSize: '1rem', color: '#2D1B4E', margin: '0 0 12px' }}>Historique</h2>
          {e.auditLogs.length === 0 ? <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Aucune intervention enregistrée.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {e.auditLogs.map((l) => (
                <div key={l.id} style={{ fontSize: '0.8rem', color: '#4B5563', borderBottom: '1px solid #F3F4F6', paddingBottom: '6px' }}>
                  <strong>{fdate(l.createdAt)}</strong> · {l.actor} — {l.detail}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Parcours par session */}
      {sessions.map((s) => (
        <div key={s} style={card}>
          <h2 style={{ fontSize: '1rem', color: '#2D1B4E', margin: '0 0 12px', fontFamily: 'var(--font-cinzel, serif)' }}>Session {s}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {base.filter((p) => p.course.sessionNumber === s).map((p) => {
              const icone = p.state === 'COMPLETED' ? '✅' : p.state === 'UNLOCKED' ? '🔓' : '🔒';
              const choix = p.course.isSpecializationSlot && p.chosenCourseId
                ? fiche.optionalCourses.find((o) => o.id === p.chosenCourseId)?.title
                : null;
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', background: p.state === 'UNLOCKED' ? 'rgba(46,196,182,0.07)' : '#FAFAFA', border: p.state === 'UNLOCKED' ? '1px solid rgba(46,196,182,0.4)' : '1px solid #F3F4F6', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.1rem' }}>{icone}</span>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#1F2937' }}>{p.course.code} — {p.course.title}</strong>
                    {p.course.isExam && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#92400E', background: '#FEF3C7', padding: '2px 8px', borderRadius: '999px' }}>Examen — hors banque</span>}
                    {choix && <div style={{ fontSize: '0.75rem', color: '#6B3FA0' }}>Choix : {choix}</div>}
                    {p.state === 'COMPLETED' && <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Terminé le {fdate(p.completedAt)} par {p.completedBy ?? '—'}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {p.state === 'UNLOCKED' && (
                      <button type="button" disabled={busy === p.course.id} onClick={() => action(p.course.id, 'complete')} style={btnSm('#059669')}>Terminer</button>
                    )}
                    {p.state === 'LOCKED' && (
                      <button type="button" disabled={busy === p.course.id} onClick={() => action(p.course.id, 'unlock')} style={btnSm('#6B3FA0')}>Débloquer</button>
                    )}
                    {p.state === 'UNLOCKED' && (
                      <button type="button" disabled={busy === p.course.id} onClick={() => action(p.course.id, 'lock')} style={{ ...btnSm('#fff'), color: '#991B1B', border: '1px solid #FCA5A5' }}>Verrouiller</button>
                    )}
                    {p.state === 'COMPLETED' && (
                      <button type="button" disabled={busy === p.course.id} onClick={() => action(p.course.id, 'uncomplete')} style={{ ...btnSm('#fff'), color: '#6B7280', border: '1px solid #D1D5DB' }}>Annuler terminé</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Paiements */}
      <div style={card}>
        <h2 style={{ fontSize: '1rem', color: '#2D1B4E', margin: '0 0 12px' }}>Paiements — total {fiche.totalPaid.toFixed(2)} $ {fiche.balance != null && `· solde ${fiche.balance.toFixed(2)} $`}</h2>
        {e.payments.length === 0 ? <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Aucun paiement enregistré.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ textAlign: 'left', color: '#6B7280' }}><th style={{ padding: '6px' }}>Date</th><th>Montant</th><th>Mode</th><th>Statut</th><th>Note</th></tr></thead>
              <tbody>
                {e.payments.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #F3F4F6', color: '#1F2937' }}>
                    <td style={{ padding: '8px 6px' }}>{fdate(p.paidAt)}</td>
                    <td style={{ fontWeight: 600 }}>{p.amount.toFixed(2)} $</td>
                    <td>{METHOD_FR[p.method] ?? p.method}</td>
                    <td>{p.status === 'PAID' ? '✓ Payé' : p.status === 'PENDING' ? 'En attente' : 'Échoué'}</td>
                    <td style={{ color: '#6B7280' }}>{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Banque de crédits */}
      <div style={card}>
        <h2 style={{ fontSize: '1rem', color: '#2D1B4E', margin: '0 0 4px' }}>Banque de crédits — solde {fiche.credits}</h2>
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0 0 12px' }}>Les crédits sont partagés entre les formations (Runes ou Tarot).</p>
        {fiche.creditHistory.length === 0 ? <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Aucune transaction.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {fiche.creditHistory.map((t) => (
              <div key={t.id} style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: '#4B5563', borderBottom: '1px solid #F3F4F6', paddingBottom: '6px' }}>
                <strong style={{ color: t.delta > 0 ? '#065F46' : '#991B1B', minWidth: '36px' }}>{t.delta > 0 ? '+' : ''}{t.delta}</strong>
                <span style={{ flex: 1 }}>{t.reason || t.type}</span>
                <span style={{ color: '#9CA3AF' }}>{fdate(t.createdAt)} · {t.createdBy ?? ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes admin */}
      <div style={card}>
        <h2 style={{ fontSize: '1rem', color: '#2D1B4E', margin: '0 0 12px' }}>Notes administratives</h2>
        <textarea value={notesDraft} onChange={(ev) => setNotesDraft(ev.target.value)} rows={4} style={{ ...field, resize: 'vertical' }} />
        <button type="button" onClick={sauverNotes} style={{ ...btnSm('#6B3FA0'), marginTop: '10px' }}>Sauvegarder les notes</button>
      </div>

      {/* Modal crédits */}
      {openCredit && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17,12,34,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setOpenCredit(false)}>
          <div onClick={(ev) => ev.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '420px', padding: '24px' }}>
            <h3 style={{ color: '#2D1B4E', margin: '0 0 14px', fontSize: '1.05rem' }}>Ajuster la banque de crédits</h3>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', marginBottom: '6px' }}>CRÉDITS (+ ajouter, − retirer)</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {['1', '10', '-1'].map((v) => (
                <button key={v} type="button" onClick={() => setCreditDelta(v)} style={{ padding: '8px 14px', borderRadius: '6px', border: creditDelta === v ? '2px solid #6B3FA0' : '1px solid #D1D5DB', background: creditDelta === v ? 'rgba(107,63,160,0.08)' : '#fff', cursor: 'pointer', fontWeight: 600, color: '#1F2937' }}>
                  {v === '10' ? '+10 (bloc)' : v === '1' ? '+1 (à la carte)' : '−1'}
                </button>
              ))}
              <input value={creditDelta} onChange={(ev) => setCreditDelta(ev.target.value)} style={{ ...field, width: '80px' }} />
            </div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', marginBottom: '6px' }}>MOTIF (obligatoire)</label>
            <input placeholder="Ex. : achat bloc de 10 — versement 2" value={creditReason} onChange={(ev) => setCreditReason(ev.target.value)} style={{ ...field, marginBottom: '16px' }} />
            {erreur && <p style={{ margin: '0 0 12px', padding: '8px 10px', borderRadius: '6px', fontSize: '0.8rem', background: '#FEE2E2', color: '#991B1B' }}>{erreur}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setOpenCredit(false)} style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', color: '#4B5563', cursor: 'pointer' }}>Annuler</button>
              <button type="button" disabled={!creditReason.trim()} onClick={ajusterCredits} style={{ ...btnSm('#6B3FA0'), opacity: creditReason.trim() ? 1 : 0.5 }}>Appliquer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal paiement */}
      {openPaiement && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17,12,34,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setOpenPaiement(false)}>
          <div onClick={(ev) => ev.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '420px', padding: '24px' }}>
            <h3 style={{ color: '#2D1B4E', margin: '0 0 14px', fontSize: '1.05rem' }}>Ajouter un paiement</h3>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', marginBottom: '6px' }}>MONTANT ($)</label>
            <input placeholder="675" value={payAmount} onChange={(ev) => setPayAmount(ev.target.value)} style={{ ...field, marginBottom: '14px' }} />
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', marginBottom: '6px' }}>MODE</label>
            <select value={payMethod} onChange={(ev) => setPayMethod(ev.target.value)} style={{ ...field, marginBottom: '14px' }}>
              <option value="INTERAC">Interac</option><option value="CARD">Carte</option><option value="CASH">Comptant</option><option value="OTHER">Autre</option>
            </select>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', marginBottom: '6px' }}>DATE (vide = aujourd’hui)</label>
            <input type="date" value={payDate} onChange={(ev) => setPayDate(ev.target.value)} style={{ ...field, marginBottom: '14px' }} />
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', marginBottom: '6px' }}>NOTE</label>
            <input placeholder="Ex. : versement 2 de 3 / paiement historique" value={payNote} onChange={(ev) => setPayNote(ev.target.value)} style={{ ...field, marginBottom: '16px' }} />
            {erreur && <p style={{ margin: '0 0 12px', padding: '8px 10px', borderRadius: '6px', fontSize: '0.8rem', background: '#FEE2E2', color: '#991B1B' }}>{erreur}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setOpenPaiement(false)} style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', color: '#4B5563', cursor: 'pointer' }}>Annuler</button>
              <button type="button" disabled={!payAmount.trim()} onClick={ajouterPaiement} style={{ ...btnSm('#B45309'), opacity: payAmount.trim() ? 1 : 0.5 }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
