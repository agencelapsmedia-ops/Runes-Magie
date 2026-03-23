'use client';

import { useEffect, useState } from 'react';

export default function ParametresPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    fetch('/api/admin/booking-settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setGoogleConnected(!!data.google_access_token);
        setLoading(false);
      });
  }, []);

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    await fetch('/api/admin/booking-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const connectGoogle = async () => {
    const res = await fetch('/api/admin/google/auth-url');
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (loading) {
    return <p className="text-gray-400 text-sm">Chargement...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Parametres</h1>

      <div className="space-y-8">
        {/* General */}
        <Section title="Informations generales">
          <Field
            label="Fuseau horaire"
            value={settings.timezone || 'America/Toronto'}
            onChange={(v) => update('timezone', v)}
          />
          <Field
            label="Email de contact"
            value={settings.contact_email || ''}
            onChange={(v) => update('contact_email', v)}
          />
        </Section>

        {/* Booking rules */}
        <Section title="Regles de reservation">
          <Field
            label="Delai max a l'avance (jours)"
            value={settings.booking_advance_days || '60'}
            onChange={(v) => update('booking_advance_days', v)}
            type="number"
          />
          <Field
            label="Delai minimum avant RDV (heures)"
            value={settings.booking_min_hours_before || '2'}
            onChange={(v) => update('booking_min_hours_before', v)}
            type="number"
          />
          <Field
            label="Delai annulation client (heures)"
            value={settings.cancellation_hours_before || '24'}
            onChange={(v) => update('cancellation_hours_before', v)}
            type="number"
          />
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <Toggle
            label="Email de confirmation automatique"
            checked={settings.confirmation_email_enabled !== 'false'}
            onChange={(v) => update('confirmation_email_enabled', v.toString())}
          />
          <Toggle
            label="Rappel avant la seance"
            checked={settings.reminder_enabled !== 'false'}
            onChange={(v) => update('reminder_enabled', v.toString())}
          />
          <Field
            label="Rappel (heures avant)"
            value={settings.reminder_hours_before || '24'}
            onChange={(v) => update('reminder_hours_before', v)}
            type="number"
          />
        </Section>

        {/* Google Calendar */}
        <Section title="Google Calendar">
          <div className="flex items-center gap-3 mb-4">
            <span className={`w-2 h-2 rounded-full ${googleConnected ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-600">
              {googleConnected ? 'Connecte' : 'Non connecte'}
            </span>
          </div>
          <button
            onClick={connectGoogle}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
          >
            {googleConnected ? 'Reconnecter' : 'Connecter Google Calendar'}
          </button>
          {googleConnected && (
            <Field
              label="ID du calendrier"
              value={settings.google_calendar_id || 'primary'}
              onChange={(v) => update('google_calendar_id', v)}
            />
          )}
        </Section>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            className="px-6 py-2.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
          >
            Enregistrer
          </button>
          {saved && (
            <span className="text-sm text-emerald-600">Enregistre!</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-violet-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
      </div>
    </label>
  );
}
