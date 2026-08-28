import Image from 'next/image';

/**
 * Page « Temporairement hors service » (mode maintenance).
 * Affichée pour tout le site public quand MAINTENANCE = true dans src/proxy.ts.
 * L'administration et la connexion restent accessibles.
 */
export const dynamic = 'force-static';

export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #2D1B4E 0%, #0A0A12 60%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '520px' }}>
        <Image
          src="/images/logo/logo-cat-gold.webp"
          alt="Runes & Magie"
          width={180}
          height={180}
          style={{ margin: '0 auto 28px', width: '180px', height: 'auto' }}
          priority
        />
        <h1
          style={{
            fontFamily: 'var(--font-cinzel-decorative, serif)',
            fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
            background: 'linear-gradient(135deg, #C9A84C, #E8D48B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
            letterSpacing: '0.05em',
          }}
        >
          Temporairement hors service
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-cormorant, Georgia, serif)',
            fontStyle: 'italic',
            color: 'rgba(232, 220, 190, 0.85)',
            fontSize: '1.2rem',
            lineHeight: 1.7,
            marginBottom: '24px',
          }}
        >
          Le Temple se refait une beauté&nbsp;✨<br />
          Nous serons de retour très bientôt.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-cinzel, serif)',
            color: 'rgba(201, 168, 76, 0.7)',
            fontSize: '0.85rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          *)O(* Runes &amp; Magie *)O(*
        </p>
        <p style={{ marginTop: '20px', color: 'rgba(232,220,190,0.45)', fontSize: '0.85rem', fontFamily: 'Georgia, serif' }}>
          Une question ? Écris-nous à{' '}
          <a href="mailto:info@runesetmagie.ca" style={{ color: '#2EC4B6', textDecoration: 'none' }}>
            info@runesetmagie.ca
          </a>
        </p>
      </div>
    </div>
  );
}
