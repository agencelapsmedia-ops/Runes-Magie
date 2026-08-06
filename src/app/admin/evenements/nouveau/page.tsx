'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FormulaireEvenement from '../FormulaireEvenement';

export default function NouvelEvenementPage() {
  const router = useRouter();

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/admin/evenements" style={{ display: 'inline-block', marginBottom: '12px', fontSize: '0.85rem', color: '#6B3FA0', textDecoration: 'none' }}>
          ← Retour à la liste
        </Link>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
          ᛝ Nouvel événement
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Il sera enregistré en brouillon tant que « Publié » n&apos;est pas coché.</p>
      </div>

      <FormulaireEvenement onSaved={(evenement) => router.push(`/admin/evenements/${evenement.id}`)} />
    </div>
  );
}
