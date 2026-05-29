import { prisma } from '@/lib/db';
import OfferingForm from '../OfferingForm';
import { createOffering } from '../actions';

export default async function NewOfferingPage() {
  const [practitioners, existingOfferings] = await Promise.all([
    prisma.practitioner.findMany({
      where: { status: 'APPROVED' },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { user: { firstName: 'asc' } },
    }),
    prisma.offering.findMany({ select: { type: true }, distinct: ['type'] }),
  ]);

  const existingTypes = existingOfferings.map((o) => o.type).sort();
  if (existingTypes.length === 0) {
    existingTypes.push('SOIN', 'COURS', 'CEREMONIE', 'GUIDANCE', 'ATELIER', 'CONSULTATION');
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <a href="/admin/offerings" style={{ display: 'inline-block', marginBottom: '12px', fontSize: '0.85rem', color: '#6B3FA0', textDecoration: 'none' }}>
          ← Retour à la liste
        </a>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
          ᚹ Nouveau service
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Crée un nouveau service (soin, cours, atelier, cérémonie, etc.). Le slug est généré automatiquement à partir du nom.
        </p>
      </div>

      <OfferingForm
        action={createOffering}
        practitioners={practitioners.map((p) => ({
          id: p.id,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          slug: p.slug,
        }))}
        existingTypes={existingTypes}
        cancelHref="/admin/offerings"
        submitLabel="Créer le service"
      />
    </div>
  );
}
