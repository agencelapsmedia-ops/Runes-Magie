import { cn } from "@/lib/utils";

interface RuneDividerProps {
  symbols?: string;
  className?: string;
}

export default function RuneDivider({
  symbols = "\u2726 \u2726 \u2726",
  className,
}: RuneDividerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 py-8 select-none",
        className,
      )}
      role="separator"
      aria-hidden="true"
    >
      {/* Left gradient line */}
      <div
        className="h-px flex-1 max-w-48"
        style={{
          background:
            "linear-gradient(to right, transparent, var(--or-ancien))",
        }}
      />

      {/* Center rune symbols */}
      <span className="text-or-ancien/60 text-sm tracking-[0.5em] font-cinzel">
        {symbols}
      </span>

      {/* Right gradient line */}
      <div
        className="h-px flex-1 max-w-48"
        style={{
          background:
            "linear-gradient(to left, transparent, var(--or-ancien))",
        }}
      />
    </div>
  );
}
