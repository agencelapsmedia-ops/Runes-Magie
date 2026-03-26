'use client';

import { useState, useMemo } from 'react';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import ProductCard from '@/components/boutique/ProductCard';
import Link from 'next/link';
import { products, categories, categorySubcategories, stoneNames, type Category } from '@/data/products';

type SortOption = 'name-asc' | 'price-asc' | 'price-desc';

export default function BoutiquePage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | 'all'>('all');
  const [activeStone, setActiveStone] = useState<string | 'all'>('all');
  const [sort, setSort] = useState<SortOption>('name-asc');

  // Get subcategories for the active category
  const subcategories = activeCategory !== 'all' ? categorySubcategories[activeCategory] : [];

  // Show stone filter only for "cristaux" category
  const showStoneFilter = activeCategory === 'cristaux';

  // Reset filters when category changes
  const handleCategoryChange = (cat: Category | 'all') => {
    setActiveCategory(cat);
    setActiveSubcategory('all');
    setActiveStone('all');
  };

  const filtered = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Subcategory filter (type/forme)
    if (activeSubcategory !== 'all') {
      result = result.filter((p) => p.subcategory === activeSubcategory);
    }

    // Stone name filter
    if (activeStone !== 'all') {
      result = result.filter((p) => p.stone === activeStone);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Sort
    switch (sort) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  }, [search, activeCategory, activeSubcategory, activeStone, sort]);

  return (
    <section className="px-4 py-12 md:py-20 max-w-7xl mx-auto">
      <SectionTitle
        title="La Boutique Enchant&eacute;e"
        subtitle="Objets magiques, cristaux, runes et tr&eacute;sors &eacute;sot&eacute;riques"
      />

      {/* ── Toolbar ────────────────────────────────── */}
      <div className="mt-10 flex flex-col gap-5">
        {/* Search + Sort row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            {/* Magnifying glass SVG */}
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchemin-vieilli/50"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx={11} cy={11} r={8} />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-2.5 rounded-sm
                bg-charbon-mystere border border-violet-royal/20
                text-parchemin placeholder:text-parchemin-vieilli/40
                focus:outline-none focus:border-or-ancien/50
                focus:shadow-[0_0_12px_rgba(201,168,76,0.15)]
                transition-all duration-300 text-sm font-philosopher"
            />
          </div>

          {/* Sort dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-4 py-2.5 rounded-sm
              bg-charbon-mystere border border-violet-royal/20
              text-parchemin text-sm font-philosopher
              focus:outline-none focus:border-or-ancien/50
              transition-all duration-300 cursor-pointer
              min-w-[180px]"
          >
            <option value="name-asc">Tri par : Nom A-Z</option>
            <option value="price-asc">Tri par : Prix croissant</option>
            <option value="price-desc">Tri par : Prix d&eacute;croissant</option>
          </select>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-violet-royal/30 scrollbar-track-transparent">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`shrink-0 px-4 py-1.5 rounded-sm text-xs font-cinzel uppercase tracking-wider
              border transition-all duration-300 cursor-pointer
              ${
                activeCategory === 'all'
                  ? 'bg-or-ancien/90 text-noir-nuit border-or-ancien'
                  : 'bg-charbon-mystere text-parchemin-vieilli border-violet-royal/20 hover:border-or-ancien/40'
              }`}
          >
            Tout
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-sm text-xs font-cinzel uppercase tracking-wider
                border transition-all duration-300 cursor-pointer
                ${
                  activeCategory === cat.id
                    ? 'bg-or-ancien/90 text-noir-nuit border-or-ancien'
                    : 'bg-charbon-mystere text-parchemin-vieilli border-violet-royal/20 hover:border-or-ancien/40'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Subcategory filters (type/forme) — shown when a category with subcategories is selected */}
        {subcategories.length > 0 && (
          <div>
            <p className="text-parchemin-vieilli/50 text-[0.6rem] font-philosopher uppercase tracking-wider mb-1.5">
              Filtrer par type / forme
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-violet-royal/30 scrollbar-track-transparent">
              <button
                type="button"
                onClick={() => setActiveSubcategory('all')}
                className={`shrink-0 px-3 py-1 rounded-full text-[0.65rem] font-philosopher
                  border transition-all duration-300 cursor-pointer
                  ${
                    activeSubcategory === 'all'
                      ? 'bg-violet-mystique/80 text-blanc-lune border-violet-mystique'
                      : 'bg-charbon-mystere/50 text-parchemin-vieilli/70 border-violet-royal/15 hover:border-violet-mystique/40'
                  }`}
              >
                Tous les types
              </button>
              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setActiveSubcategory(sub.id)}
                  className={`shrink-0 px-3 py-1 rounded-full text-[0.65rem] font-philosopher
                    border transition-all duration-300 cursor-pointer
                    ${
                      activeSubcategory === sub.id
                        ? 'bg-violet-mystique/80 text-blanc-lune border-violet-mystique'
                        : 'bg-charbon-mystere/50 text-parchemin-vieilli/70 border-violet-royal/15 hover:border-violet-mystique/40'
                    }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stone name filters — shown only for "Pierres et Cristaux" */}
        {showStoneFilter && (
          <div>
            <p className="text-parchemin-vieilli/50 text-[0.6rem] font-philosopher uppercase tracking-wider mb-1.5">
              Filtrer par pierre
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-violet-royal/30 scrollbar-track-transparent">
              <button
                type="button"
                onClick={() => setActiveStone('all')}
                className={`shrink-0 px-3 py-1 rounded-full text-[0.65rem] font-philosopher
                  border transition-all duration-300 cursor-pointer
                  ${
                    activeStone === 'all'
                      ? 'bg-or-ancien/80 text-noir-nuit border-or-ancien'
                      : 'bg-charbon-mystere/50 text-parchemin-vieilli/70 border-violet-royal/15 hover:border-or-ancien/40'
                  }`}
              >
                Toutes les pierres
              </button>
              {stoneNames.map((stone) => (
                <button
                  key={stone.id}
                  type="button"
                  onClick={() => setActiveStone(stone.id)}
                  className={`shrink-0 px-3 py-1 rounded-full text-[0.65rem] font-philosopher
                    border transition-all duration-300 cursor-pointer
                    ${
                      activeStone === stone.id
                        ? 'bg-or-ancien/80 text-noir-nuit border-or-ancien'
                        : 'bg-charbon-mystere/50 text-parchemin-vieilli/70 border-violet-royal/15 hover:border-or-ancien/40'
                    }`}
                >
                  {stone.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Results count ──────────────────────────── */}
      <p className="mt-6 text-parchemin-vieilli/60 text-sm font-philosopher">
        {filtered.length} produit{filtered.length !== 1 ? 's' : ''} trouv&eacute;{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* ── Product grid ───────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <Link key={product.id} href={`/boutique/${product.slug}`}>
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image}
                category={product.category}
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="text-5xl mb-4">&#x2728;</p>
          <p className="font-cinzel text-parchemin text-lg">
            Aucun produit trouv&eacute;
          </p>
          <p className="text-parchemin-vieilli/60 mt-2 font-philosopher">
            Essayez un autre terme de recherche ou une autre cat&eacute;gorie.
          </p>
        </div>
      )}

      <RuneDivider className="mt-16" />
    </section>
  );
}
