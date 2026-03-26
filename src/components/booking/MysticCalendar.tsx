'use client';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
];

interface Props {
  availability: Record<string, boolean>;
  selected: string;
  onSelect: (date: string) => void;
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  loading: boolean;
}

function pad(n: number) { return n.toString().padStart(2, '0'); }

export default function MysticCalendar({ availability, selected, onSelect, year, month, onMonthChange, loading }: Props) {
  const firstDay = new Date(year, month - 1, 1);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(year, month, 0).getDate();

  const goPrev = () => { if (month === 1) onMonthChange(year - 1, 12); else onMonthChange(year, month - 1); };
  const goNext = () => { if (month === 12) onMonthChange(year + 1, 1); else onMonthChange(year, month + 1); };

  const now = new Date();
  const canGoPrev = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="max-w-md mx-auto bg-charbon-mystere/80 backdrop-blur-sm border border-violet-royal/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <button type="button" onClick={goPrev} disabled={!canGoPrev}
          className={`p-2 font-cinzel text-lg transition-colors ${canGoPrev ? 'text-or-ancien hover:text-or-clair' : 'text-gris-fumee/30 cursor-not-allowed'}`}>
          &#9664;
        </button>
        <h3 className="font-cinzel text-xl text-parchemin tracking-wide">{MONTHS_FR[month - 1]} {year}</h3>
        <button type="button" onClick={goNext} className="p-2 font-cinzel text-lg text-or-ancien hover:text-or-clair transition-colors">&#9654;</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_FR.map((d) => (
          <div key={d} className="text-center text-xs font-cinzel text-or-ancien/70 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
          const dateStr = `${year}-${pad(month)}-${pad(day)}`;
          const isAvailable = availability[dateStr] === true;
          const isSelected = selected === dateStr;
          return (
            <button key={dateStr} type="button" disabled={!isAvailable || loading} onClick={() => onSelect(dateStr)}
              className={`aspect-square rounded-sm flex items-center justify-center text-sm font-cinzel transition-all duration-300 relative ${
                isSelected
                  ? 'bg-violet-royal text-or-ancien border border-or-ancien/50 shadow-[0_0_12px_rgba(107,63,160,0.5)]'
                  : isAvailable
                    ? 'text-parchemin font-semibold hover:bg-violet-royal/30 hover:text-or-ancien border border-violet-royal/20 hover:border-violet-royal/50'
                    : 'text-parchemin-vieilli/40 cursor-not-allowed border border-transparent'
              }`}>
              {day}
              {isAvailable && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-turquoise-cristal/60" />
              )}
            </button>
          );
        })}
      </div>
      {loading && <p className="text-center mt-4 text-parchemin-vieilli/40 text-sm font-philosopher italic">Consultation des astres...</p>}
    </div>
  );
}
