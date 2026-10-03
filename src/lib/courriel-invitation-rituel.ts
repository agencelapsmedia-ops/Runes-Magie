/**
 * Courriel d'avis — le rituel du samedi 3 octobre 2026 n'a pas lieu, le Cercle
 * se reprend le samedi 17 octobre (cadence habituelle d'un samedi sur deux).
 *
 * Remplace l'édition précédente (invitation au Rituel de l'Équinoxe d'Automne,
 * 19 septembre 2026) — le fichier est réécrit à chaque diffusion, l'historique
 * vit dans git. L'enveloppe ne change pas : entête, encadré de date, signature
 * et pied de page conforme à la Loi 25 avec désabonnement.
 *
 * Pas de bouton « Réserver ma place » cette fois : aucune fiche d'événement
 * n'existe pour le 17 octobre, un bouton mènerait à une page vide.
 *
 * Utilisé par /api/cron/envoi-invitation (envoi de test + diffusion).
 */

export const SUJET_INVITATION =
  'Pas de rituel aujourd’hui — on se reprend le samedi 17 octobre';

/** Construit le courriel avec le lien de désabonnement propre au destinataire. */
export function htmlInvitationRituel(lienDesabonnement: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0A0A12;color:#F5F0E8;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#C9A84C;font-size:28px;margin:0;letter-spacing:2px;">Runes &amp; Magie</h1>
    <p style="color:rgba(245,240,232,0.5);font-size:12px;margin:4px 0 0;letter-spacing:3px;">BOUTIQUE-ECOLE DE SORCELLERIE</p>
  </div>
  <div style="background:#1A1A2E;border:1px solid rgba(74,45,122,0.4);border-radius:8px;padding:32px;">
    <p style="color:#2EC4B6;font-size:12px;letter-spacing:2px;margin:0 0 8px;text-transform:uppercase;">Temple des Arcanes</p>
    <h2 style="color:#C9A84C;margin:0 0 8px;font-size:24px;line-height:1.3;">Pas de rituel aujourd&rsquo;hui</h2>
    <p style="color:#E8DCC8;font-style:italic;margin:0 0 24px;line-height:1.6;">Le Cercle ne se réunit pas ce samedi 3 octobre. La roue tourne, elle ne s&rsquo;arrête pas : on se reprend dans deux semaines.</p>
    <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#2EC4B6;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Prochain rituel</p>
      <p style="margin:4px 0;color:#C9A84C;font-size:17px;"><strong>Samedi 17 octobre, de 13 h à 15 h</strong></p>
      <p style="margin:4px 0;color:#E8DCC8;">Le Temple des Arcanes — Boutique Runes &amp; Magie <em>(sous-sol)</em></p>
      <p style="margin:4px 0;color:#E8DCC8;">149 rue Saint-Eustache, Saint-Eustache, J7R 2L5, Qc</p>
    </div>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 16px;">Merci de votre compréhension à celles et ceux qui avaient prévu de se joindre à nous aujourd&rsquo;hui. Le détail du prochain rituel — son thème, ses points et ce qu&rsquo;il faudra apporter — vous parviendra dans les jours qui viennent.</p>
    <p style="color:#E8DCC8;line-height:1.7;margin:0 0 24px;">D&rsquo;ici là, la boutique vous accueille comme à l&rsquo;habitude, et vous pouvez toujours réserver un soin ou une consultation sur <a href="https://www.runesetmagie.ca" style="color:#C9A84C;text-decoration:none;">runesetmagie.ca</a>.</p>
    <p style="color:#E8DCC8;line-height:1.7;margin:0 0 16px;text-align:center;font-style:italic;">Rallume ton feu intérieur, tout est possible, nous te voyons…<br>— Noctura )O(</p>
    <p style="color:rgba(245,240,232,0.6);font-size:13px;text-align:center;margin:0;">Une question ? Appelez Noctura au <a href="tel:+15143487705" style="color:#C9A84C;text-decoration:none;">(514) 348-7705</a>.</p>
  </div>
  <div style="text-align:center;margin-top:32px;color:rgba(245,240,232,0.4);font-size:13px;">
    <p style="margin:0 0 4px;">Runes &amp; Magie - Annabelle Dionne, Guide Spirituelle</p>
    <p style="margin:0;font-size:11px;">www.runesetmagie.ca</p>
  </div>
  <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(245,240,232,0.15);text-align:center;color:rgba(245,240,232,0.4);font-size:12px;line-height:1.6;">
    <p style="margin:0 0 8px;">Runes &amp; Magie — Boutique-école de sorcellerie</p>
    <p style="margin:0 0 8px;">Annabelle Dionne, Guide Spirituelle</p>
    <p style="margin:0 0 16px;">info@runesetmagie.com · (514) 348-7705</p>
    <p style="margin:0;font-size:11px;">Vous recevez ce courriel car vous êtes inscrit(e) à notre infolettre.<br /><a href="${lienDesabonnement}" style="color:rgba(46,196,182,0.7);text-decoration:underline;">Se désabonner en un clic</a></p>
    <p style="margin:8px 0 0;font-size:10px;color:rgba(245,240,232,0.25);font-style:italic;">Conforme Loi 25 (Québec) et LCAP. Désabonnement immédiat et définitif.</p>
  </div>
</div>
</body></html>`;
}
