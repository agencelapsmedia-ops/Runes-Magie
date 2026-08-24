import { PrismaClient } from '@prisma/client'
import { formatInTimeZone } from 'date-fns-tz'
import { writeFileSync } from 'node:fs'

const p = new PrismaClient()
const TZ = 'America/Toronto'
const d = (v: Date | null | undefined) => (v ? formatInTimeZone(v, TZ, 'yyyy-MM-dd HH:mm') : '')
const j = (v: Date | null | undefined) => (v ? formatInTimeZone(v, TZ, 'yyyy-MM-dd') : '')
const n = (v: number | null | undefined) => (v === null || v === undefined ? '' : v.toFixed(2).replace('.', ','))

async function main() {
  const rdv = await p.holisticAppointment.findMany({
    orderBy: { startsAt: 'asc' },
    include: {
      client: { select: { firstName: true, lastName: true, email: true, phone: true } },
      practitioner: { select: { slug: true, user: { select: { firstName: true, lastName: true, email: true } } } },
      payment: true,
      review: { select: { rating: true, status: true } },
    },
  })

  const lignes = rdv.map((r) => {
    const dureeMin = Math.round((r.endsAt.getTime() - r.startsAt.getTime()) / 60000)
    const modeBrut = r.paymentMode ?? (r.depositAmount ? 'STRIPE (site)' : 'STRIPE (site)')
    return {
      'Date': j(r.startsAt),
      'Heure': d(r.startsAt).slice(11),
      'Fin': d(r.endsAt).slice(11),
      'Durée (min)': String(dureeMin),
      'Cliente': `${r.client.firstName} ${r.client.lastName}`.trim(),
      'Courriel cliente': r.client.email,
      'Téléphone': r.client.phone ?? '',
      'Praticienne': `${r.practitioner.user.firstName} ${r.practitioner.user.lastName}`.trim(),
      'Statut': r.status,
      'Mode de paiement': modeBrut,
      'Origine': r.paymentMode ? 'RDV manuel' : 'Réservation en ligne',
      'Montant total': n(r.totalAmount),
      'Acompte': n(r.depositAmount),
      'Solde': n(r.remainingAmount),
      'Acompte payé le': d(r.depositPaidAt),
      'Solde chargé le': d(r.remainderChargedAt),
      'Issue séance': r.completionOutcome ?? '',
      'Paiement — montant': n(r.payment?.amountTotal),
      'Paiement — statut': r.payment?.status ?? '',
      'Paiement — payé le': d(r.payment?.paidAt),
      'Commission (35%)': n(r.payment?.amountCommission),
      'Part praticienne': n(r.payment?.amountPractitioner),
      'Stripe PaymentIntent': r.payment?.stripePaymentIntentId ?? '',
      'Annulé le': d(r.cancelledAt),
      'Annulé par': r.cancelledBy ?? '',
      'Avis': r.review ? `${r.review.rating}/5 (${r.review.status})` : '',
      'Notes': (r.notes ?? '').replace(/[\r\n;]+/g, ' ').trim(),
      'Créé le': d(r.createdAt),
      'ID': r.id,
    }
  })

  const entetes = Object.keys(lignes[0])
  const csv = [entetes.join(';'), ...lignes.map((l) => entetes.map((e) => `"${String((l as any)[e]).replace(/"/g, '""')}"`).join(';'))].join('\r\n')
  writeFileSync('scripts/_export-rdv.csv', '﻿' + csv, 'utf8')

  // Réservations présentes uniquement dans la table unifiée Booking (paniers non payés / legacy)
  const bookings = await p.booking.findMany({
    orderBy: { startsAt: 'asc' },
    include: { client: { select: { firstName: true, lastName: true, email: true } }, offering: { select: { name: true } }, payment: true },
  })
  const clesRdv = new Set(rdv.map((r) => `${r.client.email}|${r.startsAt.toISOString()}`))
  const orphelins = bookings.filter((b) => !clesRdv.has(`${b.client.email}|${b.startsAt.toISOString()}`))

  writeFileSync('scripts/_export-rdv.json', JSON.stringify({ rdv: lignes, orphelins: orphelins.map((b) => ({
    date: d(b.startsAt), cliente: `${b.client.firstName} ${b.client.lastName}`.trim(), courriel: b.client.email,
    offre: b.offering.name, statut: b.status, mode: b.mode, montant: n(b.payment?.amountTotal), paiement: b.payment?.status ?? '', cree: d(b.createdAt),
  })) }, null, 2), 'utf8')

  console.log(`RDV exportés : ${lignes.length}`)
  console.log(`Bookings sans HolisticAppointment correspondant : ${orphelins.length}`)
  console.table(orphelins.map((b) => ({ date: d(b.startsAt), cliente: `${b.client.firstName} ${b.client.lastName}`, offre: b.offering.name, statut: b.status, paiement: b.payment?.status ?? '', cree: d(b.createdAt) })))
}
main().finally(() => p.$disconnect())
