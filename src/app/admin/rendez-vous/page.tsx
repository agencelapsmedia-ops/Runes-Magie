'use client';

import { useEffect, useState, useMemo } from 'react';

interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  serviceEmoji: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
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

export default function RendezVousPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  function mapAppointment(a: Record<string, unknown>): Appointment {
    const service = a.service as Record<string, unknown> | undefined;
    return {
      id: a.id as string,
      clientName: a.clientName as string,
      clientEmail: a.clientEmail as string,
      clientPhone: (a.clientPhone as string) || '',
      serviceName: (service?.name as string) || 'Service inconnu',
      serviceEmoji: (service?.emoji as string) || '✨',
      date: a.date as string,
      time: a.startTime as string,
      duration: (service?.durationMinutes as number) || 60,
      status: a.status as Appointment['status'],
      price: (service?.price as number) || 0,
    };
  }

  function fetchAppointments() {
    setLoading(true);
    fetch('/api/admin/appointments')
      .then((res) => res.json())
      .then((data) => {
        const raw = data.appointments || data || [];
        setAppointments(raw.map(mapAppointment));
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchesSearch =
        !search ||
        a.clientName.toLowerCase().includes(search.toLowerCase()) ||
        a.clientEmail.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: newStatus as Appointment['status'] } : a
          )
        );
      }
    } catch {
      // silently fail
    }
  }

  function exportCSV() {
    const header = 'Date,Heure,Client,Email,Service,Statut,Prix\n';
    const rows = filtered
      .map(
        (a) =>
          `${a.date},${a.time},"${a.clientName}","${a.clientEmail}","${a.serviceName}",${statusLabels[a.status] || a.status},${a.price}`
      )
      .join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rendez-vous-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rendez-vous</h1>
        <button
          onClick={exportCSV}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirme</option>
          <option value="completed">Termine</option>
          <option value="cancelled">Annule</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Heure</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Aucun rendez-vous trouve.
                  </td>
                </tr>
              ) : (
                filtered.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">
                      {new Date(appt.date).toLocaleDateString('fr-CA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{appt.time}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{appt.clientName}</p>
                        <p className="text-xs text-gray-500">{appt.clientEmail}</p>
                        {appt.clientPhone && (
                          <a href={`tel:${appt.clientPhone}`} className="text-xs text-violet-600 hover:text-violet-800 hover:underline">
                            &#9742; {appt.clientPhone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <span className="mr-1">{appt.serviceEmoji}</span>
                      {appt.serviceName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          statusColors[appt.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[appt.status] || appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(appt.id, 'confirmed')}
                            className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-md font-medium transition-colors"
                          >
                            Confirmer
                          </button>
                        )}
                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                          <button
                            onClick={() => updateStatus(appt.id, 'completed')}
                            className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-md font-medium transition-colors"
                          >
                            Completer
                          </button>
                        )}
                        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                          <button
                            onClick={() => updateStatus(appt.id, 'cancelled')}
                            className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1 rounded-md font-medium transition-colors"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
