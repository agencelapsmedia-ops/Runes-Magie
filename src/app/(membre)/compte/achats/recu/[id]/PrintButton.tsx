'use client';

/** Bouton Imprimer / PDF du reçu (window.print → la cliente choisit « PDF »). */
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-block cursor-pointer rounded-sm border px-6 py-3 font-cinzel text-[0.68rem] uppercase tracking-widest text-or-ancien"
      style={{ borderColor: 'rgba(201,168,76,0.5)', background: 'transparent' }}
    >
      🖨 Imprimer / Enregistrer en PDF
    </button>
  );
}
