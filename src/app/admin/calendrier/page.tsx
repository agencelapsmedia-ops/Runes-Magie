'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    clientName: string;
    clientEmail: string;
    status: string;
    serviceName: string;
  };
}

export default function CalendrierPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const calendarRef = useRef(null);

  const loadEvents = useCallback(async () => {
    const res = await fetch('/api/admin/appointments');
    if (!res.ok) return;
    const appointments = await res.json();

    const mapped: CalendarEvent[] = appointments
      .filter((a: { status: string }) => a.status !== 'cancelled')
      .map((a: {
        id: string;
        date: string;
        startTime: string;
        endTime: string;
        clientName: string;
        clientEmail: string;
        status: string;
        service: { name: string; emoji: string; colorHex: string };
      }) => {
        const dateStr = a.date.split('T')[0];
        return {
          id: a.id,
          title: `${a.service.emoji} ${a.clientName}`,
          start: `${dateStr}T${a.startTime}`,
          end: `${dateStr}T${a.endTime}`,
          backgroundColor: a.service.colorHex + '30',
          borderColor: a.service.colorHex,
          extendedProps: {
            clientName: a.clientName,
            clientEmail: a.clientEmail,
            status: a.status,
            serviceName: a.service.name,
          },
        };
      });

    setEvents(mapped);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSelectedEvent(null);
    loadEvents();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendrier</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
          }}
          locale="fr"
          firstDay={1}
          events={events}
          eventClick={(info) => {
            const evt = events.find((e) => e.id === info.event.id);
            if (evt) setSelectedEvent(evt);
          }}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          height="auto"
          nowIndicator
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
          }}
        />
      </div>

      {/* Event detail panel */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">{selectedEvent.extendedProps.serviceName}</h3>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p><strong>Client :</strong> {selectedEvent.extendedProps.clientName}</p>
              <p><strong>Email :</strong> {selectedEvent.extendedProps.clientEmail}</p>
              <p><strong>Heure :</strong> {selectedEvent.start.split('T')[1]?.slice(0, 5)} - {selectedEvent.end.split('T')[1]?.slice(0, 5)}</p>
              <p><strong>Statut :</strong> {selectedEvent.extendedProps.status}</p>
            </div>
            <div className="flex gap-2">
              {selectedEvent.extendedProps.status === 'pending' && (
                <button onClick={() => updateStatus(selectedEvent.id, 'confirmed')} className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
                  Confirmer
                </button>
              )}
              <button onClick={() => updateStatus(selectedEvent.id, 'completed')} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                Completer
              </button>
              <button onClick={() => updateStatus(selectedEvent.id, 'cancelled')} className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">
                Annuler
              </button>
            </div>
            <button onClick={() => setSelectedEvent(null)} className="w-full mt-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
