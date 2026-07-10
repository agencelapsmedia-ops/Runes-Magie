/** Types partagés du chat Noctura. */

export interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatOffering {
  slug: string;
  name: string;
  description: string;
  priceLabel: string;
  durationLabel: string;
  modes: string[];
  practitionerName: string;
  imageUrl: string | null;
  detailHref: string;
  bookingHref: string;
  isFormation: boolean;
}

/** Image du bouton flottant (fournie par la cliente) + repli existant. */
export const LAUNCHER_IMG = '/images/chat/noctura-launcher.png';
export const WELCOME_IMG = '/images/chat/noctura-accueil.png';
export const FALLBACK_IMG = '/images/services/arcane/soin-rituel-personnage.webp';

/** Sépare le texte d'un message assistant de ses marqueurs [CARTE:slug]. */
export function parseCards(content: string): { text: string; slugs: string[] } {
  const slugs: string[] = [];
  const text = content
    .replace(/\[CARTE:([a-z0-9-]+)\]/gi, (_, slug: string) => {
      if (slugs.length < 2 && !slugs.includes(slug)) slugs.push(slug);
      return '';
    })
    .trim();
  return { text, slugs };
}
