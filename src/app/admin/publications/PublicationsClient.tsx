'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { RESEAU_LABELS, STATUTS_POST, TYPES_CONTENU } from '@/lib/social-constants';
import type { PostSerialise } from '@/lib/social-posts';
import type { CompteSerialise } from '@/lib/social-accounts';
import FichePublication from './FichePublication';
import CalendrierEditorial from './CalendrierEditorial';

const VIOLET = '#6B3FA0';

/** Écran principal des publications : filtres, liste, fiche. */
export default function PublicationsClient({
  postsInitiaux,
  comptes,
}: {
  postsInitiaux: PostSerialise[];
  comptes: CompteSerialise[];
}) {
  const [posts, setPosts] = useState<PostSerialise[]>(postsInitiaux);
  const [vue, setVue] = useState<'calendrier' | 'liste'>('calendrier');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreType, setFiltreType] = useState('tous');
  const [fiche, setFiche] = useState<PostSerialise | 'nouveau' | null>(null);
  const [dateInitiale, setDateInitiale] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    const res = await fetch('/api/admin/social/posts');
    if (res.ok) setPosts(await res.json());
  }, []);

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
            href="/admin/publications/comptes"
            style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${VIOLET}`, color: VIOLET, fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', background: '#FFFFFF' }}
          >
            ⚙ Comptes connectés
          </Link>
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

      {fiche && (
        <FichePublication
          post={fiche === 'nouveau' ? null : fiche}
          comptes={comptesActifs}
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
