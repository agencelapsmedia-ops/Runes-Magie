import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import RuneDivider from '@/components/ui/RuneDivider';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.practitioner.findUnique({ where: { slug }, include: { user: true } });
  if (!p) return { title: 'Praticien introuvable' };
  return { title: `${p.user.firstName} ${p.user.lastName} — Soins Holistiques | Runes & Magie` };
}

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default async function PractitionerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const practitioner = await prisma.practitioner.findUnique({
    where: { slug, status: 'APPROVED' },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      reviews: {
        where: { status: 'APPROVED' },
        include: { client: { select: { firstName: true, lastName: true } } },
        orderBy: { submittedAt: 'desc' },
        take: 10,
      },
      availabilities: { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } },
    },
  });

  if (!practitioner) notFound();

  const avgRating = practitioner.reviews.length
    ? Math.round((practitioner.reviews.reduce((s, r) => s + r.rating, 0) / practitioner.reviews.length) * 10) / 10
    : null;

  return (
    <div style={{ background: 'var(--noir-nuit)', minHeight: '100vh' }}>
      {/* Hero profil */}
      <section style={{ background: 'linear-gradient(135deg, var(--violet-profond), var(--charbon-mystere))', padding: '60px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Photo */}
          <div style={{ flexShrink: 0 }}>
            {practitioner.photoUrl ? (
              <Image src={practitioner.photoUrl} alt={`${practitioner.user.firstName} ${practitioner.user.lastName}`} width={160} height={160}
                style={{ borderRadius: '50%', border: '3px solid var(--or-ancien)', boxShadow: '0 0 30px rgba(201,168,76,0.3)', objectFit: 'cover', width: '160px', height: '160px' }} unoptimized />
            ) : (
              <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--violet-royal), var(--violet-mystique))', border: '3px solid var(--or-ancien)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--or-clair)', fontFamily: 'var(--font-cinzel)' }}>
                {practitioner.user.firstName[0]}{practitioner.user.lastName[0]}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-cinzel-decorative)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
              {practitioner.user.firstName} {practitioner.user.lastName}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {practitioner.specialties.map((s) => (
                <span key={s} style={{ background: 'rgba(46,196,182,0.15)', border: '1px solid rgba(46,196,182,0.4)', color: 'var(--turquoise-cristal)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontFamily: 'var(--font-cinzel)' }}>{s}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {avgRating && (
                <span style={{ color: 'var(--or-ancien)', fontFamily: 'var(--font-cinzel)', fontSize: '0.9rem' }}>
                  {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))} {avgRating}/5 ({practitioner.reviews.length} avis)
                </span>
              )}
              <span style={{ color: 'var(--parchemin-vieilli)', fontFamily: 'var(--font-cormorant)' }}>
                {practitioner.yearsExperience} ans d&apos;expérience
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--parchemin)', lineHeight: 1.8, marginBottom: '24px', maxWidth: '600px' }}>
              {practitioner.bio}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '1.5rem' }}>
                {practitioner.hourlyRate} $/h
              </span>
              <Button variant="primary" size="lg" href={`/soins/reserver/${practitioner.id}`}>
                Réserver une consultation
              </Button>
            </div>
          </div>
        </div>
      </section>

      <RuneDivider symbols="ᚢ ᛟ ᚨ" />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px', display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
        {/* Disponibilités */}
        {practitioner.availabilities.length > 0 && (
          <section>
            <h2 style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '1.2rem', marginBottom: '16px', letterSpacing: '0.1em' }}>Disponibilités</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {practitioner.availabilities.map((a) => (
                <div key={a.id} style={{ background: 'var(--charbon-mystere)', border: '1px solid rgba(74,45,122,0.4)', borderRadius: '8px', padding: '12px 20px' }}>
                  <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--turquoise-cristal)', fontSize: '0.85rem', marginBottom: '4px' }}>{DAY_NAMES[a.dayOfWeek]}</p>
                  <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin-vieilli)', fontSize: '1rem' }}>{a.startTime} – {a.endTime}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Avis */}
        {practitioner.reviews.length > 0 && (
          <section>
            <h2 style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '1.2rem', marginBottom: '16px', letterSpacing: '0.1em' }}>
              Témoignages ({practitioner.reviews.length})
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {practitioner.reviews.map((r) => (
                <div key={r.id} style={{ background: 'var(--charbon-mystere)', border: '1px solid rgba(74,45,122,0.3)', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--parchemin)', fontSize: '0.9rem' }}>{r.client.firstName} {r.client.lastName[0]}.</span>
                    <span style={{ color: 'var(--or-ancien)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--parchemin-vieilli)', lineHeight: 1.7 }}>&ldquo;{r.comment}&rdquo;</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
