import { cn } from "@/lib/utils";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export default function SectionTitle({
  title,
  subtitle,
  className,
  as: Tag = "h2",
}: SectionTitleProps) {
  return (
    <div className={cn("text-center", className)}>
      <Tag className="font-cinzel-decorative text-3xl md:text-4xl lg:text-5xl font-bold tracking-wide text-gradient-gold">
        {title}
      </Tag>

      {subtitle && (
        <p className="mt-4 text-parchemin-vieilli text-lg md:text-xl italic font-philosopher">
          {subtitle}
        </p>
      )}
    </div>
  );
}
