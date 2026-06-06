/**
 * Applique les migrations Prisma au build (Vercel production) — mais SEULEMENT si
 * `DIRECT_URL` est disponible.
 *
 * Pourquoi : le schéma utilise `directUrl = env("DIRECT_URL")`. En production
 * Vercel, cette variable existe → on applique les migrations. En preview (branches)
 * ou en local sans `.env`, elle peut être absente → on saute la migration au lieu
 * de faire échouer tout le build.
 */
import { execSync } from 'node:child_process';

if (process.env.DIRECT_URL) {
  console.log('▶️  prisma migrate deploy (DIRECT_URL présente)…');
  execSync('prisma migrate deploy', { stdio: 'inherit' });
} else {
  console.log('⏭️  Migration sautée : DIRECT_URL non définie (preview/local). Build poursuivi.');
}
