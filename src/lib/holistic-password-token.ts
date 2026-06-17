/**
 * Jeton signé « définir mon mot de passe » — sans colonne DB, sans dépendance externe.
 *
 * Format : `<payloadBase64url>.<hmacBase64url>` où le HMAC-SHA256 (clé = AUTH_SECRET)
 * couvre `<payload>.<hashedPassword actuel>`. Lier la signature au hash courant rend
 * le jeton À USAGE UNIQUE : dès que la cliente définit son mot de passe, le hash change
 * et l'ancien jeton ne valide plus. Réutilisable tel quel pour un futur « mot de passe oublié ».
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/db';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET manquant — requis pour signer les jetons de mot de passe');
  return s;
}

function sign(payloadB64: string, hashedPassword: string): string {
  return createHmac('sha256', getSecret()).update(`${payloadB64}.${hashedPassword}`).digest('base64url');
}

/** Signe un jeton lié au hash actuel de l'utilisateur (→ usage unique). */
export function signSetPasswordToken(user: { id: string; hashedPassword: string }): string {
  const payload = { uid: user.id, exp: Date.now() + TOKEN_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64, user.hashedPassword)}`;
}

/** Vérifie un jeton ; retourne l'id utilisateur si valide et non expiré, sinon null. */
export async function verifySetPasswordToken(token: string): Promise<string | null> {
  try {
    const [payloadB64, sig] = (token ?? '').split('.');
    if (!payloadB64 || !sig) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      uid?: string;
      exp?: number;
    };
    if (!payload?.uid || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;

    const user = await prisma.holisticUser.findUnique({
      where: { id: payload.uid },
      select: { id: true, hashedPassword: true },
    });
    if (!user) return null;

    const expected = sign(payloadB64, user.hashedPassword);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    return user.id;
  } catch {
    return null;
  }
}
