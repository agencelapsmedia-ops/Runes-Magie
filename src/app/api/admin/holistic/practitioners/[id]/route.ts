import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as { action: 'approve' | 'reject'; note?: string };
    const { action, note } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide. Utilisez "approve" ou "reject".' }, { status: 400 });
    }

    const practitioner = await prisma.practitioner.findUnique({ where: { id } });
    if (!practitioner) {
      return NextResponse.json({ error: 'Praticien introuvable.' }, { status: 404 });
    }

    const updated = await prisma.practitioner.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedAt: action === 'approve' ? new Date() : null,
        adminNote: note ?? null,
      },
      include: { user: true },
    });

    return NextResponse.json({ success: true, practitioner: updated });
  } catch (error) {
    console.error('[PUT /api/admin/holistic/practitioners/[id]]', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
