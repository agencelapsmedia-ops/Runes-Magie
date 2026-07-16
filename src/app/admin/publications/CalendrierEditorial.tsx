'use client';

import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import type { EventClickArg, EventContentArg, EventDropArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import { RESEAU_LABELS, STATUTS_POST } from '@/lib/social-constants';
import type { PostSerialise } from '@/lib/social-posts';

/** Statuts encore déplaçables dans le calendrier. */
const DEPLACABLES = new Set(['BROUILLON', 'A_APPROUVER', 'PROGRAMMEE']);

const PICTO_RESEAU: Record<string, string> = { FACEBOOK: 'f', INSTAGRAM: '📷', TIKTOK: '♪', YOUTUBE: '▶' };

function renderEvent(arg: EventContentArg) {
  const { reseaux } = arg.event.extendedProps as { reseaux?: string[] };
  return (
    <div style={{ overflow: 'hidden', lineHeight: 1.2, padding: '1px 3px' }}>
      {arg.timeText && <div style={{ fontSize: '0.62rem', opacity: 0.85 }}>{arg.timeText}</div>}
      <div style={{ fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {arg.event.title}
      </div>
      {reseaux && reseaux.length > 0 && (
        <div style={{ fontSize: '0.62rem', opacity: 0.9 }}>
          {reseaux.map((r) => RESEAU_LABELS[r] ?? r).join(' + ')}
        </div>
      )}
    </div>
  );
}

/**
 * Calendrier éditorial : une couleur par statut, glisser-déposer pour
 * re-dater (PATCH scheduledAt — l'heure d'origine est conservée en vue mois).
 */
export default function CalendrierEditorial({
  posts,
  onOpen,
  onDateClick,
  onMoved,
}: {
  posts: PostSerialise[];
  onOpen: (post: PostSerialise) => void;
  onDateClick: (dateLocale: string) => void; // valeur pour input datetime-local
  onMoved: () => Promise<void>;
}) {
  const parId = useMemo(() => new Map(posts.map((p) => [p.id, p])), [posts]);

  const events = useMemo(
    () =>
      posts
        .filter((p) => p.scheduledAt)
        .map((p) => {
          const s = STATUTS_POST[p.status] ?? STATUTS_POST.BROUILLON;
          return {
            id: p.id,
            title: p.title,
            start: p.scheduledAt as string,
            backgroundColor: s.bg,
            borderColor: s.border,
            textColor: s.fg,
            editable: DEPLACABLES.has(p.status),
            extendedProps: { reseaux: p.targets.map((t) => t.network) },
          };
        }),
    [posts],
  );

  const aPlanifier = useMemo(() => posts.filter((p) => !p.scheduledAt && p.status !== 'PUBLIEE'), [posts]);

  function onEventClick(arg: EventClickArg) {
    const post = parId.get(arg.event.id);
    if (post) onOpen(post);
  }

  async function onEventDrop(arg: EventDropArg) {
    const post = parId.get(arg.event.id);
    const nouvelleDate = arg.event.start;
    if (!post || !nouvelleDate) {
      arg.revert();
      return;
    }
    const res = await fetch(`/api/admin/social/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt: nouvelleDate.toISOString() }),
    }).catch(() => null);
    if (!res || !res.ok) {
      arg.revert();
      return;
    }
    await onMoved();
  }

  function onDate(arg: DateClickArg) {
    const d = new Date(arg.date);
    if (arg.allDay) d.setHours(10, 0, 0, 0); // vue mois : 10 h par défaut
    const p = (n: number) => String(n).padStart(2, '0');
    onDateClick(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`);
  }

  return (
    <div>
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '18px' }}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          locale={frLocale}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          events={events}
          editable
          eventClick={onEventClick}
          eventDrop={onEventDrop}
          dateClick={onDate}
          eventContent={renderEvent}
          eventDisplay="block"
          height="auto"
          dayMaxEventRows={4}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        />
      </div>

      {aPlanifier.length > 0 && (
        <div style={{ marginTop: '16px', background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '16px' }}>
          <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.85rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '10px' }}>
            À planifier ({aPlanifier.length}) — clique pour ouvrir et choisir une date
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {aPlanifier.map((p) => {
              const s = STATUTS_POST[p.status] ?? STATUTS_POST.BROUILLON;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpen(p)}
                  style={{ padding: '7px 12px', borderRadius: '8px', border: `1px solid ${s.border}`, background: s.bg, color: s.fg, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {p.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .fc { font-family: inherit; }
        .fc .fc-button-primary { background: #6B3FA0; border-color: #6B3FA0; text-transform: capitalize; font-size: 0.82rem; }
        .fc .fc-button-primary:hover { background: #2D1B4E; border-color: #2D1B4E; }
        .fc .fc-toolbar-title { font-family: var(--font-cinzel, serif); font-size: 1.15rem; color: #2D1B4E; text-transform: capitalize; }
        .fc .fc-col-header-cell-cushion, .fc .fc-daygrid-day-number { color: #374151; text-decoration: none; }
        .fc .fc-daygrid-day-frame { cursor: pointer; }
        .fc .fc-day-today { background: rgba(107, 63, 160, 0.06) !important; }
        .fc-event { cursor: pointer; font-size: 0.76rem; }
        .fc .fc-daygrid-more-link { color: #6B3FA0; font-weight: 600; }
      `}</style>
    </div>
  );
}
