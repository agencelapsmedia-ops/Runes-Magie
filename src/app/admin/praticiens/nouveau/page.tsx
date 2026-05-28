import PractitionerForm from '../PractitionerForm';
import { createPractitioner } from '../actions';

export default function NewPractitionerPage() {
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '32px' }}>
        <a
          href="/admin/praticiens"
          style={{
            display: 'inline-block',
            marginBottom: '12px',
            fontSize: '0.85rem',
            color: '#6B3FA0',
            textDecoration: 'none',
          }}
        >
          ← Retour à la liste
        </a>
        <h1
          style={{
            fontFamily: 'var(--font-cinzel, serif)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#2D1B4E',
            marginBottom: '8px',
          }}
        >
          ᚻ Nouveau praticien
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Crée un compte praticien approuvé immédiatement. Un mot de passe est généré automatiquement —
          il s&apos;affichera une seule fois après la création.
        </p>
      </div>

      <PractitionerForm
        action={createPractitioner}
        cancelHref="/admin/praticiens"
        submitLabel="Créer le praticien"
      />
    </div>
  );
}
