import { prisma } from '@/lib/db';
import PractitionerCard from '@/components/holistique/PractitionerCard';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';

export const metadata = { title: 'Praticiens — Soins Holistiques | Runes & Magie' };

const SPECIALTIES = [
  'Toutes', 'Reiki', 'Naturopathie', 'Coaching Spirituel',
  'Cristallothérapie', 'Hypnose', 'Soins Chamaniques',
];

async function getPractitioners() {
  const practitioners = await prisma.practitioner.findMany({
    where: { status: 'APPROVED' },
    include: {
      user: { select: { firstName: true, lastName: true } },
      reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
    },
    orderBy: { approvedAt: 'desc' },
  });
  return practitioners.map((p) => ({
    id: p.id,
    slug: p.slug,
    firstName: p.user.firstName,
    lastName: p.user.lastName,
    bio: p.bio,
    specialties: p.specialties,
    hourlyRate: p.hourlyRate,
    photoUrl: p.photoUrl,
    yearsExperience: p.yearsExperience,
    avgRating: p.reviews.length
      ? Math.round((p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length) * 10) / 10
      : null,
    reviewCount: p.reviews.length,
  }));
}

export default async function PraticiensPage() {
  const practitioners = await getPractitioners();

  return (
    <div style={{ background: 'var(--noir-nuit)', minHeight: '100vh' }}>
      {/* Hero compact */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--violet-profond) 0%, var(--charbon-mystere) 60%, var(--noir-nuit) 100%)',
          padding: '80px 24px 60px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', letterSpacing: '0.3em', fontSize: '0.8rem', marginBottom: '16px', opacity: 0.8 }}>
          ᚨ PRATICIENS CERTIFIÉS ᚨ
        </p>
        <h1 style={{ fontFamily: 'var(--font-cinzel-decorative)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair), var(--or-ancien))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' }}>
          Nos Thérapeutes
        </h1>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--parchemin-vieilli)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Des praticiens certifiés, soigneusement sélectionnés pour vous accompagner sur votre chemin de guérison
        </p>
      </section>

      <RuneDivider symbols="ᚢ ᛏ ᚨ" />

      {/* Liste praticiens */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {practitioners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '3rem', marginBottom: '24px' }}>ᛟ</p>
            <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin-vieilli)', fontSize: '1.3rem', fontStyle: 'italic' }}>
              Les praticiens arrivent bientôt...<br />
              <span style={{ fontSize: '1rem', opacity: 0.7 }}>Revenez nous voir prochainement.</span>
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {practitioners.map((p) => (
              <PractitionerCard key={p.id} {...p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
