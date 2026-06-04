import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import RuneDivider from '@/components/ui/RuneDivider';
import Button from '@/components/ui/Button';
import type { Service } from '@/data/services';

interface FormationDetailViewProps {
  formation: Service;
  courses: Service[];
}

export default function FormationDetailView({ formation, courses }: FormationDetailViewProps) {
  return (
    <div>
      {/* Hero */}
      <section
        className="relative py-20 md:py-32 px-4"
        style={{
          background:
            'linear-gradient(135deg, var(--violet-profond) 0%, var(--charbon-mystere) 50%, var(--teal-profond) 100%)',
        }}
      >
        <div className="absolute inset-0 bg-noir-nuit/40" />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="font-cinzel text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-turquoise-cristal/40 text-turquoise-cristal">
            Formation · {courses.length} cours
          </span>
          <div className="text-7xl md:text-8xl text-or-ancien mt-8 mb-6 animate-glow-pulse select-none">
            {formation.icon}
          </div>
          <h1 className="font-cinzel-decorative text-3xl md:text-5xl font-bold text-gradient-gold mb-6">
            {formation.name}
          </h1>
          <div className="flex items-center justify-center gap-6 text-lg">
            <span className="font-cinzel text-2xl text-or-ancien font-semibold">
              {typeof formation.price === 'number' ? formatPrice(formation.price) : formation.price}
            </span>
            <span className="text-parchemin-vieilli/40">&#9670;</span>
            <span className="text-parchemin-vieilli/80 font-philosopher">{formation.duration}</span>
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <p className="text-parchemin-vieilli/90 text-lg md:text-xl leading-relaxed font-cormorant">
              {formation.longDescription}
            </p>
          </div>

          <RuneDivider />

          {/* Les cours de la formation */}
          <div className="my-16">
            <h2 className="font-cinzel text-2xl text-or-ancien mb-8 text-center">
              Les cours de cette formation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/ecole/${course.slug}`}
                  className="group bg-charbon-mystere border border-violet-royal/30 rounded-lg p-6 transition-all duration-300 hover:border-violet-mystique/60 hover:shadow-[0_0_20px_rgba(107,63,160,0.12)]"
                >
                  <div className="text-3xl text-or-ancien/70 mb-4 group-hover:text-or-ancien transition-colors select-none">
                    {course.icon}
                  </div>
                  <h3 className="font-cinzel text-lg text-parchemin mb-2 group-hover:text-or-ancien transition-colors">
                    {course.name}
                  </h3>
                  <p className="text-parchemin-vieilli/60 text-sm line-clamp-2">
                    {course.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <RuneDivider symbols="&#10022; &#10022; &#10022;" />

          <div className="my-16 text-center">
            <h2 className="font-cinzel text-2xl text-parchemin mb-4">Prête à apprendre&nbsp;?</h2>
            <p className="text-parchemin-vieilli/70 mb-8 font-philosopher text-lg">
              Inscrivez-vous à la formation et commencez votre apprentissage.
            </p>
            <Button href="/reserver" variant="cta" size="lg">
              Réserver cette formation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
