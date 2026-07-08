import { prisma } from '@/lib/db';
import Link from 'next/link';
import RuneDivider from '@/components/ui/RuneDivider';

const TYPE_LABELS: Record<string, string> = {
  SOIN: 'Soins énergétiques',
  COURS: 'Formations & Cours',
  CEREMONIE: 'Cérémonies',
  GUIDANCE: 'Guidance & Tirages',
  ATELIER: 'Ateliers & Animations',
  CONSULTATION: 'Consultations',
  SERVICE_EXTERIEUR: 'Services extérieurs',
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  SOIN: 'Soins sur mesure pour rééquilibrer corps, âme et esprit',
  COURS: 'Apprentissage des arts énergétiques et spirituels',
  CEREMONIE: 'Rituels et célébrations personnalisées',
  GUIDANCE: 'Lectures divinatoires pour éclairer ton chemin',
  ATELIER: 'Expériences de groupe et soirées découverte',
  CONSULTATION: 'Accompagnements spécialisés',
  SERVICE_EXTERIEUR: 'Soins et purifications hors de la boutique',
};

export const metadata = {
  title: 'Nos Services & Soins — Runes & Magie',
  description: 'Découvrez tous les soins, formations, cérémonies et consultations proposés par les praticien·ne·s certifié·e·s de Runes & Magie.',
};

export default async function ServicesPage() {
  const offerings = await prisma.offering.findMany({
    where: { isActive: true },
    include: {
      practitioner: { include: { user: { select: { firstName: true, lastName: true } } } },
      providers: { include: { practitioner: { include: { user: { select: { firstName: true } } } } } },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  // Grouper par type
  const grouped = offerings.reduce<Record<string, typeof offerings>>((acc, o) => {
    if (!acc[o.type]) acc[o.type] = [];
    acc[o.type].push(o);
    return acc;
  }, {});

  // Ordre des sections
  const typeOrder = ['SOIN', 'GUIDANCE', 'COURS', 'ATELIER', 'CEREMONIE', 'CONSULTATION', 'SERVICE_EXTERIEUR'];
  const sortedTypes = typeOrder.filter((t) => grouped[t]).concat(
    Object.keys(grouped).filter((t) => !typeOrder.includes(t)),
  );

  return (
    <div style={{ background: 'var(--noir-nuit)', minHeight: '100vh' }}>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--violet-profond) 0%, var(--charbon-mystere) 60%, var(--noir-nuit) 100%)',
          padding: '80px 24px 60px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', letterSpacing: '0.3em', fontSize: '0.8rem', marginBottom: '16px', opacity: 0.8 }}>
          ᚷ NOS SERVICES ᚷ
        </p>
        <h1 style={{ fontFamily: 'var(--font-cinzel-decorative)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair), var(--or-ancien))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' }}>
          Soins, Cours & Cérémonies
        </h1>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--parchemin-vieilli)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
          {offerings.length} services soigneusement préparés par nos praticien·ne·s pour t&apos;accompagner sur ton chemin
        </p>
      </section>

      <RuneDivider symbols="ᚢ ᛏ ᚨ" />

      {/* Sections par type */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {sortedTypes.map((type) => {
          const services = grouped[type];
          return (
            <div key={type} style={{ marginBottom: '64px' }}>
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {TYPE_LABELS[type] ?? type}
                </h2>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--parchemin)', opacity: 0.55, fontSize: '1.05rem' }}>
                  {TYPE_DESCRIPTIONS[type] ?? ''}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {services.map((o) => {
                  const allProviders = [
                    o.practitioner.user.firstName,
                    ...o.providers.map((p) => p.practitioner.user.firstName),
                  ];
                  return (
                    <article
                      key={o.id}
                      style={{
                        background: 'rgba(26, 26, 46, 0.9)',
                        border: '1px solid rgba(74, 45, 122, 0.3)',
                        borderRadius: '6px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ fontFamily: 'var(--font-cinzel-decorative)', fontSize: '2rem', color: 'var(--or-ancien)', lineHeight: 1 }}>
                          {o.emoji}
                        </div>
                        {o.isFeatured && (
                          <span style={{ padding: '2px 10px', background: 'rgba(201, 168, 76, 0.15)', border: '1px solid rgba(201, 168, 76, 0.4)', color: 'var(--or-ancien)', borderRadius: '12px', fontSize: '0.65rem', fontFamily: 'var(--font-cinzel)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Vedette
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-clair)', fontSize: '1.05rem', lineHeight: 1.3, margin: 0 }}>
                        {o.name}
                      </h3>

                      <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)', opacity: 0.7, fontSize: '0.95rem', lineHeight: 1.5, margin: 0, flex: 1, whiteSpace: 'pre-line' }}>
                        {o.description}
                      </p>

                      {/* Métadonnées */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.72rem' }}>
                        <span style={{ padding: '3px 10px', background: 'rgba(46, 196, 182, 0.1)', border: '1px solid rgba(46, 196, 182, 0.3)', color: 'var(--turquoise-cristal)', borderRadius: '12px' }}>
                          {o.durationMinutes} min
                        </span>
                        {o.numSessions && (
                          <span style={{ padding: '3px 10px', background: 'rgba(74, 45, 122, 0.2)', border: '1px solid rgba(74, 45, 122, 0.5)', color: 'var(--parchemin)', borderRadius: '12px' }}>
                            {o.numSessions} séances
                          </span>
                        )}
                        {o.capacity > 1 && (
                          <span style={{ padding: '3px 10px', background: 'rgba(74, 45, 122, 0.2)', border: '1px solid rgba(74, 45, 122, 0.5)', color: 'var(--parchemin)', borderRadius: '12px' }}>
                            {o.capacity} pers. max
                          </span>
                        )}
                        {o.modes.map((m) => (
                          <span
                            key={m}
                            style={{
                              padding: '3px 10px',
                              background: m === 'VIRTUAL' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                              border: `1px solid ${m === 'VIRTUAL' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                              color: m === 'VIRTUAL' ? '#60a5fa' : '#4ade80',
                              borderRadius: '12px',
                            }}
                          >
                            {m === 'IN_PERSON' ? 'Présentiel' : 'Virtuel'}
                          </span>
                        ))}
                      </div>

                      {/* Praticien·ne·s */}
                      <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)', opacity: 0.5, fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
                        Avec {allProviders.join(' ou ')}
                      </p>

                      {/* Prix */}
                      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(74, 45, 122, 0.3)' }}>
                        {o.price > 0 ? (
                          <>
                            <div style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '1.15rem', fontWeight: 600 }}>
                              {o.price.toFixed(2)} $
                              <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '4px' }}>/ personne</span>
                            </div>
                            {o.priceForTwo && (
                              <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--turquoise-cristal)', fontSize: '0.9rem', marginTop: '2px' }}>
                                {o.priceForTwo.toFixed(2)} $ pour 2 personnes
                              </div>
                            )}
                            {o.pricePackage && (
                              <div style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--or-clair)', fontSize: '0.9rem', marginTop: '4px' }}>
                                Forfait {o.numSessions ? `${o.numSessions} séances` : 'complet'} : <strong>{o.pricePackage.toFixed(0)} $</strong>
                                {o.pricePackageMsrp && o.pricePackageMsrp > o.pricePackage && (
                                  <span style={{ textDecoration: 'line-through', opacity: 0.5, marginLeft: '6px', fontSize: '0.8rem' }}>
                                    {o.pricePackageMsrp.toFixed(0)} $
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--parchemin)', opacity: 0.6, fontSize: '0.95rem' }}>
                            Tarif sur demande
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <Link
                        href={`/soins/reserver/${o.practitioner.id}?offering=${o.slug}`}
                        style={{
                          marginTop: '8px',
                          display: 'inline-block',
                          textAlign: 'center',
                          padding: '10px 16px',
                          background: 'linear-gradient(to right, var(--violet-royal), var(--violet-profond))',
                          border: '1px solid rgba(201, 168, 76, 0.4)',
                          color: 'var(--or-ancien)',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-cinzel)',
                          fontSize: '0.75rem',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          textDecoration: 'none',
                        }}
                      >
                        Réserver ce soin
                      </Link>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}

        {offerings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--parchemin)', opacity: 0.5, fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
            Aucun service disponible pour le moment. Reviens bientôt.
          </div>
        )}
      </section>
    </div>
  );
}
