import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import OfferingForm from '../../OfferingForm';
import { updateOffering } from '../../actions';

export default async function EditOfferingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const offering = await prisma.offering.findUnique({
    where: { id },
    include: {
      practitioner: { include: { user: { select: { firstName: true } } } },
      providers: true,
    },
  });

  if (!offering) notFound();

  // Praticien·ne·s déjà rattaché·e·s à ce service (primaire + providers),
  // qu'on doit toujours pouvoir re-sélectionner même s'ils ne sont pas APPROVED —
  // sinon l'enregistrement échoue (au moins 1 praticien·ne obligatoire).
  const associatedPractitionerIds = [
    offering.practitionerId,
    ...offering.providers.map((p) => p.practitionerId),
  ];

  const [practitioners, existingOfferings] = await Promise.all([
    prisma.practitioner.findMany({
      where: {
        OR: [
          { status: 'APPROVED' },
          { id: { in: associatedPractitionerIds } },
        ],
      },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { user: { firstName: 'asc' } },
    }),
    prisma.offering.findMany({ select: { type: true }, distinct: ['type'] }),
  ]);

  const existingTypes = existingOfferings.map((o) => o.type).sort();
  const updateAction = updateOffering.bind(null, id);

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <a href="/admin/offerings" style={{ display: 'inline-block', marginBottom: '12px', fontSize: '0.85rem', color: '#6B3FA0', textDecoration: 'none' }}>
          ← Retour à la liste
        </a>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
          ᚹ Modifier : {offering.name}
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Slug : <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{offering.slug}</code>
        </p>
      </div>

      <OfferingForm
        action={updateAction}
        practitioners={practitioners.map((p) => ({
          id: p.id,
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          slug: p.slug,
        }))}
        existingTypes={existingTypes}
        cancelHref="/admin/offerings"
        submitLabel="Enregistrer les modifications"
        offeringId={id}
        defaults={{
          name: offering.name,
          type: offering.type,
          description: offering.description,
          longDescription: offering.longDescription,
          durationMinutes: offering.durationMinutes,
          capacity: offering.capacity,
          price: offering.price,
          priceForTwo: offering.priceForTwo,
          pricePackage: offering.pricePackage,
          pricePackageMsrp: offering.pricePackageMsrp,
          numSessions: offering.numSessions,
          emoji: offering.emoji,
          imageUrl: offering.imageUrl,
          sortOrder: offering.sortOrder,
          isFeatured: offering.isFeatured,
          isActive: offering.isActive,
          modes: offering.modes,
          primaryPractitionerId: offering.practitionerId,
          additionalPractitionerIds: offering.providers.map((p) => p.practitionerId),
        }}
      />
    </div>
  );
}
