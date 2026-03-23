'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardData {
  todayCount: number;
  weekCount: number;
  pendingCount: number;
  weekRevenue: number;
  upcoming: Array<{
    id: string;
    clientName: string;
    date: string;
    startTime: string;
    status: string;
    service: { name: string; emoji: string; colorHex: string };
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  cancelled: 'Annulee',
  completed: 'Completee',
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      const res = await fetch(`/api/admin/appointments?from=${today}&to=${weekEndStr}`);
      if (!res.ok) return;
      const appointments = await res.json();

      const todayApps = appointments.filter(
        (a: { date: string }) => a.date.split('T')[0] === today
      );
      const pending = appointments.filter(
        (a: { status: string }) => a.status === 'pending'
      );
      const revenue = appointments
        .filter((a: { status: string }) => a.status !== 'cancelled')
        .reduce(
          (sum: number, a: { service: { price?: number } }) => sum + (a.service?.price || 0),
          0
        );

      const upcoming = appointments
        .filter((a: { status: string }) => a.status !== 'cancelled')
        .sort((a: { date: string; startTime: string }, b: { date: string; startTime: string }) =>
          `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)
        )
        .slice(0, 5);

      setData({
        todayCount: todayApps.length,
        weekCount: appointments.filter((a: { status: string }) => a.status !== 'cancelled').length,
        pendingCount: pending.length,
        weekRevenue: revenue,
        upcoming,
      });
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Aujourd'hui"
          value={data?.todayCount ?? '-'}
          sub="rendez-vous"
          color="violet"
        />
        <StatCard
          label="Cette semaine"
          value={data?.weekCount ?? '-'}
          sub="seances"
          color="blue"
        />
        <StatCard
          label="En attente"
          value={data?.pendingCount ?? '-'}
          sub="a confirmer"
          color="amber"
          alert={!!data && data.pendingCount > 0}
        />
        <StatCard
          label="Revenus (semaine)"
          value={data ? `${data.weekRevenue.toFixed(0)} $` : '-'}
          sub="potentiels"
          color="emerald"
        />
      </div>

      {/* Upcoming appointments */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Prochains rendez-vous</h2>
          <Link
            href="/admin/rendez-vous"
            className="text-sm text-violet-600 hover:text-violet-700"
          >
            Voir tout &rarr;
          </Link>
        </div>

        {!data ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : data.upcoming.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Aucun rendez-vous a venir
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.upcoming.map((apt) => (
              <div key={apt.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${apt.service.colorHex}15` }}
                >
                  {apt.service.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {apt.clientName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {apt.service.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">
                    {new Date(apt.date).toLocaleDateString('fr-CA')}
                  </p>
                  <p className="text-xs text-gray-500">{apt.startTime}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[apt.status] || 'bg-gray-100 text-gray-600'}`}
                >
                  {STATUS_LABELS[apt.status] || apt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  alert,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  alert?: boolean;
}) {
  const bgColors: Record<string, string> = {
    violet: 'bg-violet-50 border-violet-200',
    blue: 'bg-blue-50 border-blue-200',
    amber: 'bg-amber-50 border-amber-200',
    emerald: 'bg-emerald-50 border-emerald-200',
  };
  const textColors: Record<string, string> = {
    violet: 'text-violet-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
  };

  return (
    <div className={`rounded-xl border p-5 ${bgColors[color] || 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        {alert && (
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        )}
      </div>
      <p className={`text-3xl font-bold ${textColors[color] || 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
