import { prisma } from '@/lib/db';
import OfferingRowActions from './OfferingRowActions';

export default async function OfferingsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;

  const offerings = await prisma.offering.findMany({
    include: {
      practitioner: { include: { user: { select: { firstName: true, lastName: true } } } },
      providers: {
        include: { practitioner: { include: { user: { select: { firstName: true } } } } },
      },
      category: { select: { id: true, name: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  // Stats
  const activeCount = offerings.filter((o) => o.isActive).length;
  const inactiveCount = offerings.length - activeCount;

  // Filtre par catégorie
  const catMap = new Map<string, { id: string; name: string; count: number }>();
  let noneCount = 0;
  for (const o of offerings) {
    if (o.category) {
      const e = catMap.get(o.category.id) ?? { id: o.category.id, name: o.category.name, count: 0 };
      e.count += 1;
      catMap.set(o.category.id, e);
    } else {
      noneCount += 1;
    }
  }
  const cats = [...catMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  const selectedCategory = params.category;
  const filtered = selectedCategory
    ? selectedCategory === 'none'
      ? offerings.filter((o) => !o.categoryId)
      : offerings.filter((o) => o.categoryId === selectedCategory)
    : offerings;

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
            ᚹ Services & Offrandes
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
            {offerings.length} service(s) au total — {activeCount} actif(s), {inactiveCount} désactivé(s)
          </p>
        </div>
        <a
          href="/admin/offerings/nouveau"
          style={{
            padding: '10px 20px',
            background: '#6B3FA0',
            color: '#FFFFFF',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'var(--font-cinzel, serif)',
          }}
        >
          + Nouveau service
        </a>
      </div>

      {offerings.length === 0 ? (
        <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '48px', textAlign: 'center', color: '#9CA3AF', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1rem' }}>Aucun service pour l&apos;instant.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
            Lance <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>npx tsx scripts/seed-offerings-from-excel.ts</code> ou clique « + Nouveau service ».
          </p>
        </div>
      ) : (
        <>
          {/* Filtre par catégorie */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #E5E7EB', flexWrap: 'wrap' }}>
            <a
              href="/admin/offerings"
              style={{
                padding: '10px 20px',
                fontFamily: 'var(--font-cinzel, serif)',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                borderBottom: !selectedCategory ? '2px solid #6B3FA0' : '2px solid transparent',
                color: !selectedCategory ? '#6B3FA0' : '#6B7280',
                marginBottom: '-2px',
              }}
            >
              Tous ({offerings.length})
            </a>
            {cats.map((c) => (
              <a
                key={c.id}
                href={`/admin/offerings?category=${c.id}`}
                style={{
                  padding: '10px 20px',
                  fontFamily: 'var(--font-cinzel, serif)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderBottom: selectedCategory === c.id ? '2px solid #6B3FA0' : '2px solid transparent',
                  color: selectedCategory === c.id ? '#6B3FA0' : '#6B7280',
                  marginBottom: '-2px',
                }}
              >
                {c.name} ({c.count})
              </a>
            ))}
            {noneCount > 0 && (
              <a
                href="/admin/offerings?category=none"
                style={{
                  padding: '10px 20px',
                  fontFamily: 'var(--font-cinzel, serif)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderBottom: selectedCategory === 'none' ? '2px solid #6B3FA0' : '2px solid transparent',
                  color: selectedCategory === 'none' ? '#6B3FA0' : '#9CA3AF',
                  marginBottom: '-2px',
                }}
              >
                Sans catégorie ({noneCount})
              </a>
            )}
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '48px', textAlign: 'center', color: '#9CA3AF', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1rem' }}>Aucun service dans cette catégorie.</p>
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    {['Service', 'Catégorie', 'Praticien·ne·s', 'Prix', 'Durée', 'Modes', 'Statut', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.72rem', fontWeight: 600, color: '#6B3FA0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, idx) => {
                    const allProviders = [
                      `${o.practitioner.user.firstName}${o.practitioner.user.lastName ? ' ' + o.practitioner.user.lastName : ''}`,
                      ...o.providers.map((p) => p.practitioner.user.firstName),
                    ];
                    const priceStr = o.priceForTwo ? `${o.price} $ / ${o.priceForTwo} $ duo` : `${o.price} $`;
                    const packageStr = o.pricePackage ? ` · forfait ${o.pricePackage} $` : '';
                    return (
                      <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.4rem' }}>{o.emoji}</span>
                            <div>
                              <p style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.9rem', margin: 0 }}>{o.name}</p>
                              <p style={{ color: '#9CA3AF', fontSize: '0.72rem', margin: '2px 0 0' }}>{o.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {o.category ? (
                            <span style={{ padding: '2px 10px', background: '#EDE9FE', color: '#6B3FA0', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 500, fontFamily: 'var(--font-cinzel, serif)' }}>
                              {o.category.name}
                            </span>
                          ) : (
                            <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#4B5563' }}>
                          {allProviders.join(', ')}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#4B5563', whiteSpace: 'nowrap' }}>
                          {priceStr}{packageStr}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#4B5563' }}>
                          {o.durationMinutes} min{o.capacity > 1 ? ` · ${o.capacity} pl.` : ''}
                          {o.numSessions ? ` · ${o.numSessions} séances` : ''}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.78rem' }}>
                          {o.modes.map((m) => (
                            <span key={m} style={{ display: 'inline-block', padding: '2px 8px', background: m === 'VIRTUAL' ? '#DBEAFE' : '#D1FAE5', color: m === 'VIRTUAL' ? '#1E40AF' : '#065F46', borderRadius: '8px', fontSize: '0.7rem', marginRight: '4px' }}>
                              {m === 'IN_PERSON' ? 'Présentiel' : 'Virtuel'}
                            </span>
                          ))}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '2px 10px', background: o.isActive ? '#D1FAE5' : '#F3F4F6', color: o.isActive ? '#065F46' : '#6B7280', border: '1px solid', borderColor: o.isActive ? '#6EE7B7' : '#D1D5DB', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600 }}>
                            {o.isActive ? 'Actif' : 'Désactivé'}
                          </span>
                          {o.isFeatured && (
                            <span style={{ marginLeft: '4px', padding: '2px 8px', background: '#FEF3C7', color: '#92400E', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600 }}>
                              Vedette
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <OfferingRowActions offeringId={o.id} isActive={o.isActive} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
