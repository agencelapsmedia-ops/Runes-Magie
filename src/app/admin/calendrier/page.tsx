import { prisma } from '@/lib/db';
import CalendrierClient from './CalendrierClient';

// Toujours frais : les rendez-vous changent en continu (réservations publiques + manuelles).
export const dynamic = 'force-dynamic';

/**
 * Calendrier admin : TOUS les rendez-vous de TOUTES les praticiennes au même
 * endroit, en vues mois / semaine / jour (FullCalendar). Même source de données
 * que /admin/consultations (HolisticAppointment), lue directement via Prisma
 * puis sérialisée pour le composant client.
 */
export default async function CalendrierAdminPage() {
  const [appointments, practitioners] = await Promise.all([
    prisma.holisticAppointment.findMany({
      include: {
        client: { select: { firstName: true, lastName: true, email: true, phone: true } },
        practitioner: { include: { user: { select: { firstName: true, lastName: true } } } },
        payment: { select: { status: true } },
      },
      orderBy: { startsAt: 'asc' },
    }),
    prisma.practitioner.findMany({
      where: { status: 'APPROVED' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        // Offerings actives : alimente le modal « + Nouveau rendez-vous »
        // (même forme que /admin/consultations).
        offerings: {
          where: { isActive: true },
          select: { id: true, name: true, durationMinutes: true, price: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Objets 100 % sérialisables pour le client component (Dates → ISO).
  const rdvs = appointments.map((a) => ({
    id: a.id,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
    status: a.status,
    practitionerId: a.practitionerId,
    practitionerName: `${a.practitioner.user.firstName} ${a.practitioner.user.lastName}`.trim(),
    clientName: `${a.client.firstName} ${a.client.lastName}`.trim(),
    clientEmail: a.client.email,
    clientPhone: a.client.phone ?? null,
    notes: a.notes ?? null,
    paymentMode: a.paymentMode ?? null,
    paymentStatus: a.payment?.status ?? null,
  }));

  const praticiennes = practitioners.map((p) => ({
    id: p.id,
    name: `${p.user.firstName} ${p.user.lastName}`.trim(),
  }));

  // Options du modal de création (praticienne + ses soins actifs).
  const practitionerOptions = practitioners.map((p) => ({
    id: p.id,
    name: `${p.user.firstName} ${p.user.lastName}`.trim(),
    offerings: p.offerings,
  }));

  return <CalendrierClient rdvs={rdvs} praticiennes={praticiennes} practitionerOptions={practitionerOptions} />;
}
