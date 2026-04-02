import Button from '@/components/ui/Button';
import RuneDivider from '@/components/ui/RuneDivider';
import PractitionerCard from '@/components/holistique/PractitionerCard';

interface Practitioner {
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

async function getPractitioners(): Promise<Practitioner[]> {
  try {
    // En server component, on importe directement Prisma pour éviter la latence réseau
    const { prisma } = await import('@/lib/db');
    const practitioners = await prisma.practitioner.findMany({
      where: { status: 'APPROVED' },
      take: 6,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        reviews: {
          where: { status: 'APPROVED' },
          select: { rating: true },
        },
      },
    });

    return practitioners.map((p) => {
      const reviewCount = p.reviews.length;
      const avgRating =
        reviewCount > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          : 0;
      return {
        id: p.id,
        slug: p.slug,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        bio: p.bio,
        specialties: p.specialties,
        hourlyRate: p.hourlyRate,
        photoUrl: p.photoUrl,
        yearsExperience: p.yearsExperience,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount,
      };
    });
  } catch {
    return [];
  }
}

const SPECIALTIES = [
  'Reiki',
  'Naturopathie',
  'Coaching Spirituel',
  'Cristallothérapie',
  'Hypnose',
  'Soins Chamaniques',
];

const STEPS = [
  {
    rune: 'ᚢ',
    title: 'Choisissez votre praticien',
    description:
      'Parcourez les profils de nos thérapeutes certifiés. Filtrez par spécialité, disponibilité et tarif pour trouver l\'accompagnant qui résonne avec votre chemin.',
  },
  {
    rune: 'ᛏ',
    title: 'Réservez votre créneau',
    description:
      'Sélectionnez le moment qui vous convient parmi les disponibilités du praticien. Paiement sécurisé, confirmation instantanée.',
  },
  {
    rune: 'ᚨ',
    title: 'Consultez en vidéo',
    description:
      'Connectez-vous depuis votre espace sacré, où que vous soyez au Québec. La séance se tient entièrement en ligne, dans un espace confidentiel et protégé.',
  },
];

export default async function SoinsPage() {
  const practitioners = await getPractitioners();

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, var(--violet-profond) 0%, var(--charbon-mystere) 40%, var(--noir-nuit) 100%)',
        }}
      >
        {/* Halo de lumière derrière le titre */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse, rgba(74, 45, 122, 0.35) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        {/* Badges flottants */}
        <div className="relative z-10 flex flex-wrap justify-center gap-3 mb-10">
          {['100% en ligne', 'Paiement sécurisé', 'Vidéo intégrée'].map((badge) => (
            <span
              key={badge}
              className="font-philosopher text-xs px-3 py-1 rounded-full border"
              style={{
                backgroundColor: 'rgba(46, 196, 182, 0.08)',
                borderColor: 'rgba(46, 196, 182, 0.25)',
                color: 'var(--turquoise-cristal)',
              }}
            >
              ✦ {badge}
            </span>
          ))}
        </div>

        {/* Titre principal */}
        <div className="relative z-10 max-w-4xl">
          <h1
            className="font-cinzel-decorative text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6"
            style={{
              background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair), var(--or-ancien))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Soins Énergétiques & Holistiques
          </h1>

          <p className="font-cinzel text-base sm:text-lg text-parchemin/80 tracking-widest uppercase mb-6">
            Connectez-vous avec des praticiens certifiés au Québec
          </p>

          <p className="font-cormorant italic text-xl sm:text-2xl text-parchemin/60 max-w-2xl mx-auto leading-relaxed mb-10">
            Reiki, naturopathie, coaching spirituel, cristallothérapie — des thérapeutes certifiés
            pour guider votre chemin de guérison
          </p>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button href="/soins/praticiens" variant="primary" size="lg">
              Explorer les praticiens
            </Button>
            <Button href="/soins/inscription-praticien" variant="secondary" size="lg">
              Devenir praticien
            </Button>
          </div>
        </div>

        {/* Rune décorative en bas */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 font-cinzel-decorative text-4xl select-none animate-bounce"
          style={{ color: 'rgba(201, 168, 76, 0.3)' }}
          aria-hidden="true"
        >
          ᚹ
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ──────────────────────────────────── */}
      <section
        id="comment"
        className="py-24 px-4"
        style={{ backgroundColor: 'var(--charbon-mystere)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="font-cinzel-decorative text-3xl sm:text-4xl font-bold mb-4"
              style={{
                background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Comment ça marche
            </h2>
            <p className="font-philosopher text-parchemin/50 italic">
              Trois étapes simples vers votre bien-être
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, index) => (
              <div
                key={step.rune}
                className="relative flex flex-col items-center text-center p-8 rounded-sm border"
                style={{
                  backgroundColor: 'rgba(10, 10, 18, 0.6)',
                  borderColor: 'rgba(74, 45, 122, 0.3)',
                }}
              >
                {/* Numéro de l'étape */}
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 font-cinzel text-xs px-3 py-1 rounded-full border"
                  style={{
                    backgroundColor: 'var(--charbon-mystere)',
                    borderColor: 'rgba(201, 168, 76, 0.3)',
                    color: 'var(--or-ancien)',
                  }}
                >
                  Étape {index + 1}
                </div>

                {/* Rune */}
                <div
                  className="font-cinzel-decorative text-6xl mb-6 select-none"
                  style={{ color: 'var(--or-ancien)', opacity: 0.8 }}
                  aria-hidden="true"
                >
                  {step.rune}
                </div>

                <h3 className="font-cinzel text-sm uppercase tracking-widest text-or-ancien mb-4">
                  {step.title}
                </h3>

                <p className="font-cormorant text-base italic text-parchemin/60 leading-relaxed">
                  {step.description}
                </p>

                {/* Bordure or en bas */}
                <div
                  className="absolute bottom-0 left-1/4 right-1/4 h-px"
                  style={{ background: 'linear-gradient(to right, transparent, var(--or-ancien), transparent)', opacity: 0.4 }}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <RuneDivider symbols="ᚠ ✦ ᚢ ✦ ᚦ" />

      {/* ── SPÉCIALITÉS ────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ backgroundColor: 'var(--noir-nuit)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="font-cinzel-decorative text-3xl sm:text-4xl font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Nos Spécialités
          </h2>
          <p className="font-philosopher text-parchemin/50 italic mb-12">
            Des disciplines ancestrales et modernes pour votre équilibre
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {SPECIALTIES.map((specialty) => (
              <span
                key={specialty}
                className="font-cinzel text-xs uppercase tracking-widest px-5 py-3 rounded-sm border transition-colors duration-300 cursor-default"
                style={{
                  backgroundColor: 'rgba(45, 27, 78, 0.3)',
                  borderColor: 'rgba(74, 45, 122, 0.4)',
                  color: 'var(--parchemin)',
                }}
              >
                ✦ {specialty}
              </span>
            ))}
          </div>
        </div>
      </section>

      <RuneDivider />

      {/* ── PRATICIENS ─────────────────────────────────────────── */}
      <section
        className="py-24 px-4"
        style={{ backgroundColor: 'var(--charbon-mystere)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="font-cinzel-decorative text-3xl sm:text-4xl font-bold mb-4"
              style={{
                background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Nos Praticiens
            </h2>
            <p className="font-philosopher text-parchemin/50 italic">
              Des guides certifiés pour accompagner votre chemin
            </p>
          </div>

          {practitioners.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {practitioners.map((practitioner) => (
                  <PractitionerCard key={practitioner.id} {...practitioner} />
                ))}
              </div>

              <div className="text-center mt-12">
                <Button href="/soins/praticiens" variant="secondary" size="lg">
                  Voir tous les praticiens
                </Button>
              </div>
            </>
          ) : (
            <div
              className="text-center py-20 border rounded-sm"
              style={{
                borderColor: 'rgba(74, 45, 122, 0.2)',
                backgroundColor: 'rgba(10, 10, 18, 0.4)',
              }}
            >
              <div
                className="font-cinzel-decorative text-6xl mb-6 select-none"
                style={{ color: 'rgba(201, 168, 76, 0.3)' }}
                aria-hidden="true"
              >
                ᛟ
              </div>
              <p className="font-cinzel text-sm uppercase tracking-widest text-parchemin/40">
                Les praticiens arrivent bientôt...
              </p>
              <p className="font-cormorant italic text-parchemin/30 mt-2">
                Notre communauté de thérapeutes se constitue avec soin
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────── */}
      <section
        className="py-24 px-4 text-center"
        style={{
          background:
            'linear-gradient(160deg, var(--noir-nuit) 0%, var(--violet-profond) 50%, var(--noir-nuit) 100%)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div
            className="font-cinzel-decorative text-5xl mb-8 select-none"
            style={{ color: 'rgba(201, 168, 76, 0.4)' }}
            aria-hidden="true"
          >
            ᛗ
          </div>

          <h2
            className="font-cinzel-decorative text-3xl sm:text-4xl font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Vous êtes thérapeute ?
          </h2>
          <p className="font-cormorant italic text-xl text-parchemin/60 leading-relaxed mb-4">
            Rejoignez notre plateforme et partagez vos dons avec des clients qui cherchent
            exactement ce que vous offrez.
          </p>
          <p className="font-philosopher text-sm text-parchemin/40 mb-10">
            Visibilité accrue, agenda en ligne, paiements sécurisés — tout ce dont vous avez besoin pour exercer sereinement.
          </p>
          <Button href="/soins/inscription-praticien" variant="primary" size="lg">
            Soumettre votre candidature
          </Button>
        </div>
      </section>
    </>
  );
}
