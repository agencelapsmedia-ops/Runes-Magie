'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RESEAU_LABELS, STATUTS_POST, TYPES_CONTENU } from '@/lib/social-constants';
import type { PostSerialise } from '@/lib/social-posts';
import type { CompteSerialise } from '@/lib/social-accounts';
import FichePublication from './FichePublication';
import CalendrierEditorial from './CalendrierEditorial';
import GenerateurSerie from './GenerateurSerie';

interface BatchProgression {
  id: string;
  title: string;
  quantite: number;
  status: string;
  progression?: { enAttente: number; enCours: number; generes: number; erreurs: number };
}

const VIOLET = '#6B3FA0';

/** Écran principal des publications : marques, filtres, liste, fiche. */
export default function PublicationsClient({
  postsInitiaux,
  comptes,
  organisations,
  orgActive,
}: {
  postsInitiaux: PostSerialise[];
  comptes: CompteSerialise[];
  organisations: { id: string; name: string; isActive: boolean }[];
  orgActive: string;
}) {
  const [posts, setPosts] = useState<PostSerialise[]>(postsInitiaux);
  const [vue, setVue] = useState<'calendrier' | 'liste'>('calendrier');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreType, setFiltreType] = useState('tous');
  const [fiche, setFiche] = useState<PostSerialise | 'nouveau' | null>(null);
  const [dateInitiale, setDateInitiale] = useState<string | null>(null);
  const [generateur, setGenerateur] = useState(false);
  const [batches, setBatches] = useState<BatchProgression[]>([]);
  const [approbationEnCours, setApprobationEnCours] = useState(false);

  const recharger = useCallback(async () => {
    const res = await fetch(`/api/admin/social/posts?org=${encodeURIComponent(orgActive)}`);
    if (res.ok) setPosts(await res.json());
  }, [orgActive]);

  const rechargerBatches = useCallback(async (): Promise<BatchProgression[]> => {
    try {
      const res = await fetch(`/api/admin/social/batches?org=${encodeURIComponent(orgActive)}`);
      if (!res.ok) return [];
      const data: BatchProgression[] = await res.json();
      setBatches(data);
      return data;
    } catch {
      return [];
    }
  }, [orgActive]);

  // Suivi des lots en cours : relance la génération et rafraîchit tant que ça tourne.
  useEffect(() => {
    let arret = false;
    let enCoursDeTic = false;

    const tic = async () => {
      if (arret || enCoursDeTic) return;
      enCoursDeTic = true;
      try {
        const lots = await rechargerBatches();
        if (lots.some((b) => b.status === 'EN_COURS')) {
          await fetch('/api/admin/social/batches/tick', { method: 'POST' }).catch(() => undefined);
          if (!arret) await Promise.all([rechargerBatches(), recharger()]);
        }
      } finally {
        enCoursDeTic = false;
      }
    };

    void tic();
    const intervalle = setInterval(tic, 20_000);
    return () => {
      arret = true;
      clearInterval(intervalle);
    };
  }, [recharger, rechargerBatches]);

  const aApprouver = posts.filter((p) => p.status === 'A_APPROUVER').length;

  /** « Tout approuver » : A_APPROUVER → PROGRAMMEE pour la marque active. */
  async function toutApprouver() {
    if (
      !window.confirm(
        `Approuver les ${aApprouver} publications en attente ? Elles partiront automatiquement à leurs dates programmées.`,
      )
    )
      return;
    setApprobationEnCours(true);
    try {
      const res = await fetch('/api/admin/social/posts/approuver-lot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.ignores) && data.ignores.length > 0) {
        window.alert(
          `${data.approuves} approuvée(s). Ignorées :\n` +
            data.ignores.map((x: { title: string; raison: string }) => `• ${x.title} — ${x.raison}`).join('\n'),
        );
      }
      await recharger();
    } finally {
      setApprobationEnCours(false);
    }
  }

  const comptesActifs = comptes.filter((c) => c.isActive);

  const visibles = useMemo(
    () =>
      posts
        .filter((p) => (filtreStatut === 'tous' ? true : p.status === filtreStatut))
        .filter((p) => (filtreType === 'tous' ? true : p.type === filtreType)),
    [posts, filtreStatut, filtreType],
  );

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.6rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '4px' }}>
            Publications réseaux sociaux
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
            Prépare, décline, programme et publie sur Facebook et Instagram.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href="/admin/publications/marques"
            style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${VIOLET}`, color: VIOLET, fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', background: '#FFFFFF' }}
          >
            🏷 Marques
          </Link>
          <Link
            href={`/admin/publications/comptes?org=${encodeURIComponent(orgActive)}`}
            style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${VIOLET}`, color: VIOLET, fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', background: '#FFFFFF' }}
          >
            ⚙ Comptes connectés
          </Link>
          <button
            type="button"
            onClick={() => setGenerateur(true)}
            style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #0D5C54, #1A8A7D)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            ⚡ Générer une série
          </button>
          <button
            type="button"
            onClick={() => {
              setDateInitiale(null);
              setFiche('nouveau');
            }}
            style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: `linear-gradient(135deg, ${VIOLET}, #4A2D7A)`, color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            + Nouvelle publication
          </button>
        </div>
      </div>

      {/* Lots de génération en cours ou en erreur */}
      {batches
        .filter((b) => b.status === 'EN_COURS' || (b.progression?.erreurs ?? 0) > 0)
        .slice(0, 3)
        .map((b) => {
          const p = b.progression ?? { enAttente: 0, enCours: 0, generes: 0, erreurs: 0 };
          const enCours = b.status === 'EN_COURS';
          return (
            <div
              key={b.id}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: enCours ? '#ECFDF5' : '#FEF3C7', border: `1px solid ${enCours ? '#6EE7B7' : '#FCD34D'}`, borderRadius: '8px', padding: '10px 16px', marginBottom: '10px', fontSize: '0.85rem', color: enCours ? '#065F46' : '#92400E' }}
            >
              <span style={{ fontWeight: 700 }}>{enCours ? '⚙ Génération en cours' : '⚠ Lot avec erreurs'} — {b.title}</span>
              <span>
                {p.generes}/{b.quantite} générés
                {p.erreurs > 0 && ` · ${p.erreurs} erreur${p.erreurs > 1 ? 's' : ''}`}
              </span>
              {enCours && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(`Annuler le lot « ${b.title} » ? Les publications déjà générées restent.`)) return;
                    await fetch(`/api/admin/social/batches/${b.id}`, { method: 'DELETE' });
                    await rechargerBatches();
                  }}
                  style={{ marginLeft: 'auto', padding: '4px 12px', background: '#FFFFFF', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Annuler le lot
                </button>
              )}
            </div>
          );
        })}

      {/* Approbation en un clic */}
      {aApprouver > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '10px 16px', marginBottom: '10px', fontSize: '0.85rem', color: '#92400E' }}>
          <span style={{ fontWeight: 700 }}>
            {aApprouver} publication{aApprouver > 1 ? 's' : ''} en attente d’approbation
          </span>
          <button
            type="button"
            onClick={toutApprouver}
            disabled={approbationEnCours}
            style={{ marginLeft: 'auto', padding: '6px 16px', background: approbationEnCours ? '#FCD34D' : 'linear-gradient(135deg, #92400E, #B45309)', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: approbationEnCours ? 'wait' : 'pointer' }}
          >
            {approbationEnCours ? 'Approbation…' : `✅ Tout approuver (${aApprouver})`}
          </button>
        </div>
      )}

      {/* Sélecteur de marque */}
      {organisations.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {organisations.map((o) => (
            <Link
              key={o.id}
              href={`/admin/publications?org=${encodeURIComponent(o.id)}`}
              style={{
                padding: '7px 16px',
                borderRadius: '9999px',
                border: `1px solid ${o.id === orgActive ? VIOLET : '#D1D5DB'}`,
                background: o.id === orgActive ? VIOLET : '#FFFFFF',
                color: o.id === orgActive ? '#FFFFFF' : o.isActive ? '#374151' : '#9CA3AF',
                fontSize: '0.8rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              {o.name}
              {!o.isActive && ' (désactivée)'}
            </Link>
          ))}
        </div>
      )}

      {comptesActifs.length === 0 && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.85rem', color: '#92400E' }}>
          Aucun compte connecté : tu peux préparer tes publications, mais pour publier il faut d’abord{' '}
          <Link href="/admin/publications/comptes" style={{ color: '#92400E', fontWeight: 700 }}>connecter ta Page Facebook et ton Instagram</Link>.
        </div>
      )}

      {/* Filtres + légende */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '12px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${VIOLET}` }}>
          {(['calendrier', 'liste'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVue(v)}
              style={{ padding: '7px 16px', border: 'none', background: vue === v ? VIOLET : '#FFFFFF', color: vue === v ? '#FFFFFF' : VIOLET, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
            >
              {v === 'calendrier' ? '📅 Calendrier' : '☰ Liste'}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>
          Statut :
          <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} style={selectStyle}>
            <option value="tous">Tous</option>
            {Object.entries(STATUTS_POST).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>
          Type :
          <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} style={selectStyle}>
            <option value="tous">Tous</option>
            {TYPES_CONTENU.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginLeft: 'auto' }}>
          {Object.entries(STATUTS_POST).map(([k, v]) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#374151' }}>
              <span style={{ width: '11px', height: '11px', borderRadius: '3px', background: v.bg, border: `1px solid ${v.border}`, display: 'inline-block' }} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Calendrier */}
      {vue === 'calendrier' && (
        <CalendrierEditorial
          posts={visibles}
          onOpen={(p) => {
            setDateInitiale(null);
            setFiche(p);
          }}
          onDateClick={(dateLocale) => {
            setDateInitiale(dateLocale);
            setFiche('nouveau');
          }}
          onMoved={recharger}
        />
      )}

      {/* Liste */}
      {vue === 'liste' && (
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {visibles.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
            Aucune publication — clique « + Nouvelle publication » pour créer la première.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Publication', 'Type', 'Réseaux', 'Quand (heure de Montréal)', 'Statut', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.72rem', fontWeight: 600, color: VIOLET, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.map((p, idx) => {
                const statut = STATUTS_POST[p.status] ?? STATUTS_POST.BROUILLON;
                const typeLabel = TYPES_CONTENU.find((t) => t.value === p.type)?.label ?? p.type;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                    <td style={{ padding: '13px 14px' }}>
                      <button
                        type="button"
                        onClick={() => setFiche(p)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#2D1B4E', fontWeight: 600, fontSize: '0.9rem', textAlign: 'left' }}
                      >
                        {p.title}
                      </button>
                      {p.images.length > 0 && (
                        <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#9CA3AF' }}>🖼 {p.images.length}</span>
                      )}
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '0.82rem', color: '#4B5563' }}>{typeLabel}</td>
                    <td style={{ padding: '13px 14px', fontSize: '0.82rem', color: '#4B5563' }}>
                      {p.targets.length === 0
                        ? '—'
                        : p.targets.map((t) => RESEAU_LABELS[t.network] ?? t.network).join(' + ')}
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '0.82rem', color: '#4B5563' }}>
                      {p.scheduledAt
                        ? new Date(p.scheduledAt).toLocaleString('fr-CA', {
                            timeZone: 'America/Toronto',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'À planifier'}
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600, background: statut.bg, color: statut.fg, border: `1px solid ${statut.border}`, whiteSpace: 'nowrap' }}>
                        {statut.label}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setFiche(p)}
                        style={{ padding: '5px 12px', background: '#FFFFFF', color: VIOLET, border: '1px solid #C4B5FD', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      )}

      {generateur && (
        <GenerateurSerie
          organizationId={orgActive}
          comptes={comptesActifs}
          onClose={() => setGenerateur(false)}
          onCreated={async () => {
            await Promise.all([rechargerBatches(), recharger()]);
            void fetch('/api/admin/social/batches/tick', { method: 'POST' }).catch(() => undefined);
          }}
        />
      )}

      {fiche && (
        <FichePublication
          post={fiche === 'nouveau' ? null : fiche}
          comptes={comptesActifs}
          organizationId={orgActive}
          dateInitiale={dateInitiale}
          onClose={() => setFiche(null)}
          onChanged={async () => {
            await recharger();
          }}
        />
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '0.85rem',
  color: '#1F2937',
  background: '#FFFFFF',
  fontWeight: 400,
};
