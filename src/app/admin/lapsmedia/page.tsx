'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  LIBELLE_METHODE,
  METHODES_PAIEMENT,
  TAUX_HORAIRE,
  dureeLisible,
  heuresLisibles,
  cleMois,
  moisLisible,
  montantAction,
  montantLisible,
} from '@/lib/laps-facturation';

interface LapsAction {
  id: string;
  title: string;
  description: string;
  doneOn: string;
  minutes: number;
  billable: boolean;
  hourlyRate: number;
  todoTaskId: string | null;
  todoTask: { id: string; title: string } | null;
}

interface LapsPaiement {
  id: string;
  amount: number;
  paidOn: string;
  method: string;
  note: string;
}

interface Bilan {
  minutesFacturables: number;
  minutesNonFacturables: number;
  totalFacture: number;
  totalPaye: number;
  solde: number;
  nbActions: number;
  nbPaiements: number;
  parMois: { mois: string; minutesFacturables: number; minutesNonFacturables: number; montant: number }[];
}

interface TacheTodo {
  id: string;
  title: string;
  status: string;
}

/** Date du jour au format d'un <input type="date">, en heure de Montréal. */
function aujourdhui(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(new Date());
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

const formeVide = {
  title: '',
  description: '',
  doneOn: '',
  heures: '',
  minutes: '',
  billable: true,
  todoTaskId: '',
};

const paiementVide = { amount: '', paidOn: '', method: 'INTERAC', note: '' };

const carte: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: '18px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
};
const champ: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '0.88rem',
  width: '100%',
};
const etiquette: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#6B7280',
  marginBottom: '5px',
};
const bouton = (fond: string): React.CSSProperties => ({
  padding: '9px 18px',
  background: fond,
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-cinzel, serif)',
});

export default function LapsMediaPage() {
  const [actions, setActions] = useState<LapsAction[]>([]);
  const [paiements, setPaiements] = useState<LapsPaiement[]>([]);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [taches, setTaches] = useState<TacheTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtre, setFiltre] = useState<'toutes' | 'facturables' | 'non'>('toutes');
  const [formOuvert, setFormOuvert] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [forme, setForme] = useState({ ...formeVide });
  const [enregistrement, setEnregistrement] = useState(false);

  const [paiement, setPaiement] = useState({ ...paiementVide });
  const [paiementEnCours, setPaiementEnCours] = useState(false);

  async function charger() {
    try {
      const [ra, rp, rb, rt] = await Promise.all([
        fetch('/api/admin/laps/actions'),
        fetch('/api/admin/laps/paiements'),
        fetch('/api/admin/laps/bilan'),
        fetch('/api/admin/todos'),
      ]);
      if (!ra.ok || !rp.ok || !rb.ok) throw new Error('Erreur de chargement');
      setActions(await ra.json());
      setPaiements(await rp.json());
      setBilan(await rb.json());
      setTaches(rt.ok ? await rt.json() : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void charger();
  }, []);

  const minutesSaisies = (Number(forme.heures) || 0) * 60 + (Number(forme.minutes) || 0);
  const montantSaisi = montantAction({ minutes: minutesSaisies, hourlyRate: TAUX_HORAIRE });

  const visibles = useMemo(
    () =>
      actions.filter((a) =>
        filtre === 'toutes' ? true : filtre === 'facturables' ? a.billable : !a.billable,
      ),
    [actions, filtre],
  );

  /** Actions regroupées par mois de réalisation, du plus récent au plus ancien. */
  const parMois = useMemo(() => {
    const groupes = new Map<string, LapsAction[]>();
    for (const a of visibles) {
      const cle = cleMois(a.doneOn);
      groupes.set(cle, [...(groupes.get(cle) ?? []), a]);
    }
    return [...groupes.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [visibles]);

  function ouvrirCreation() {
    setEditingId(null);
    setForme({ ...formeVide, doneOn: aujourdhui() });
    setFormOuvert(true);
    setError(null);
  }

  function ouvrirEdition(a: LapsAction) {
    setEditingId(a.id);
    setForme({
      title: a.title,
      description: a.description,
      doneOn: a.doneOn.slice(0, 10),
      heures: String(Math.floor(a.minutes / 60)),
      minutes: String(a.minutes % 60),
      billable: a.billable,
      todoTaskId: a.todoTaskId ?? '',
    });
    setFormOuvert(true);
    setError(null);
  }

  /** Import d'une tâche du kanban : le titre est copié, donc réécrivable. */
  function importerTache(id: string) {
    const tache = taches.find((t) => t.id === id);
    setForme((f) => ({ ...f, todoTaskId: id, title: tache ? tache.title : f.title }));
  }

  async function enregistrerAction() {
    if (!forme.title.trim()) return setError('Le nom de l’action est requis.');
    if (minutesSaisies <= 0) return setError('La durée doit être supérieure à zéro.');
    if (!forme.doneOn) return setError('La date de réalisation est requise.');

    setEnregistrement(true);
    setError(null);
    const corps = {
      title: forme.title,
      description: forme.description,
      doneOn: forme.doneOn,
      minutes: minutesSaisies,
      billable: forme.billable,
      todoTaskId: forme.todoTaskId || null,
    };
    try {
      const res = await fetch(
        editingId ? `/api/admin/laps/actions/${editingId}` : '/api/admin/laps/actions',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(corps),
        },
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Échec');
      setFormOuvert(false);
      await charger();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setEnregistrement(false);
    }
  }

  async function supprimerAction(a: LapsAction) {
    if (!confirm(`Supprimer définitivement « ${a.title} » ?`)) return;
    const res = await fetch(`/api/admin/laps/actions/${a.id}`, { method: 'DELETE' });
    if (!res.ok) return setError('Suppression impossible.');
    await charger();
  }

  async function basculerFacturable(a: LapsAction) {
    const res = await fetch(`/api/admin/laps/actions/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billable: !a.billable }),
    });
    if (!res.ok) return setError('Modification impossible.');
    await charger();
  }

  async function enregistrerPaiement() {
    const montant = Number(paiement.amount);
    if (!Number.isFinite(montant) || montant <= 0) return setError('Le montant du paiement est invalide.');
    if (!paiement.paidOn) return setError('La date du paiement est requise.');

    setPaiementEnCours(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/laps/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paiement, amount: montant }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Échec');
      setPaiement({ ...paiementVide, paidOn: aujourdhui() });
      await charger();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setPaiementEnCours(false);
    }
  }

  async function supprimerPaiement(p: LapsPaiement) {
    if (!confirm(`Supprimer le paiement de ${montantLisible(p.amount)} ?`)) return;
    const res = await fetch(`/api/admin/laps/paiements/${p.id}`, { method: 'DELETE' });
    if (!res.ok) return setError('Suppression impossible.');
    await charger();
  }

  return (
    <div style={{ padding: '28px 20px', maxWidth: '1180px', margin: '0 auto' }}>
      <h1
        style={{
          fontFamily: 'var(--font-cinzel-decorative, serif)',
          fontSize: '1.9rem',
          color: '#2D1B4E',
          margin: '0 0 6px',
        }}
      >
        Laps Media
      </h1>
      <p style={{ color: '#6B7280', fontSize: '0.92rem', margin: '0 0 22px' }}>
        Les actions réalisées pour Runes &amp; Magie, le temps qu’elles ont pris et le solde à régler.
        Taux : {montantLisible(TAUX_HORAIRE)} de l’heure.
      </p>

      {error && (
        <p style={{ color: '#991B1B', background: '#FEE2E2', padding: '10px 14px', borderRadius: '8px', fontSize: '0.86rem' }}>
          {error}
        </p>
      )}

      {loading || !bilan ? (
        <p style={{ color: '#6B7280' }}>Chargement…</p>
      ) : (
        <>
          {/* ── Bandeau du solde ─────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {[
              { titre: 'Total facturé', valeur: bilan.totalFacture, couleur: '#2D1B4E' },
              { titre: 'Total payé', valeur: bilan.totalPaye, couleur: '#065F46' },
              { titre: 'Solde dû', valeur: bilan.solde, couleur: bilan.solde > 0 ? '#991B1B' : '#065F46' },
            ].map((c) => (
              <div key={c.titre} style={carte}>
                <p style={etiquette}>{c.titre}</p>
                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: c.couleur }}>
                  {montantLisible(c.valeur)}
                </p>
              </div>
            ))}
            <div style={carte}>
              <p style={etiquette}>Temps consigné</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>
                <strong>{heuresLisibles(bilan.minutesFacturables)}</strong> facturées
                <br />
                <span style={{ color: '#6B7280' }}>{heuresLisibles(bilan.minutesNonFacturables)} non facturées</span>
              </p>
            </div>
          </div>

          {/* ── Rapport mensuel ──────────────────────────────────────────── */}
          {bilan.parMois.length > 0 && (
            <div style={{ ...carte, marginTop: '18px' }}>
              <p style={{ ...etiquette, marginBottom: '12px' }}>Rapport mensuel</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#6B7280' }}>
                    <th style={{ padding: '6px 8px', fontWeight: 600 }}>Mois</th>
                    <th style={{ padding: '6px 8px', fontWeight: 600 }}>Heures facturées</th>
                    <th style={{ padding: '6px 8px', fontWeight: 600 }}>Heures non facturées</th>
                    <th style={{ padding: '6px 8px', fontWeight: 600, textAlign: 'right' }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {bilan.parMois.map((m) => (
                    <tr key={m.mois} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '8px', color: '#1F2937', fontWeight: 600 }}>{moisLisible(m.mois)}</td>
                      <td style={{ padding: '8px', color: '#374151' }}>{dureeLisible(m.minutesFacturables)}</td>
                      <td style={{ padding: '8px', color: '#6B7280' }}>{dureeLisible(m.minutesNonFacturables)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#2D1B4E' }}>
                        {montantLisible(m.montant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Formulaire d'action ──────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '26px 0 14px', flexWrap: 'wrap' }}>
            <button onClick={formOuvert ? () => setFormOuvert(false) : ouvrirCreation} style={bouton('#6B3FA0')}>
              {formOuvert ? 'Fermer' : '+ Nouvelle action'}
            </button>
            <label style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600 }}>
              Afficher :{' '}
              <select
                value={filtre}
                onChange={(e) => setFiltre(e.target.value as typeof filtre)}
                style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                <option value="toutes">Toutes</option>
                <option value="facturables">Facturables</option>
                <option value="non">Non facturables</option>
              </select>
            </label>
          </div>

          {formOuvert && (
            <div style={{ ...carte, marginBottom: '22px' }}>
              <p style={{ ...etiquette, marginBottom: '14px' }}>
                {editingId ? 'Modifier l’action' : 'Nouvelle action'}
              </p>

              {!editingId && taches.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={etiquette}>Importer une tâche du to-do (le nom reste modifiable)</label>
                  <select
                    value={forme.todoTaskId}
                    onChange={(e) => importerTache(e.target.value)}
                    style={champ}
                  >
                    <option value="">— Aucune —</option>
                    {taches.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title.length > 90 ? `${t.title.slice(0, 90)}…` : t.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={etiquette}>Nom de l’action (tel que facturé)</label>
                <input
                  value={forme.title}
                  onChange={(e) => setForme({ ...forme, title: e.target.value })}
                  placeholder="Correctif — courriels mot de passe oublié"
                  style={champ}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={etiquette}>Ce qui a été fait</label>
                <textarea
                  value={forme.description}
                  onChange={(e) => setForme({ ...forme, description: e.target.value })}
                  rows={4}
                  placeholder="Diagnostic, correctif, tests en production…"
                  style={{ ...champ, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={etiquette}>Date de réalisation</label>
                  <input
                    type="date"
                    value={forme.doneOn}
                    onChange={(e) => setForme({ ...forme, doneOn: e.target.value })}
                    style={champ}
                  />
                </div>
                <div>
                  <label style={etiquette}>Heures</label>
                  <input
                    type="number"
                    min={0}
                    value={forme.heures}
                    onChange={(e) => setForme({ ...forme, heures: e.target.value })}
                    placeholder="2"
                    style={champ}
                  />
                </div>
                <div>
                  <label style={etiquette}>Minutes</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={forme.minutes}
                    onChange={(e) => setForme({ ...forme, minutes: e.target.value })}
                    placeholder="30"
                    style={champ}
                  />
                </div>
                <div>
                  <label style={etiquette}>Facturation</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: '#374151', padding: '8px 0' }}>
                    <input
                      type="checkbox"
                      checked={forme.billable}
                      onChange={(e) => setForme({ ...forme, billable: e.target.checked })}
                    />
                    Facturable
                  </label>
                </div>
              </div>

              <p style={{ margin: '14px 0 0', fontSize: '0.9rem', color: forme.billable ? '#2D1B4E' : '#6B7280' }}>
                {minutesSaisies > 0 ? (
                  <>
                    {dureeLisible(minutesSaisies)} ·{' '}
                    {forme.billable ? <strong>{montantLisible(montantSaisi)}</strong> : 'non facturée (0,00 $)'}
                  </>
                ) : (
                  'Saisis une durée pour voir le montant.'
                )}
              </p>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button onClick={enregistrerAction} disabled={enregistrement} style={bouton('#065F46')}>
                  {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => setFormOuvert(false)}
                  style={{ ...bouton('#F3F4F6'), color: '#374151' }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* ── Liste des actions ────────────────────────────────────────── */}
          {visibles.length === 0 ? (
            <p style={{ color: '#6B7280' }}>Aucune action enregistrée pour l’instant.</p>
          ) : (
            parMois.map(([cle, lignes]) => (
              <div key={cle} style={{ marginBottom: '22px' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-cinzel, serif)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#6B3FA0',
                    margin: '0 0 10px 2px',
                  }}
                >
                  {moisLisible(cle)}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {lignes.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        ...carte,
                        padding: '14px 16px',
                        borderLeft: `4px solid ${a.billable ? '#6B3FA0' : '#9CA3AF'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 320px' }}>
                          <p style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600, color: '#1F2937' }}>{a.title}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                            {fmtDate(a.doneOn)} · {dureeLisible(a.minutes)}
                            {!a.billable && ' · non facturée'}
                          </p>
                          {a.description && (
                            <p style={{ margin: '8px 0 0', fontSize: '0.86rem', color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                              {a.description}
                            </p>
                          )}
                          {a.todoTask && (
                            <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>
                              Issue du to-do :{' '}
                              <Link href="/admin/todo" style={{ color: '#6B3FA0' }}>
                                {a.todoTask.title}
                              </Link>
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '1.1rem',
                              fontWeight: 700,
                              color: a.billable ? '#2D1B4E' : '#9CA3AF',
                            }}
                          >
                            {a.billable ? montantLisible(montantAction(a)) : '—'}
                          </p>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => ouvrirEdition(a)}
                              style={{ background: 'none', border: 'none', color: '#6B3FA0', fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => basculerFacturable(a)}
                              style={{ background: 'none', border: 'none', color: '#A16207', fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              {a.billable ? 'Ne pas facturer' : 'Facturer'}
                            </button>
                            <button
                              onClick={() => supprimerAction(a)}
                              style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* ── Paiements ────────────────────────────────────────────────── */}
          <h2
            style={{
              fontFamily: 'var(--font-cinzel-decorative, serif)',
              fontSize: '1.3rem',
              color: '#2D1B4E',
              margin: '34px 0 12px',
            }}
          >
            Paiements
          </h2>

          <div style={{ ...carte, marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <div>
                <label style={etiquette}>Montant</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paiement.amount}
                  onChange={(e) => setPaiement({ ...paiement, amount: e.target.value })}
                  placeholder="500.00"
                  style={champ}
                />
              </div>
              <div>
                <label style={etiquette}>Date</label>
                <input
                  type="date"
                  value={paiement.paidOn || aujourdhui()}
                  onChange={(e) => setPaiement({ ...paiement, paidOn: e.target.value })}
                  style={champ}
                />
              </div>
              <div>
                <label style={etiquette}>Mode</label>
                <select
                  value={paiement.method}
                  onChange={(e) => setPaiement({ ...paiement, method: e.target.value })}
                  style={champ}
                >
                  {METHODES_PAIEMENT.map((m) => (
                    <option key={m} value={m}>
                      {LIBELLE_METHODE[m]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={etiquette}>Note</label>
                <input
                  value={paiement.note}
                  onChange={(e) => setPaiement({ ...paiement, note: e.target.value })}
                  placeholder="Acompte septembre"
                  style={champ}
                />
              </div>
            </div>
            <button
              onClick={enregistrerPaiement}
              disabled={paiementEnCours}
              style={{ ...bouton('#065F46'), marginTop: '14px' }}
            >
              {paiementEnCours ? 'Enregistrement…' : 'Enregistrer le paiement'}
            </button>
          </div>

          {paiements.length === 0 ? (
            <p style={{ color: '#6B7280' }}>Aucun paiement enregistré.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paiements.map((p) => (
                <div
                  key={p.id}
                  style={{
                    ...carte,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '14px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#065F46' }}>
                      − {montantLisible(p.amount)}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#6B7280' }}>
                      {fmtDate(p.paidOn)} · {LIBELLE_METHODE[p.method] ?? p.method}
                      {p.note && ` · ${p.note}`}
                    </p>
                  </div>
                  <button
                    onClick={() => supprimerPaiement(p)}
                    style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
