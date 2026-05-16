'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

// ════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════

type ProductType = 'PHYSICAL' | 'DROPSHIPPING' | 'EBOOK' | 'COURSE';

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  inStock: boolean;
  featured: boolean;
  sku: string | null;
  stockQuantity: number | null;
  cloverId: string | null;
  cloverSyncedAt: string | null;
  productType: ProductType;
  syncToClover: boolean;
}

interface Category {
  slug: string;
  name: string;
}

type CellState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface SaveResult {
  id: string;
  ok: boolean;
  error?: string;
  cloverSyncStatus: 'synced' | 'queued' | 'skipped';
}

// ════════════════════════════════════════════════════════════════
// Page
// ════════════════════════════════════════════════════════════════

export default function ProductsGridPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Modifs en attente : { productId: { field: newValue } }
  const [pendingEdits, setPendingEdits] = useState<Record<string, Record<string, unknown>>>({});

  // État visuel par cellule : { productId: { field: state } }
  const [cellStates, setCellStates] = useState<Record<string, Record<string, CellState>>>({});

  // Historique pour undo (Ctrl+Z)
  const undoStack = useRef<Array<Record<string, Record<string, unknown>>>>([]);
  const MAX_UNDO = 20;

  // ────────────────────────────────────────────────
  // Chargement
  // ────────────────────────────────────────────────
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
      ]);
      if (!pRes.ok) throw new Error('Erreur chargement produits');
      const pData = await pRes.json();
      setProducts(Array.isArray(pData) ? pData : []);

      if (cRes.ok) {
        const cData = await cRes.json();
        setCategories(Array.isArray(cData) ? cData : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // ────────────────────────────────────────────────
  // Edition d'une cellule
  // ────────────────────────────────────────────────
  const updateCell = useCallback((productId: string, field: string, value: unknown) => {
    setPendingEdits((prev) => {
      // Snapshot pour undo AVANT la modif
      undoStack.current.push(JSON.parse(JSON.stringify(prev)));
      if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();

      const newProductEdits = { ...(prev[productId] || {}), [field]: value };
      return { ...prev, [productId]: newProductEdits };
    });
    setCellStates((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [field]: 'dirty' },
    }));
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    setPendingEdits(prev);
    // Reset les cellStates pour les cellules qui n'ont plus de modif
    setCellStates(() => {
      const newStates: Record<string, Record<string, CellState>> = {};
      for (const pid of Object.keys(prev)) {
        newStates[pid] = {};
        for (const f of Object.keys(prev[pid])) {
          newStates[pid][f] = 'dirty';
        }
      }
      return newStates;
    });
  }, []);

  // Ctrl+Z global
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        // Ne pas intercepter si on est dans un input et qu'il a sa propre undo stack
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  // ────────────────────────────────────────────────
  // Sauvegarde de tout
  // ────────────────────────────────────────────────
  async function saveAll() {
    const entries = Object.entries(pendingEdits).filter(([, changes]) => Object.keys(changes).length > 0);
    if (entries.length === 0) return;

    setSaving(true);
    setError(null);

    // Marquer toutes les cellules en "saving"
    setCellStates((prev) => {
      const next = { ...prev };
      for (const [pid, changes] of entries) {
        next[pid] = { ...next[pid] };
        for (const f of Object.keys(changes)) {
          next[pid][f] = 'saving';
        }
      }
      return next;
    });

    try {
      const updates = entries.map(([id, changes]) => ({ id, changes }));
      const res = await fetch('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur sauvegarde');
      }
      const data: { results: SaveResult[]; counts: { ok: number; failed: number; syncedClover: number; queuedClover: number } } = await res.json();

      // Met à jour les états par produit
      setCellStates((prev) => {
        const next = { ...prev };
        for (const r of data.results) {
          const changes = pendingEdits[r.id];
          if (!changes) continue;
          next[r.id] = { ...next[r.id] };
          for (const f of Object.keys(changes)) {
            next[r.id][f] = r.ok ? 'saved' : 'error';
          }
        }
        return next;
      });

      // Recharge la liste pour récupérer les valeurs finales (cloverSyncedAt, etc.)
      await load();

      // Nettoie les pending pour les produits sauvegardés OK
      setPendingEdits((prev) => {
        const next: Record<string, Record<string, unknown>> = {};
        for (const r of data.results) {
          if (!r.ok) {
            next[r.id] = prev[r.id]; // garde les modifs des produits en erreur
          }
        }
        return next;
      });
      undoStack.current = [];

      // Fade le "saved" vert au bout de 2s
      setTimeout(() => {
        setCellStates((prev) => {
          const next = { ...prev };
          for (const pid of Object.keys(next)) {
            next[pid] = { ...next[pid] };
            for (const f of Object.keys(next[pid])) {
              if (next[pid][f] === 'saved') next[pid][f] = 'idle';
            }
          }
          return next;
        });
      }, 2000);

      if (data.counts.failed > 0) {
        setError(`${data.counts.failed} produit(s) en erreur. Voir les cellules rouges.`);
      } else if (data.counts.queuedClover > 0) {
        setError(`Sauvegardé ${data.counts.ok} produit(s). ${data.counts.queuedClover} sync Clover en queue (sera retenté automatiquement).`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      // Marque toutes les cellules en error
      setCellStates((prev) => {
        const next = { ...prev };
        for (const [pid, changes] of entries) {
          next[pid] = { ...next[pid] };
          for (const f of Object.keys(changes)) {
            next[pid][f] = 'error';
          }
        }
        return next;
      });
    } finally {
      setSaving(false);
    }
  }

  function discardAll() {
    if (!confirm('Annuler toutes les modifications non sauvegardées ?')) return;
    setPendingEdits({});
    setCellStates({});
    undoStack.current = [];
  }

  // Valeur affichée (pending value if dirty, sinon server value)
  function getValue(product: Product, field: keyof Product): unknown {
    const pending = pendingEdits[product.id];
    if (pending && field in pending) return pending[field];
    return product[field];
  }

  function getCellState(productId: string, field: string): CellState {
    return cellStates[productId]?.[field] ?? 'idle';
  }

  // ────────────────────────────────────────────────
  // Définition des colonnes TanStack Table
  // ────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      id: 'image',
      header: 'Image',
      cell: ({ row }) => (
        <div style={{ width: 40, height: 40, position: 'relative', background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
          {row.original.image ? (
            <Image src={row.original.image} alt={row.original.name} fill style={{ objectFit: 'cover' }} sizes="40px" />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: 12 }}>—</div>
          )}
        </div>
      ),
      size: 60,
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => (
        <EditableCell
          value={getValue(row.original, 'name') as string}
          state={getCellState(row.original.id, 'name')}
          onChange={(v) => updateCell(row.original.id, 'name', v)}
        />
      ),
      size: 220,
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => (
        <EditableCell
          value={(getValue(row.original, 'sku') as string | null) ?? ''}
          state={getCellState(row.original.id, 'sku')}
          onChange={(v) => updateCell(row.original.id, 'sku', v || null)}
          monospace
        />
      ),
      size: 150,
    },
    {
      accessorKey: 'category',
      header: 'Catégorie',
      cell: ({ row }) => (
        <SelectCell
          value={getValue(row.original, 'category') as string}
          options={categories.map((c) => ({ value: c.slug, label: c.name }))}
          state={getCellState(row.original.id, 'category')}
          onChange={(v) => updateCell(row.original.id, 'category', v)}
        />
      ),
      size: 160,
    },
    {
      accessorKey: 'price',
      header: 'Prix ($)',
      cell: ({ row }) => (
        <EditableCell
          value={String(getValue(row.original, 'price') ?? 0)}
          state={getCellState(row.original.id, 'price')}
          onChange={(v) => updateCell(row.original.id, 'price', parseFloat(v) || 0)}
          inputType="number"
        />
      ),
      size: 100,
    },
    {
      accessorKey: 'stockQuantity',
      header: 'Stock',
      cell: ({ row }) => {
        const isPhysical = (getValue(row.original, 'productType') as ProductType) === 'PHYSICAL';
        return (
          <EditableCell
            value={String(getValue(row.original, 'stockQuantity') ?? '')}
            state={getCellState(row.original.id, 'stockQuantity')}
            onChange={(v) => updateCell(row.original.id, 'stockQuantity', v === '' ? null : parseInt(v, 10))}
            inputType="number"
            disabled={!isPhysical}
            placeholder={isPhysical ? '0' : '—'}
          />
        );
      },
      size: 90,
    },
    {
      accessorKey: 'productType',
      header: 'Type',
      cell: ({ row }) => (
        <SelectCell
          value={getValue(row.original, 'productType') as string}
          options={[
            { value: 'PHYSICAL', label: 'Physique' },
            { value: 'DROPSHIPPING', label: 'Dropship' },
            { value: 'EBOOK', label: 'Ebook' },
            { value: 'COURSE', label: 'Cours' },
          ]}
          state={getCellState(row.original.id, 'productType')}
          onChange={(v) => updateCell(row.original.id, 'productType', v)}
        />
      ),
      size: 110,
    },
    {
      accessorKey: 'inStock',
      header: 'En stock',
      cell: ({ row }) => (
        <CheckboxCell
          checked={getValue(row.original, 'inStock') as boolean}
          state={getCellState(row.original.id, 'inStock')}
          onChange={(v) => updateCell(row.original.id, 'inStock', v)}
        />
      ),
      size: 70,
    },
    {
      accessorKey: 'featured',
      header: 'Vedette',
      cell: ({ row }) => (
        <CheckboxCell
          checked={getValue(row.original, 'featured') as boolean}
          state={getCellState(row.original.id, 'featured')}
          onChange={(v) => updateCell(row.original.id, 'featured', v)}
        />
      ),
      size: 70,
    },
    {
      accessorKey: 'syncToClover',
      header: 'Sync Clover',
      cell: ({ row }) => (
        <CheckboxCell
          checked={getValue(row.original, 'syncToClover') as boolean}
          state={getCellState(row.original.id, 'syncToClover')}
          onChange={(v) => updateCell(row.original.id, 'syncToClover', v)}
        />
      ),
      size: 80,
    },
    {
      id: 'cloverStatus',
      header: 'Clover',
      cell: ({ row }) => {
        const cloverId = row.original.cloverId;
        if (!cloverId) {
          return <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>—</span>;
        }
        return (
          <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: '0.7rem', background: '#D1FAE5', color: '#065F46', fontFamily: 'monospace' }}>
            ✓ {cloverId.slice(0, 6)}
          </span>
        );
      },
      size: 90,
      enableSorting: false,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [categories, pendingEdits, cellStates, updateCell]);

  const table = useReactTable({
    data: products,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Compteur de modifs en attente
  const dirtyCount = Object.values(pendingEdits).reduce((n, changes) => n + Object.keys(changes).length, 0);

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: 4 }}>
          ᚤ Produits — grille
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
          Édite plusieurs cellules, puis &laquo; Sauvegarder tout &raquo;. Les changements sont poussés à Clover automatiquement.
          {' '}<span style={{ color: '#9CA3AF' }}>(Ctrl+Z pour annuler)</span>
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          style={{ padding: '8px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: '0.9rem', minWidth: 240, color: '#1F2937', background: '#FFF' }}
        />
        <div style={{ flex: 1 }} />
        {dirtyCount > 0 && (
          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '6px 12px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 600, border: '1px solid #FCD34D' }}>
            {dirtyCount} modif{dirtyCount > 1 ? 's' : ''} en attente
          </span>
        )}
        <button
          onClick={discardAll}
          disabled={dirtyCount === 0 || saving}
          style={{
            background: dirtyCount === 0 ? '#E5E7EB' : '#FFF',
            color: dirtyCount === 0 ? '#9CA3AF' : '#991B1B',
            border: `1px solid ${dirtyCount === 0 ? '#E5E7EB' : '#FCA5A5'}`,
            padding: '8px 16px',
            borderRadius: 8,
            cursor: dirtyCount === 0 || saving ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          ✕ Annuler tout
        </button>
        <button
          onClick={saveAll}
          disabled={dirtyCount === 0 || saving}
          style={{
            background: dirtyCount === 0 || saving ? '#9CA3AF' : '#2D1B4E',
            color: '#FFF',
            border: 'none',
            padding: '8px 18px',
            borderRadius: 8,
            cursor: dirtyCount === 0 || saving ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {saving ? '⏳ Sauvegarde...' : '✓ Sauvegarder tout'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
          ⚠ {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#FFF', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'auto', maxHeight: '70vh' }}>
        {loading ? (
          <div style={{ padding: 64, textAlign: 'center', color: '#9CA3AF' }}>Chargement...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center', color: '#9CA3AF' }}>Aucun produit.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#F9FAFB', zIndex: 10 }}>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} style={{ borderBottom: '2px solid #E5E7EB' }}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      style={{
                        padding: '10px 8px',
                        textAlign: 'left',
                        fontFamily: 'var(--font-cinzel, serif)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#6B3FA0',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        width: header.getSize(),
                        cursor: header.column.getCanSort() ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, idx) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ padding: 6, verticalAlign: 'middle', width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: 12, color: '#6B7280', fontSize: '0.8rem', lineHeight: 1.5 }}>
        💡 Jaune = modifié non sauvé · Vert = sauvegardé OK · Rouge = erreur (la modif reste en pending, tu peux retenter).
        Le stock est désactivé pour les produits non-physiques.
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Cellules éditables
// ════════════════════════════════════════════════════════════════

function cellBackground(state: CellState): string {
  switch (state) {
    case 'dirty': return '#FEF3C7';
    case 'saving': return '#DBEAFE';
    case 'saved': return '#D1FAE5';
    case 'error': return '#FEE2E2';
    default: return 'transparent';
  }
}

function EditableCell({
  value, state, onChange, monospace, inputType, disabled, placeholder,
}: {
  value: string;
  state: CellState;
  onChange: (v: string) => void;
  monospace?: boolean;
  inputType?: 'text' | 'number';
  disabled?: boolean;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  // Pattern React officiel : "storing information from previous renders".
  // Sync local avec value quand le serveur renvoie une nouvelle valeur (après save reload),
  // mais préserve l'édition en cours quand on est en train de taper (dirty/saving/error).
  if (value !== prevValue) {
    setPrevValue(value);
    if (state === 'idle' || state === 'saved') {
      setLocal(value);
    }
  }

  return (
    <input
      type={inputType || 'text'}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { if (local !== value) onChange(local); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.currentTarget.blur(); }
        if (e.key === 'Escape') { setLocal(value); e.currentTarget.blur(); }
      }}
      disabled={disabled}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '6px 8px',
        border: '1px solid transparent',
        borderRadius: 4,
        fontSize: '0.85rem',
        background: cellBackground(state),
        color: disabled ? '#9CA3AF' : '#1F2937',
        fontFamily: monospace ? 'monospace' : 'inherit',
        outline: 'none',
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = '#6B3FA0'; }}
      onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
    />
  );
}

function SelectCell({
  value, options, state, onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  state: CellState;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '6px 8px',
        border: '1px solid transparent',
        borderRadius: 4,
        fontSize: '0.85rem',
        background: cellBackground(state),
        color: '#1F2937',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function CheckboxCell({
  checked, state, onChange,
}: {
  checked: boolean;
  state: CellState;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 6, background: cellBackground(state), borderRadius: 4 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, cursor: 'pointer' }}
      />
    </div>
  );
}
