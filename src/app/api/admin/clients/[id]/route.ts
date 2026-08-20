import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** PATCH /api/admin/clients/[id] — modifie les informations d'un client (prénom, nom, courriel, téléphone). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const client = await prisma.holisticUser.findUnique({
    where: { id },
    select: { id: true, role: true, email: true },
  });
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  // Sécurité : cette route ne modifie que des fiches CLIENT (jamais praticiennes ni admins).
  if (client.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Seules les fiches client peuvent être modifiées ici.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'Le prénom et le nom sont requis.' }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Adresse courriel invalide.' }, { status: 400 });
  }
  if (firstName.length > 100 || lastName.length > 100 || email.length > 200 || phone.length > 30) {
    return NextResponse.json({ error: 'Un des champs est trop long.' }, { status: 400 });
  }

  // Le courriel doit rester unique (c'est l'identifiant de connexion).
  if (email !== client.email.toLowerCase()) {
    const existing = await prisma.holisticUser.findUnique({ where: { email }, select: { id: true } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: 'Ce courriel est déjà utilisé par un autre compte.' }, { status: 409 });
    }
  }

  const updated = await prisma.holisticUser.update({
    where: { id },
    data: { firstName, lastName, email, phone: phone || null },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  });

  return NextResponse.json({ ok: true, client: updated });
}
