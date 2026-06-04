/**
 * Audit READ-ONLY des anomalies de la base (système holistique V2).
 * N'écrit jamais — se contente de lister ce qui cloche.
 *
 * Exécution :
 *   npx tsx scripts/audit-anomalies.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

type Finding = { gravite: 'HAUTE' | 'MOYENNE' | 'BASSE'; categorie: string; detail: string };
const findings: Finding[] = [];
const add = (gravite: Finding['gravite'], categorie: string, detail: string) =>
  findings.push({ gravite, categorie, detail });

async function main() {
  console.log('\n🔍 Audit des anomalies — base holistique V2\n');

  const [offerings, practitioners, bookings, users] = await Promise.all([
    prisma.offering.findMany({ include: { practitioner: true, providers: true, bookings: true } }),
    prisma.practitioner.findMany(),
    prisma.booking.findMany(),
    prisma.user.findMany(),
  ]);

  console.log(
    `Volumétrie : ${offerings.length} offerings · ${practitioners.length} praticiens · ` +
      `${bookings.length} réservations · ${users.length} utilisateurs\n`
  );

  const practitionerIds = new Set(practitioners.map((p) => p.id));
  const offeringIds = new Set(offerings.map((o) => o.id));
  const userIds = new Set(users.map((u) => u.id));

  // ---- OFFERINGS ----
  // Doublons de slug (devrait être impossible via @unique, mais on vérifie)
  const slugCount = new Map<string, number>();
  // Doublons "logiques" : même praticien + même nom
  const nameKey = new Map<string, string[]>();

  for (const o of offerings) {
    slugCount.set(o.slug, (slugCount.get(o.slug) ?? 0) + 1);

    const k = `${o.practitionerId}::${o.name.trim().toLowerCase()}`;
    nameKey.set(k, [...(nameKey.get(k) ?? []), o.slug]);

    if (!o.name?.trim()) add('HAUTE', 'Offering', `${o.slug} : nom vide`);
    if (!o.description?.trim()) add('MOYENNE', 'Offering', `${o.slug} : description vide`);
    if (o.price == null || o.price <= 0) add('HAUTE', 'Offering', `${o.slug} : prix invalide (${o.price})`);
    if (o.durationMinutes == null || o.durationMinutes <= 0)
      add('HAUTE', 'Offering', `${o.slug} : durée invalide (${o.durationMinutes})`);
    if (o.priceForTwo != null && o.priceForTwo <= 0)
      add('BASSE', 'Offering', `${o.slug} : priceForTwo invalide (${o.priceForTwo})`);
    if (o.pricePackage != null && o.pricePackage <= 0)
      add('BASSE', 'Offering', `${o.slug} : pricePackage invalide (${o.pricePackage})`);
    if (o.pricePackageMsrp != null && o.pricePackage != null && o.pricePackageMsrp < o.pricePackage)
      add('BASSE', 'Offering', `${o.slug} : MSRP (${o.pricePackageMsrp}) < forfait (${o.pricePackage})`);
    if (!practitionerIds.has(o.practitionerId))
      add('HAUTE', 'Offering', `${o.slug} : practitionerId orphelin (${o.practitionerId})`);
    if (!o.modes?.length) add('MOYENNE', 'Offering', `${o.slug} : aucun mode (IN_PERSON/VIRTUAL)`);
    if (o.capacity != null && o.capacity < 1) add('MOYENNE', 'Offering', `${o.slug} : capacité < 1`);
  }

  for (const [slug, n] of slugCount) if (n > 1) add('HAUTE', 'Offering', `slug dupliqué : ${slug} (${n}×)`);
  for (const [k, slugs] of nameKey)
    if (slugs.length > 1)
      add('MOYENNE', 'Offering', `doublon logique (même praticien+nom) : ${slugs.join(', ')}`);

  // ---- PROVIDERS additionnels orphelins ----
  for (const o of offerings)
    for (const pr of o.providers)
      if (!practitionerIds.has(pr.practitionerId))
        add('MOYENNE', 'OfferingProvider', `${o.slug} : provider orphelin (${pr.practitionerId})`);

  // ---- BOOKINGS ----
  const byPractitioner = new Map<string, typeof bookings>();
  for (const b of bookings) {
    if (!offeringIds.has(b.offeringId)) add('HAUTE', 'Booking', `${b.id} : offeringId orphelin (${b.offeringId})`);
    if (!practitionerIds.has(b.practitionerId))
      add('HAUTE', 'Booking', `${b.id} : practitionerId orphelin (${b.practitionerId})`);
    if (!userIds.has(b.clientId)) add('HAUTE', 'Booking', `${b.id} : clientId orphelin (${b.clientId})`);
    if (b.endsAt <= b.startsAt)
      add('HAUTE', 'Booking', `${b.id} : endsAt <= startsAt (${b.startsAt.toISOString()})`);
    if (b.mode === 'VIRTUAL' && !b.dailyRoomUrl)
      add('BASSE', 'Booking', `${b.id} : VIRTUAL sans dailyRoomUrl`);
    if (b.status === 'CANCELLED' && !b.cancelledAt)
      add('BASSE', 'Booking', `${b.id} : CANCELLED sans cancelledAt`);

    const active = !['CANCELLED', 'NO_SHOW'].includes(b.status);
    if (active) byPractitioner.set(b.practitionerId, [...(byPractitioner.get(b.practitionerId) ?? []), b]);
  }

  // Chevauchements (double-booking) par praticien
  for (const [pid, list] of byPractitioner) {
    const sorted = [...list].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    for (let i = 1; i < sorted.length; i++)
      if (sorted[i].startsAt < sorted[i - 1].endsAt)
        add(
          'HAUTE',
          'Booking',
          `chevauchement praticien ${pid} : ${sorted[i - 1].id} (${sorted[i - 1].startsAt.toISOString()}→${sorted[i - 1].endsAt.toISOString()}) ∩ ${sorted[i].id} (${sorted[i].startsAt.toISOString()})`
        );
  }

  // ---- PRACTITIONERS ----
  for (const p of practitioners) {
    const activeOfferings = offerings.filter((o) => o.practitionerId === p.id && o.isActive);
    if (p.status !== 'APPROVED' && activeOfferings.length)
      add('MOYENNE', 'Practitioner', `${p.slug} : statut ${p.status} mais ${activeOfferings.length} offering(s) actif(s)`);
  }

  // ---- RAPPORT ----
  const order = { HAUTE: 0, MOYENNE: 1, BASSE: 2 } as const;
  findings.sort((a, b) => order[a.gravite] - order[b.gravite] || a.categorie.localeCompare(b.categorie));

  if (!findings.length) {
    console.log('✅ Aucune anomalie détectée.\n');
  } else {
    const counts = findings.reduce<Record<string, number>>((acc, f) => ((acc[f.gravite] = (acc[f.gravite] ?? 0) + 1), acc), {});
    console.log(`⚠️  ${findings.length} anomalie(s) : ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(' · ')}\n`);
    for (const f of findings) console.log(`  [${f.gravite.padEnd(7)}] ${f.categorie.padEnd(16)} ${f.detail}`);
    console.log('');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
