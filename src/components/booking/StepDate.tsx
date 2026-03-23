'use client';

import { useEffect, useState, useCallback } from 'react';
import MysticCalendar from './MysticCalendar';

interface Props {
  serviceId: string;
  selected: string;
  onSelect: (date: string) => void;
  onBack: () => void;
}

export default function StepDate({ serviceId, selected, onSelect, onBack }: Props) {
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const fetchMonth = useCallback(
    (year: number, month: number) => {
      setLoading(true);
      fetch(
        `/api/public/slots/month?serviceId=${serviceId}&year=${year}&month=${month}`
      )
        .then((r) => r.json())
        .then((data) => setAvailability((prev) => ({ ...prev, ...data })))
        .finally(() => setLoading(false));
    },
    [serviceId]
  );

  useEffect(() => {
    fetchMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth, fetchMonth]);

  const handleMonthChange = (year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
  };

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="font-cinzel-decorative text-2xl md:text-3xl text-gradient-gold">
          Choisissez votre date
        </h2>
        <p className="mt-3 text-parchemin-vieilli/70 font-philosopher italic">
          Les jours illumines sont disponibles pour votre seance
        </p>
      </div>

      <MysticCalendar
        availability={availability}
        selected={selected}
        onSelect={onSelect}
        year={viewYear}
        month={viewMonth}
        onMonthChange={handleMonthChange}
        loading={loading}
      />

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onBack}
          className="font-cinzel text-sm text-parchemin-vieilli/50 hover:text-or-ancien transition-colors tracking-wider"
        >
          &larr; Retour
        </button>
      </div>
    </div>
  );
}
