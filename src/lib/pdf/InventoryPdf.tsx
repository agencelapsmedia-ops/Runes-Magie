/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface InventoryPdfProduct {
  sku: string | null;
  name: string;
  category: string;
  productType: string;
  price: number;
  stockQuantity: number | null;
  inStock: boolean;
  cloverId: string | null;
}

export interface InventoryPdfProps {
  products: InventoryPdfProduct[];
  filterLabel?: string; // ex: "Catégorie : Cristaux" — affiché en sous-titre
  generatedAt?: Date;
}

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
  brand: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#2D1B4E',
  },
  brandSub: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  generatedAt: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'right',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#2D1B4E',
    marginTop: 12,
    marginBottom: 2,
  },
  filterLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  table: {
    marginTop: 4,
  },
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
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  tableRowHidden: {
    color: '#9CA3AF',
  },
  colSku: { width: '10%' },
  colName: { width: '38%' },
  colCategory: { width: '15%' },
  colType: { width: '11%' },
  colPrice: { width: '10%', textAlign: 'right' },
  colStock: { width: '7%', textAlign: 'right' },
  colState: { width: '5%', textAlign: 'center' },
  colClover: { width: '4%', textAlign: 'center' },
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
  totals: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    gap: 30,
  },
  totalBlock: {
    flexDirection: 'column',
  },
  totalLabel: {
    fontSize: 7,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#2D1B4E',
    marginTop: 2,
  },
});

function formatDateFr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' $';
}

function productTypeShort(t: string): string {
  switch (t) {
    case 'PHYSICAL': return 'Phys.';
    case 'DROPSHIPPING': return 'Drop.';
    case 'EBOOK': return 'Ebook';
    case 'COURSE': return 'Cours';
    default: return t.slice(0, 5);
  }
}

export function InventoryPdf({ products, filterLabel, generatedAt = new Date() }: InventoryPdfProps) {
  const visibleCount = products.filter((p) => p.inStock).length;
  const hiddenCount = products.length - visibleCount;
  const linkedToClover = products.filter((p) => p.cloverId).length;
  const totalValue = products.reduce((sum, p) => sum + (p.stockQuantity ?? 0) * p.price, 0);

  return (
    <Document
      title="Inventaire Runes & Magie"
      author="Runes & Magie"
      subject="Inventaire produits"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>Runes &amp; Magie</Text>
            <Text style={styles.brandSub}>Boutique-école de sorcellerie</Text>
          </View>
          <Text style={styles.generatedAt}>Généré le {formatDateFr(generatedAt)}</Text>
        </View>

        <Text style={styles.title}>Inventaire des produits</Text>
        {filterLabel && <Text style={styles.filterLabel}>{filterLabel}</Text>}

        {/* Totaux */}
        <View style={styles.totals}>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Total produits</Text>
            <Text style={styles.totalValue}>{products.length}</Text>
          </View>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Visibles</Text>
            <Text style={styles.totalValue}>{visibleCount}</Text>
          </View>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Cachés</Text>
            <Text style={styles.totalValue}>{hiddenCount}</Text>
          </View>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Liés Clover</Text>
            <Text style={styles.totalValue}>{linkedToClover}</Text>
          </View>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Valeur stock</Text>
            <Text style={styles.totalValue}>{formatPrice(totalValue)}</Text>
          </View>
        </View>

        {/* Tableau */}
        <View style={styles.table}>
          {/* Header (répété sur chaque page) */}
          <View style={styles.tableHeader} fixed>
            <Text style={styles.colSku}>SKU</Text>
            <Text style={styles.colName}>Nom</Text>
            <Text style={styles.colCategory}>Catégorie</Text>
            <Text style={styles.colType}>Type</Text>
            <Text style={styles.colPrice}>Prix</Text>
            <Text style={styles.colStock}>Stock</Text>
            <Text style={styles.colState}>État</Text>
            <Text style={styles.colClover}>Clv</Text>
          </View>

          {products.map((p, i) => (
            <View
              key={`${p.sku}-${i}`}
              style={[
                styles.tableRow,
                ...(i % 2 === 1 ? [styles.tableRowAlt] : []),
                ...(!p.inStock ? [styles.tableRowHidden] : []),
              ]}
              wrap={false}
            >
              <Text style={styles.colSku}>{p.sku ?? '—'}</Text>
              <Text style={styles.colName}>{p.name}</Text>
              <Text style={styles.colCategory}>{p.category}</Text>
              <Text style={styles.colType}>{productTypeShort(p.productType)}</Text>
              <Text style={styles.colPrice}>{formatPrice(p.price)}</Text>
              <Text style={styles.colStock}>{p.stockQuantity ?? '—'}</Text>
              <Text style={styles.colState}>{p.inStock ? '✓' : '×'}</Text>
              <Text style={styles.colClover}>{p.cloverId ? '✓' : '—'}</Text>
            </View>
          ))}
        </View>

        {/* Pied de page numéroté */}
        <View style={styles.footer} fixed>
          <Text>Runes &amp; Magie — Inventaire</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
