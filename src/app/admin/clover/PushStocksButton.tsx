'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ResultatStock {
  total: number;
  envoyes: number;
  enFile: number;
  unitesTotal: number;
  resultats: Array<{ name: string; stock: number; status: 'envoye' | 'en-file' }>;
}

/**
 * Envoi des quantités en stock vers Clover.
 *
 * Chez Clover, le stock vit sur un endpoint distinct de l'article : créer un
 * article ne transmet jamais sa quantité. Ce bouton comble l'écart, et reste
 * utile à chaque fois qu'une partie de l'inventaire est mise à jour sur le site.
 */
export default function PushStocksButton({
  produitsAvecStock,
  unitesTotal,
}: {
  produitsAvecStock: number;
  unitesTotal: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultatStock | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function envoyer(opts: { limit?: number }) {
    const message = opts.limit
      ? `Tester en envoyant le stock de ${opts.limit} produit(s) vers Clover ?\n\nLa quantité sera écrasée dans Clover par celle du site.`
      : `Envoyer le stock des ${produitsAvecStock} produits vers Clover ?\n\nLes quantités de Clover seront REMPLACÉES par celles du site (${unitesTotal} unités au total).\n\nÀ ne faire que si le site détient la bonne quantité.`;
    if (!window.confirm(message)) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const url = opts.limit
        ? `/api/admin/clover/push-stocks?limit=${opts.limit}`
        : '/api/admin/clover/push-stocks';
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erreur serveur');
        return;
      }
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  if (produitsAvecStock === 0 && !result) return null;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: '20px 24px',
        marginBottom: 24,
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-cinzel, serif)',
          color: '#2D1B4E',
          fontSize: '1.05rem',
          margin: '0 0 8px',
        }}
      >
        Quantités en stock
      </h2>
      <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: '0 0 16px', lineHeight: 1.5 }}>
        <strong>{produitsAvecStock}</strong> produit{produitsAvecStock > 1 ? 's ont' : ' a'} une
        quantité suivie sur le site, soit <strong>{unitesTotal}</strong> unité
        {unitesTotal > 1 ? 's' : ''}. Clover gère le stock séparément de la fiche article :
        créer un produit n&apos;envoie pas sa quantité. Ce bouton la transmet.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => envoyer({ limit: 1 })}
          disabled={loading}
          style={{
            padding: '10px 18px',
            border: '1px solid #6B3FA0',
            background: '#fff',
            color: '#6B3FA0',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Tester avec 1 produit
        </button>
        <button
          onClick={() => envoyer({})}
          disabled={loading}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: '#6B3FA0',
            color: '#fff',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Envoi en cours…' : `↑ Envoyer les ${produitsAvecStock} quantités vers Clover`}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 6,
            color: '#991B1B',
            fontSize: '0.85rem',
          }}
        >
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
            <Stat label="Traités" value={result.total} color="#4B5563" />
            <Stat label="Envoyés" value={result.envoyes} color="#065F46" />
            <Stat label="En file (reprise)" value={result.enFile} color="#92400E" />
            <Stat label="Unités transmises" value={result.unitesTotal} color="#6B3FA0" />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto', fontSize: '0.8rem', color: '#4B5563' }}>
            {result.resultats.map((r, i) => (
              <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ color: r.status === 'envoye' ? '#065F46' : '#92400E' }}>
                  {r.status === 'envoye' ? '✓' : '⏳'}
                </span>{' '}
                <strong>{r.name}</strong> — {r.stock} en stock
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
