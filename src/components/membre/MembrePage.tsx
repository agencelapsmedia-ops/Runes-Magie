import type { ReactNode } from 'react';

/** En-tête de section réutilisable dans l'espace membre. */
export function MembreHeader({
  emoji,
  title,
  subtitle,
}: {
  emoji?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-8">
      <h1 className="flex items-center gap-3 font-cinzel-decorative text-2xl text-or-ancien sm:text-3xl">
        {emoji && (
          <span aria-hidden className="text-2xl">
            {emoji}
          </span>
        )}
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 font-cormorant text-lg italic text-parchemin/50">{subtitle}</p>
      )}
      <div
        className="mt-5 h-px w-full"
        style={{
          background:
            'linear-gradient(to right, rgba(201,168,76,0.4), rgba(74,45,122,0.25), transparent)',
        }}
      />
    </header>
  );
}

/** Bloc « contenu à venir » pour les sections en cours de construction. */
export function ComingSoon({
  message = 'Cette section arrive bientôt.',
  children,
}: {
  message?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className="rounded-sm border px-8 py-14 text-center"
      style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(74, 45, 122, 0.3)' }}
    >
      <div aria-hidden className="mb-4 font-cinzel-decorative text-4xl text-or-ancien/30">
        ᛟ
      </div>
      <p className="font-cormorant text-xl italic leading-relaxed text-parchemin/55">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
