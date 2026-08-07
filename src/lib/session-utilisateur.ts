'use client';

/**
 * session-utilisateur.ts — une seule source de vérité, côté client, pour
 * « qui est connecté » et « où l'emmener ».
 *
 * Pourquoi ce fichier existe : la règle rôle → destination était recopiée dans
 * Navbar, MobileMenu, UserNav et BarreOnglets, avec trois replis différents
 * (`/compte`, `/soins/dashboard/client`, `/compte`) et un seul des quatre qui
 * connaissait `isOwner`. Résultat : sur téléphone, la praticienne propriétaire
 * était traitée comme une cliente ordinaire. Une règle recopiée quatre fois
 * finit toujours par diverger — alors elle ne vit plus qu'ici.
 *
 * L'autorité reste le serveur (`src/lib/admin-guard.ts`, `src/lib/auth.ts`) :
 * ce module ne décide d'aucun droit, il décide seulement de ce qu'on AFFICHE.
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export interface SessionUtilisateur {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  practitionerId?: string;
  practitionerStatus?: string;
  isOwner?: boolean;
}

/**
 * Accès à l'administration. Reflète exactement `admin-guard.ts` : la
 * praticienne propriétaire (`isOwner`) y a droit sans porter le rôle ADMIN.
 * Si cette règle change côté serveur, elle doit changer ici aussi.
 */
export function aAccesAdmin(u: SessionUtilisateur | null | undefined): boolean {
  return u?.role === 'ADMIN' || u?.isOwner === true;
}

/**
 * L'espace personnel de l'utilisateur : où le bouton « mon espace » l'emmène.
 * `label` est la forme courte (barre d'onglets, écrans étroits), `labelLong`
 * la forme complète. Les deux désignent le MÊME endroit — c'est le point : un
 * écran étroit peut raccourcir un libellé, jamais changer sa destination.
 */
export function espacePrincipal(u: SessionUtilisateur | null | undefined): {
  href: string;
  label: string;
  labelLong: string;
} {
  if (u?.role === 'PRACTITIONER') {
    return { href: '/soins/dashboard/praticien', label: 'Mon espace', labelLong: 'Mon espace praticien' };
  }
  if (u?.role === 'ADMIN') {
    return { href: '/admin', label: 'Admin', labelLong: 'Administration' };
  }
  // Client·e connecté·e ou visiteur : l'espace membre. `/soins/dashboard/client`
  // ne fait que rediriger ici, on économise le rebond.
  return { href: '/compte', label: 'Compte', labelLong: 'Mon compte' };
}

// Une seule requête réseau pour tous les composants montés sur la même page :
// Navbar, BarreOnglets et UserNav coexistent et demandaient chacun la session.
// La promesse est mémorisée par chemin, ce qui la rafraîchit à la navigation
// (indispensable juste après une connexion ou une déconnexion).
let enVol: { cle: string; promesse: Promise<SessionUtilisateur | null> } | null = null;

function chargerSession(cle: string): Promise<SessionUtilisateur | null> {
  if (enVol?.cle === cle) return enVol.promesse;
  const promesse = fetch('/api/holistique/auth/me', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (d?.user ?? null) as SessionUtilisateur | null)
    .catch(() => null);
  enVol = { cle, promesse };
  return promesse;
}

/** Vide le cache : à appeler après une déconnexion pour ne pas réafficher l'ancien état. */
export function oublierSession(): void {
  enVol = null;
}

/**
 * `charge` reste vrai une fois la première réponse reçue : les composants
 * n'ont pas à repasser par un état « inconnu » à chaque navigation, ce qui
 * ferait clignoter les boutons.
 */
export function useSessionUtilisateur(): {
  utilisateur: SessionUtilisateur | null;
  charge: boolean;
} {
  const pathname = usePathname();
  const [utilisateur, setUtilisateur] = useState<SessionUtilisateur | null>(null);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    let actif = true;
    chargerSession(pathname ?? '/').then((u) => {
      if (!actif) return;
      setUtilisateur(u);
      setCharge(true);
    });
    return () => {
      actif = false;
    };
  }, [pathname]);

  return { utilisateur, charge };
}
