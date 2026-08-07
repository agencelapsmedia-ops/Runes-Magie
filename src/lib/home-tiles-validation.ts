import { ANCRAGES } from '@/lib/home-tiles';

/**
 * Validation des tuiles de l'accueil, partagée par la création et la
 * modification.
 *
 * Ce qui arrive ici vient d'un formulaire d'administration, mais rien
 * n'empêche d'appeler la route directement : on valide donc pour de vrai.
 */

export interface ChampsTuile {
  title?: string;
  subtitle?: string;
  iconKey?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageFocus?: string;
  href?: string;
  variant?: string;
  chips?: unknown;
  isVisible?: boolean;
}

/**
 * Une destination doit être interne (« /quelque-chose ») ou en HTTPS.
 * Ce contrôle est ce qui empêche d'injecter « javascript:… » dans un lien de
 * la page d'accueil — le protocole-piège classique d'un champ href libre.
 * « //ailleurs.com » est rejeté aussi : c'est une URL absolue déguisée.
 */
export function hrefValide(valeur: string): boolean {
  if (valeur.startsWith('//')) return false;
  return valeur.startsWith('/') || valeur.startsWith('https://');
}

/** Seules les images de notre propre stockage sont acceptées. */
export function imageValide(valeur: string): boolean {
  if (!valeur) return true; // vide = pas d'image, c'est permis
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  return valeur.startsWith(`${base}/storage/v1/object/public/products/`);
}

/**
 * Clé d'icône : simple contrôle de forme. Une clé inconnue n'est pas une
 * erreur — `IconeCategorie` retombe sur l'étoile — donc inutile de maintenir
 * ici une liste qui devrait rester synchronisée avec le composant.
 */
const FORME_ICONE = /^[a-z0-9-]{1,32}$/;

export interface ResultatValidation {
  data: Record<string, unknown>;
  erreur?: string;
}

/**
 * Construit l'objet à écrire en base à partir du corps reçu.
 * `exigerRequis` : true à la création (titre et destination obligatoires),
 * false à la modification (tout est optionnel, on ne touche qu'au fourni).
 */
export function validerTuile(body: ChampsTuile, exigerRequis: boolean): ResultatValidation {
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const titre = String(body.title).trim();
    if (!titre) return { data, erreur: 'Le titre est requis.' };
    data.title = titre;
  } else if (exigerRequis) {
    return { data, erreur: 'Le titre est requis.' };
  }

  if (body.href !== undefined) {
    const href = String(body.href).trim();
    if (!href) return { data, erreur: 'La destination est requise.' };
    if (!hrefValide(href)) {
      return {
        data,
        erreur: 'La destination doit commencer par « / » (page du site) ou « https:// ».',
      };
    }
    data.href = href;
  } else if (exigerRequis) {
    return { data, erreur: 'La destination est requise.' };
  }

  if (body.subtitle !== undefined) data.subtitle = String(body.subtitle).trim();
  if (body.imageAlt !== undefined) data.imageAlt = String(body.imageAlt).trim();

  if (body.iconKey !== undefined) {
    const icone = String(body.iconKey).trim();
    if (icone && !FORME_ICONE.test(icone)) {
      return { data, erreur: 'Nom d’icône invalide (lettres minuscules, chiffres et tirets).' };
    }
    data.iconKey = icone || 'etoile';
  }

  if (body.imageUrl !== undefined) {
    const url = String(body.imageUrl).trim();
    if (!imageValide(url)) {
      return { data, erreur: 'Cette image ne provient pas du stockage de Runes & Magie.' };
    }
    data.imageUrl = url;
  }

  if (body.imageFocus !== undefined) {
    const focus = String(body.imageFocus).trim();
    if (!(ANCRAGES as readonly string[]).includes(focus)) {
      return { data, erreur: `Cadrage inconnu : ${focus}.` };
    }
    data.imageFocus = focus;
  }

  if (body.variant !== undefined) {
    const variante = String(body.variant).trim().toUpperCase();
    if (variante !== 'CARTE' && variante !== 'BANDE') {
      return { data, erreur: 'La variante doit être CARTE ou BANDE.' };
    }
    data.variant = variante;
  }

  if (body.isVisible !== undefined) {
    if (typeof body.isVisible !== 'boolean') {
      return { data, erreur: 'La visibilité doit être vraie ou fausse.' };
    }
    data.isVisible = body.isVisible;
  }

  if (body.chips !== undefined) {
    if (body.chips === null) {
      data.chips = undefined;
    } else if (!Array.isArray(body.chips)) {
      return { data, erreur: 'Les pastilles doivent être une liste.' };
    } else {
      if (body.chips.length > 12) {
        return { data, erreur: 'Douze pastilles au maximum.' };
      }
      const pastilles: Array<{ label: string; href: string; iconKey: string }> = [];
      for (const entree of body.chips) {
        if (!entree || typeof entree !== 'object' || Array.isArray(entree)) {
          return { data, erreur: 'Pastille invalide.' };
        }
        const brut = entree as Record<string, unknown>;
        const label = typeof brut.label === 'string' ? brut.label.trim() : '';
        if (!label) return { data, erreur: 'Chaque pastille doit avoir un libellé.' };
        if (label.length > 40) {
          return { data, erreur: 'Un libellé de pastille dépasse 40 caractères.' };
        }
        const href = typeof brut.href === 'string' ? brut.href.trim() : '';
        if (href && !hrefValide(href)) {
          return { data, erreur: `Destination de pastille invalide : ${href}` };
        }
        const iconKey = typeof brut.iconKey === 'string' ? brut.iconKey.trim() : '';
        if (iconKey && !FORME_ICONE.test(iconKey)) {
          return { data, erreur: `Nom d’icône de pastille invalide : ${iconKey}` };
        }
        pastilles.push({ label, href, iconKey: iconKey || 'etoile' });
      }
      data.chips = pastilles;
    }
  }

  return { data };
}

/** Slug stable dérivé du titre — sert d'identifiant lisible et au seed. */
export function slugDepuis(titre: string): string {
  return (
    titre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'tuile'
  );
}
