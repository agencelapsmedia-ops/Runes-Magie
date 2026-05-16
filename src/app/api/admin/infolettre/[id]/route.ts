import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

/**
 * PATCH /api/admin/infolettre/[id]
 *
 * Actions admin sur un NewsletterSubscriber.
 * Body: { action: 'unsubscribe' | 'resubscribe' | 'delete' }
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const { action } = await req.json();

  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } });
  if (!subscriber) {
    return NextResponse.json({ error: 'Abonné introuvable' }, { status: 404 });
  }

  if (action === 'unsubscribe') {
    const updated = await prisma.newsletterSubscriber.update({
      where: { id },
      data: { unsubscribedAt: new Date(), consentEmail: false },
    });
    return NextResponse.json({ success: true, subscriber: updated });
  }

  if (action === 'resubscribe') {
    const updated = await prisma.newsletterSubscriber.update({
      where: { id },
      data: { unsubscribedAt: null, consentEmail: true, consentedAt: new Date() },
    });
    return NextResponse.json({ success: true, subscriber: updated });
  }

  if (action === 'delete') {
    // Hard delete — utile pour les requêtes RGPD/Loi 25 "droit à l'oubli"
    await prisma.newsletterSubscriber.delete({ where: { id } });
    return NextResponse.json({ success: true, deleted: true });
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
}
