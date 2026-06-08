import { cn } from '@/lib/utils';

const PHONE_DISPLAY = '514-348-7705';
const PHONE_HREF = 'tel:+15143487705';

type PhoneButtonSize = 'sm' | 'md' | 'lg';

const sizeStyles: Record<PhoneButtonSize, string> = {
  sm: 'px-6 py-2.5 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export default function PhoneButton({
  size = 'md',
  className,
}: {
  size?: PhoneButtonSize;
  className?: string;
}) {
  return (
    <a
      href={PHONE_HREF}
      aria-label={`Appeler le ${PHONE_DISPLAY}`}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'font-cinzel uppercase tracking-[0.15em] rounded-sm',
        'transition-all duration-300 ease-out cursor-pointer select-none',
        'bg-transparent text-turquoise-cristal border-2 border-turquoise-cristal/50',
        'hover:border-turquoise-cristal hover:bg-turquoise-cristal/10 active:scale-[0.98]',
        sizeStyles[size],
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 5.5C3 4.12 4.12 3 5.5 3h1.6a1 1 0 0 1 .95.68l1.2 3.5a1 1 0 0 1-.5 1.2l-1.4.7a11 11 0 0 0 5.1 5.1l.7-1.4a1 1 0 0 1 1.2-.5l3.5 1.2a1 1 0 0 1 .68.95v1.6c0 1.38-1.12 2.5-2.5 2.5C9.6 21 3 14.4 3 5.5Z" />
      </svg>
      {PHONE_DISPLAY}
    </a>
  );
}
