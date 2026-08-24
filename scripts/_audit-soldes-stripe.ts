/** Lecture seule : soldes et payouts des comptes Stripe (plateforme + Express). */
import Stripe from 'stripe';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any });

async function main() {
  for (const acct of ['acct_1TfRwq5UKumEzHpa', 'acct_1TfS3e5GK8iZv09L', 'acct_1TpHQ1GCc3SuZcAG']) {
    try {
      const account = await stripe.accounts.retrieve(acct);
      const bal = await stripe.balance.retrieve({ stripeAccount: acct });
      const payouts = await stripe.payouts.list({ limit: 10 }, { stripeAccount: acct });
      console.log(`=== ${acct} (${account.email ?? ''}) payouts_enabled=${account.payouts_enabled}`);
      console.log('  disponible:', JSON.stringify(bal.available), ' en attente:', JSON.stringify(bal.pending));
      for (const p of payouts.data) {
        console.log(`  payout ${(p.amount / 100).toFixed(2)}$ ${p.status} ${new Date(p.created * 1000).toISOString().slice(0, 10)} ${p.failure_code ?? ''}`);
      }
    } catch (e) {
      console.log(`=== ${acct} ERREUR: ${(e as Error).message}`);
    }
  }
  const platBal = await stripe.balance.retrieve();
  console.log('=== PLATEFORME disponible:', JSON.stringify(platBal.available), ' en attente:', JSON.stringify(platBal.pending));
}

main().catch((e) => { console.error(e); process.exit(1); });
