'use client';

import { deletePractitioner } from './actions';

interface Props {
  id: string;
  name: string;
}

export default function DeleteButton({ id, name }: Props) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (
      !confirm(
        `Supprimer définitivement ${name} ?\n\nCette action est irréversible (compte, fiche, disponibilités, etc.).`
      )
    ) {
      e.preventDefault();
    }
  }

  return (
    <form action={deletePractitioner.bind(null, id)} onSubmit={handleSubmit}>
      <button
        type="submit"
        style={{
          padding: '6px 14px',
          background: '#FEE2E2',
          color: '#991B1B',
          border: '1px solid #FCA5A5',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-cinzel, serif)',
        }}
      >
        Supprimer
      </button>
    </form>
  );
}
