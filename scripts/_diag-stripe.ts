import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const p = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function main() {
  console.log('=== PRATICIENNES / COMPTES CONNECT ===')
  const prats = await p.practitioner.findMany({
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  })
  for (const pr of prats) {
    console.log(
      `${(pr.user.firstName + ' ' + pr.user.lastName).padEnd(26)} | ${pr.status.padEnd(9)} | connect=${pr.stripeAccountId ?? '—'} | pret=${pr.stripeAccountReady}`,
    )
  }

  console.log('\n=== TRANSFERTS ENREGISTRES EN BASE ===')
  const paiements = await p.holisticPayment.findMany({ where: { NOT: { stripeTransferId: null } } })
  console.log('HolisticPayment avec stripeTransferId :', paiements.length)

  console.log('\n=== COMPTE STRIPE DE LA CLE ===')
  const acct = await stripe.accounts.retrieve()
  console.log({
    id: acct.id,
    nom: acct.settings?.dashboard?.display_name,
    courriel: acct.email,
    pays: acct.country,
    devise: acct.default_currency,
    type: acct.type,
    charges: acct.charges_enabled,
    payouts: acct.payouts_enabled,
    entreprise: acct.business_profile?.name,
    url: acct.business_profile?.url,
  })

  console.log('\n=== MODE DE LA CLE ===', process.env.STRIPE_SECRET_KEY?.slice(0, 8) + '…')

  console.log('\n=== COMPTES CONNECTES CHEZ STRIPE ===')
  const cn = await stripe.accounts.list({ limit: 20 })
  console.log('nombre :', cn.data.length)
  for (const a of cn.data) {
    console.log(`${a.id} | ${a.email ?? '—'} | charges=${a.charges_enabled} payouts=${a.payouts_enabled} | ${a.business_profile?.name ?? ''}`)
  }

  console.log('\n=== 15 DERNIERS PAIEMENTS REELS CHEZ STRIPE ===')
  const pis = await stripe.paymentIntents.list({ limit: 15, expand: ['data.latest_charge'] })
  for (const pi of pis.data) {
    const ch = pi.latest_charge as Stripe.Charge | null
    console.log(
      new Date(pi.created * 1000).toISOString().slice(0, 16),
      '|', (pi.amount / 100).toFixed(2), pi.currency.toUpperCase(),
      '|', pi.status.padEnd(9),
      '| transfer=', (pi.transfer_data as { destination?: string } | null)?.destination ?? '—',
      '| fee=', pi.application_fee_amount ? (pi.application_fee_amount / 100).toFixed(2) : '—',
      '| dest_payment=', ch?.transfer ?? '—',
    )
  }

  console.log('\n=== SOLDE DU COMPTE PLATEFORME ===')
  const bal = await stripe.balance.retrieve()
  console.log('disponible :', bal.available.map((b) => `${(b.amount / 100).toFixed(2)} ${b.currency.toUpperCase()}`).join(', '))
  console.log('en attente  :', bal.pending.map((b) => `${(b.amount / 100).toFixed(2)} ${b.currency.toUpperCase()}`).join(', '))

  console.log('\n=== VERSEMENTS (payouts) VERS LE COMPTE BANCAIRE ===')
  const po = await stripe.payouts.list({ limit: 5 })
  for (const x of po.data) {
    console.log(new Date(x.created * 1000).toISOString().slice(0, 10), (x.amount / 100).toFixed(2), x.currency.toUpperCase(), x.status, '→', x.destination)
  }
}

main()
  .catch((e) => console.error('ERREUR:', e.message))
  .finally(() => p.$disconnect())
