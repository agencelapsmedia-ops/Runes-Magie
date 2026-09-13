/**
 * Courriel d'invitation au Rituel de l'Équinoxe d'Automne (Mabon) — 19 septembre 2026.
 *
 * Le contenu est écrit à la main à chaque édition (thème du rituel, divinité
 * invoquée, saison) : il n'est pas généré depuis la fiche Event, qui ne porte
 * ni le ton ni la mise en page de l'infolettre. Les faits (date, lieu, places,
 * matériel, programme) sont en revanche recopiés de la fiche pour rester cohérents.
 *
 * Utilisé par /api/cron/envoi-invitation (envoi de test + diffusion).
 */

export const SUJET_INVITATION =
  "Noctura vous invite — Rituel de l'Équinoxe d'Automne, samedi 19 septembre";

export const LIEN_EVENEMENT =
  'https://www.runesetmagie.ca/evenements/rituel-equinoxe-d-automne';

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
    <h2 style="color:#C9A84C;margin:0 0 8px;font-size:24px;line-height:1.3;">Rituel de l'Équinoxe d'Automne</h2>
    <p style="color:#E8DCC8;font-style:italic;margin:0 0 24px;">Mabon — équilibre, gratitude et transmutation</p>
    <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:16px;margin:0 0 24px;">
      <p style="margin:4px 0;color:#C9A84C;font-size:17px;"><strong>Samedi 19 septembre, de 13 h à 15 h</strong></p>
      <p style="margin:4px 0;color:#E8DCC8;">Le Temple des Arcanes — Boutique Runes &amp; Magie <em>(sous-sol)</em></p>
      <p style="margin:4px 0;color:#E8DCC8;">149 rue Saint-Eustache, Saint-Eustache</p>
      <p style="margin:12px 0 0;color:#2EC4B6;font-size:15px;letter-spacing:1px;"><strong>ENTRÉE GRATUITE POUR TOUS — 20 PLACES</strong></p>
    </div>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 16px;">Le Temple des Arcanes vous accueille dans son ambiance feutrée d'époque, avec ses murs de pierre ancestraux, au sous-sol de la Tourelle du vieux Saint-Eustache (1903) — un lieu rempli de magie et de bienveillance, inclusif et ouvert d'esprit pour tous.</p>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 16px;">L'équinoxe d'automne se lève le <strong style="color:#C9A84C;">22 septembre à 20 h</strong> : le jour et la nuit se font égaux, puis la nuit l'emporte doucement. Nous nous rassemblons quelques jours plus tôt pour accueillir ensemble ce point de bascule, celui que l'on nomme <strong style="color:#C9A84C;">Mabon</strong> — la seconde récolte, celle où l'on remercie avant de rentrer.</p>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 16px;">Ce rituel-ci se place sous le signe de <strong style="color:#C9A84C;">l'équilibre</strong> : celui du dedans comme celui du dehors, dans nos relations, dans notre maison, dans la répartition de notre énergie entre chacune des sphères de notre vie. Nous ferons le bilan de l'été 2026, nous mettrons en pratique ce qu'il nous a appris, et nous transmuterons ce qui demande encore à l'être.</p>
    <div style="background:rgba(74,45,122,0.25);border:1px solid rgba(74,45,122,0.5);border-radius:6px;padding:18px 20px;margin:0 0 24px;">
      <p style="margin:0 0 10px;color:#C9A84C;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Au programme</p>
      <p style="margin:0 0 8px;color:#E8DCC8;line-height:1.7;">La Nature et ses cycles, et leurs impacts sur nous, ainsi que les symboles de ce mouvement de saison.</p>
      <p style="margin:0 0 8px;color:#E8DCC8;line-height:1.7;">Tirage de cartes divinatoires et de Runes Futhark pour nous guider dans cette transition.</p>
      <p style="margin:0 0 8px;color:#E8DCC8;line-height:1.7;">Méditation en groupe au son de la musique, puis partage ouvert de l'Assemblée.</p>
      <p style="margin:0 0 8px;color:#E8DCC8;line-height:1.7;">Déploiement des intentions de chacun des membres du Cercle dans l'Éther.</p>
      <p style="margin:0 0 8px;color:#E8DCC8;line-height:1.7;">Tirage du concours parmi les participants — pour clôturer la Saison du Feu 2026.</p>
      <p style="margin:0;color:#E8DCC8;line-height:1.7;">Clôture du rituel, puis une heure de temps libre au Temple.</p>
    </div>
    <div style="background:rgba(46,196,182,0.08);border-left:3px solid rgba(46,196,182,0.5);padding:14px 16px;margin:0 0 24px;">
      <p style="margin:0 0 6px;color:#2EC4B6;font-size:12px;letter-spacing:2px;text-transform:uppercase;">À apporter</p>
      <p style="margin:0;color:#E8DCC8;line-height:1.7;">Un champignon de votre choix pour ornementer le bol d'offrandes — ou quelque chose de naturel qui vous fait penser à l'automne — ainsi que votre intention du moment.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${LIEN_EVENEMENT}" style="display:inline-block;padding:16px 36px;background:linear-gradient(to right,#4A2D7A,#2D1B4E);border:1px solid #C9A84C;border-radius:4px;color:#C9A84C;font-family:Georgia,serif;font-size:15px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">Réserver ma place</a>
    </div>
    <p style="color:#E8DCC8;line-height:1.7;margin:0 0 16px;text-align:center;font-size:14px;"><strong style="color:#C9A84C;">Important :</strong> si vous venez accompagné, dites-le nous à l'inscription — les places sont limitées et comptées.</p>
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
