import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import PractitionerForm from '../../PractitionerForm';
import { updatePractitioner } from '../../actions';

export default async function EditPractitionerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const practitioner = await prisma.practitioner.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!practitioner) notFound();

  // Bind id à l'action pour qu'elle soit utilisable directement par le formulaire
  const updateAction = updatePractitioner.bind(null, id);

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <a
          href="/admin/praticiens"
          style={{
            display: 'inline-block',
            marginBottom: '12px',
            fontSize: '0.85rem',
            color: '#6B3FA0',
            textDecoration: 'none',
          }}
        >
          ← Retour à la liste
        </a>
        <h1
          style={{
            fontFamily: 'var(--font-cinzel, serif)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#2D1B4E',
            marginBottom: '8px',
          }}
        >
          ᚻ Modifier {practitioner.user.firstName} {practitioner.user.lastName}
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Slug actuel : <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>{practitioner.slug}</code>
          {' '}— il sera régénéré si le nom change.
        </p>
      </div>

      <PractitionerForm
        action={updateAction}
        cancelHref="/admin/praticiens"
        submitLabel="Enregistrer les modifications"
        showPasswordField
        defaults={{
          email: practitioner.user.email,
          firstName: practitioner.user.firstName,
          lastName: practitioner.user.lastName,
          bio: practitioner.bio,
          specialties: practitioner.specialties,
          yearsExperience: practitioner.yearsExperience,
          hourlyRate: practitioner.hourlyRate,
          photoUrl: practitioner.photoUrl,
        }}
      />
    </div>
  );
}
