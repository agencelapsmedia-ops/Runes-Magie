import { prisma } from '@/lib/db';
import { isInternalEmail } from '@/lib/holistic-clients';
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
  // Ménage paresseux (même règle que la page de réservation) : les réservations
  // « en attente de paiement » abandonnées depuis > 30 min (lien Stripe expiré)
  // sont supprimées — elles ne polluent plus le calendrier de la praticienne.
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const stale = await prisma.holisticAppointment.findMany({
    where: { status: 'PENDING', createdAt: { lt: thirtyMinAgo } },
    select: { id: true },
  });
  if (stale.length) {
    const staleIds = stale.map((s) => s.id);
    await prisma.holisticPayment.deleteMany({ where: { appointmentId: { in: staleIds } } });
    await prisma.holisticAppointment.deleteMany({ where: { id: { in: staleIds } } });
  }

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

  // Le nom du soin est stocké dans les notes au format « Service : … ».
  const serviceFromNotes = (notes: string | null): string => {
    const m = (notes ?? '').match(/Service\s*:\s*([^\n]+)/);
    return m ? m[1].trim() : 'Consultation';
  };

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
    serviceName: serviceFromNotes(a.notes),
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

  // Praticienne principale pour la feuille de création mobile (Task 7) : à ce
  // jour une seule praticienne est APPROVED, on retient donc la première —
  // même convention que ManualAppointmentButton (practitioners[0]).
  //
  // Tri des soins par fréquence (demandé par le brief) : `Offering` n'a pas de
  // relation vers `HolisticAppointment` (le soin d'un RDV v2 est retrouvé par
  // texte dans les notes, voir `serviceFromNotes` ci-dessus) — aucun compte de
  // rendez-vous n'est donc disponible côté Prisma. On retombe sur le tri déjà
  // fait par la requête ci-dessus (`orderBy: { name: 'asc' }`).
  const practitionerPrincipale = practitionerOptions[0] ?? null;

  // Dernières clientes de la praticienne principale — même forme que
  // GET /api/admin/clients/search (id, firstName, lastName, email, phone).
  // Dérivées de ses derniers rendez-vous, dédupliquées par personne (la plus
  // récente conservée), limitées à 8 comme la recherche.
  const clientesRecentes: { id: string; firstName: string; lastName: string; email: string; phone: string }[] = [];
  if (practitionerPrincipale) {
    const rdvsRecents = await prisma.holisticAppointment.findMany({
      where: { practitionerId: practitionerPrincipale.id },
      orderBy: { createdAt: 'desc' },
      select: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
      take: 60, // marge pour dédupliquer par cliente avant de garder les 8 plus récentes
    });
    const dejaVues = new Set<string>();
    for (const { client } of rdvsRecents) {
      if (!client.id || dejaVues.has(client.id)) continue; // id vide (garde-fou) ou cliente déjà retenue
      dejaVues.add(client.id);
      clientesRecentes.push({
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        // Adresse interne (compte créé sans courriel) : jamais affichée, comme côté /clients/search.
        email: isInternalEmail(client.email) ? '' : client.email,
        // `phone` est nullable en base ; la feuille attend une chaîne.
        phone: client.phone ?? '',
      });
      if (clientesRecentes.length >= 8) break;
    }
  }

  return (
    <CalendrierClient
      rdvs={rdvs}
      praticiennes={praticiennes}
      practitionerOptions={practitionerOptions}
      practitionerPrincipale={practitionerPrincipale}
      clientesRecentes={clientesRecentes}
    />
  );
}
