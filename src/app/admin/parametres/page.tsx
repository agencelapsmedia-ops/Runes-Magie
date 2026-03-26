'use client';

import { useEffect, useState } from 'react';

interface BookingSettings {
  timezone: string;
  contactEmail: string;
  bookingAdvanceDays: number;
  bookingMinHoursBefore: number;
  cancellationHoursBefore: number;
  notifyOnNewBooking: boolean;
  notifyOnCancellation: boolean;
  notifyOnReminder: boolean;
  googleCalendarConnected: boolean;
}

const defaultSettings: BookingSettings = {
  timezone: 'America/Toronto',
  contactEmail: '',
  bookingAdvanceDays: 30,
  bookingMinHoursBefore: 24,
  cancellationHoursBefore: 24,
  notifyOnNewBooking: true,
  notifyOnCancellation: true,
  notifyOnReminder: true,
  googleCalendarConnected: false,
};

export default function ParametresPage() {
  const [settings, setSettings] = useState<BookingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/booking-settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings({ ...defaultSettings, ...data });
      })
      .catch(() => setSettings(defaultSettings))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/booking-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Parametres</h1>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600 font-medium">
              Enregistre!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* General */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuseau horaire
              </label>
              <select
                value={settings.timezone}
                onChange={(e) =>
                  setSettings({ ...settings, timezone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="America/Toronto">America/Toronto (EST)</option>
                <option value="America/Montreal">America/Montreal (EST)</option>
                <option value="America/Vancouver">America/Vancouver (PST)</option>
                <option value="America/Winnipeg">America/Winnipeg (CST)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de contact
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) =>
                  setSettings({ ...settings, contactEmail: e.target.value })
                }
                placeholder="contact@runesetmagie.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>
        </section>

        {/* Booking rules */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Regles de reservation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jours a l&apos;avance (max)
              </label>
              <input
                type="number"
                min={1}
                value={settings.bookingAdvanceDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bookingAdvanceDays: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Nombre de jours maximum pour reserver a l&apos;avance
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heures minimum avant RDV
              </label>
              <input
                type="number"
                min={0}
                value={settings.bookingMinHoursBefore}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bookingMinHoursBefore: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Delai minimum entre la reservation et le rendez-vous
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heures avant pour annuler
              </label>
              <input
                type="number"
                min={0}
                value={settings.cancellationHoursBefore}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    cancellationHoursBefore: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Delai minimum pour annuler un rendez-vous
              </p>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Nouvelle reservation
                </p>
                <p className="text-xs text-gray-500">
                  Recevoir un email lors d&apos;une nouvelle reservation
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    notifyOnNewBooking: !settings.notifyOnNewBooking,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifyOnNewBooking ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifyOnNewBooking ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Annulation
                </p>
                <p className="text-xs text-gray-500">
                  Recevoir un email lors d&apos;une annulation
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    notifyOnCancellation: !settings.notifyOnCancellation,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifyOnCancellation ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifyOnCancellation ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Rappels
                </p>
                <p className="text-xs text-gray-500">
                  Envoyer des rappels aux clients avant leur rendez-vous
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    notifyOnReminder: !settings.notifyOnReminder,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifyOnReminder ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifyOnReminder ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Google Calendar */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Google Calendar
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {settings.googleCalendarConnected
                  ? 'Google Calendar est connecte.'
                  : 'Synchronisez vos rendez-vous avec Google Calendar.'}
              </p>
              {settings.googleCalendarConnected && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  Connecte
                </p>
              )}
            </div>
            <button
              onClick={() => {
                if (settings.googleCalendarConnected) {
                  setSettings({ ...settings, googleCalendarConnected: false });
                } else {
                  window.location.href = '/api/admin/google-calendar/connect';
                }
              }}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                settings.googleCalendarConnected
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : 'bg-violet-600 text-white hover:bg-violet-700'
              }`}
            >
              {settings.googleCalendarConnected ? 'Deconnecter' : 'Connecter'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
