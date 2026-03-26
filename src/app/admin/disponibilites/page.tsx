'use client';

import { useEffect, useState } from 'react';

interface Rule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface Exception {
  id?: string;
  date: string;
  type: 'closed' | 'special';
  startTime?: string;
  endTime?: string;
  label?: string;
}

interface Slot {
  time: string;
  available: boolean;
}

const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function DisponibilitesPage() {
  const [activeTab, setActiveTab] = useState<'horaires' | 'exceptions' | 'apercu'>('horaires');
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [loadingExceptions, setLoadingExceptions] = useState(true);
  const [saving, setSaving] = useState(false);

  // Exception form
  const [excDate, setExcDate] = useState('');
  const [excType, setExcType] = useState<'closed' | 'special'>('closed');
  const [excStart, setExcStart] = useState('09:00');
  const [excEnd, setExcEnd] = useState('17:00');
  const [excLabel, setExcLabel] = useState('');

  // Preview
  const [previewService, setPreviewService] = useState('');
  const [previewDate, setPreviewDate] = useState('');
  const [previewSlots, setPreviewSlots] = useState<Slot[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchRules();
    fetchExceptions();
    fetch('/api/admin/services')
      .then((res) => res.json())
      .then((data) => setServices(data.services || data || []))
      .catch(() => setServices([]));
  }, []);

  function fetchRules() {
    setLoadingRules(true);
    fetch('/api/admin/availability/rules')
      .then((res) => res.json())
      .then((data) => {
        const raw = data.rules || data || [];
        // Ensure all 7 days have an entry, map isActive -> enabled
        const full: Rule[] = [];
        for (let i = 0; i < 7; i++) {
          const existing = raw.find((r: Record<string, unknown>) => r.dayOfWeek === i);
          if (existing) {
            full.push({
              id: existing.id as string,
              dayOfWeek: existing.dayOfWeek as number,
              startTime: (existing.startTime as string) || '09:00',
              endTime: (existing.endTime as string) || '17:00',
              enabled: (existing.isActive ?? existing.enabled ?? true) as boolean,
            });
          } else {
            full.push({ dayOfWeek: i, startTime: '09:00', endTime: '17:00', enabled: false });
          }
        }
        setRules(full);
      })
      .catch(() => {
        const defaults: Rule[] = [];
        for (let i = 0; i < 7; i++) {
          defaults.push({
            dayOfWeek: i,
            startTime: '09:00',
            endTime: '17:00',
            enabled: i < 5,
          });
        }
        setRules(defaults);
      })
      .finally(() => setLoadingRules(false));
  }

  function fetchExceptions() {
    setLoadingExceptions(true);
    fetch('/api/admin/availability/exceptions')
      .then((res) => res.json())
      .then((data) => setExceptions(data.exceptions || data || []))
      .catch(() => setExceptions([]))
      .finally(() => setLoadingExceptions(false));
  }

  async function saveRules() {
    setSaving(true);
    try {
      await fetch('/api/admin/availability/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function addException(e: React.FormEvent) {
    e.preventDefault();
    if (!excDate) return;

    const exc: Exception = {
      date: excDate,
      type: excType,
      label: excLabel || undefined,
      ...(excType === 'special' ? { startTime: excStart, endTime: excEnd } : {}),
    };

    try {
      const res = await fetch('/api/admin/availability/exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exc),
      });
      if (res.ok) {
        fetchExceptions();
        setExcDate('');
        setExcLabel('');
      }
    } catch {
      // silently fail
    }
  }

  async function deleteException(id: string) {
    try {
      const res = await fetch(`/api/admin/availability/exceptions/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExceptions((prev) => prev.filter((ex) => ex.id !== id));
      }
    } catch {
      // silently fail
    }
  }

  async function loadPreview() {
    if (!previewService || !previewDate) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(
        `/api/admin/availability/rules?preview=true&serviceId=${previewService}&date=${previewDate}`
      );
      const data = await res.json();
      setPreviewSlots(data.slots || []);
    } catch {
      setPreviewSlots([]);
    } finally {
      setLoadingPreview(false);
    }
  }

  function updateRule(dayOfWeek: number, field: keyof Rule, value: string | boolean) {
    setRules((prev) =>
      prev.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, [field]: value } : r))
    );
  }

  const tabs = [
    { key: 'horaires' as const, label: 'Horaires' },
    { key: 'exceptions' as const, label: 'Exceptions' },
    { key: 'apercu' as const, label: 'Apercu' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Disponibilites</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Horaires tab */}
      {activeTab === 'horaires' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {loadingRules ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.dayOfWeek}
                    className="flex items-center gap-4 py-2"
                  >
                    {/* Toggle */}
                    <button
                      onClick={() =>
                        updateRule(rule.dayOfWeek, 'enabled', !rule.enabled)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                        rule.enabled ? 'bg-violet-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          rule.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Day name */}
                    <span className="w-24 text-sm font-medium text-gray-900">
                      {dayNames[rule.dayOfWeek]}
                    </span>

                    {/* Time inputs */}
                    {rule.enabled ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={rule.startTime}
                          onChange={(e) =>
                            updateRule(rule.dayOfWeek, 'startTime', e.target.value)
                          }
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        />
                        <span className="text-gray-400 text-sm">a</span>
                        <input
                          type="time"
                          value={rule.endTime}
                          onChange={(e) =>
                            updateRule(rule.dayOfWeek, 'endTime', e.target.value)
                          }
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Ferme</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={saveRules}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les horaires'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Exceptions tab */}
      {activeTab === 'exceptions' && (
        <div className="space-y-6">
          {/* Add exception form */}
          <form
            onSubmit={addException}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Ajouter une exception
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={excDate}
                  onChange={(e) => setExcDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Type
                </label>
                <select
                  value={excType}
                  onChange={(e) => setExcType(e.target.value as 'closed' | 'special')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="closed">Ferme</option>
                  <option value="special">Horaires speciaux</option>
                </select>
              </div>
              {excType === 'special' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      De
                    </label>
                    <input
                      type="time"
                      value={excStart}
                      onChange={(e) => setExcStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      A
                    </label>
                    <input
                      type="time"
                      value={excEnd}
                      onChange={(e) => setExcEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </>
              )}
              <div className={excType === 'special' ? 'sm:col-span-2 lg:col-span-4' : ''}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Libelle (optionnel)
                </label>
                <input
                  type="text"
                  value={excLabel}
                  onChange={(e) => setExcLabel(e.target.value)}
                  placeholder="Ex: Jour ferie, Vacances..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Ajouter
              </button>
            </div>
          </form>

          {/* Exceptions list */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Exceptions configurees
              </h3>
            </div>
            {loadingExceptions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
              </div>
            ) : exceptions.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                Aucune exception configuree.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {exceptions.map((exc) => (
                  <li
                    key={exc.id || exc.date}
                    className="px-6 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          exc.type === 'closed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {exc.type === 'closed' ? 'Ferme' : 'Special'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(exc.date + 'T00:00:00').toLocaleDateString('fr-CA', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        {exc.type === 'special' && exc.startTime && exc.endTime && (
                          <p className="text-xs text-gray-500">
                            {exc.startTime} - {exc.endTime}
                          </p>
                        )}
                        {exc.label && (
                          <p className="text-xs text-gray-400">{exc.label}</p>
                        )}
                      </div>
                    </div>
                    {exc.id && (
                      <button
                        onClick={() => deleteException(exc.id!)}
                        className="text-xs text-gray-400 hover:text-red-600 font-medium"
                      >
                        Supprimer
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Apercu tab */}
      {activeTab === 'apercu' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Apercu des creneaux disponibles
          </h3>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Service
              </label>
              <select
                value={previewService}
                onChange={(e) => setPreviewService(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="">Selectionner un service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date
              </label>
              <input
                type="date"
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadPreview}
                disabled={!previewService || !previewDate || loadingPreview}
                className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingPreview ? 'Chargement...' : 'Voir les creneaux'}
              </button>
            </div>
          </div>

          {previewSlots.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {previewSlots.map((slot) => (
                <div
                  key={slot.time}
                  className={`text-center py-2 px-3 rounded-lg text-sm font-medium ${
                    slot.available
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {slot.time}
                </div>
              ))}
            </div>
          )}

          {previewSlots.length === 0 && previewService && previewDate && !loadingPreview && (
            <p className="text-sm text-gray-400 text-center py-4">
              Aucun creneau disponible pour cette date.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
