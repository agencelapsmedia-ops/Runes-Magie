'use client';

import { resetPractitionerStripe } from './actions';

interface Props {
  id: string;
  name: string;
}

export default function ResetStripeButton({ id, name }: Props) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (
      !confirm(
        `Réinitialiser le compte Stripe Connect de ${name} ?\n\n` +
          `Le lien de paiement actuel sera détaché. ${name} devra recliquer ` +
          `« Configurer les paiements » dans son espace pour se reconnecter.\n\n` +
          `(Utile au passage de Stripe en mode live : les comptes créés en mode test ne fonctionnent plus.)`
      )
    ) {
      e.preventDefault();
    }
  }

  return (
    <form action={resetPractitionerStripe.bind(null, id)} onSubmit={handleSubmit}>
      <button
        type="submit"
        title="Détacher le compte Stripe Connect (forcera un nouvel onboarding en live)"
        style={{
          padding: '6px 14px',
          background: '#FEF3C7',
          color: '#92400E',
          border: '1px solid #FCD34D',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-cinzel, serif)',
          whiteSpace: 'nowrap',
        }}
      >
        Réinit. Stripe
      </button>
    </form>
  );
}
