/**
 * Feuille de présence d'un rituel — à imprimer et cocher au Temple.
 *
 * Volontairement pauvre en information : les noms, une case à cocher, et de la
 * place pour écrire. C'est un document de terrain, pas un rapport.
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface LigneFeuille {
  nom: string;
  courriel: string;
  telephone: string | null;
  /** Pointage déjà enregistré, pré-coché sur la feuille. */
  attendance: string | null;
}

export interface FeuillePresenceProps {
  titre: string;
  dateFormatee: string;
  lieu: string;
  capacite: number;
  inscrits: LigneFeuille[];
  genereLe?: Date;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
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
  title: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#2D1B4E', marginTop: 14 },
  meta: { fontSize: 10, color: '#4B5563', marginTop: 3 },
  compte: { fontSize: 10, color: '#4B5563', marginTop: 10, marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2D1B4E',
    color: '#FFFFFF',
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#D1D5DB',
  },
  rowAlt: { backgroundColor: '#F9FAFB' },
  colCase: { width: '8%', textAlign: 'center' },
  colNom: { width: '34%', fontFamily: 'Helvetica-Bold' },
  colCourriel: { width: '36%', fontSize: 9, color: '#4B5563' },
  colTel: { width: '22%', fontSize: 9, color: '#4B5563' },
  case: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#2D1B4E',
    marginHorizontal: 'auto',
  },
  caseCochee: { backgroundColor: '#2D1B4E' },
  vide: { fontSize: 10, color: '#9CA3AF', marginTop: 20, fontStyle: 'italic' },
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

export function FeuillePresencePdf({
  titre,
  dateFormatee,
  lieu,
  capacite,
  inscrits,
  genereLe = new Date(),
}: FeuillePresenceProps) {
  return (
    <Document title={`Feuille de présence — ${titre}`} author="Runes & Magie" subject="Feuille de présence">
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>Runes &amp; Magie</Text>
            <Text style={styles.brandSub}>Boutique-école de sorcellerie</Text>
          </View>
          <Text style={styles.generatedAt}>Généré le {dateHeure(genereLe)}</Text>
        </View>

        <Text style={styles.title}>{titre}</Text>
        <Text style={styles.meta}>{dateFormatee}</Text>
        <Text style={styles.meta}>{lieu}</Text>
        <Text style={styles.compte}>
          {inscrits.length} inscrit{inscrits.length > 1 ? 's' : ''} sur {capacite} places
        </Text>

        {inscrits.length === 0 ? (
          <Text style={styles.vide}>Aucune personne inscrite.</Text>
        ) : (
          <View>
            <View style={styles.tableHeader} fixed>
              <Text style={styles.colCase}>✓</Text>
              <Text style={styles.colNom}>Nom</Text>
              <Text style={styles.colCourriel}>Courriel</Text>
              <Text style={styles.colTel}>Téléphone</Text>
            </View>
            {inscrits.map((i, index) => (
              <View
                key={`${i.courriel}-${index}`}
                style={[styles.row, ...(index % 2 === 1 ? [styles.rowAlt] : [])]}
                wrap={false}
              >
                <View style={styles.colCase}>
                  <View style={[styles.case, ...(i.attendance === 'PRESENT' ? [styles.caseCochee] : [])]} />
                </View>
                <Text style={styles.colNom}>{i.nom}</Text>
                <Text style={styles.colCourriel}>{i.courriel}</Text>
                <Text style={styles.colTel}>{i.telephone || '—'}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Runes &amp; Magie — Feuille de présence</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
