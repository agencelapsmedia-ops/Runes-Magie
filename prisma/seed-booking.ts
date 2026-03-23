import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding booking system...");

  // 1. Admin user
  const adminEmail = process.env.ADMIN_EMAIL || "sorciere@runesetmagie.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme";
  const hashedPassword = await hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      hashedPassword,
      name: "Noctura Anna",
    },
  });
  console.log(`Admin user: ${adminEmail}`);

  // 2. Services (matching existing site services)
  const services = [
    {
      name: "Le Soin Rituel",
      slug: "soin-rituel",
      description: "Soin energetique sur chaise a massage avec points de pression et techniques de respiration, faisant appel aux 4 elements et a la magie naturelle.",
      durationMinutes: 75,
      bufferMinutes: 15,
      price: 125,
      colorHex: "#6B3FA0",
      emoji: "\u16CA",
    },
    {
      name: "Tirage Runes & Cartes Combines",
      slug: "tirage-runes-cartes-combines",
      description: "Tirage de Runes Futhark combine a un tirage de Cartes de Tarot ou d'Oracle, selectionne selon votre energie.",
      durationMinutes: 60,
      bufferMinutes: 15,
      price: 95,
      colorHex: "#4A2D7A",
      emoji: "\u16C8",
    },
    {
      name: "Tirage Simple",
      slug: "tirage-simple",
      description: "Tirage de Cartes divinatoires ou de Runes Futhark pour une question precise.",
      durationMinutes: 30,
      bufferMinutes: 15,
      price: 60,
      colorHex: "#1A8A7D",
      emoji: "\u16A8",
    },
    {
      name: "Cours Prive",
      slug: "cours-prive",
      description: "Session individuelle de formation dans l'univers energetique et spirituel. Disponible sur place ou en virtuel.",
      durationMinutes: 60,
      bufferMinutes: 15,
      price: 89.99,
      colorHex: "#C41D6E",
      emoji: "\u16B1",
    },
    {
      name: "Consultation Mediumnique",
      slug: "consultation-mediumnique",
      description: "Seance de communication intuitive pour recevoir des messages de l'au-dela et des guidances spirituelles profondes.",
      durationMinutes: 45,
      bufferMinutes: 15,
      price: 85,
      colorHex: "#8B2F8B",
      emoji: "\u16B9",
    },
    {
      name: "Soin Energetique a Distance",
      slug: "soin-energetique-distance",
      description: "Soin energetique realise a distance par visioconference, travail sur les chakras et les corps subtils.",
      durationMinutes: 45,
      bufferMinutes: 15,
      price: 75,
      colorHex: "#0D5C54",
      emoji: "\u16B9",
    },
  ];

  for (const service of services) {
    await prisma.bookingService.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
  }
  console.log(`${services.length} services created`);

  // 3. Availability rules (Mardi-Samedi, 10h-17h)
  const existingRules = await prisma.availabilityRule.count();
  if (existingRules === 0) {
    const days = [2, 3, 4, 5, 6]; // Tue-Sat
    for (const dayOfWeek of days) {
      await prisma.availabilityRule.create({
        data: {
          dayOfWeek,
          startTime: "10:00",
          endTime: "17:00",
          isActive: true,
        },
      });
    }
    console.log("Availability rules created (Tue-Sat, 10:00-17:00)");
  }

  // 4. Default settings
  const defaults: Record<string, string> = {
    timezone: "America/Toronto",
    booking_advance_days: "60",
    booking_min_hours_before: "2",
    cancellation_hours_before: "24",
    confirmation_email_enabled: "true",
    reminder_enabled: "true",
    reminder_hours_before: "24",
  };

  for (const [key, value] of Object.entries(defaults)) {
    await prisma.bookingSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log("Default settings created");

  console.log("Booking seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
