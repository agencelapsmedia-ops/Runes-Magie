'use client';

import { useEffect, useState, useCallback } from 'react';

interface Rule {
  id: string;
  serviceId: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface Exception {
  id: string;
  date: string;
  isOpen: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function DisponibilitesPage() {
  const [tab, setTab] = useState<'rules' | 'exceptions' | 'preview'>('rules');
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRules = useCallback(async () => {
    const res = await fetch('/api/admin/availability/rules');
    if (res.ok) setRules(await res.json());
  }, []);

  const loadExceptions = useCallback(async () => {
    const res = await fetch('/api/admin/availability/exceptions');
    if (res.ok) setExceptions(await res.json());
  }, []);

  useEffect(() => {
    Promise.all([loadRules(), loadExceptions()]).then(() => setLoading(false));
  }, [loadRules, loadExceptions]);

  const addRule = async (dayOfWeek: number) => {
    await fetch('/api/admin/availability/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayOfWeek, startTime: '10:00', endTime: '17:00' }),
    });
    loadRules();
  };

  const deleteRule = async (id: string) => {
    await fetch(`/api/admin/availability/rules/${id}`, { method: 'DELETE' });
    loadRules();
  };

  const updateRule = async (id: string, data: Partial<Rule>) => {
    await fetch(`/api/admin/availability/rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    loadRules();
  };

  const addException = async (date: string, isOpen: boolean, startTime?: string, endTime?: string, reason?: string) => {
    await fetch('/api/admin/availability/exceptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, isOpen, startTime, endTime, reason }),
    });
    loadExceptions();
  };

  const deleteException = async (id: string) => {
    await fetch(`/api/admin/availability/exceptions/${id}`, { method: 'DELETE' });
    loadExceptions();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Disponibilites</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {(['rules', 'exceptions', 'preview'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'rules' ? 'Horaires' : t === 'exceptions' ? 'Exceptions' : 'Apercu'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Chargement...</p>
      ) : tab === 'rules' ? (
        <RulesTab
          rules={rules}
          onAdd={addRule}
          onDelete={deleteRule}
          onUpdate={updateRule}
        />
      ) : tab === 'exceptions' ? (
        <ExceptionsTab
          exceptions={exceptions}
          onAdd={addException}
          onDelete={deleteException}
        />
      ) : (
        <PreviewTab />
      )}
    </div>
  );
}

function RulesTab({
  rules,
  onAdd,
  onDelete,
  onUpdate,
}: {
  rules: Rule[];
  onAdd: (day: number) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Rule>) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {DAYS.map((name, dayIndex) => {
        const dayRules = rules.filter((r) => r.dayOfWeek === dayIndex);
        const isOpen = dayRules.length > 0;

        return (
          <div key={dayIndex} className={`bg-white rounded-xl border p-4 ${isOpen ? 'border-gray-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold text-sm ${isOpen ? 'text-gray-900' : 'text-gray-400'}`}>
                {name}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                {isOpen ? 'Ouvert' : 'Ferme'}
              </span>
            </div>

            <div className="space-y-2">
              {dayRules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={rule.startTime}
                    onChange={(e) => onUpdate(rule.id, { startTime: e.target.value })}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs text-gray-900"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="time"
                    value={rule.endTime}
                    onChange={(e) => onUpdate(rule.id, { endTime: e.target.value })}
                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs text-gray-900"
                  />
                  <button
                    onClick={() => onDelete(rule.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => onAdd(dayIndex)}
              className="mt-3 text-xs text-violet-600 hover:text-violet-700"
            >
              + Ajouter une plage
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ExceptionsTab({
  exceptions,
  onAdd,
  onDelete,
}: {
  exceptions: Exception[];
  onAdd: (date: string, isOpen: boolean, startTime?: string, endTime?: string, reason?: string) => void;
  onDelete: (id: string) => void;
}) {
  const [date, setDate] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('17:00');
  const [reason, setReason] = useState('');

  const handleAdd = () => {
    if (!date) return;
    onAdd(date, isOpen, isOpen ? startTime : undefined, isOpen ? endTime : undefined, reason || undefined);
    setDate('');
    setReason('');
  };

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Ajouter une exception</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Type</label>
            <select value={isOpen ? 'open' : 'closed'} onChange={(e) => setIsOpen(e.target.value === 'open')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
              <option value="closed">Journee fermee</option>
              <option value="open">Horaires speciaux</option>
            </select>
          </div>
          {isOpen && (
            <>
              <div>
                <label className="text-xs text-gray-500">De</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
              </div>
              <div>
                <label className="text-xs text-gray-500">A</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
              </div>
            </>
          )}
        </div>
        <div className="flex gap-3 mt-3">
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Raison (optionnel)" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
          <button onClick={handleAdd} disabled={!date} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
            Ajouter
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Exceptions a venir</h3>
        </div>
        {exceptions.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm">Aucune exception</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {exceptions.map((exc) => (
              <div key={exc.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-900 font-medium">
                    {new Date(exc.date).toLocaleDateString('fr-CA')}
                  </span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${exc.isOpen ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {exc.isOpen ? `${exc.startTime} - ${exc.endTime}` : 'Ferme'}
                  </span>
                  {exc.reason && <span className="ml-2 text-xs text-gray-500">{exc.reason}</span>}
                </div>
                <button onClick={() => onDelete(exc.id)} className="text-red-400 hover:text-red-600 text-sm">
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewTab() {
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/public/services').then((r) => r.json()).then(setServices);
  }, []);

  const preview = async () => {
    if (!selectedService || !date) return;
    setLoading(true);
    const res = await fetch(`/api/public/slots?serviceId=${selectedService}&date=${date}`);
    setSlots(await res.json());
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Simuler les creneaux</h3>
        <div className="flex gap-3">
          <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
            <option value="">Choisir un service</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
          <button onClick={preview} disabled={!selectedService || !date} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
            Voir
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-400 text-sm">Chargement...</p>}
      {slots.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <span
                key={slot.time}
                className={`px-3 py-1.5 rounded text-sm font-mono ${
                  slot.available
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-50 text-red-400 line-through'
                }`}
              >
                {slot.time}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
