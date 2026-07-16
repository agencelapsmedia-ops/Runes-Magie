/**
 * Chiffrement des jetons d'accès des comptes réseaux sociaux (AES-256-GCM).
 *
 * Format stocké : base64(iv).base64(authTag).base64(chiffré)
 * Clé : SOCIAL_TOKEN_ENCRYPTION_KEY — 32 octets encodés en base64.
 *   Génération : node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Règles : jamais de jeton en clair en base, dans les logs ni dans les
 * réponses API (seuls les 4 derniers caractères sont conservés à part).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;

function getKey(): Buffer {
  const raw = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "SOCIAL_TOKEN_ENCRYPTION_KEY absente — générer 32 octets base64 et l'ajouter aux variables d'environnement.",
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY invalide — attendu : 32 octets encodés en base64.');
  }
  return key;
}

/** Le chiffrement est-il configuré ? (pour un message d'erreur propre côté admin) */
export function chiffrementConfigure(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

export function chiffrerToken(token: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function dechiffrerToken(stored: string): string {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = stored.split('.');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Jeton chiffré illisible (format inattendu).');
  }
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}
