import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';

/**
 * Rendu public du modèle « standard » : titre, sous-titre et corps de texte.
 * Les paragraphes sont séparés par une ligne vide dans le champ « body ».
 */
export default function StandardPageTemplate({
  title,
  subtitle,
  body,
}: {
  title: string;
  subtitle?: string;
  body?: string;
}) {
  const paragraphs = (body ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="px-4 py-16 md:py-24 max-w-3xl mx-auto">
      <SectionTitle title={title} subtitle={subtitle || undefined} as="h1" />

      <RuneDivider symbols="ᚨ ᛟ ᚱ" />

      <div className="mt-8 flex flex-col gap-6">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-parchemin-vieilli leading-relaxed text-lg font-philosopher whitespace-pre-line"
          >
            {p}
          </p>
        ))}
      </div>
    </article>
  );
}
