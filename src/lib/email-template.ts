/**
 * Gabarit HTML partagé des courriels Runes & Magie.
 *
 * Extrait de `src/lib/order-email.ts:31`, où il était privé et recopié à
 * l'identique dans plusieurs fichiers. Les courriels existants n'ont pas été
 * migrés (risque inutile) ; tout NOUVEAU courriel doit utiliser ce module.
 */

const OR = '#C9A84C';
const PARCHEMIN = '#F5F0E8';
const PARCHEMIN_DOUX = '#E8DCC8';

/**
 * Échappe le texte destiné à être inséré dans du HTML.
 * Indispensable : le message libre d'un participant finit dans le courriel que
 * reçoit l'administration. Sans échappement, il peut y injecter du HTML.
 */
export function encoderHtml(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function bouton(href: string, libelle: string): string {
  return `<div style="text-align:center;margin:28px 0;"><a href="${href}" style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#4A2D7A,#2D1B4E);border:1px solid ${OR};border-radius:4px;color:${OR};font-family:Georgia,serif;font-size:14px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">${libelle}</a></div>`;
}

export function encadre(contenu: string): string {
  return `<div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:16px;margin:16px 0;">${contenu}</div>`;
}

export function gabaritCourriel(contenu: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0A0A12;color:${PARCHEMIN};font-family:Georgia,serif;"><div style="max-width:600px;margin:0 auto;padding:40px 20px;"><div style="text-align:center;margin-bottom:32px;"><h1 style="color:${OR};font-size:28px;margin:0;letter-spacing:2px;">Runes &amp; Magie</h1><p style="color:rgba(245,240,232,0.5);font-size:12px;margin:4px 0 0;letter-spacing:3px;">BOUTIQUE-ECOLE DE SORCELLERIE</p></div><div style="background:#1A1A2E;border:1px solid rgba(74,45,122,0.4);border-radius:8px;padding:32px;">${contenu}</div><div style="text-align:center;margin-top:32px;color:rgba(245,240,232,0.4);font-size:13px;"><p>Runes &amp; Magie - Annabelle Dionne, Guide Spirituelle</p><p style="font-size:11px;">www.runesetmagie.ca</p></div></div></body></html>`;
}

export const COULEURS = { OR, PARCHEMIN, PARCHEMIN_DOUX } as const;
