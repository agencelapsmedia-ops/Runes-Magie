/**
 * Ornement doré : lignes effilées, losanges, points et étoile à 8 branches.
 * Encadre le sous-titre « La voie des arcanes » ; `flip` donne la version
 * miroir, posée sous le texte.
 *
 * Extrait de HeroCarousel pour être partagé avec le hero compact de l'accueil.
 * Le tracé est inchangé.
 */
export default function OrnementDore({
  flip = false,
  className = '',
}: {
  flip?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 560 48"
      aria-hidden="true"
      className={className}
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
    >
      <path d="M16 24 C 60 21.2, 110 21.2, 152 24 C 110 26.8, 60 26.8, 16 24 Z" fill="#C9A84C" />
      <path d="M544 24 C 500 21.2, 450 21.2, 408 24 C 450 26.8, 500 26.8, 544 24 Z" fill="#C9A84C" />
      <rect x="166" y="18" width="12" height="12" transform="rotate(45 172 24)" fill="none" stroke="#C9A84C" strokeWidth="1.1" />
      <circle cx="172" cy="24" r="1.4" fill="#E8CE7E" />
      <rect x="382" y="18" width="12" height="12" transform="rotate(45 388 24)" fill="none" stroke="#C9A84C" strokeWidth="1.1" />
      <circle cx="388" cy="24" r="1.4" fill="#E8CE7E" />
      <line x1="184" y1="24" x2="234" y2="24" stroke="#C9A84C" strokeWidth="0.7" opacity="0.8" />
      <line x1="326" y1="24" x2="376" y2="24" stroke="#C9A84C" strokeWidth="0.7" opacity="0.8" />
      <circle cx="196" cy="24" r="1.3" fill="#E0BD62" />
      <circle cx="208" cy="24" r="1.8" fill="#E0BD62" />
      <circle cx="220" cy="24" r="2.3" fill="#E0BD62" />
      <circle cx="364" cy="24" r="1.3" fill="#E0BD62" />
      <circle cx="352" cy="24" r="1.8" fill="#E0BD62" />
      <circle cx="340" cy="24" r="2.3" fill="#E0BD62" />
      <path d="M243 24 L248.5 22 L250.5 16.5 L252.5 22 L258 24 L252.5 26 L250.5 31.5 L248.5 26 Z" fill="#F3DD96" />
      <path d="M317 24 L311.5 22 L309.5 16.5 L307.5 22 L302 24 L307.5 26 L309.5 31.5 L311.5 26 Z" fill="#F3DD96" />
      <circle cx="280" cy="24" r="14" fill="none" stroke="#C9A84C" strokeWidth="1.2" />
      <circle cx="280" cy="24" r="10.5" fill="none" stroke="#C9A84C" strokeWidth="0.6" opacity="0.6" />
      <path d="M280 13.5 L282.6 21.4 L290.5 24 L282.6 26.6 L280 34.5 L277.4 26.6 L269.5 24 L277.4 21.4 Z" fill="#E8CE7E" />
      <path d="M274 18 L286 30 M286 18 L274 30" stroke="#C9A84C" strokeWidth="0.8" opacity="0.7" />
      <circle cx="280" cy="6.5" r="1.2" fill="#E8CE7E" />
      <circle cx="280" cy="41.5" r="1.2" fill="#E8CE7E" />
    </svg>
  );
}
