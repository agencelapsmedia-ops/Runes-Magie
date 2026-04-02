import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌟 Création des praticiens fictifs...');

  const practitioners = [
    {
      firstName: 'Séraphine',
      lastName: 'Beaumont',
      email: 'seraphine@example.com',
      specialty: ['Reiki', 'Soins Chamaniques'],
      bio: "Initiée aux arts sacrés du Reiki depuis plus de 15 ans, Séraphine canalise les énergies universelles pour rétablir l'harmonie corps-âme-esprit. Chaque soin est une cérémonie, un voyage intérieur guidé par les forces de la lumière.",
      yearsExperience: 15,
      hourlyRate: 95,
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
      availabilities: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '10:00', endTime: '15:00' },
      ],
    },
    {
      firstName: 'Marc-André',
      lastName: 'Tremblay',
      email: 'marc-andre@example.com',
      specialty: ['Naturopathie', 'Coaching Spirituel'],
      bio: "Naturopathe certifié et guide de transformation spirituelle, Marc-André accompagne les âmes en quête d'équilibre naturel. Sa pratique intègre les plantes médicinales, la nutrition holistique et les enseignements anciens pour une guérison profonde.",
      yearsExperience: 8,
      hourlyRate: 85,
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      availabilities: [
        { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
        { dayOfWeek: 6, startTime: '09:00', endTime: '13:00' },
      ],
    },
    {
      firstName: 'Luna',
      lastName: 'Moreau',
      email: 'luna@example.com',
      specialty: ['Cristallothérapie', 'Reiki'],
      bio: "Gardienne des cristaux et maîtresse Reiki de 3ème degré, Luna travaille avec les fréquences vibratoires des pierres précieuses pour libérer les blocages énergétiques. Ses soins sont des rituels de purification et d'élévation vibratoire.",
      yearsExperience: 10,
      hourlyRate: 90,
      photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      availabilities: [
        { dayOfWeek: 1, startTime: '13:00', endTime: '20:00' },
        { dayOfWeek: 2, startTime: '13:00', endTime: '20:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
      ],
    },
    {
      firstName: 'Étienne',
      lastName: 'Dubois',
      email: 'etienne@example.com',
      specialty: ['Hypnose', 'Coaching Spirituel'],
      bio: "Hypnothérapeute et psychologue transpersonnel, Étienne guide les voyages de l'inconscient pour libérer les mémoires karmiques et reprogrammer les croyances limitantes. Sa méthode unique allie hypnose ericksonienne et travail énergétique.",
      yearsExperience: 12,
      hourlyRate: 110,
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      availabilities: [
        { dayOfWeek: 3, startTime: '08:00', endTime: '16:00' },
        { dayOfWeek: 4, startTime: '08:00', endTime: '16:00' },
        { dayOfWeek: 5, startTime: '08:00', endTime: '14:00' },
      ],
    },
    {
      firstName: 'Isabelle',
      lastName: 'Côté',
      email: 'isabelle@example.com',
      specialty: ['Soins Chamaniques', 'Naturopathie'],
      bio: "Chamane urbaine formée dans les traditions autochtones et nord-européennes, Isabelle tisse le lien entre les mondes pour des guérisons profondes. Elle utilise le voyage chamanique, les tambours sacrés et la connexion aux esprits-guides.",
      yearsExperience: 18,
      hourlyRate: 100,
      photoUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop',
      availabilities: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '15:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '15:00' },
        { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' },
      ],
    },
    {
      firstName: 'Naomie',
      lastName: 'Bergeron',
      email: 'naomie@example.com',
      specialty: ['Reiki', 'Cristallothérapie', 'Coaching Spirituel'],
      bio: "Enseignante Reiki et thérapeute holistique, Naomie accompagne les femmes sur leur chemin de guérison et d'éveil. Ses séances intègrent le Reiki, la méditation guidée et le travail avec les cristaux pour une transformation en douceur.",
      yearsExperience: 7,
      hourlyRate: 80,
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
      availabilities: [
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 5, startTime: '13:00', endTime: '19:00' },
      ],
    },
  ];

  for (const p of practitioners) {
    // Check if already exists
    const existing = await prisma.holisticUser.findUnique({ where: { email: p.email } });
    if (existing) {
      console.log(`⏭ ${p.firstName} ${p.lastName} existe déjà`);
      continue;
    }

    const hashedPassword = await bcrypt.hash('Runes2024!', 12);
    const slug = `${p.firstName}-${p.lastName}`.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    await prisma.holisticUser.create({
      data: {
        email: p.email,
        hashedPassword,
        firstName: p.firstName,
        lastName: p.lastName,
        role: 'PRACTITIONER',
        practitioner: {
          create: {
            slug,
            status: 'APPROVED',
            bio: p.bio,
            specialties: p.specialty,
            yearsExperience: p.yearsExperience,
            hourlyRate: p.hourlyRate,
            photoUrl: p.photoUrl,
            approvedAt: new Date(),
            availabilities: {
              create: p.availabilities.map(a => ({ ...a, isActive: true })),
            },
          },
        },
      },
    });
    console.log(`✅ Praticien créé: ${p.firstName} ${p.lastName} (${slug})`);
  }

  console.log('✨ Seed terminé!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
