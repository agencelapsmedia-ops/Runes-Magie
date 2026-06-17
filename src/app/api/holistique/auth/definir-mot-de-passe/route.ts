import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { verifySetPasswordToken } from '@/lib/holistic-password-token';

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
  }

  const uid = await verifySetPasswordToken(typeof token === 'string' ? token : '');
  if (!uid) return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 401 });

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.holisticUser.update({ where: { id: uid }, data: { hashedPassword } });
  return NextResponse.json({ ok: true });
}
