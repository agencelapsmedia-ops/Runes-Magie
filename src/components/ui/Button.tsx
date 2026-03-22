import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "cta" | "mystique";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

interface ButtonAsButton extends ButtonBaseProps {
  href?: undefined;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string;
  type?: never;
  disabled?: never;
  onClick?: never;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-gradient-to-r from-violet-royal to-violet-profond",
    "text-or-ancien",
    "border border-or-ancien/30",
    "hover:shadow-[0_0_20px_rgba(201,168,76,0.4),0_0_40px_rgba(201,168,76,0.15)]",
    "hover:border-or-ancien/60",
    "active:scale-[0.98]",
  ].join(" "),

  secondary: [
    "bg-transparent",
    "text-or-ancien",
    "border-2 border-or-ancien/50",
    "hover:border-or-ancien",
    "hover:bg-or-ancien/10",
    "hover:shadow-[0_0_15px_rgba(201,168,76,0.2)]",
    "active:scale-[0.98]",
  ].join(" "),

  cta: [
    "bg-gradient-to-r from-magenta-rituel to-fuchsia-enchante",
    "text-blanc-lune",
    "border border-fuchsia-enchante/30",
    "hover:shadow-[0_0_25px_rgba(196,29,110,0.5),0_0_50px_rgba(196,29,110,0.2)]",
    "hover:border-fuchsia-enchante/60",
    "active:scale-[0.98]",
  ].join(" "),

  mystique: [
    "bg-gradient-to-r from-teal-profond to-teal-magique",
    "text-noir-nuit",
    "border border-turquoise-cristal/30",
    "hover:shadow-[0_0_20px_rgba(46,196,182,0.4),0_0_40px_rgba(46,196,182,0.15)]",
    "hover:border-turquoise-cristal/60",
    "active:scale-[0.98]",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const sharedClasses = cn(
    "inline-flex items-center justify-center",
    "font-cinzel uppercase tracking-[0.15em]",
    "rounded-sm",
    "transition-all duration-300 ease-out",
    "cursor-pointer select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-or-ancien",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );

  if (props.href !== undefined) {
    const { href } = props as ButtonAsLink;
    return (
      <Link href={href} className={sharedClasses}>
        {children}
      </Link>
    );
  }

  const { type = "button", disabled, onClick } = props as ButtonAsButton;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(sharedClasses, disabled && "opacity-50 pointer-events-none")}
    >
      {children}
    </button>
  );
}
