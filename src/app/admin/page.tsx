'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  serviceEmoji: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  featured: boolean;
  image: string;
}

interface ReservationStats {
  todayCount: number;
  weekCount: number;
  pendingCount: number;
  weekRevenue: number;
}

interface BoutiqueStats {
  totalProducts: number;
  inStockCount: number;
  outOfStockCount: number;
  featuredCount: number;
  categoriesCount: number;
}

function computeReservationStats(appointments: Appointment[]): ReservationStats {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

  const todayCount = appointments.filter((a) => a.date === todayStr).length;
  const weekAppts = appointments.filter(
    (a) => a.date >= startOfWeekStr && a.date <= endOfWeekStr
  );
  const weekCount = weekAppts.length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const weekRevenue = weekAppts
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => sum + (a.price || 0), 0);

  return { todayCount, weekCount, pendingCount, weekRevenue };
}

function computeBoutiqueStats(products: Product[]): BoutiqueStats {
  const categories = new Set(products.map((p) => p.category));
  return {
    totalProducts: products.length,
    inStockCount: products.filter((p) => p.inStock).length,
    outOfStockCount: products.filter((p) => !p.inStock).length,
    featuredCount: products.filter((p) => p.featured).length,
    categoriesCount: categories.size,
  };
}

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirme',
  completed: 'Termine',
  cancelled: 'Annule',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/appointments')
        .then((res) => res.json())
        .then((data) => data.appointments || data || [])
        .catch(() => []),
      fetch('/api/admin/products')
        .then((res) => res.json())
        .then((data) => (Array.isArray(data) ? data : data.products || []))
        .catch(() => []),
    ]).then(([appts, prods]) => {
      setAppointments(appts);
      setProducts(prods);
      setLoading(false);
    });
  }, []);

  const resStats = computeReservationStats(appointments);
  const boutStats = computeBoutiqueStats(products);

  const upcoming = appointments
    .filter(
      (a) =>
        a.status !== 'cancelled' &&
        a.date >= new Date().toISOString().split('T')[0]
    )
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Banner de bienvenue mystique */}
      <div className="relative min-h-[280px] flex flex-col items-center justify-center overflow-hidden bg-[#0d0a1a] rounded-2xl p-10 text-center mb-8">
        {/* Etoiles animees */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {Array.from({ length: 50 }).map((_, i) => {
            const size = Math.random() * 2.5 + 1;
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            const duration = (Math.random() * 3 + 1.5).toFixed(1);
            const opacity = (Math.random() * 0.6 + 0.2).toFixed(2);
            const delay = (Math.random() * 4).toFixed(1);
            return (
              <div
                key={i}
                className="absolute rounded-full bg-white animate-[twinkle_var(--d)_ease-in-out_infinite_alternate]"
                style={{
                  width: size, height: size,
                  top: `${top}%`, left: `${left}%`,
                  '--d': `${duration}s`,
                  '--o': opacity,
                  animationDelay: `${delay}s`,
                  opacity: 0,
                } as React.CSSProperties}
              />
            );
          })}
        </div>

        {/* Lune */}
        <svg className="w-14 h-14 mb-5 animate-[float_4s_ease-in-out_infinite] drop-shadow-[0_0_18px_rgba(200,170,255,0.5)]" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="mg" cx="40%" cy="35%" r="55%">
              <stop offset="0%" stopColor="#e8d5ff"/>
              <stop offset="100%" stopColor="#8b5fc0"/>
            </radialGradient>
          </defs>
          <circle cx="30" cy="30" r="28" fill="url(#mg)"/>
          <circle cx="42" cy="20" r="20" fill="#0d0a1a"/>
        </svg>

        <p className="font-cinzel-decorative text-[11px] tracking-[0.35em] text-[#a78bca] uppercase mb-4 animate-[fadein_1.2s_ease_0.3s_forwards] opacity-0">
          Bienvenue dans ton sanctuaire
        </p>

        <p className="font-cormorant italic font-light text-[28px] leading-relaxed text-[#f0e8ff] max-w-[560px] mx-auto mb-5 animate-[fadein_1.4s_ease_0.7s_forwards] opacity-0" style={{ textShadow: '0 0 40px rgba(180,140,255,0.3)' }}>
          N&apos;oublie jamais ta <em className="text-[#c9a9f5]">beaute</em> et ta <em className="text-[#c9a9f5]">force</em>,<br/>je te vois.
        </p>

        <div className="flex items-center gap-2.5 animate-[fadein_1.6s_ease_1.2s_forwards] opacity-0">
          <div className="w-[60px] h-px bg-gradient-to-r from-transparent to-[#6b4fa0]" />
          <div className="w-1.5 h-1.5 bg-[#c9a9f5] rotate-45 shadow-[0_0_8px_rgba(200,170,255,0.8)]" />
          <div className="w-[60px] h-px bg-gradient-to-l from-transparent to-[#6b4fa0]" />
        </div>

        <style jsx>{`
          @keyframes twinkle {
            0% { opacity: 0; transform: scale(0.8); }
            100% { opacity: var(--o); transform: scale(1.2); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes fadein {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Tableau de bord</h1>

      {/* Two module cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ====== MODULE RESERVATION ====== */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-violet-500 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">&#128197;</span>
              <div>
                <h2 className="text-lg font-bold text-white">Reservations</h2>
                <p className="text-violet-200 text-xs">Gestion des rendez-vous</p>
              </div>
            </div>
            <Link
              href="/admin/rendez-vous"
              className="text-xs font-medium text-white/80 hover:text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors"
            >
              Voir tout
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            <div className="bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">Aujourd&apos;hui</p>
              <p className="text-2xl font-bold text-violet-700">{resStats.todayCount}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">Cette semaine</p>
              <p className="text-2xl font-bold text-blue-700">{resStats.weekCount}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{resStats.pendingCount}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">Revenus semaine</p>
              <p className="text-2xl font-bold text-green-600">
                {resStats.weekRevenue.toFixed(2)} $
              </p>
            </div>
          </div>

          {/* Upcoming list */}
          <div className="border-t border-gray-100">
            <div className="px-5 py-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Prochains rendez-vous
              </p>
            </div>
            {upcoming.length === 0 ? (
              <div className="px-5 py-6 text-center text-gray-400 text-sm">
                Aucun rendez-vous a venir.
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {upcoming.map((appt) => (
                  <li
                    key={appt.id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{appt.serviceEmoji}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appt.clientName}
                        </p>
                        <p className="text-xs text-gray-500">{appt.serviceName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          {new Date(appt.date).toLocaleDateString('fr-CA', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <p className="text-xs text-gray-500">{appt.time}</p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          statusColors[appt.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[appt.status] || appt.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick links */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
            <Link
              href="/admin/calendrier"
              className="text-xs text-violet-600 hover:text-violet-800 font-medium"
            >
              Calendrier
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/admin/services"
              className="text-xs text-violet-600 hover:text-violet-800 font-medium"
            >
              Services
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/admin/disponibilites"
              className="text-xs text-violet-600 hover:text-violet-800 font-medium"
            >
              Disponibilites
            </Link>
          </div>
        </div>

        {/* ====== MODULE BOUTIQUE ====== */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-500 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">&#128722;</span>
              <div>
                <h2 className="text-lg font-bold text-white">Boutique</h2>
                <p className="text-teal-200 text-xs">Gestion des produits</p>
              </div>
            </div>
            <Link
              href="/admin/produits"
              className="text-xs font-medium text-white/80 hover:text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors"
            >
              Gerer
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            <div className="bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">Total produits</p>
              <p className="text-2xl font-bold text-teal-700">{boutStats.totalProducts}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">En stock</p>
              <p className="text-2xl font-bold text-green-600">{boutStats.inStockCount}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">Rupture de stock</p>
              <p className="text-2xl font-bold text-red-500">{boutStats.outOfStockCount}</p>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs text-gray-500 mb-1">Produits vedettes</p>
              <p className="text-2xl font-bold text-yellow-600">{boutStats.featuredCount}</p>
            </div>
          </div>

          {/* Categories breakdown */}
          <div className="border-t border-gray-100">
            <div className="px-5 py-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Par categorie ({boutStats.categoriesCount})
              </p>
            </div>
            <ul className="divide-y divide-gray-50">
              {Object.entries(
                products.reduce<Record<string, { count: number; inStock: number }>>(
                  (acc, p) => {
                    if (!acc[p.category]) acc[p.category] = { count: 0, inStock: 0 };
                    acc[p.category].count++;
                    if (p.inStock) acc[p.category].inStock++;
                    return acc;
                  },
                  {}
                )
              )
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([category, info]) => (
                  <li
                    key={category}
                    className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-teal-500" />
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {category.replace('-', ' & ').replace('herbes encens', 'Herbes & Encens')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {info.count} produit{info.count > 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {info.inStock} en stock
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          {/* Quick links */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
            <Link
              href="/admin/produits"
              className="text-xs text-teal-600 hover:text-teal-800 font-medium"
            >
              Tous les produits
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/boutique"
              className="text-xs text-teal-600 hover:text-teal-800 font-medium"
            >
              Voir la boutique
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
