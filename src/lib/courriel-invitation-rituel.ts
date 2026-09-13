/**
 * Courriel d'invitation au Rituel de l'Équinoxe d'Automne (Mabon) — 19 septembre 2026.
 *
 * Le corps reprend le texte de la fiche de l'événement tel qu'il paraît sur le
 * site (demande d'Annabelle, 2026-09-13) : même liste de points, même consigne
 * « À apporter », même adresse. Seule l'enveloppe change — entête, encadré de
 * date, bouton de réservation, signature et pied de page conforme à la Loi 25.
 *
 * Utilisé par /api/cron/envoi-invitation (envoi de test + diffusion).
 */

export const SUJET_INVITATION =
  "Noctura vous invite — Rituel de l'Équinoxe d'Automne, samedi 19 septembre";

export const LIEN_EVENEMENT =
  'https://www.runesetmagie.ca/evenements/rituel-equinoxe-d-automne';

/** Les points du rituel, repris mot pour mot de la fiche de l'événement. */
const POINTS_RITUEL = [
  'La Nature et ses cycles, et leurs impacts sur nous,',
  "Atteindre l'équilibre intérieur et extérieur (relations, maison, etc),",
  'Répartir adéquatement notre énergie au sein de chacune des sphères de notre vie,',
  "Bilan d'été 2026, Introspection, Mise en pratique des apprentissages, Gratitude, Transmutation",
  'Les symboles de ce mouvement de saison,',
  'Tirage de cartes divinatoires et de Runes Futhark pour nous guider dans cette transition,',
  'Méditation en groupe au son de la musique (libre),',
  "Partage ouvert de l'Assemblée,",
  "Déploiement des intentions de chacun des membres du Cercle dans l'Éther,",
  'Tirage Concours au sein des Participants (Concours pour clôturer la Saison du Feu 2026)',
  'Clôture du Rituel et temps libre au Temple (1hr)',
];

/** Construit le courriel avec le lien de désabonnement propre au destinataire. */
export function htmlInvitationRituel(lienDesabonnement: string): string {
  const points = POINTS_RITUEL.map(
    (p) =>
      `<li style="color:#F5F0E8;line-height:1.7;margin:0 0 10px;">${p}</li>`,
  ).join('');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0A0A12;color:#F5F0E8;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#C9A84C;font-size:28px;margin:0;letter-spacing:2px;">Runes &amp; Magie</h1>
    <p style="color:rgba(245,240,232,0.5);font-size:12px;margin:4px 0 0;letter-spacing:3px;">BOUTIQUE-ECOLE DE SORCELLERIE</p>
  </div>
  <div style="background:#1A1A2E;border:1px solid rgba(74,45,122,0.4);border-radius:8px;padding:32px;">
    <p style="color:#2EC4B6;font-size:12px;letter-spacing:2px;margin:0 0 8px;text-transform:uppercase;">Temple des Arcanes</p>
    <h2 style="color:#C9A84C;margin:0 0 8px;font-size:24px;line-height:1.3;">Rituel Équinoxe d'Automne (Mabon)</h2>
    <p style="color:#E8DCC8;font-style:italic;margin:0 0 24px;line-height:1.6;">Équinoxe du 22 septembre 8pm (Qc) : Bilan d'été 2026, Introspection, Apprentissages, Gratitude, Transmutation</p>
    <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:16px;margin:0 0 24px;">
      <p style="margin:4px 0;color:#C9A84C;font-size:17px;"><strong>Samedi 19 septembre, de 13 h à 15 h</strong></p>
      <p style="margin:4px 0;color:#E8DCC8;">Le Temple des Arcanes — Boutique Runes &amp; Magie <em>(sous-sol)</em></p>
      <p style="margin:4px 0;color:#E8DCC8;">149 rue Saint-Eustache, Saint-Eustache, J7R 2L5, Qc</p>
      <p style="margin:12px 0 0;color:#2EC4B6;font-size:15px;letter-spacing:1px;"><strong>ENTRÉE GRATUITE POUR TOUS — 20 PLACES</strong></p>
    </div>
    <p style="color:#F5F0E8;line-height:1.7;margin:0 0 12px;"><strong style="color:#C9A84C;">Dans ce Rituel, nous parlerons de :</strong></p>
    <ul style="margin:0 0 24px;padding-left:22px;">${points}</ul>
    <div style="background:rgba(46,196,182,0.08);border-left:3px solid rgba(46,196,182,0.5);padding:14px 16px;margin:0 0 24px;">
      <p style="margin:0 0 6px;color:#2EC4B6;font-size:12px;letter-spacing:2px;text-transform:uppercase;">À apporter</p>
      <p style="margin:0;color:#E8DCC8;line-height:1.7;">Apportez un champignon de votre choix pour ornementer le bol d'offrandes, ou quelque chose de naturel qui vous fait penser à l'automne, votre intention du moment, et si vous apportez des amis avec vous, merci de nous le mentionner, car les places sont limitées et comptées !</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${LIEN_EVENEMENT}" style="display:inline-block;padding:16px 36px;background:linear-gradient(to right,#4A2D7A,#2D1B4E);border:1px solid #C9A84C;border-radius:4px;color:#C9A84C;font-family:Georgia,serif;font-size:15px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">Réserver ma place</a>
    </div>
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
