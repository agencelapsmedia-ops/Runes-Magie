/**
 * Courriel d'invitation au Rituel des Justes de voix — édition du 5 septembre 2026.
 *
 * Le contenu est écrit à la main à chaque édition (thème du rituel, divinité
 * invoquée, saison) : il n'est pas généré depuis la fiche Event, qui ne porte
 * ni le ton ni la mise en page de l'infolettre. Les faits (date, lieu, places,
 * matériel) sont en revanche recopiés de la fiche pour rester cohérents.
 *
 * Utilisé par /api/cron/envoi-invitation (envoi de test + diffusion).
 */

export const SUJET_INVITATION =
  'Noctura vous invite — Rituel des Justes de voix, samedi 5 septembre';

export const LIEN_EVENEMENT =
  'https://www.runesetmagie.ca/evenements/rituel-des-justes-de-voix-2';

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
    <h2 style="color:#C9A84C;margin:0 0 8px;font-size:24px;line-height:1.3;">Rituel des Justes de voix</h2>
    <p style="color:#E8DCC8;font-style:italic;margin:0 0 24px;">Transition, récoltes et préparation à l'hiver</p>
    <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:16px;margin:0 0 24px;">
      <p style="margin:4px 0;color:#C9A84C;font-size:17px;"><strong>Samedi 5 septembre, de 13 h à 14 h 30</strong></p>
      <p style="margin:4px 0;color:#E8DCC8;">Le Temple des Arcanes — Boutique Runes &amp; Magie <em>(sous-sol)</em></p>
      <p style="margin:4px 0;color:#E8DCC8;">149 rue Saint-Eustache, Saint-Eustache</p>
      <p style="margin:12px 0 0;color:#2EC4B6;font-size:15px;letter-spacing:1px;"><strong>20 PLACES SEULEMENT</strong></p>
    </div>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 16px;">Le Temple des Arcanes vous accueille dans son ambiance feutrée d'époque, avec ses murs de pierre ancestraux, au sous-sol de la Tourelle du vieux Saint-Eustache (1903) — un lieu rempli de magie et de bienveillance, inclusif et ouvert d'esprit pour tous.</p>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 16px;">Ce rituel-ci se place sous le signe de la <strong style="color:#C9A84C;">transition</strong> : les récoltes, les réserves que l'on met de côté, le ralentissement qui s'installe. C'est le temps de consommer les fruits de son labeur, de purifier son environnement comme ses relations, et de redécorer l'intérieur — la maison autant que le soi.</p>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 16px;">Nous travaillerons avec la <strong style="color:#C9A84C;">conjonction de la Lune et de Mars du 6 septembre</strong> : le féminin sacré et les émotions portées par l'astre lunaire, alliés au masculin sacré et à l'action stimulée par Mars. Deux énergies complémentaires à canaliser vers nos projets à concrétiser, plutôt que vers la confrontation, la colère ou la vengeance. Douceur, lenteur et prise de conscience sur ce qui doit être nettoyé en nous et autour de nous.</p>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 16px;">La grotte de l'ours qui s'en va hiberner se doit d'être confortable et propre, chaleureuse et accueillante. Nous verrons ensemble ce qui doit être sorti de la grotte, ce qui doit y être préservé ou nettoyé, et ce qui doit y être ajouté pour l'hiver à venir.</p>
    <div style="background:rgba(46,196,182,0.08);border-left:3px solid rgba(46,196,182,0.5);padding:14px 16px;margin:0 0 24px;">
      <p style="margin:0 0 6px;color:#2EC4B6;font-size:12px;letter-spacing:2px;text-transform:uppercase;">À apporter</p>
      <p style="margin:0;color:#E8DCC8;line-height:1.7;">Votre intention du moment, votre oracle ou Tarot personnel, et une offrande naturelle inspirée de la saison.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${LIEN_EVENEMENT}" style="display:inline-block;padding:16px 36px;background:linear-gradient(to right,#4A2D7A,#2D1B4E);border:1px solid #C9A84C;border-radius:4px;color:#C9A84C;font-family:Georgia,serif;font-size:15px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">Réserver ma place</a>
    </div>
    <p style="color:#E8DCC8;line-height:1.7;margin:0 0 16px;text-align:center;font-size:14px;"><strong style="color:#C9A84C;">Important :</strong> si votre inscription comprend d'autres invités, dites-le nous — nous devons compter le nombre réel de personnes.</p>
    <p style="color:#E8DCC8;line-height:1.7;margin:0 0 16px;text-align:center;font-style:italic;">Rallume ton feu intérieur, tout est possible, nous te voyons…<br>— Noctura )O(</p>
    <p style="color:rgba(245,240,232,0.6);font-size:13px;text-align:center;margin:0;">Vous préférez le téléphone ? Appelez Noctura au <a href="tel:+15143487705" style="color:#C9A84C;text-decoration:none;">(514) 348-7705</a>.</p>
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
