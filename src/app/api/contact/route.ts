import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || "Runes & Magie <noreply@runesetmagie.com>";
const CONTACT_TO = process.env.CONTACT_EMAIL || "info@runesetmagie.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * POST /api/contact
 * Reçoit le formulaire de contact public et envoie un courriel à l'équipe
 * (CONTACT_EMAIL), avec reply-to = l'adresse du visiteur.
 */
export async function POST(request: NextRequest) {
  let body: { nom?: unknown; email?: unknown; sujet?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const nom = typeof body.nom === "string" ? body.nom.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const sujet = typeof body.sujet === "string" ? body.sujet.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!nom || !email || !message) {
    return NextResponse.json({ error: "Nom, courriel et message sont requis." }, { status: 400 });
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Adresse courriel invalide." }, { status: 400 });
  }

  if (!resend) {
    console.error("[contact] RESEND_API_KEY non configurée — message non envoyé:", { nom, email, sujet });
    return NextResponse.json({ error: "Le service de courriel n'est pas configuré." }, { status: 500 });
  }

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#6B3FA0;">Nouveau message — Formulaire de contact</h2>
      <p><strong>Nom :</strong> ${escapeHtml(nom)}</p>
      <p><strong>Courriel :</strong> ${escapeHtml(email)}</p>
      <p><strong>Sujet :</strong> ${escapeHtml(sujet) || "—"}</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />
      <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: CONTACT_TO,
      replyTo: email,
      subject: `Contact${sujet ? ` — ${sujet}` : ""} — ${nom}`,
      html,
    });
    if (error) {
      console.error("[contact] Resend error:", error);
      return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] send failed:", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}
