import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface PractitionerCardProps {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  specialties: string[];
  hourlyRate: number | null;
  photoUrl: string | null;
  yearsExperience: number | null;
  avgRating: number;
  reviewCount: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Note : ${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-3.5 h-3.5"
          fill={star <= Math.round(rating) ? 'var(--or-ancien)' : 'none'}
          stroke="var(--or-ancien)"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
          />
        </svg>
      ))}
    </div>
  );
}

export default function PractitionerCard({
  slug,
  firstName,
  lastName,
  bio,
  specialties,
  hourlyRate,
  photoUrl,
  yearsExperience,
  avgRating,
  reviewCount,
}: PractitionerCardProps) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  const displayedSpecialties = specialties.slice(0, 3);

  return (
    <article
      className="group relative flex flex-col rounded-sm overflow-hidden border transition-all duration-300"
      style={{
        backgroundColor: 'var(--charbon-mystere)',
        borderColor: 'rgba(74, 45, 122, 0.2)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201, 168, 76, 0.4)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(74, 45, 122, 0.3), 0 0 60px rgba(201, 168, 76, 0.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74, 45, 122, 0.2)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Photo ou initiales */}
      <div className="relative w-full h-48 overflow-hidden">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={`${firstName} ${lastName}`}
            fill
            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--violet-profond), var(--violet-royal))',
            }}
          >
            <span className="font-cinzel-decorative text-4xl font-bold text-or-ancien/80">
              {initials}
            </span>
          </div>
        )}

        {/* Overlay gradient en bas de la photo */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16"
          style={{
            background: 'linear-gradient(to top, var(--charbon-mystere), transparent)',
          }}
        />
      </div>

      {/* Contenu */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Nom */}
        <div>
          <h3 className="font-cinzel text-base font-semibold text-or-ancien leading-tight">
            {firstName} {lastName}
          </h3>
          {yearsExperience !== null && yearsExperience > 0 && (
            <p className="font-philosopher text-xs text-parchemin/50 mt-0.5">
              {yearsExperience} an{yearsExperience > 1 ? 's' : ''} d&apos;expérience
            </p>
          )}
        </div>

        {/* Badges de spécialités */}
        {displayedSpecialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayedSpecialties.map((specialty) => (
              <span
                key={specialty}
                className="font-philosopher text-xs px-2 py-0.5 rounded-sm border"
                style={{
                  backgroundColor: 'rgba(46, 196, 182, 0.1)',
                  borderColor: 'rgba(46, 196, 182, 0.3)',
                  color: 'var(--turquoise-cristal)',
                }}
              >
                {specialty}
              </span>
            ))}
            {specialties.length > 3 && (
              <span
                className="font-philosopher text-xs px-2 py-0.5 rounded-sm"
                style={{ color: 'var(--parchemin)', opacity: 0.4 }}
              >
                +{specialties.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bio (courte) */}
        {bio && (
          <p className="font-cormorant text-sm text-parchemin/60 line-clamp-2 italic leading-relaxed">
            {bio}
          </p>
        )}

        {/* Séparateur */}
        <div
          className="h-px mt-auto"
          style={{ background: 'linear-gradient(to right, transparent, rgba(74, 45, 122, 0.4), transparent)' }}
        />

        {/* Pied de carte : note + prix + bouton */}
        <div className="flex items-center justify-between gap-2">
          {/* Note et avis */}
          <div className="flex flex-col gap-0.5">
            <StarRating rating={avgRating} />
            {reviewCount > 0 ? (
              <p className="font-philosopher text-xs text-parchemin/40">
                {avgRating.toFixed(1)} ({reviewCount} avis)
              </p>
            ) : (
              <p className="font-philosopher text-xs text-parchemin/30">
                Nouveau praticien
              </p>
            )}
          </div>

          {/* Prix */}
          {hourlyRate !== null && (
            <div className="text-right">
              <span className="font-cinzel text-sm font-semibold" style={{ color: 'var(--or-ancien)' }}>
                {hourlyRate}$
              </span>
              <span className="font-philosopher text-xs text-parchemin/40"> /h</span>
            </div>
          )}
        </div>

        {/* Bouton Réserver */}
        <Link
          href={`/soins/praticiens/${slug}`}
          className="mt-1 w-full inline-flex items-center justify-center font-cinzel uppercase tracking-widest text-xs px-4 py-2.5 rounded-sm border transition-all duration-300"
          style={{
            backgroundColor: 'transparent',
            borderColor: 'rgba(74, 45, 122, 0.5)',
            color: 'var(--or-ancien)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(74, 45, 122, 0.2)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201, 168, 76, 0.4)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 15px rgba(201, 168, 76, 0.15)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74, 45, 122, 0.5)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          Réserver
        </Link>
      </div>
    </article>
  );
}
