import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

/**
 * GET /api/admin/clients/export?type=comptes|infolettre|all
 *
 * Exporte les clients en CSV (UTF-8 BOM pour compatibilité Excel).
 * Utile pour Annabelle pour faire des sauvegardes ou importer dans un autre outil
 * (Mailchimp, Resend Audiences, etc.).
 */
export async function GET(req: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const type = url.searchParams.get('type') ?? 'all';
  const today = new Date().toISOString().slice(0, 10);

  let csv: string;
  let filename: string;

  if (type === 'comptes') {
    const clients = await prisma.holisticUser.findMany({
      where: { role: 'CLIENT' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { clientBookings: true } } },
    });

    const rows = clients.map((c) => [
      c.firstName,
      c.lastName,
      c.email,
      c.phone ?? '',
      c.dischargeSignedAt ? 'oui' : 'non',
      c._count.clientBookings.toString(),
      new Date(c.createdAt).toISOString().slice(0, 10),
    ]);

    csv = toCsv(
      ['Prénom', 'Nom', 'Courriel', 'Téléphone', 'Décharge signée', 'Réservations', 'Inscrit le'],
      rows,
    );
    filename = `clients-comptes-${today}.csv`;
  } else if (type === 'infolettre') {
    const subs = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const rows = subs.map((s) => [
      s.firstName ?? '',
      s.lastName ?? '',
      s.email,
      s.phone ?? '',
      s.unsubscribedAt ? 'désabonné' : 'actif',
      s.source,
      s.consentedAt ? new Date(s.consentedAt).toISOString() : '',
      s.consentIp ?? '',
      new Date(s.createdAt).toISOString().slice(0, 10),
    ]);

    csv = toCsv(
      [
        'Prénom',
        'Nom',
        'Courriel',
        'Téléphone',
        'Statut',
        'Source',
        'Consentement (date+heure)',
        'IP consentement',
        'Inscrit le',
      ],
      rows,
    );
    filename = `infolettre-abonnes-${today}.csv`;
  } else {
    // type=all : tous (comptes + abonnés), avec colonne d'origine
    const [clients, subs] = await Promise.all([
      prisma.holisticUser.findMany({
        where: { role: 'CLIENT' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.newsletterSubscriber.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const clientRows = clients.map((c) => [
      'Compte client',
      c.firstName,
      c.lastName,
      c.email,
      c.phone ?? '',
      '',
      new Date(c.createdAt).toISOString().slice(0, 10),
    ]);

    const subRows = subs.map((s) => [
      'Infolettre',
      s.firstName ?? '',
      s.lastName ?? '',
      s.email,
      s.phone ?? '',
      s.unsubscribedAt ? 'désabonné' : 'actif',
      new Date(s.createdAt).toISOString().slice(0, 10),
    ]);

    csv = toCsv(
      ['Type', 'Prénom', 'Nom', 'Courriel', 'Téléphone', 'Statut', 'Date'],
      [...clientRows, ...subRows],
    );
    filename = `clients-tous-${today}.csv`;
  }

  // BOM UTF-8 pour Excel compatibility (sinon Excel décode mal les accents)
  const body = '﻿' + csv;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Encode des données tabulaires en CSV (RFC 4180).
 * Échappe correctement les guillemets, virgules et retours de ligne.
 */
function toCsv(headers: string[], rows: string[][]): string {
  const escapeCell = (cell: string): string => {
    if (cell.includes('"') || cell.includes(',') || cell.includes('\n') || cell.includes('\r')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  };

  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','));
  }
  return lines.join('\r\n');
}
