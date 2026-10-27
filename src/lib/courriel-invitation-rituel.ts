/**
 * Courriel d'invitation — atelier « Fabrique ta Baguette pour Halloween » du
 * samedi 31 octobre 2026, avec Noctura.
 *
 * Remplace l'édition précédente (Rituel Énergisant du 17 octobre) — le fichier
 * est réécrit à chaque diffusion, l'historique vit dans git.
 * L'enveloppe ne change pas : entête, encadré de date, bouton, signature et
 * pied de page conforme à la Loi 25 avec désabonnement.
 *
 * Le corps reprend le texte de la fiche de l'événement tel qu'il paraît sur le
 * site (présentation, prix, « À apporter », adresse complète) : le courriel et
 * la page racontent la même chose. Une coquille du site est corrigée ici
 * (« un bijoux » → « un bijou »).
 *
 * Le bouton pointe vers la fiche publique
 * /evenements/fabrique-ta-baguette-pour-halloween.
 *
 * Utilisé par /api/cron/envoi-invitation (envoi de test + diffusion).
 */

export const SUJET_INVITATION =
  'Fabrique ta baguette pour Halloween — samedi 31 octobre';

/** Construit le courriel avec le lien de désabonnement propre au destinataire. */
export function htmlInvitationRituel(lienDesabonnement: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0A0A12;color:#F5F0E8;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#C9A84C;font-size:28px;margin:0;letter-spacing:2px;">Runes &amp; Magie</h1>
    <p style="color:rgba(245,240,232,0.5);font-size:12px;margin:4px 0 0;letter-spacing:3px;">BOUTIQUE-ECOLE DE SORCELLERIE</p>
  </div>
  <div style="background:#1A1A2E;border:1px solid rgba(74,45,122,0.4);border-radius:8px;padding:32px;">
    <p style="color:#2EC4B6;font-size:12px;letter-spacing:2px;margin:0 0 8px;text-transform:uppercase;">Atelier d&rsquo;Halloween</p>
    <h2 style="color:#C9A84C;margin:0 0 8px;font-size:24px;line-height:1.3;">Fabrique ta Baguette pour Halloween</h2>
    <p style="color:#E8DCC8;font-style:italic;margin:0 0 24px;line-height:1.6;">Ton cristal, ton bois, ta magie — et une baguette qui repart avec son nom mystique.</p>
    <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#2EC4B6;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Quand et où</p>
      <p style="margin:4px 0;color:#C9A84C;font-size:17px;"><strong>Samedi 31 octobre, à 13 h</strong></p>
      <p style="margin:4px 0;color:#E8DCC8;">Boutique Runes &amp; Magie — 149 rue Saint-Eustache, Saint-Eustache, J7R 2L5</p>
      <p style="margin:4px 0;color:#E8DCC8;">40 $ par personne · places limitées · avec Noctura</p>
    </div>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 16px;">Viens fabriquer ta propre baguette en choisissant ton cristal et ton bois, tes décorations, pour la mettre à ton image, et repars avec ta baguette et son nom mystique lors du rituel à la fin de l&rsquo;atelier&nbsp;!</p>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 24px;">Une baguette symbolise le feu en magie, ta volonté et ton énergie vitale. Elle est un symbole de combativité et de volonté. Quoi de mieux en ce début de saison plus sombre, que de se rappeler qui on est&nbsp;?</p>
    <div style="background:rgba(46,196,182,0.08);border-left:3px solid #2EC4B6;border-radius:4px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 8px;color:#2EC4B6;font-size:12px;letter-spacing:2px;text-transform:uppercase;">À apporter</p>
      <p style="margin:0;color:#E8DCC8;line-height:1.7;">Un bijou ou une breloque, une pierre, un objet miniature à apposer sur la baguette qui vous est cher, mais pas d&rsquo;obligation, nous avons tout en atelier&nbsp;!</p>
    </div>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="https://www.runesetmagie.ca/evenements/fabrique-ta-baguette-pour-halloween" style="display:inline-block;background:linear-gradient(135deg,#C41D6E,#8B2F8B);color:#F8F6F2;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;letter-spacing:1px;">Réserver ma place</a>
      <p style="margin:12px 0 0;color:rgba(245,240,232,0.5);font-size:12px;">Les places sont limitées. Un compte gratuit est nécessaire pour réserver.</p>
    </div>
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
