/**
 * Rapport des rituels en PDF — mêmes chiffres que /admin/evenements/rapports,
 * puisque les deux consomment `construireRapportEvenements`.
 *
 * Polices Helvetica intégrées, comme InventoryPdf : une police maison
 * (`Font.register`) obligerait à déclarer la route dans
 * `outputFileTracingIncludes` de next.config.ts pour que le TTF suive dans le
 * bundle Vercel.
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { RapportEvenements } from '@/lib/rapports-evenements';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 50,
    paddingLeft: 36,
    paddingRight: 36,
    color: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#2D1B4E',
    paddingBottom: 8,
  },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#2D1B4E' },
  brandSub: { fontSize: 9, color: '#6B7280', marginTop: 2 },
  generatedAt: { fontSize: 9, color: '#6B7280', textAlign: 'right' },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#2D1B4E', marginTop: 12, marginBottom: 2 },
  filterLabel: { fontSize: 10, color: '#6B7280', marginBottom: 10, fontStyle: 'italic' },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#2D1B4E',
    marginTop: 18,
    marginBottom: 6,
  },
  totals: { marginTop: 12, padding: 10, backgroundColor: '#F3F4F6', flexDirection: 'row', gap: 22 },
  totalBlock: { flexDirection: 'column' },
  totalLabel: { fontSize: 7, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#2D1B4E', marginTop: 2 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2D1B4E',
    color: '#FFFFFF',
    padding: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    fontSize: 9,
  },
  tableRowAlt: { backgroundColor: '#F9FAFB' },
  tableRowFaded: { color: '#9CA3AF' },
  note: { fontSize: 8, color: '#6B7280', marginTop: 8, fontStyle: 'italic' },

  // Tableau « par rituel »
  rDate: { width: '15%' },
  rTitre: { width: '31%' },
  rNombre: { width: '9%', textAlign: 'right' },
  rTaux: { width: '9%', textAlign: 'right' },

  // Tableau « par participant »
  pNom: { width: '30%' },
  pCourriel: { width: '34%' },
  pNombre: { width: '9%', textAlign: 'right' },
  pDate: { width: '18%', textAlign: 'right' },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#6B7280',
  },
});

function dateHeure(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function jour(d: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Toronto',
  }).format(d);
}

export function RapportEvenementsPdf({ rapport }: { rapport: RapportEvenements }) {
  const { global } = rapport;
  const periode =
    rapport.debut || rapport.fin
      ? `Période : ${rapport.debut ? jour(rapport.debut) : 'origine'} → ${rapport.fin ? jour(rapport.fin) : "aujourd'hui"}`
      : 'Tous les rituels depuis l’origine';

  return (
    <Document title="Rapport des rituels — Runes & Magie" author="Runes & Magie" subject="Participation aux rituels">
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>Runes &amp; Magie</Text>
            <Text style={styles.brandSub}>Boutique-école de sorcellerie</Text>
          </View>
          <Text style={styles.generatedAt}>Généré le {dateHeure(rapport.genereLe)}</Text>
        </View>

        <Text style={styles.title}>Rapport de participation aux rituels</Text>
        <Text style={styles.filterLabel}>{periode}</Text>

        <View style={styles.totals}>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Rituels</Text>
            <Text style={styles.totalValue}>{global.rituels}</Text>
          </View>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Inscriptions</Text>
            <Text style={styles.totalValue}>{global.confirmees}</Text>
          </View>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Participants</Text>
            <Text style={styles.totalValue}>{global.participants}</Text>
          </View>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Fidèles (2+)</Text>
            <Text style={styles.totalValue}>{global.fideles}</Text>
          </View>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Présences</Text>
            <Text style={styles.totalValue}>{global.presences}</Text>
          </View>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Remplissage</Text>
            <Text style={styles.totalValue}>{global.remplissageMoyen} %</Text>
          </View>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Annulations</Text>
            <Text style={styles.totalValue}>{global.annulees}</Text>
          </View>
        </View>

        {global.pointees < global.confirmees && (
          <Text style={styles.note}>
            {global.confirmees - global.pointees} inscription(s) sur {global.confirmees} ne sont pas
            encore pointées : le nombre de présences est donc incomplet.
          </Text>
        )}

        <Text style={styles.sectionTitle}>Par rituel</Text>
        <View>
          <View style={styles.tableHeader} fixed>
            <Text style={styles.rDate}>Date</Text>
            <Text style={styles.rTitre}>Rituel</Text>
            <Text style={styles.rNombre}>Places</Text>
            <Text style={styles.rNombre}>Inscrits</Text>
            <Text style={styles.rTaux}>Taux</Text>
            <Text style={styles.rNombre}>Présents</Text>
            <Text style={styles.rNombre}>Nouv.</Text>
            <Text style={styles.rNombre}>Rev.</Text>
          </View>
          {rapport.rituels.map((r, i) => (
            <View
              key={r.id}
              style={[
                styles.tableRow,
                ...(i % 2 === 1 ? [styles.tableRowAlt] : []),
                ...(r.annule ? [styles.tableRowFaded] : []),
              ]}
              wrap={false}
            >
              <Text style={styles.rDate}>{jour(r.debut)}</Text>
              <Text style={styles.rTitre}>{r.annule ? `${r.titre} (annulé)` : r.titre}</Text>
              <Text style={styles.rNombre}>{r.capacite}</Text>
              <Text style={styles.rNombre}>{r.confirmes}</Text>
              <Text style={styles.rTaux}>{r.remplissage} %</Text>
              <Text style={styles.rNombre}>{r.presents + r.absents === 0 ? '—' : r.presents}</Text>
              <Text style={styles.rNombre}>{r.nouveaux}</Text>
              <Text style={styles.rNombre}>{r.revenants}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle} break={rapport.rituels.length > 12}>
          Par participant
        </Text>
        <View>
          <View style={styles.tableHeader} fixed>
            <Text style={styles.pNom}>Nom</Text>
            <Text style={styles.pCourriel}>Courriel</Text>
            <Text style={styles.pNombre}>Inscr.</Text>
            <Text style={styles.pNombre}>Prés.</Text>
            <Text style={styles.pDate}>Dernier rituel</Text>
          </View>
          {rapport.participants.map((p, i) => (
            <View
              key={p.userId}
              style={[styles.tableRow, ...(i % 2 === 1 ? [styles.tableRowAlt] : [])]}
              wrap={false}
            >
              <Text style={styles.pNom}>{p.nom}</Text>
              <Text style={styles.pCourriel}>{p.courriel}</Text>
              <Text style={styles.pNombre}>{p.inscriptions}</Text>
              <Text style={styles.pNombre}>{p.presences}</Text>
              <Text style={styles.pDate}>{p.inscriptions > 0 ? jour(p.dernier) : '—'}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.note}>
          Les participants sont regroupés par compte membre : une même personne possédant deux
          comptes apparaît deux fois.
        </Text>

        <View style={styles.footer} fixed>
          <Text>Runes &amp; Magie — Rapport des rituels</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
