/**
 * IA rédactionnelle du module Publications (Claude, sorties structurées).
 *
 * - genererDeclinaisons : versions Facebook (narratif) et Instagram (rythmé),
 *   suggestions de hashtags et textes alternatifs des images.
 * - verifierConformite : repère les formulations risquées pour Meta
 *   (promesses thérapeutiques, résultats garantis…). AIDE rédactionnelle,
 *   pas une garantie d'approbation par Meta.
 *
 * Le JSON est garanti par `output_config.format` (json_schema) puis revalidé
 * champ par champ côté serveur avant d'être utilisé.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SocialImage, SocialVariant } from '@/lib/social-constants';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODELE_IA = 'claude-sonnet-5';

export function iaConfiguree(): boolean {
  return anthropic !== null;
}

export interface Declinaisons {
  facebook: SocialVariant;
  instagram: SocialVariant;
  suggestionsHashtags: string[];
  altTexts: string[];
}

export interface ProblemeConformite {
  extrait: string;
  raison: string;
  categorie: string;
  suggestion: string;
}
export interface SectionConformite {
  niveau: 'OK' | 'ATTENTION' | 'RISQUE';
  problemes: ProblemeConformite[];
}
export interface RapportConformite {
  baseText: SectionConformite;
  facebook: SectionConformite;
  instagram: SectionConformite;
  globalLevel: 'OK' | 'ATTENTION' | 'RISQUE';
}

interface PostPourIA {
  title: string;
  type: string;
  baseText: string;
  callToAction: string;
  link: string | null;
  hashtags: string;
  images: SocialImage[];
  variants: Record<string, SocialVariant>;
}

const SCHEMA_VARIANTE = {
  type: 'object',
  properties: {
    texte: { type: 'string' },
    hashtags: { type: 'array', items: { type: 'string' } },
  },
  required: ['texte', 'hashtags'],
  additionalProperties: false,
} as const;

const SCHEMA_DECLINAISONS = {
  type: 'object',
  properties: {
    facebook: SCHEMA_VARIANTE,
    instagram: SCHEMA_VARIANTE,
    suggestionsHashtags: { type: 'array', items: { type: 'string' } },
    altTexts: { type: 'array', items: { type: 'string' } },
  },
  required: ['facebook', 'instagram', 'suggestionsHashtags', 'altTexts'],
  additionalProperties: false,
} as const;

const SCHEMA_SECTION_CONFORMITE = {
  type: 'object',
  properties: {
    niveau: { type: 'string', enum: ['OK', 'ATTENTION', 'RISQUE'] },
    problemes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          extrait: { type: 'string' },
          raison: { type: 'string' },
          categorie: { type: 'string' },
          suggestion: { type: 'string' },
        },
        required: ['extrait', 'raison', 'categorie', 'suggestion'],
        additionalProperties: false,
      },
    },
  },
  required: ['niveau', 'problemes'],
  additionalProperties: false,
} as const;

const SCHEMA_CONFORMITE = {
  type: 'object',
  properties: {
    baseText: SCHEMA_SECTION_CONFORMITE,
    facebook: SCHEMA_SECTION_CONFORMITE,
    instagram: SCHEMA_SECTION_CONFORMITE,
    globalLevel: { type: 'string', enum: ['OK', 'ATTENTION', 'RISQUE'] },
  },
  required: ['baseText', 'facebook', 'instagram', 'globalLevel'],
  additionalProperties: false,
} as const;

/** Appel Claude avec sortie structurée + parsing sécuritaire. */
async function appelStructure(
  system: string,
  contenu: string,
  schema: Record<string, unknown>,
  temperature: number,
): Promise<unknown> {
  if (!anthropic) throw new Error("L'IA n'est pas configurée (ANTHROPIC_API_KEY absente).");

  const reponse = await anthropic.beta.messages.create({
    model: MODELE_IA,
    max_tokens: 3000,
    temperature,
    system,
    messages: [{ role: 'user', content: contenu }],
    output_config: { format: { type: 'json_schema', schema } },
  });

  const bloc = reponse.content.find((b) => b.type === 'text');
  const brut = bloc && 'text' in bloc ? bloc.text : '';
  const nettoye = brut.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(nettoye);
  } catch {
    throw new Error("L'IA a renvoyé une réponse illisible — réessaie.");
  }
}

function versVariant(v: unknown): SocialVariant {
  const texte = typeof (v as { texte?: unknown })?.texte === 'string' ? (v as { texte: string }).texte : '';
  const brut = (v as { hashtags?: unknown })?.hashtags;
  const hashtags = Array.isArray(brut) ? brut.filter((h): h is string => typeof h === 'string') : [];
  return { texte, hashtags };
}

function versTableauTextes(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function descriptionPost(post: PostPourIA): string {
  return [
    `Titre interne : ${post.title}`,
    `Type de contenu : ${post.type}`,
    `Texte / idée de base :\n${post.baseText || '(vide)'}`,
    `Appel à l'action : ${post.callToAction || '(aucun)'}`,
    `Lien : ${post.link ?? '(aucun)'}`,
    `Hashtags de base : ${post.hashtags || '(aucun)'}`,
    `Nombre d'images : ${post.images.length}`,
    ...post.images.map((img, i) => `Image ${i + 1} — texte alternatif actuel : ${img.alt || '(à rédiger)'}`),
  ].join('\n\n');
}

const SYSTEM_DECLINAISONS = `Tu es la rédactrice réseaux sociaux de « Runes & Magie », boutique-école ésotérique et espace de soins holistiques à Saint-Eustache, Québec.

Ton style : français du Québec, tutoiement chaleureux, univers mystique doux et invitant. RÈGLE ABSOLUE : jamais de promesse thérapeutique, médicale ou de résultat (pas de « guérit », « soigne », « élimine ton anxiété », « résultat garanti ») — utilise « accompagne », « favorise la détente », « un moment pour toi ».

À partir du contenu fourni, produis :
1. "facebook" : version narrative et posée (2 à 4 courts paragraphes), lien intégré naturellement s'il y en a un, peu d'émojis, 3 à 8 hashtags sobres.
2. "instagram" : version rythmée — phrases courtes, émojis pertinents (sans excès), symbole ✦ bienvenu, appel à l'action clair (mentionner « lien dans la bio » si un lien existe), 10 à 20 hashtags mélangeant populaires et de niche.
3. "suggestionsHashtags" : 5 à 10 hashtags supplémentaires pertinents non utilisés ci-dessus.
4. "altTexts" : un texte alternatif descriptif et sobre par image (accessibilité — décris ce qu'on voit, sans hashtags ni marketing). Autant d'entrées que d'images ; s'il n'y a pas d'images, tableau vide.`;

const SYSTEM_CONFORMITE = `Tu es vérificatrice de conformité publicitaire Meta (Facebook/Instagram) pour une boutique ésotérique québécoise. Analyse SÉPARÉMENT chaque texte fourni (baseText, facebook, instagram) et signale tout passage risquant un refus ou une restriction.

Catégories à surveiller (utilise exactement ces libellés dans "categorie") :
- « promesse thérapeutique » : guérir, soigner, traiter, soulager une condition ;
- « état de santé » : référence à une maladie ou condition physique/mentale du lecteur ;
- « attribution personnelle » : s'adresser à un attribut personnel (« tu souffres de… », « toi qui es anxieuse ») ;
- « résultat garanti » : garanti, 100 %, à coup sûr, assurément ;
- « affirmation paranormale » : phénomène paranormal présenté comme un fait certain ;
- « peur ou vulnérabilité » : malédiction, danger, urgence anxiogène ;
- « avant/après » : transformation implicite ou explicite ;
- « pression commerciale » : urgence excessive à acheter/réserver.

Le vocabulaire spirituel prudent (« accompagne », « favorise la détente », « selon la tradition », « expérience immersive ») est ACCEPTABLE. Pour chaque problème : "extrait" = citation exacte, "raison" = pourquoi c'est risqué, "suggestion" = reformulation sûre. "niveau" par texte : OK (rien), ATTENTION (à surveiller), RISQUE (refus probable). "globalLevel" = le pire des trois. Un texte vide est OK.`;

/** Génère les déclinaisons FB/IG + hashtags + textes alternatifs. */
export async function genererDeclinaisons(post: PostPourIA): Promise<Declinaisons> {
  const brut = (await appelStructure(SYSTEM_DECLINAISONS, descriptionPost(post), SCHEMA_DECLINAISONS as unknown as Record<string, unknown>, 0.7)) as Record<string, unknown>;
  return {
    facebook: versVariant(brut.facebook),
    instagram: versVariant(brut.instagram),
    suggestionsHashtags: versTableauTextes(brut.suggestionsHashtags),
    altTexts: versTableauTextes(brut.altTexts),
  };
}

/** Vérifie la conformité Meta des textes du post. */
export async function verifierConformite(post: PostPourIA): Promise<RapportConformite> {
  const contenu = [
    `baseText :\n${post.baseText || '(vide)'}`,
    `facebook :\n${post.variants.FACEBOOK?.texte || '(vide)'}\n${(post.variants.FACEBOOK?.hashtags ?? []).join(' ')}`,
    `instagram :\n${post.variants.INSTAGRAM?.texte || '(vide)'}\n${(post.variants.INSTAGRAM?.hashtags ?? []).join(' ')}`,
  ].join('\n\n---\n\n');

  const brut = (await appelStructure(SYSTEM_CONFORMITE, contenu, SCHEMA_CONFORMITE as unknown as Record<string, unknown>, 0)) as Record<string, unknown>;

  const versSection = (v: unknown): SectionConformite => {
    const niveau = (v as { niveau?: unknown })?.niveau;
    const problemesBruts = (v as { problemes?: unknown })?.problemes;
    return {
      niveau: niveau === 'ATTENTION' || niveau === 'RISQUE' ? niveau : 'OK',
      problemes: Array.isArray(problemesBruts)
        ? problemesBruts
            .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
            .map((p) => ({
              extrait: typeof p.extrait === 'string' ? p.extrait : '',
              raison: typeof p.raison === 'string' ? p.raison : '',
              categorie: typeof p.categorie === 'string' ? p.categorie : '',
              suggestion: typeof p.suggestion === 'string' ? p.suggestion : '',
            }))
        : [],
    };
  };

  const globalLevel = (brut as { globalLevel?: unknown }).globalLevel;
  return {
    baseText: versSection(brut.baseText),
    facebook: versSection(brut.facebook),
    instagram: versSection(brut.instagram),
    globalLevel: globalLevel === 'ATTENTION' || globalLevel === 'RISQUE' ? globalLevel : 'OK',
  };
}
