/**
 * holistic-auth.ts — Wrapper de compatibilité.
 *
 * Historiquement, le site avait DEUX instances NextAuth séparées :
 *   - `/api/auth/[...nextauth]`        → AdminUser (admin site principal)
 *   - `/api/holistique/auth/[...nextauth]` → HolisticUser (clients + praticiens)
 *
 * Problème : le `signIn()` de `next-auth/react` ne tape QUE `/api/auth/*` par défaut,
 * donc les inscriptions sur `/soins/auth/register` (qui créent un HolisticUser)
 * ne pouvaient jamais se reconnecter.
 *
 * Fix : on a unifié l'authorize() dans `auth.ts` (tente AdminUser puis HolisticUser).
 * Ce fichier ré-exporte simplement les helpers de `auth.ts` pour ne pas casser
 * les imports existants (`holisticSession`, `holisticHandlers`, etc.).
 */

export {
  auth as holisticSession,
  handlers as holisticHandlers,
  signIn as holisticSignIn,
  signOut as holisticSignOut,
} from '@/lib/auth';
