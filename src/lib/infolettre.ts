/**
 * Helpers pour l'infolettre — génération des URLs de désabonnement et de gestion.
 */

/**
 * Génère l'URL publique de désabonnement à insérer dans chaque email envoyé aux abonnés.
 *
 * Conforme Loi 25 / LCAP : un clic suffit pour se désabonner, pas d'authentification.
 *
 * @example
 * unsubscribeUrl('abc123def456') // → 'https://www.runesetmagie.ca/infolettre/desabonnement?token=abc123def456'
 */
export function unsubscribeUrl(unsubscribeToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.runesetmagie.ca';
  return `${baseUrl}/infolettre/desabonnement?token=${encodeURIComponent(unsubscribeToken)}`;
}

/**
 * HTML du footer de désabonnement à insérer dans chaque email infolettre.
 * Conforme LCAP — doit être présent dans TOUS les emails marketing.
 */
export function unsubscribeFooter(unsubscribeToken: string): string {
  const url = unsubscribeUrl(unsubscribeToken);
  return `
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(245,240,232,0.15);text-align:center;font-family:Georgia,serif;color:rgba(245,240,232,0.4);font-size:12px;line-height:1.6;">
      <p style="margin:0 0 8px;">Runes &amp; Magie — Boutique-école de sorcellerie</p>
      <p style="margin:0 0 8px;">Annabelle Dionne, Guide Spirituelle</p>
      <p style="margin:0 0 16px;">info@runesetmagie.com · (514) 348-7705</p>
      <p style="margin:0;font-size:11px;">
        Vous recevez ce courriel car vous êtes inscrit(e) à notre infolettre.
        <br />
        <a href="${url}" style="color:rgba(46,196,182,0.7);text-decoration:underline;">
          Se désabonner en un clic
        </a>
      </p>
      <p style="margin:8px 0 0;font-size:10px;color:rgba(245,240,232,0.25);font-style:italic;">
        Conforme Loi 25 (Québec) et LCAP. Désabonnement immédiat et définitif.
      </p>
    </div>
  `.trim();
}
