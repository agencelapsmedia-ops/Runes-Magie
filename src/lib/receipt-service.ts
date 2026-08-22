/**
 * receipt-service.ts — reçus/factures simples de Runes & Magie.
 * Générés automatiquement à chaque encaissement, numérotés RM-AAAA-NNNN,
 * envoyés par courriel et consultables dans « Mon espace → Achats & factures ».
 * Taxes non applicables pour l'instant (Annabelle n'est pas inscrite aux taxes) —
 * le jour venu, ajouter TPS/TVQ ici et dans la page du reçu.
 */
import { Resend } from 'resend';
import { prisma } from '@/lib/db';

export const ENTREPRISE = {
  nom: 'Runes & Magie',
  proprietaire: 'Annabelle Dionne',
  adresse: '149 rue Saint-Eustache, Saint-Eustache (QC) J7R 2L5',
  neq: '2274695404',
  courriel: 'info@runesetmagie.ca',
};

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || 'Runes & Magie <noreply@runesetmagie.ca>';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca').replace(/\/$/, '');

/**
 * Crée un reçu numéroté (idempotent par source) et l'envoie par courriel.
 * Best-effort : ne lance jamais — un échec de reçu ne doit pas casser un paiement.
 */
export async function createReceipt(params: {
  clientId: string;
  description: string;
  amount: number;
  method: 'CARD' | 'INTERAC' | 'CASH' | 'OTHER';
  paidAt?: Date;
  appointmentId?: string | null;
  kind?: 'DEPOSIT' | 'REMAINDER' | 'FULL' | 'FORMATION' | 'MANUAL';
  formationPaymentId?: string | null;
  /** false = pas de courriel (ex. génération rétroactive de vieux reçus). */
  sendEmail?: boolean;
}): Promise<{ id: string; number: string } | null> {
  try {
    if (!(params.amount > 0)) return null;

    // Idempotence : déjà un reçu pour cette source → on ne double pas.
    if (params.appointmentId && params.kind) {
      const existing = await prisma.receipt.findUnique({
        where: { appointmentId_kind: { appointmentId: params.appointmentId, kind: params.kind } },
        select: { id: true, number: true },
      });
      if (existing) return existing;
    }
    if (params.formationPaymentId) {
      const existing = await prisma.receipt.findUnique({
        where: { formationPaymentId: params.formationPaymentId },
        select: { id: true, number: true },
      });
      if (existing) return existing;
    }

    const year = new Date().getFullYear();
    let receipt: { id: string; number: string } | null = null;
    // Numérotation séquentielle par année ; la contrainte unique sur `number`
    // attrape les collisions concurrentes → on réessaie avec le numéro suivant.
    for (let tentative = 0; tentative < 3 && !receipt; tentative++) {
      const count = await prisma.receipt.count({ where: { number: { startsWith: `RM-${year}-` } } });
      const number = `RM-${year}-${String(count + 1 + tentative).padStart(4, '0')}`;
      try {
        receipt = await prisma.receipt.create({
          data: {
            number,
            clientId: params.clientId,
            description: params.description,
            amount: params.amount,
            method: params.method,
            paidAt: params.paidAt ?? new Date(),
            appointmentId: params.appointmentId ?? null,
            kind: params.kind ?? 'PAYMENT',
            formationPaymentId: params.formationPaymentId ?? null,
          },
          select: { id: true, number: true },
        });
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((err as any)?.code !== 'P2002') throw err; // collision de numéro → retry
      }
    }
    if (!receipt) return null;

    if (params.sendEmail !== false) {
      await sendReceiptEmail(receipt.id).catch((err) =>
        console.error('[recu] envoi courriel échoué (non-bloquant)', err),
      );
    }
    return receipt;
  } catch (err) {
    console.error('[recu] création échouée (non-bloquant)', err);
    return null;
  }
}

const METHOD_FR: Record<string, string> = { CARD: 'Carte', INTERAC: 'Virement Interac', CASH: 'Comptant', OTHER: 'Autre' };

/** Envoie le reçu par courriel à la cliente (sauf adresses internes). */
export async function sendReceiptEmail(receiptId: string): Promise<void> {
  const r = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: { client: { select: { firstName: true, email: true } } },
  });
  if (!r || r.client.email.endsWith('@interne.invalid')) return;

  const dateFr = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long', timeZone: 'America/Montreal' }).format(r.paidAt);
  const url = `${APP_URL}/compte/achats/recu/${r.id}`;
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0A12;color:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#C9A84C;font-size:28px;margin:0;letter-spacing:0.05em;">Runes &amp; Magie</h1>
      <p style="color:rgba(201,168,76,0.6);font-size:13px;margin:8px 0 0;letter-spacing:0.1em;text-transform:uppercase;">Reçu ${r.number}</p>
    </div>
    <div style="background:#1A1A2E;border:1px solid rgba(74,45,122,0.4);border-radius:8px;padding:32px;">
      <p style="color:#F5F0E8;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Bonjour ${r.client.firstName}, voici ton reçu — merci pour ta confiance ✨
      </p>
      <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:0 0 16px;">
        <p style="margin:4px 0;color:#E8DCC8;"><strong>Description :</strong> ${r.description}</p>
        <p style="margin:4px 0;color:#E8DCC8;"><strong>Date :</strong> ${dateFr}</p>
        <p style="margin:4px 0;color:#E8DCC8;"><strong>Mode de paiement :</strong> ${METHOD_FR[r.method] ?? r.method}</p>
        <p style="margin:12px 0 0;color:#C9A84C;font-size:20px;"><strong>Montant : ${r.amount.toFixed(2)} $</strong></p>
        <p style="margin:4px 0;color:rgba(232,220,190,0.6);font-size:13px;">Taxes non applicables</p>
      </div>
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${url}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;">Voir / imprimer mon reçu</a>
      </div>
      <p style="color:rgba(245,240,232,0.5);font-size:12px;line-height:1.6;margin:20px 0 0;padding-top:16px;border-top:1px solid rgba(74,45,122,0.3);text-align:center;">
        ${ENTREPRISE.nom} — ${ENTREPRISE.proprietaire}<br>${ENTREPRISE.adresse}<br>NEQ : ${ENTREPRISE.neq} · ${ENTREPRISE.courriel}
      </p>
    </div>
  </div>
</body></html>`;

  if (!resend) {
    console.log('[recu] Resend non configuré — courriel non envoyé :', r.client.email, r.number);
    return;
  }
  await resend.emails.send({ from: FROM, to: r.client.email, subject: `Ton reçu ${r.number} — Runes & Magie`, html });
}

/** Description lisible d'un RDV (ligne « Service : … » de ses notes). */
export function serviceFromNotes(notes: string | null | undefined): string {
  return notes?.match(/Service\s*:\s*([^\n]+)/)?.[1]?.trim() ?? 'Séance';
}
