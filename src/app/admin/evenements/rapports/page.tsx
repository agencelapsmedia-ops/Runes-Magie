import Link from 'next/link';
import { construireRapportEvenements, dateCourte } from '@/lib/rapports-evenements';

export const dynamic = 'force-dynamic';

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 14px',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: '0.85rem',
  color: '#4B5563',
};
const nombreStyle: React.CSSProperties = { ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' };
const thNombre: React.CSSProperties = { ...thStyle, textAlign: 'right' };

/** Pastille de fidélité — 3 participations et plus, c'est le noyau du cercle. */
function BadgeFidelite({ nombre }: { nombre: number }) {
  if (nombre < 2) return null;
  const noyau = nombre >= 3;
  return (
    <span
      style={{
        display: 'inline-block',
        marginLeft: '8px',
        padding: '2px 9px',
        borderRadius: '9999px',
        fontSize: '0.68rem',
        fontWeight: 600,
        fontFamily: 'var(--font-cinzel, serif)',
        background: noyau ? '#EDE9FE' : '#F3F4F6',
        color: noyau ? '#6B3FA0' : '#6B7280',
        border: `1px solid ${noyau ? '#C4B5FD' : '#E5E7EB'}`,
      }}
    >
      {noyau ? 'Noyau' : 'Fidèle'}
    </span>
  );
}

export default async function RapportsEvenementsPage({
  searchParams,
}: {
  searchParams: Promise<{ debut?: string; fin?: string }>;
}) {
  const { debut: debutBrut, fin: finBrut } = await searchParams;

  const versDate = (valeur?: string): Date | null => {
    if (!valeur) return null;
    const date = new Date(valeur);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const debut = versDate(debutBrut);
  // La borne de fin est une date sans heure : sans ce décalage, un rituel tenu
  // à 13 h le dernier jour de la période serait exclu du rapport.
  const finJour = versDate(finBrut);
  const fin = finJour ? new Date(finJour.getTime() + 24 * 60 * 60 * 1000 - 1) : null;

  const rapport = await construireRapportEvenements({ debut, fin });
  const { global } = rapport;

  const parametresPdf = new URLSearchParams();
  if (debutBrut) parametresPdf.set('debut', debutBrut);
  if (finBrut) parametresPdf.set('fin', finBrut);
  const lienPdf = `/api/admin/evenements/rapport-pdf${parametresPdf.toString() ? `?${parametresPdf}` : ''}`;

  const stats = [
    { label: 'Rituels', value: String(global.rituels), color: '#6B3FA0', bg: '#EDE9FE', border: '#C4B5FD', rune: 'ᛝ' },
    { label: 'Inscriptions confirmées', value: String(global.confirmees), color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD', rune: 'ᚦ' },
    { label: 'Participants différents', value: String(global.participants), color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7', rune: 'ᛗ' },
    { label: 'Revenus (2 rituels et +)', value: String(global.fideles), color: '#92400E', bg: '#FEF3C7', border: '#FCD34D', rune: 'ᛉ' },
    { label: 'Présences pointées', value: String(global.presences), color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7', rune: 'ᚨ' },
    { label: 'Remplissage moyen', value: `${global.remplissageMoyen} %`, color: '#6B3FA0', bg: '#EDE9FE', border: '#C4B5FD', rune: 'ᚲ' },
  ];

  const nonPointees = global.confirmees - global.pointees;

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '28px' }}>
        <Link
          href="/admin/evenements"
          style={{ display: 'inline-block', marginBottom: '12px', fontSize: '0.85rem', color: '#6B3FA0', textDecoration: 'none' }}
        >
          ← Retour aux événements
        </Link>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
          ᛝ Rapports des rituels
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Qui vient, qui revient, et combien de personnes se présentent réellement.
        </p>
      </div>

      {/* Filtre de période + téléchargement. Formulaire GET : les bornes vivent
          dans l'URL, donc le lien du PDF est toujours celui de l'écran affiché. */}
      <form
        method="get"
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '16px 18px',
          marginBottom: '24px',
        }}
      >
        <label style={{ fontSize: '0.78rem', color: '#4B5563', fontWeight: 600 }}>
          Du
          <input
            type="date"
            name="debut"
            defaultValue={debutBrut ?? ''}
            style={{ display: 'block', marginTop: '4px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
          />
        </label>
        <label style={{ fontSize: '0.78rem', color: '#4B5563', fontWeight: 600 }}>
          Au
          <input
            type="date"
            name="fin"
            defaultValue={finBrut ?? ''}
            style={{ display: 'block', marginTop: '4px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
          />
        </label>
        <button
          type="submit"
          style={{ padding: '9px 18px', background: '#6B3FA0', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Filtrer
        </button>
        {(debutBrut || finBrut) && (
          <Link
            href="/admin/evenements/rapports"
            style={{ padding: '9px 14px', fontSize: '0.82rem', color: '#6B7280', textDecoration: 'none' }}
          >
            Tout afficher
          </Link>
        )}
        <a
          href={lienPdf}
          style={{ marginLeft: 'auto', padding: '9px 16px', background: '#fff', border: '1px solid #C4B5FD', color: '#6B3FA0', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
        >
          ⭳ Télécharger le rapport (PDF)
        </a>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '18px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: '#FFFFFF', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${s.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: s.color }}>
                {s.rune}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {s.label}
              </span>
            </div>
            <p style={{ fontSize: '1.7rem', fontWeight: 700, color: '#2D1B4E', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {nonPointees > 0 && (
        <p style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E', borderRadius: '10px', padding: '12px 16px', fontSize: '0.85rem', marginBottom: '28px' }}>
          {nonPointees} inscription{nonPointees > 1 ? 's' : ''} sur {global.confirmees} ne{' '}
          {nonPointees > 1 ? 'sont' : "n'est"} pas encore pointée{nonPointees > 1 ? 's' : ''} — le
          nombre de présences est donc incomplet. Le pointage se fait sur la fiche de chaque rituel.
        </p>
      )}

      <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.2rem', color: '#2D1B4E', margin: '10px 0 14px' }}>
        Par rituel
      </h2>
      {rapport.rituels.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '30px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Aucun rituel sur cette période.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', overflowX: 'auto', marginBottom: '32px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Rituel</th>
                <th style={thNombre}>Places</th>
                <th style={thNombre}>Inscrits</th>
                <th style={thNombre}>Remplissage</th>
                <th style={thNombre}>Présents</th>
                <th style={thNombre}>Absents</th>
                <th style={thNombre}>Nouveaux</th>
                <th style={thNombre}>Revenants</th>
                <th style={thNombre}>Annulations</th>
                <th style={thNombre}>Délai médian</th>
              </tr>
            </thead>
            <tbody>
              {rapport.rituels.map((r, index) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6', background: index % 2 === 1 ? '#FCFCFD' : '#fff' }}>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{dateCourte(r.debut)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#1F2937' }}>
                    <Link href={`/admin/evenements/${r.id}`} style={{ color: '#1F2937', textDecoration: 'none' }}>
                      {r.titre}
                    </Link>
                    {r.annule && <span style={{ color: '#991B1B', fontWeight: 600 }}> — annulé</span>}
                  </td>
                  <td style={nombreStyle}>{r.capacite}</td>
                  <td style={{ ...nombreStyle, fontWeight: 600, color: '#1F2937' }}>{r.confirmes}</td>
                  <td style={nombreStyle}>{r.remplissage} %</td>
                  <td style={nombreStyle}>{r.presents + r.absents === 0 ? '—' : r.presents}</td>
                  <td style={nombreStyle}>{r.presents + r.absents === 0 ? '—' : r.absents}</td>
                  <td style={nombreStyle}>{r.nouveaux}</td>
                  <td style={nombreStyle}>{r.revenants}</td>
                  <td style={nombreStyle}>{r.annulees}</td>
                  <td style={nombreStyle}>{r.delaiMedian === null ? '—' : `${r.delaiMedian} j`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.2rem', color: '#2D1B4E', margin: '10px 0 14px' }}>
        Par participant
      </h2>
      {rapport.participants.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '30px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Personne ne s&apos;est inscrit sur cette période.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={thStyle}>Nom</th>
                <th style={thStyle}>Courriel</th>
                <th style={thNombre}>Inscriptions</th>
                <th style={thNombre}>Présences</th>
                <th style={thNombre}>Annulations</th>
                <th style={thNombre}>Premier</th>
                <th style={thNombre}>Dernier</th>
              </tr>
            </thead>
            <tbody>
              {rapport.participants.map((p, index) => (
                <tr key={p.userId} style={{ borderBottom: '1px solid #F3F4F6', background: index % 2 === 1 ? '#FCFCFD' : '#fff' }}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#1F2937' }}>
                    {p.nom}
                    <BadgeFidelite nombre={p.inscriptions} />
                  </td>
                  <td style={tdStyle}>{p.courriel}</td>
                  <td style={{ ...nombreStyle, fontWeight: 600, color: '#1F2937' }}>{p.inscriptions}</td>
                  <td style={nombreStyle}>{p.presences}</td>
                  <td style={nombreStyle}>{p.annulations || '—'}</td>
                  <td style={nombreStyle}>{p.inscriptions > 0 ? dateCourte(p.premier) : '—'}</td>
                  <td style={nombreStyle}>{p.inscriptions > 0 ? dateCourte(p.dernier) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ color: '#9CA3AF', fontSize: '0.78rem', marginTop: '14px' }}>
        Les participants sont regroupés par compte membre : une même personne possédant deux comptes
        (deux adresses courriel) apparaît deux fois.
      </p>
    </div>
  );
}
