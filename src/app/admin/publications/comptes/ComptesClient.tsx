'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ETATS_CONNEXION, RESEAU_LABELS } from '@/lib/social-constants';
import type { CompteSerialise } from '@/lib/social-accounts';

const VIOLET = '#6B3FA0';

/** Gestion des comptes réseaux sociaux : liste, ajout, test de connexion. */
export default function ComptesClient({
  comptesInitiaux,
  chiffrementPret,
}: {
  comptesInitiaux: CompteSerialise[];
  chiffrementPret: boolean;
}) {
  const [comptes, setComptes] = useState<CompteSerialise[]>(comptesInitiaux);
  const [formOuvert, setFormOuvert] = useState(false);
  const [network, setNetwork] = useState('FACEBOOK');
  const [label, setLabel] = useState('');
  const [externalId, setExternalId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [parentAccountId, setParentAccountId] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [testEnCours, setTestEnCours] = useState<string | null>(null);

  async function recharger() {
    const res = await fetch('/api/admin/social/accounts');
    if (res.ok) setComptes(await res.json());
  }

  async function ajouter() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/social/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network,
          label,
          externalId,
          accessToken,
          parentAccountId: parentAccountId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ ok: false, text: data.error ?? "Échec de l'ajout." });
        return;
      }
      setFeedback({ ok: true, text: `Compte « ${label} » ajouté ✓ — clique « Tester » pour vérifier la connexion.` });
      setLabel('');
      setExternalId('');
      setAccessToken('');
      setParentAccountId('');
      await recharger();
    } catch {
      setFeedback({ ok: false, text: 'Erreur réseau — réessaie.' });
    } finally {
      setBusy(false);
    }
  }

  async function tester(id: string) {
    setTestEnCours(id);
    try {
      const res = await fetch(`/api/admin/social/accounts/${id}/test`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      setFeedback(
        data.ok
          ? { ok: true, text: `Connexion réussie ✓ — Meta répond : « ${data.name} »` }
          : { ok: false, text: `Échec du test : ${data.error ?? 'erreur inconnue'}` },
      );
      await recharger();
    } finally {
      setTestEnCours(null);
    }
  }

  async function basculerActif(c: CompteSerialise) {
    await fetch(`/api/admin/social/accounts/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    await recharger();
  }

  async function supprimer(c: CompteSerialise) {
    if (!window.confirm(`Supprimer le compte « ${c.label} » ?`)) return;
    const res = await fetch(`/api/admin/social/accounts/${c.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setFeedback({ ok: false, text: data.error ?? 'Suppression refusée.' });
    await recharger();
  }

  const pagesFacebook = comptes.filter((c) => c.network === 'FACEBOOK');

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link href="/admin/publications" style={{ fontSize: '0.8rem', color: '#6B7280', textDecoration: 'none', fontFamily: 'var(--font-cinzel, serif)' }}>
          ← Retour aux publications
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.6rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '4px' }}>
            Comptes réseaux sociaux
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
            Connecte ta Page Facebook et ton compte Instagram professionnel pour publier depuis l’admin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOuvert((v) => !v)}
          style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: `linear-gradient(135deg, ${VIOLET}, #4A2D7A)`, color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
        >
          {formOuvert ? 'Fermer le formulaire' : '+ Connecter un compte'}
        </button>
      </div>

      {!chiffrementPret && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.85rem', color: '#991B1B' }}>
          ⚠ La variable <code>SOCIAL_TOKEN_ENCRYPTION_KEY</code> n’est pas configurée dans Vercel — l’ajout de comptes est bloqué tant qu’elle n’est pas en place.
        </div>
      )}

      {feedback && (
        <p style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', background: feedback.ok ? '#D1FAE5' : '#FEE2E2', color: feedback.ok ? '#065F46' : '#991B1B', border: `1px solid ${feedback.ok ? '#6EE7B7' : '#FCA5A5'}` }}>
          {feedback.text}
        </p>
      )}

      {formOuvert && (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.05rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '14px' }}>
            Connecter un compte
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: VIOLET }}>
              Réseau
              <select value={network} onChange={(e) => setNetwork(e.target.value)} style={champ}>
                <option value="FACEBOOK">Facebook (Page)</option>
                <option value="INSTAGRAM">Instagram (professionnel)</option>
              </select>
            </label>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: VIOLET }}>
              Libellé
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. : Page Runes & Magie" style={champ} />
            </label>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: VIOLET }}>
              {network === 'FACEBOOK' ? 'Identifiant de la Page (page-id)' : 'Identifiant Instagram (ig-user-id)'}
              <input value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="Ex. : 1234567890" style={champ} />
            </label>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: VIOLET }}>
              Jeton d’accès (Page Access Token longue durée)
              <input value={accessToken} onChange={(e) => setAccessToken(e.target.value)} type="password" placeholder="Collé depuis l’outil Meta" style={champ} />
            </label>
            {network === 'INSTAGRAM' && (
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: VIOLET }}>
                Page Facebook parente (porte les autorisations)
                <select value={parentAccountId} onChange={(e) => setParentAccountId(e.target.value)} style={champ}>
                  <option value="">— Aucune —</option>
                  {pagesFacebook.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div style={{ marginTop: '14px' }}>
            <button
              type="button"
              onClick={ajouter}
              disabled={busy || !chiffrementPret || !label.trim() || !externalId.trim() || !accessToken.trim()}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: busy || !chiffrementPret ? '#C4B5FD' : `linear-gradient(135deg, ${VIOLET}, #4A2D7A)`, color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}
            >
              {busy ? 'Ajout…' : 'Ajouter le compte'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des comptes */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', marginBottom: '24px' }}>
        {comptes.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
            Aucun compte connecté pour l’instant — clique « + Connecter un compte » et suis le guide ci-dessous.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Réseau', 'Libellé', 'Identifiant', 'Jeton', 'État', 'Dernier test', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.72rem', fontWeight: 600, color: VIOLET, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comptes.map((c, idx) => {
                const etat = ETATS_CONNEXION[c.connectionStatus] ?? ETATS_CONNEXION.INVALID;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? '#FFF' : '#FAFAFA', opacity: c.isActive ? 1 : 0.55 }}>
                    <td style={cellule}>{RESEAU_LABELS[c.network] ?? c.network}</td>
                    <td style={{ ...cellule, fontWeight: 600 }}>{c.label}{!c.isActive && ' (désactivé)'}</td>
                    <td style={{ ...cellule, fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.externalId}</td>
                    <td style={{ ...cellule, fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.tokenMasque}</td>
                    <td style={cellule}>
                      <span style={{ padding: '2px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600, background: etat.bg, color: etat.fg }}>
                        {etat.label}
                      </span>
                    </td>
                    <td style={{ ...cellule, fontSize: '0.78rem', color: '#6B7280' }}>
                      {c.lastTestedAt ? new Date(c.lastTestedAt).toLocaleString('fr-CA', { timeZone: 'America/Toronto' }) : '—'}
                      {c.lastTestError && (
                        <div style={{ color: '#991B1B', marginTop: '2px', maxWidth: '220px' }}>{c.lastTestError}</div>
                      )}
                    </td>
                    <td style={cellule}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => tester(c.id)} disabled={testEnCours === c.id} style={boutonLigne('#1D4ED8', '#93C5FD')}>
                          {testEnCours === c.id ? 'Test…' : 'Tester'}
                        </button>
                        <button type="button" onClick={() => basculerActif(c)} style={boutonLigne('#92400E', '#FCD34D')}>
                          {c.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                        <button type="button" onClick={() => supprimer(c)} style={boutonLigne('#991B1B', '#FCA5A5')}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Guide pas-à-pas */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.05rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '10px' }}>
          Comment obtenir tes identifiants et ton jeton (une seule fois)
        </h2>
        <ol style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.8, paddingLeft: '20px' }}>
          <li>Ton compte Instagram doit être <strong>professionnel</strong> et <strong>lié à ta Page Facebook</strong> (application Instagram → Paramètres → Comptes liés).</li>
          <li>Va sur <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: VIOLET }}>developers.facebook.com</a> avec ton compte Facebook admin de la Page et crée une <strong>app</strong> de type « Business ». Elle peut rester en mode développement : pour publier sur tes propres comptes, aucune révision Meta n’est nécessaire.</li>
          <li>Dans l’<strong>Explorateur de l’API Graph</strong> (outils de l’app), génère un jeton utilisateur avec les permissions : <code>pages_show_list</code>, <code>pages_manage_posts</code>, <code>pages_read_engagement</code>, <code>instagram_basic</code>, <code>instagram_content_publish</code>.</li>
          <li>Échange-le contre un <strong>jeton longue durée</strong>, puis récupère le <strong>Page Access Token longue durée</strong> via <code>/me/accounts</code> (avec le <strong>page-id</strong>).</li>
          <li>Récupère l’identifiant Instagram : <code>/&#123;page-id&#125;?fields=instagram_business_account</code>.</li>
          <li>Ajoute ici : un compte <strong>Facebook</strong> (page-id + jeton) et un compte <strong>Instagram</strong> (ig-user-id + le même jeton, en choisissant la Page parente), puis clique <strong>Tester</strong>.</li>
        </ol>
        <p style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '10px' }}>
          Note : même un jeton « longue durée » peut être invalidé par Meta (changement de mot de passe, permission retirée, vérification de sécurité).
          Si l’état passe à « Jeton invalide », il suffit de régénérer un jeton et de le recoller (bouton Modifier — à venir — ou supprime/recrée le compte).
        </p>
      </div>
    </div>
  );
}

const champ: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: '6px',
  padding: '9px 11px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  fontSize: '0.88rem',
  color: '#111827',
  background: '#FFFFFF',
  boxSizing: 'border-box',
  fontWeight: 400,
};

const cellule: React.CSSProperties = { padding: '12px 14px', fontSize: '0.85rem', color: '#374151', verticalAlign: 'top' };

function boutonLigne(couleur: string, bordure: string): React.CSSProperties {
  return {
    padding: '5px 10px',
    background: '#FFFFFF',
    color: couleur,
    border: `1px solid ${bordure}`,
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}
