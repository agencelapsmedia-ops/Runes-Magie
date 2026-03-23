'use client';

import { useEffect, useState, useCallback } from 'react';

interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  service: { name: string; emoji: string; colorHex: string };
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

export default function RendezVousPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);

    const res = await fetch(`/api/admin/appointments?${params}`);
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const exportCsv = () => {
    const header = 'Date,Heure,Client,Email,Service,Statut\n';
    const rows = appointments.map((a) =>
      `${a.date.split('T')[0]},${a.startTime},${a.clientName},${a.clientEmail},${a.service.name},${a.status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rendez-vous-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rendez-vous</h1>
        <button
          onClick={exportCsv}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou courriel..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-violet-500 outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmee</option>
          <option value="completed">Completee</option>
          <option value="cancelled">Annulee</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucun rendez-vous</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Heure</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Service</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-900">
                    {new Date(apt.date).toLocaleDateString('fr-CA')}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{apt.startTime}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{apt.clientName}</div>
                    <div className="text-xs text-gray-500">{apt.clientEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      <span>{apt.service.emoji}</span>
                      <span className="text-gray-700">{apt.service.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[apt.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[apt.status] || apt.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {apt.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(apt.id, 'confirmed')}
                          className="px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        >
                          Confirmer
                        </button>
                      )}
                      {(apt.status === 'confirmed' || apt.status === 'pending') && (
                        <>
                          <button
                            onClick={() => updateStatus(apt.id, 'completed')}
                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            Completer
                          </button>
                          <button
                            onClick={() => updateStatus(apt.id, 'cancelled')}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            Annuler
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
