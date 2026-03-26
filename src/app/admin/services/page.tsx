'use client';

import { useEffect, useState } from 'react';

interface Service {
  id: string;
  emoji: string;
  name: string;
  description: string;
  duration: number;
  buffer: number;
  price: number;
  color: string;
  maxPerSlot: number;
  active: boolean;
}

const emptyService: Omit<Service, 'id'> = {
  emoji: '✨',
  name: '',
  description: '',
  duration: 60,
  buffer: 15,
  price: 0,
  color: '#7c3aed',
  maxPerSlot: 1,
  active: true,
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<Omit<Service, 'id'>>(emptyService);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  function mapFromApi(s: Record<string, unknown>): Service {
    return {
      id: s.id as string,
      emoji: (s.emoji as string) || '✨',
      name: s.name as string,
      description: s.description as string,
      duration: (s.durationMinutes ?? s.duration) as number,
      buffer: (s.bufferMinutes ?? s.buffer) as number,
      price: (s.price ?? 0) as number,
      color: (s.colorHex ?? s.color ?? '#7c3aed') as string,
      maxPerSlot: (s.maxPerSlot ?? 1) as number,
      active: (s.isActive ?? s.active ?? false) as boolean,
    };
  }

  function mapToApi(f: Omit<Service, 'id'>) {
    return {
      emoji: f.emoji,
      name: f.name,
      description: f.description,
      durationMinutes: f.duration,
      bufferMinutes: f.buffer,
      price: f.price,
      colorHex: f.color,
      maxPerSlot: f.maxPerSlot,
      isActive: f.active,
    };
  }

  function fetchServices() {
    setLoading(true);
    fetch('/api/admin/services')
      .then((res) => res.json())
      .then((data) => {
        const list = data.services || data || [];
        setServices(list.map(mapFromApi));
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }

  function openCreate() {
    setEditingService(null);
    setForm(emptyService);
    setModalOpen(true);
  }

  function openEdit(service: Service) {
    setEditingService(service);
    setForm({
      emoji: service.emoji,
      name: service.name,
      description: service.description,
      duration: service.duration,
      buffer: service.buffer,
      price: service.price,
      color: service.color,
      maxPerSlot: service.maxPerSlot,
      active: service.active,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : '/api/admin/services';
      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapToApi(form)),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchServices();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce service ?')) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // silently fail
    }
  }

  async function toggleActive(service: Service) {
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.active }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, active: !s.active } : s))
        );
      }
    } catch {
      // silently fail
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <button
          onClick={openCreate}
          className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Nouveau service
        </button>
      </div>

      {/* Service cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className={`bg-white rounded-xl border border-gray-200 p-5 transition-opacity ${
              !service.active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{service.emoji}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-xs text-gray-500">
                    {service.duration} min &middot; {service.price.toFixed(2)} $
                  </p>
                </div>
              </div>
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: service.color }}
              />
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {service.description}
            </p>

            <div className="flex items-center justify-between">
              {/* Toggle active */}
              <button
                onClick={() => toggleActive(service)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  service.active ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    service.active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(service)}
                  className="text-xs text-gray-500 hover:text-violet-600 font-medium"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="text-xs text-gray-500 hover:text-red-600 font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 text-sm">
            Aucun service configure. Cliquez sur &quot;Nouveau service&quot; pour commencer.
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingService ? 'Modifier le service' : 'Nouveau service'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* Emoji */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emoji
                </label>
                <input
                  type="text"
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                />
              </div>

              {/* Duration + Buffer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duree (min)
                  </label>
                  <select
                    value={form.duration}
                    onChange={(e) =>
                      setForm({ ...form, duration: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={75}>75 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tampon (min)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.buffer}
                    onChange={(e) =>
                      setForm({ ...form, buffer: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Price + Color */}
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="h-9 w-9 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Max per slot */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max par creneau
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.maxPerSlot}
                  onChange={(e) =>
                    setForm({ ...form, maxPerSlot: parseInt(e.target.value) || 1 })
                  }
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
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
