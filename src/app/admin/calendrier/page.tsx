'use client';

import { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';

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
  status: string;
  price: number;
  color?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: Appointment;
}

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirme',
  completed: 'Termine',
  cancelled: 'Annule',
};

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
};

function toCalendarEvents(appointments: Appointment[]): CalendarEvent[] {
  return appointments.map((appt) => {
    const [hours, minutes] = appt.time.split(':').map(Number);
    const start = new Date(`${appt.date}T${appt.time}:00`);
    const end = new Date(start.getTime() + appt.duration * 60 * 1000);

    const color = appt.color || statusColors[appt.status] || '#7c3aed';

    return {
      id: appt.id,
      title: `${appt.serviceEmoji} ${appt.clientName}`,
      start: start.toISOString(),
      end: end.toISOString(),
      backgroundColor: color,
      borderColor: color,
      extendedProps: appt,
    };
  });
}

export default function CalendrierPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  function mapAppt(a: Record<string, unknown>): Appointment {
    const service = a.service as Record<string, unknown> | undefined;
    const dateStr = typeof a.date === 'string' ? a.date.split('T')[0] : '';
    return {
      id: a.id as string,
      clientName: a.clientName as string,
      clientEmail: a.clientEmail as string,
      clientPhone: (a.clientPhone as string) || '',
      serviceName: (service?.name as string) || '',
      serviceEmoji: (service?.emoji as string) || '✨',
      date: dateStr,
      time: a.startTime as string,
      duration: (service?.durationMinutes as number) || 60,
      status: a.status as string,
      price: (service?.price as number) || 0,
      color: (service?.colorHex as string) || undefined,
    };
  }

  useEffect(() => {
    fetch('/api/admin/appointments')
      .then((res) => res.json())
      .then((data) => {
        const raw = data.appointments || data || [];
        setAppointments(raw.map(mapAppt));
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const events = toCalendarEvents(appointments);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendrier</h1>

      <div className="flex gap-6">
        {/* Calendar */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={frLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            eventClick={(info) => {
              const appt = info.event.extendedProps as Appointment;
              setSelectedAppt(appt);
            }}
            height="auto"
            slotMinTime="08:00:00"
            slotMaxTime="21:00:00"
            allDaySlot={false}
            nowIndicator={true}
            eventDisplay="block"
          />
        </div>

        {/* Detail panel */}
        {selectedAppt && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Detail du rendez-vous
                </h3>
                <button
                  onClick={() => setSelectedAppt(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedAppt.clientName}
                  </p>
                  <p className="text-xs text-gray-500">{selectedAppt.clientEmail}</p>
                  {selectedAppt.clientPhone && (
                    <a href={`tel:${selectedAppt.clientPhone}`} className="text-xs text-violet-600 hover:text-violet-800 hover:underline">
                      &#9742; {selectedAppt.clientPhone}
                    </a>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500">Service</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedAppt.serviceEmoji} {selectedAppt.serviceName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Date &amp; Heure</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedAppt.date).toLocaleDateString('fr-CA', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedAppt.time} ({selectedAppt.duration} min)
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Statut</p>
                  <span
                    className="inline-block text-xs font-medium px-2.5 py-1 rounded-full mt-1"
                    style={{
                      backgroundColor:
                        (statusColors[selectedAppt.status] || '#7c3aed') + '20',
                      color: statusColors[selectedAppt.status] || '#7c3aed',
                    }}
                  >
                    {statusLabels[selectedAppt.status] || selectedAppt.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Prix</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedAppt.price.toFixed(2)} $
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
