'use client';

import { useEffect, useState, useCallback } from 'react';

interface BookingService {
  id: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  price: number | null;
  colorHex: string;
  emoji: string;
  isActive: boolean;
  maxPerSlot: number;
}

const DURATIONS = [30, 45, 60, 75, 90, 120];

export default function AdminServicesPage() {
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BookingService | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/services');
    if (res.ok) setServices(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    load();
  };

  const handleSave = async (data: Partial<BookingService>) => {
    if (editing) {
      await fetch(`/api/admin/services/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
        >
          + Nouveau service
        </button>
      </div>

      {/* Service Form Modal */}
      {showForm && (
        <ServiceForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Services Grid */}
      {loading ? (
        <p className="text-gray-400 text-sm">Chargement...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl border p-5 transition-opacity ${
                service.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{service.emoji}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.isActive}
                    onChange={(e) => toggleActive(service.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-violet-300 rounded-full peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{service.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <span>{service.durationMinutes} min</span>
                {service.price && (
                  <>
                    <span>|</span>
                    <span>{service.price.toFixed(2).replace('.', ',')} $</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: service.colorHex }}
                />
                <button
                  onClick={() => { setEditing(service); setShowForm(true); }}
                  className="text-xs text-violet-600 hover:text-violet-700"
                >
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceForm({
  initial,
  onSave,
  onClose,
}: {
  initial: BookingService | null;
  onSave: (data: Partial<BookingService>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [emoji, setEmoji] = useState(initial?.emoji || '*');
  const [description, setDescription] = useState(initial?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes || 60);
  const [bufferMinutes, setBufferMinutes] = useState(initial?.bufferMinutes || 15);
  const [price, setPrice] = useState(initial?.price?.toString() || '');
  const [colorHex, setColorHex] = useState(initial?.colorHex || '#6B3FA0');
  const [maxPerSlot, setMaxPerSlot] = useState(initial?.maxPerSlot || 1);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {initial ? 'Modifier le service' : 'Nouveau service'}
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Emoji</label>
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 text-center text-xl" />
            </div>
            <div className="col-span-3">
              <label className="text-xs font-medium text-gray-600">Nom</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Duree (min)</label>
              <select value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
                {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Buffer (min)</label>
              <input type="number" value={bufferMinutes} onChange={(e) => setBufferMinutes(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Prix ($)</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Optionnel" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Couleur</label>
              <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="w-full h-[38px] border border-gray-300 rounded-lg cursor-pointer" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Max/creneau</label>
              <input type="number" min={1} value={maxPerSlot} onChange={(e) => setMaxPerSlot(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button
            onClick={() => onSave({
              name, emoji, description, durationMinutes, bufferMinutes,
              price: price ? parseFloat(price) : null,
              colorHex, maxPerSlot,
            })}
            disabled={!name || !description}
            className="flex-1 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {initial ? 'Enregistrer' : 'Creer'}
          </button>
        </div>
      </div>
    </div>
  );
}
