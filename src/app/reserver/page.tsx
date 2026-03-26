import type { Metadata } from 'next';
import BookingWizard from '@/components/booking/BookingWizard';
import RuneDivider from '@/components/ui/RuneDivider';

export const metadata: Metadata = {
  title: 'Reserver une Seance | Runes & Magie',
  description: 'Reservez votre seance mystique en ligne. Tirage de runes, soins energetiques, consultations spirituelles avec Noctura Anna.',
};

export default function ReserverPage() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-4">
          <span className="text-5xl text-or-ancien animate-glow-pulse select-none block mb-4">&#10022;</span>
          <h1 className="font-cinzel-decorative text-3xl md:text-4xl lg:text-5xl font-bold tracking-wide text-gradient-gold">
            Reserver une Seance
          </h1>
          <p className="mt-4 text-parchemin-vieilli text-lg md:text-xl italic font-philosopher">
            Laissez-vous guider vers votre prochaine experience mystique
          </p>
        </div>
        <RuneDivider className="my-10" />
        <BookingWizard />
      </div>
    </section>
  );
}
