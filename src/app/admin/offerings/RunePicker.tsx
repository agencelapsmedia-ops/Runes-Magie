'use client';

import { useState } from 'react';

/**
 * Sélecteur visuel pour le champ « Emoji / Rune » d'un service.
 * La valeur choisie (caractère de rune Elder Futhark ou emoji) est stockée
 * dans un <input type="hidden" name="emoji"> soumis avec le formulaire
 * server-action — aucun changement de schéma : `offering.emoji` reste
 * une simple chaîne affichée telle quelle (carte, page détail, liste admin).
 */

interface Rune {
  s: string; // symbole
  n: string; // nom
  m: string; // signification courte
}

const AETTS: { title: string; runes: Rune[] }[] = [
  {
    title: '1ᵉʳ Aett — Freyr & Freyja',
    runes: [
      { s: 'ᚠ', n: 'Fehu', m: 'Abondance' },
      { s: 'ᚢ', n: 'Uruz', m: 'Force' },
      { s: 'ᚦ', n: 'Thurisaz', m: 'Protection' },
      { s: 'ᚨ', n: 'Ansuz', m: 'Sagesse' },
      { s: 'ᚱ', n: 'Raidho', m: 'Voyage' },
      { s: 'ᚲ', n: 'Kenaz', m: 'Créativité' },
      { s: 'ᚷ', n: 'Gebo', m: 'Don' },
      { s: 'ᚹ', n: 'Wunjo', m: 'Joie' },
    ],
  },
  {
    title: '2ᵉ Aett — Heimdall',
    runes: [
      { s: 'ᚺ', n: 'Hagalaz', m: 'Bouleversement' },
      { s: 'ᚾ', n: 'Nauthiz', m: 'Besoin' },
      { s: 'ᛁ', n: 'Isa', m: 'Introspection' },
      { s: 'ᛃ', n: 'Jera', m: 'Récolte' },
      { s: 'ᛇ', n: 'Eihwaz', m: 'Endurance' },
      { s: 'ᛈ', n: 'Perthro', m: 'Destin' },
      { s: 'ᛉ', n: 'Algiz', m: 'Protection' },
      { s: 'ᛊ', n: 'Sowilo', m: 'Soleil' },
    ],
  },
  {
    title: '3ᵉ Aett — Tyr',
    runes: [
      { s: 'ᛏ', n: 'Tiwaz', m: 'Justice' },
      { s: 'ᛒ', n: 'Berkana', m: 'Renaissance' },
      { s: 'ᛖ', n: 'Ehwaz', m: 'Mouvement' },
      { s: 'ᛗ', n: 'Mannaz', m: 'Le Soi' },
      { s: 'ᛚ', n: 'Laguz', m: 'Intuition' },
      { s: 'ᛜ', n: 'Ingwaz', m: 'Fertilité' },
      { s: 'ᛞ', n: 'Dagaz', m: 'Aube' },
      { s: 'ᛟ', n: 'Othala', m: 'Héritage' },
    ],
  },
];

const ALL_RUNES: Rune[] = AETTS.flatMap((a) => a.runes);

const QUICK_EMOJIS = ['✨', '🌙', '🔮', '🕯️', '🌿', '💎', '⭐', '❄️', '🌊', '🔥'];

export default function RunePicker({ defaultValue = '*' }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue || '*');

  const matched = ALL_RUNES.find((r) => r.s === value);
  const previewLabel = matched ? `${matched.n} — ${matched.m}` : 'Personnalisé';

  const runeBtn = (selected: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    width: '60px',
    padding: '8px 4px',
    cursor: 'pointer',
    border: '1px solid',
    borderColor: selected ? '#C9A84C' : '#E5E7EB',
    background: selected ? 'rgba(201,168,76,0.14)' : '#FFFFFF',
    borderRadius: '8px',
    transition: 'all 0.15s',
  });

  return (
    <div>
      {/* Aperçu (sur fond sombre, comme sur le site) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: '#1A1A2E',
          border: '1px solid #2D1B4E',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '2.6rem', color: '#C9A84C', lineHeight: 1, minWidth: '44px', textAlign: 'center' }}>
          {value}
        </span>
        <div>
          <div style={{ color: '#F5F0E8', fontSize: '0.8rem', fontFamily: 'var(--font-cinzel, serif)' }}>
            Aperçu de l&apos;icône
          </div>
          <div style={{ color: 'rgba(201,168,76,0.75)', fontSize: '0.72rem', marginTop: '2px' }}>
            {previewLabel}
          </div>
        </div>
      </div>

      {/* Grille des 24 runes par Aett */}
      {AETTS.map((aett) => (
        <div key={aett.title} style={{ marginBottom: '14px' }}>
          <p
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#6B3FA0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 8px',
              fontFamily: 'var(--font-cinzel, serif)',
            }}
          >
            {aett.title}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {aett.runes.map((r) => (
              <button
                key={r.n}
                type="button"
                onClick={() => setValue(r.s)}
                title={`${r.n} — ${r.m}`}
                style={runeBtn(value === r.s)}
              >
                <span style={{ fontSize: '1.55rem', color: '#9C7A1E', lineHeight: 1 }}>{r.s}</span>
                <span style={{ fontSize: '0.6rem', color: '#6B7280', fontWeight: 600 }}>{r.n}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Emojis rapides */}
      <p
        style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: '#6B3FA0',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '4px 0 8px',
          fontFamily: 'var(--font-cinzel, serif)',
        }}
      >
        Emojis courants
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {QUICK_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setValue(e)}
            style={{
              width: '44px',
              height: '44px',
              cursor: 'pointer',
              border: '1px solid',
              borderColor: value === e ? '#C9A84C' : '#E5E7EB',
              background: value === e ? 'rgba(201,168,76,0.14)' : '#FFFFFF',
              borderRadius: '8px',
              fontSize: '1.4rem',
              lineHeight: 1,
            }}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Saisie personnalisée + valeur soumise */}
      <label
        style={{
          display: 'block',
          fontSize: '0.7rem',
          fontWeight: 600,
          color: '#6B7280',
          marginBottom: '6px',
        }}
        htmlFor="emojiCustom"
      >
        Ou saisis ton propre symbole / emoji
      </label>
      <input
        id="emojiCustom"
        type="text"
        maxLength={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: '90px',
          padding: '8px 10px',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          fontSize: '1.2rem',
          textAlign: 'center',
          color: '#1F2937',
          background: '#FFFFFF',
        }}
      />

      {/* Valeur réellement soumise avec le formulaire */}
      <input type="hidden" name="emoji" value={value} />
    </div>
  );
}
