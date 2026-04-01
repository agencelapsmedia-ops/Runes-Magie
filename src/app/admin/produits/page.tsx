'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import ImageUploader from '@/components/admin/ImageUploader';
import { categorySubcategories, stoneNames } from '@/data/products';

const CATEGORIES = [
  { id: 'cristaux', name: 'Pierres et Cristaux' },
  { id: 'runes', name: 'Runes' },
  { id: 'tarot', name: 'Tarot' },
  { id: 'oracle', name: 'Oracles' },
  { id: 'herbes-encens', name: 'Herbes & Encens' },
  { id: 'bougies', name: 'Bougies' },
  { id: 'bijoux', name: 'Bijoux' },
  { id: 'orgonites', name: 'Orgonites' },
  { id: 'baguettes-magiques', name: 'Baguettes Magiques' },
];

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  longDescription: string;
  category: string;
  subcategory: string;
  stone: string;
  image: string;
  images: string[];
  inStock: boolean;
  featured: boolean;
  tags: string[];
}

const emptyProduct: Omit<Product, 'id' | 'slug'> = {
  name: '',
  price: 0,
  description: '',
  longDescription: '',
  category: 'cristaux',
  subcategory: '',
  stone: '',
  image: '',
  images: [],
  inStock: true,
  featured: false,
  tags: [],
};

export default function ProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id' | 'slug'>>(emptyProduct);
  const [tagsInput, setTagsInput] = useState('');
  const [imagesInput, setImagesInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  function fetchProducts() {
    setLoading(true);
    fetch('/api/admin/products')
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }

  function openCreate() {
    setEditingProduct(null);
    setForm(emptyProduct);
    setTagsInput('');
    setImagesInput('');
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: product.price,
      description: product.description,
      longDescription: product.longDescription,
      category: product.category,
      subcategory: product.subcategory || '',
      stone: product.stone || '',
      image: product.image,
      images: product.images,
      inStock: product.inStock,
      featured: product.featured,
      tags: product.tags,
    });
    setTagsInput(product.tags.join(', '));
    setImagesInput(product.images.join('\n'));
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const images = imagesInput
      .split('\n')
      .map((i) => i.trim())
      .filter(Boolean);

    const payload = { ...form, tags, images };

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchProducts();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      // silently fail
    }
  }

  async function toggleStock(product: Product) {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !product.inStock }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, inStock: !p.inStock } : p))
        );
      }
    } catch {
      // silently fail
    }
  }

  async function toggleFeatured(product: Product) {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !product.featured }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, featured: !p.featured } : p))
        );
      }
    } catch {
      // silently fail
    }
  }

  const filtered = products
    .filter((p) => filterCategory === 'all' || p.category === filterCategory)
    .filter(
      (p) =>
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );

  const categoryName = (id: string) =>
    CATEGORIES.find((c) => c.id === id)?.name || id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Produits
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({products.length})
          </span>
        </h1>
        <button
          onClick={openCreate}
          className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Nouveau produit
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 w-64"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          <option value="all">Toutes les categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Product table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Produit</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Categorie</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Prix</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">Stock</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">Vedette</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((product) => (
              <tr
                key={product.id}
                className={`hover:bg-gray-50 transition-colors ${!product.inStock ? 'opacity-50' : ''}`}
              >
                {/* Image */}
                <td className="px-4 py-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized={product.image.includes('supabase.co')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        ?
                      </div>
                    )}
                  </div>
                </td>

                {/* Name + description */}
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                    {product.description}
                  </p>
                </td>

                {/* Category */}
                <td className="px-4 py-3">
                  <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
                    {categoryName(product.category)}
                  </span>
                </td>

                {/* Price */}
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {product.price.toFixed(2)} $
                </td>

                {/* Stock toggle */}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleStock(product)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      product.inStock ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        product.inStock ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>

                {/* Featured toggle */}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleFeatured(product)}
                    className={`text-lg transition-colors ${
                      product.featured ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                    }`}
                    title={product.featured ? 'Retirer des vedettes' : 'Mettre en vedette'}
                  >
                    {product.featured ? '\u2605' : '\u2606'}
                  </button>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="text-xs text-gray-500 hover:text-violet-600 font-medium"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-xs text-gray-500 hover:text-red-600 font-medium"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                  Aucun produit trouve.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              {/* Category + Subcategory + Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categorie
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Subcategory — only shown if category has subcategories */}
              {categorySubcategories[form.category as keyof typeof categorySubcategories]?.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type / Forme
                    </label>
                    <select
                      value={form.subcategory}
                      onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    >
                      <option value="">— Aucun —</option>
                      {categorySubcategories[form.category as keyof typeof categorySubcategories]?.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.category === 'cristaux' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de pierre
                      </label>
                      <select
                        value={form.stone}
                        onChange={(e) => setForm({ ...form, stone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      >
                        <option value="">— Aucune —</option>
                        {stoneNames.map((stone) => (
                          <option key={stone.id} value={stone.id}>
                            {stone.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Description courte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description courte
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                />
              </div>

              {/* Description longue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description longue
                </label>
                <textarea
                  rows={4}
                  value={form.longDescription}
                  onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                />
              </div>

              {/* Image principale */}
              <ImageUploader
                label="Image principale"
                value={form.image}
                onChange={(url) => setForm({ ...form, image: typeof url === 'string' ? url : url[0] || '' })}
                folder={form.category || 'general'}
              />

              {/* Images supplementaires */}
              <ImageUploader
                label="Images supplementaires"
                value={imagesInput ? imagesInput.split('\n').filter(Boolean) : []}
                onChange={(urls) => {
                  const arr = Array.isArray(urls) ? urls : [urls];
                  setImagesInput(arr.join('\n'));
                }}
                multiple
                folder={form.category || 'general'}
              />

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (separes par des virgules)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="protection, cristal, meditation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-700">En stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-700">Produit vedette</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
