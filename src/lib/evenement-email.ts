import { Resend } from 'resend';
import { gabaritCourriel, encoderHtml, bouton, encadre } from '@/lib/email-template';
import { formaterDateEvenement } from '@/lib/evenements';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || 'Runes & Magie <noreply@runesetmagie.ca>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@runesetmagie.com';

export interface DonneesCourrielEvenement {
  prenom: string;
  nom: string;
  courriel: string;
  titre: string;
  debut: Date;
  lieu: string;
  enLigne: boolean;
  lienEnLigne?: string | null;
  aApporter?: string | null;
  note?: string | null;
  jetonAnnulation: string;
}

async function envoyer(to: string | string[], subject: string, html: string, quoi: string) {
  if (!resend) {
    console.log(`[Courriel] ${quoi} ->`, to);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

function blocDetails(d: DonneesCourrielEvenement): string {
  const lieu = d.enLigne
    ? `En ligne${d.lienEnLigne ? ` — <a href="${d.lienEnLigne}" style="color:#C9A84C;">rejoindre</a>` : ''}`
    : encoderHtml(d.lieu);
  return encadre(
    `<p style="margin:4px 0;color:#C9A84C;font-size:18px;"><strong>${encoderHtml(d.titre)}</strong></p>` +
      `<p style="margin:4px 0;color:#E8DCC8;">${formaterDateEvenement(d.debut)}</p>` +
      `<p style="margin:4px 0;color:#E8DCC8;">${lieu}</p>` +
      (d.aApporter
        ? `<p style="margin:12px 0 4px;color:#C9A84C;font-size:13px;letter-spacing:1px;">À APPORTER</p><p style="margin:0;color:#E8DCC8;">${encoderHtml(d.aApporter)}</p>`
        : ''),
  );
}

export async function envoyerConfirmationInscription(d: DonneesCourrielEvenement) {
  const lienAnnulation = `${APP_URL}/evenements/annulation/${d.jetonAnnulation}`;
  const html = gabaritCourriel(
    `<h2 style="color:#C9A84C;margin-top:0;">Votre place est réservée &#10024;</h2>` +
      `<p style="color:#F5F0E8;">Bonjour ${encoderHtml(d.prenom)},</p>` +
      `<p style="color:#F5F0E8;">Votre inscription est confirmée. Nous avons hâte de vous accueillir.</p>` +
      blocDetails(d) +
      bouton(`${APP_URL}/compte/evenements`, 'Mes événements') +
      `<p style="color:rgba(245,240,232,0.6);font-size:13px;text-align:center;">Un empêchement ? <a href="${lienAnnulation}" style="color:#C9A84C;">Annulez votre place</a> pour la libérer.</p>`,
  );
  await envoyer(d.courriel, `Inscription confirmée — ${d.titre}`, html, 'confirmation inscription');
}

export async function envoyerNotificationAdmin(
  d: DonneesCourrielEvenement,
  placesPrises: number,
  capacite: number,
) {
  const html = gabaritCourriel(
    `<h2 style="color:#C9A84C;margin-top:0;">Nouvelle inscription</h2>` +
      `<p style="color:#F5F0E8;"><strong>${encoderHtml(d.prenom)} ${encoderHtml(d.nom)}</strong> — ${encoderHtml(d.courriel)}</p>` +
      blocDetails(d) +
      (d.note
        ? `<p style="color:#C9A84C;font-size:13px;letter-spacing:1px;margin-bottom:4px;">SON MESSAGE</p><p style="color:#E8DCC8;white-space:pre-wrap;">${encoderHtml(d.note)}</p>`
        : '') +
      `<p style="color:#C9A84C;font-size:20px;text-align:center;margin-top:24px;"><strong>${placesPrises} / ${capacite} places</strong></p>`,
  );
  await envoyer(ADMIN_EMAIL, `${placesPrises}/${capacite} — ${d.titre}`, html, 'notification admin');
}

export async function envoyerRappel(d: DonneesCourrielEvenement) {
  const html = gabaritCourriel(
    `<h2 style="color:#C9A84C;margin-top:0;">C'est bientôt &#127769;</h2>` +
      `<p style="color:#F5F0E8;">Bonjour ${encoderHtml(d.prenom)},</p>` +
      `<p style="color:#F5F0E8;">Petit rappel de votre inscription.</p>` +
      blocDetails(d) +
      `<p style="color:rgba(245,240,232,0.6);font-size:13px;text-align:center;">Empêchement de dernière minute ? <a href="${APP_URL}/evenements/annulation/${d.jetonAnnulation}" style="color:#C9A84C;">Libérez votre place</a>.</p>`,
  );
  await envoyer(d.courriel, `Rappel — ${d.titre}`, html, 'rappel');
}

export async function envoyerConfirmationAnnulation(d: DonneesCourrielEvenement) {
  const html = gabaritCourriel(
    `<h2 style="color:#C9A84C;margin-top:0;">Votre place a été libérée</h2>` +
      `<p style="color:#F5F0E8;">Bonjour ${encoderHtml(d.prenom)},</p>` +
      `<p style="color:#F5F0E8;">Votre inscription à <strong>${encoderHtml(d.titre)}</strong> (${formaterDateEvenement(d.debut)}) est annulée. Au plaisir de vous voir à une prochaine occasion.</p>` +
      bouton(`${APP_URL}/evenements`, 'Voir les prochains événements'),
  );
  await Promise.all([
    envoyer(d.courriel, `Annulation confirmée — ${d.titre}`, html, 'annulation participant'),
    envoyer(
      ADMIN_EMAIL,
      `Désistement — ${d.titre}`,
      gabaritCourriel(
        `<h2 style="color:#C9A84C;margin-top:0;">Un désistement</h2>` +
          `<p style="color:#F5F0E8;">${encoderHtml(d.prenom)} ${encoderHtml(d.nom)} (${encoderHtml(d.courriel)}) a annulé sa place pour <strong>${encoderHtml(d.titre)}</strong>. Une place est de nouveau disponible.</p>`,
      ),
      'annulation admin',
    ),
  ]);
}

export async function envoyerAnnulationEvenement(
  destinataires: string[],
  titre: string,
  debut: Date,
  motif: string | null,
) {
  if (destinataires.length === 0) return;
  const html = gabaritCourriel(
    `<h2 style="color:#C9A84C;margin-top:0;">Événement annulé</h2>` +
      `<p style="color:#F5F0E8;">Nous sommes désolés : <strong>${encoderHtml(titre)}</strong>, prévu le ${formaterDateEvenement(debut)}, est annulé.</p>` +
      (motif ? `<p style="color:#E8DCC8;white-space:pre-wrap;">${encoderHtml(motif)}</p>` : '') +
      bouton(`${APP_URL}/evenements`, 'Voir les autres événements'),
  );
  // Envoi individuel : jamais de liste de destinataires en clair (Loi 25).
  for (const destinataire of destinataires) {
    await envoyer(destinataire, `Annulé — ${titre}`, html, 'annulation evenement');
  }
}

export async function envoyerMessageAuxInscrits(
  destinataires: string[],
  titre: string,
  sujet: string,
  message: string,
) {
  if (destinataires.length === 0) return;
  const html = gabaritCourriel(
    `<h2 style="color:#C9A84C;margin-top:0;">${encoderHtml(titre)}</h2>` +
      `<p style="color:#F5F0E8;white-space:pre-wrap;">${encoderHtml(message)}</p>`,
  );
  for (const destinataire of destinataires) {
    await envoyer(destinataire, sujet, html, 'message aux inscrits');
  }
}
