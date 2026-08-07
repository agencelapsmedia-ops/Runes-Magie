import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import RuneDivider from '@/components/ui/RuneDivider';
import IconeCategorie from '@/components/ui/IconeCategorie';
import ProductCard from '@/components/boutique/ProductCard';
import ArcaneEditorProvider, {
  ArcaneFieldButton,
  type EditTarget,
  type TypeChamp,
} from '@/components/services/ArcaneInlineEditor';
import { FONTS } from '@/lib/service-landing';
import type { ContenuHerboristerie } from '@/lib/pages/herboristerie';
import type { Category } from '@/data/products';

/** Offre tirée de la base, réduite à ce que la page affiche. */
export interface OffreLiee {
  slug: string;
  name: string;
  description: string;
  priceLabel: string;
  durationLabel: string;
  detailHref: string;
  practitionerName: string;
}

export interface ProduitLie {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
  checkoutType: string | null;
}

type Champ = keyof ContenuHerboristerie;

const CHAMPS: Array<{ field: Champ; label: string; kind?: TypeChamp; multiligne?: boolean }> = [
  { field: 'heroSurtitre', label: 'Modifier le petit texte au-dessus du titre' },
  { field: 'heroTitre', label: 'Modifier le titre de la page' },
  { field: 'heroAccroche', label: "Modifier l'accroche" },
  { field: 'heroImage', label: "Changer l'image du haut de page", kind: 'image' },
  { field: 'heroImageAlt', label: "Décrire l'image du haut (accessibilité et référencement)" },

  { field: 'introTitre', label: 'Modifier le titre de la présentation' },
  { field: 'introTexte', label: 'Modifier le texte de présentation', multiligne: true },
  { field: 'introImage', label: "Changer l'image de la présentation", kind: 'image' },
  { field: 'introImageAlt', label: "Décrire l'image de la présentation" },

  { field: 'approcheTitre', label: 'Modifier le titre « Notre approche »' },
  { field: 'approche1Titre', label: 'Modifier le 1er principe' },
  { field: 'approche1Texte', label: 'Modifier le texte du 1er principe', multiligne: true },
  { field: 'approche1Icone', label: "Changer l'icône du 1er principe" },
  { field: 'approche2Titre', label: 'Modifier le 2e principe' },
  { field: 'approche2Texte', label: 'Modifier le texte du 2e principe', multiligne: true },
  { field: 'approche2Icone', label: "Changer l'icône du 2e principe" },
  { field: 'approche3Titre', label: 'Modifier le 3e principe' },
  { field: 'approche3Texte', label: 'Modifier le texte du 3e principe', multiligne: true },
  { field: 'approche3Icone', label: "Changer l'icône du 3e principe" },
  { field: 'approche4Titre', label: 'Modifier le 4e principe' },
  { field: 'approche4Texte', label: 'Modifier le texte du 4e principe', multiligne: true },
  { field: 'approche4Icone', label: "Changer l'icône du 4e principe" },

  { field: 'plantesTitre', label: 'Modifier le titre de la section plantes' },
  { field: 'plantesIntro', label: 'Modifier le chapeau de la section plantes', multiligne: true },
  ...[1, 2, 3, 4, 5, 6].flatMap((n) => [
    { field: `plante${n}Nom` as Champ, label: `Modifier le nom de la plante ${n}` },
    { field: `plante${n}Latin` as Champ, label: `Modifier le nom latin de la plante ${n}` },
    { field: `plante${n}Note` as Champ, label: `Modifier la note de la plante ${n}`, multiligne: true },
  ]),

  { field: 'consultationTitre', label: 'Modifier le titre de la consultation' },
  { field: 'consultationTexte', label: 'Modifier le texte de la consultation', multiligne: true },
  { field: 'consultationCtaLabel', label: 'Modifier le bouton de la consultation' },
  { field: 'consultationCtaHref', label: 'Modifier la destination du bouton' },

  { field: 'formationTitre', label: 'Modifier le titre des formations' },
  { field: 'formationTexte', label: 'Modifier le texte des formations', multiligne: true },

  { field: 'boutiqueTitre', label: 'Modifier le titre de la section boutique' },
  { field: 'boutiqueTexte', label: 'Modifier le texte de la section boutique', multiligne: true },

  { field: 'avertissementTitre', label: "Modifier le titre de l'avertissement" },
  { field: 'avertissementTexte', label: "Modifier le texte de l'avertissement", multiligne: true },

  { field: 'finalTitre', label: "Modifier le titre de l'appel final" },
  { field: 'finalTexte', label: "Modifier le texte de l'appel final", multiligne: true },
  { field: 'finalCtaLabel', label: 'Modifier le bouton final' },
  { field: 'finalCtaHref', label: 'Modifier la destination du bouton final' },

  { field: 'titleFont', label: 'Changer la police des grands titres', kind: 'police' },
  { field: 'labelFont', label: 'Changer la police des libellés', kind: 'police' },
  { field: 'bodyFont', label: 'Changer la police des paragraphes', kind: 'police' },
];

function Visuel({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-[linear-gradient(135deg,#1A1A2E_0%,#0D5C54_100%)] ${className ?? ''}`}
        aria-hidden="true"
      >
        <span className="font-cinzel-decorative text-4xl text-or-ancien/25">ᛒ</span>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} quality={82} className="object-cover" />
    </div>
  );
}

export default function HerboristerieTemplate({
  content,
  canEdit,
  updatedAt,
  consultation,
  formations,
  produits,
}: {
  content: ContenuHerboristerie;
  canEdit: boolean;
  updatedAt?: string;
  consultation: OffreLiee | null;
  formations: OffreLiee[];
  produits: ProduitLie[];
}) {
  const approches = [1, 2, 3, 4].map((n) => ({
    n,
    titre: content[`approche${n}Titre` as Champ],
    texte: content[`approche${n}Texte` as Champ],
    icone: content[`approche${n}Icone` as Champ],
  }));

  const plantes = [1, 2, 3, 4, 5, 6].map((n) => ({
    n,
    nom: content[`plante${n}Nom` as Champ],
    latin: content[`plante${n}Latin` as Champ],
    note: content[`plante${n}Note` as Champ],
  }));

  const corps = (
    <div
      className="overflow-hidden bg-noir-nuit text-parchemin"
      style={
        {
          '--ff-titre': FONTS[content.titleFont as keyof typeof FONTS].css,
          '--ff-label': FONTS[content.labelFont as keyof typeof FONTS].css,
          '--ff-corps': FONTS[content.bodyFont as keyof typeof FONTS].css,
        } as React.CSSProperties
      }
    >
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative -mt-18 flex min-h-[55vh] items-end overflow-hidden lg:-mt-20 lg:min-h-[62vh]">
        <div className="absolute inset-0">
          <Visuel src={content.heroImage} alt={content.heroImageAlt} className="h-full w-full" sizes="100vw" priority />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,18,0.5)_0%,rgba(10,10,18,0.35)_45%,rgba(10,10,18,0.94)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-14 pt-32 text-center">
          <div className="relative inline-block">
            {canEdit && <ArcaneFieldButton field="heroImage" label="Changer l'image du haut de page" position="-left-12 top-0" />}
            {canEdit && <ArcaneFieldButton field="heroSurtitre" label="Modifier le petit texte au-dessus du titre" />}
            <p className="ff-label text-xs uppercase tracking-[0.32em] text-turquoise-cristal">
              {content.heroSurtitre}
            </p>
          </div>
          <div className="relative mt-4 inline-block">
            {canEdit && <ArcaneFieldButton field="heroTitre" label="Modifier le titre de la page" />}
            <h1 className="ff-titre text-[clamp(2.4rem,7vw,5rem)] font-bold uppercase leading-[1.02] tracking-[0.05em] text-gradient-gold">
              {content.heroTitre}
            </h1>
          </div>
          <div className="relative mx-auto mt-5 max-w-2xl">
            {canEdit && <ArcaneFieldButton field="heroAccroche" label="Modifier l'accroche" />}
            <p className="ff-corps text-lg italic leading-relaxed text-parchemin-vieilli/90 md:text-xl">
              {content.heroAccroche}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ PRÉSENTATION ═══════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="relative inline-block">
              {canEdit && <ArcaneFieldButton field="introTitre" label="Modifier le titre de la présentation" />}
              <h2 className="ff-titre text-3xl font-bold uppercase tracking-[0.06em] text-or-ancien md:text-4xl">
                {content.introTitre}
              </h2>
            </div>
            <div className="relative mt-6">
              {canEdit && <ArcaneFieldButton field="introTexte" label="Modifier le texte de présentation" />}
              <p className="whitespace-pre-line ff-corps text-lg leading-relaxed text-parchemin-vieilli/85">
                {content.introTexte}
              </p>
            </div>
          </div>
          <div className="relative">
            {canEdit && <ArcaneFieldButton field="introImage" label="Changer l'image de la présentation" />}
            <Visuel
              src={content.introImage}
              alt={content.introImageAlt}
              className="aspect-[4/3] w-full rounded-lg border border-or-ancien/25"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <RuneDivider symbols="ᛒ ᛃ ᛚ" />

      {/* ═══════════════ APPROCHE ═══════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="relative mb-12 text-center">
          {canEdit && <ArcaneFieldButton field="approcheTitre" label="Modifier le titre « Notre approche »" />}
          <h2 className="ff-titre text-3xl font-bold uppercase tracking-[0.08em] text-gradient-gold md:text-4xl">
            {content.approcheTitre}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {approches.map((a) => (
            <article
              key={a.n}
              className="rounded-lg border border-violet-royal/30 bg-charbon-mystere/60 p-6 transition-all duration-500 hover:border-or-ancien/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-or-ancien/50 text-or-ancien">
                <IconeCategorie nom={a.icone} taille={22} />
              </span>
              <div className="relative mt-4 inline-block">
                {canEdit && <ArcaneFieldButton field={`approche${a.n}Titre`} label={`Modifier le principe ${a.n}`} />}
                <h3 className="ff-label text-xs uppercase tracking-[0.14em] text-or-clair">{a.titre}</h3>
              </div>
              <div className="relative mt-3">
                {canEdit && <ArcaneFieldButton field={`approche${a.n}Texte`} label={`Modifier le texte du principe ${a.n}`} />}
                <p className="whitespace-pre-line ff-corps text-base leading-relaxed text-parchemin-vieilli/75">
                  {a.texte}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ═══════════════ PLANTES ═══════════════ */}
      <section className="border-y border-violet-royal/25 bg-charbon-mystere/40">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="relative mb-4 text-center">
            {canEdit && <ArcaneFieldButton field="plantesTitre" label="Modifier le titre de la section plantes" />}
            <h2 className="ff-titre text-3xl font-bold uppercase tracking-[0.08em] text-or-ancien md:text-4xl">
              {content.plantesTitre}
            </h2>
          </div>
          <div className="relative mx-auto mb-12 max-w-2xl text-center">
            {canEdit && <ArcaneFieldButton field="plantesIntro" label="Modifier le chapeau de la section plantes" />}
            <p className="whitespace-pre-line ff-corps text-base italic leading-relaxed text-parchemin-vieilli/65">
              {content.plantesIntro}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plantes.map((p) => (
              <article
                key={p.n}
                className="rounded-lg border border-or-ancien/25 bg-noir-nuit/50 p-6 transition-all duration-500 hover:border-or-ancien/50"
              >
                <div className="relative inline-block">
                  {canEdit && <ArcaneFieldButton field={`plante${p.n}Nom`} label={`Modifier la plante ${p.n}`} />}
                  <h3 className="ff-titre text-xl text-or-clair">{p.nom}</h3>
                </div>
                <div className="relative mt-1 inline-block">
                  {canEdit && <ArcaneFieldButton field={`plante${p.n}Latin`} label={`Modifier le nom latin ${p.n}`} position="-right-2 -top-2" />}
                  <p className="font-cormorant text-sm italic text-turquoise-cristal/70">{p.latin}</p>
                </div>
                <div className="relative mt-3">
                  {canEdit && <ArcaneFieldButton field={`plante${p.n}Note`} label={`Modifier la note ${p.n}`} />}
                  <p className="whitespace-pre-line ff-corps text-base leading-relaxed text-parchemin-vieilli/75">
                    {p.note}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CONSULTATION ═══════════════ */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
        <div className="relative inline-block">
          {canEdit && <ArcaneFieldButton field="consultationTitre" label="Modifier le titre de la consultation" />}
          <h2 className="ff-titre text-2xl font-bold uppercase tracking-[0.06em] text-or-ancien md:text-3xl">
            {content.consultationTitre}
          </h2>
        </div>
        <div className="relative mx-auto mt-5 max-w-2xl">
          {canEdit && <ArcaneFieldButton field="consultationTexte" label="Modifier le texte de la consultation" />}
          <p className="whitespace-pre-line ff-corps text-lg leading-relaxed text-parchemin-vieilli/85">
            {content.consultationTexte}
          </p>
        </div>

        {consultation && (
          <Link
            href={consultation.detailHref}
            className="mx-auto mt-8 block max-w-xl rounded-lg border border-or-ancien/30 bg-charbon-mystere/60 p-6 text-left transition-all duration-500 hover:border-or-ancien/60"
          >
            <p className="ff-label text-[0.65rem] uppercase tracking-[0.16em] text-turquoise-cristal">
              {consultation.practitionerName}
            </p>
            <p className="mt-2 ff-titre text-xl text-or-clair">{consultation.name}</p>
            <p className="mt-2 whitespace-pre-line ff-corps text-base text-parchemin-vieilli/75">
              {consultation.description}
            </p>
            <p className="mt-3 font-cinzel text-xs uppercase tracking-widest text-or-ancien">
              {consultation.priceLabel} · {consultation.durationLabel} · En savoir plus →
            </p>
          </Link>
        )}

        <div className="relative mt-8">
          {canEdit && <ArcaneFieldButton field="consultationCtaLabel" label="Modifier le bouton de la consultation" />}
          <Button href={content.consultationCtaHref} variant="or" size="lg">
            {content.consultationCtaLabel}
          </Button>
        </div>
      </section>

      <RuneDivider symbols="ᚨ ᛊ ᚹ" />

      {/* ═══════════════ SE FORMER ═══════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="relative mb-4 text-center">
          {canEdit && <ArcaneFieldButton field="formationTitre" label="Modifier le titre des formations" />}
          <h2 className="ff-titre text-2xl font-bold uppercase tracking-[0.06em] text-or-ancien md:text-3xl">
            {content.formationTitre}
          </h2>
        </div>
        <div className="relative mx-auto mb-10 max-w-2xl text-center">
          {canEdit && <ArcaneFieldButton field="formationTexte" label="Modifier le texte des formations" />}
          <p className="whitespace-pre-line ff-corps text-lg leading-relaxed text-parchemin-vieilli/80">
            {content.formationTexte}
          </p>
        </div>

        {formations.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {formations.map((f) => (
              <Link
                key={f.slug}
                href={f.detailHref}
                className="rounded-lg border border-violet-royal/35 bg-charbon-mystere/60 p-6 transition-all duration-500 hover:border-or-ancien/50"
              >
                <p className="ff-label text-[0.65rem] uppercase tracking-[0.16em] text-turquoise-cristal">
                  {f.practitionerName}
                </p>
                <p className="mt-2 ff-titre text-xl text-or-clair">{f.name}</p>
                <p className="mt-2 whitespace-pre-line ff-corps text-base text-parchemin-vieilli/75">
                  {f.description}
                </p>
                <p className="mt-3 font-cinzel text-xs uppercase tracking-widest text-or-ancien">
                  {f.priceLabel} · {f.durationLabel} · En savoir plus →
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════ BOUTIQUE ═══════════════ */}
      {produits.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-6 py-16 md:py-20">
          <div className="relative mb-4 text-center">
            {canEdit && <ArcaneFieldButton field="boutiqueTitre" label="Modifier le titre de la section boutique" />}
            <h2 className="ff-titre text-2xl font-bold uppercase tracking-[0.06em] text-or-ancien md:text-3xl">
              {content.boutiqueTitre}
            </h2>
          </div>
          <div className="relative mx-auto mb-10 max-w-2xl text-center">
            {canEdit && <ArcaneFieldButton field="boutiqueTexte" label="Modifier le texte de la section boutique" />}
            <p className="whitespace-pre-line ff-corps text-lg leading-relaxed text-parchemin-vieilli/80">
              {content.boutiqueTexte}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {produits.map((p) => (
              <Link key={p.id} href={`/boutique/${p.slug}`}>
                <ProductCard
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  image={p.image ?? '/images/placeholder.jpg'}
                  category={p.category as Category}
                  checkoutType={(p.checkoutType as 'stripe' | 'email') ?? 'stripe'}
                />
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button href="/boutique" variant="secondary" size="lg">
              Voir toute la boutique
            </Button>
          </div>
        </section>
      )}

      {/* ═══════════════ AVERTISSEMENT ═══════════════ */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-lg border border-magenta-rituel/30 bg-magenta-rituel/5 p-6 md:p-8">
          <div className="relative inline-block">
            {canEdit && <ArcaneFieldButton field="avertissementTitre" label="Modifier le titre de l'avertissement" />}
            <h2 className="ff-label text-xs uppercase tracking-[0.18em] text-magenta-rituel">
              {content.avertissementTitre}
            </h2>
          </div>
          <div className="relative mt-4">
            {canEdit && <ArcaneFieldButton field="avertissementTexte" label="Modifier le texte de l'avertissement" />}
            <p className="whitespace-pre-line ff-corps text-base leading-relaxed text-parchemin-vieilli/80">
              {content.avertissementTexte}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ APPEL FINAL ═══════════════ */}
      <section className="border-t border-violet-royal/25 bg-[linear-gradient(160deg,rgba(13,92,84,0.35)_0%,rgba(10,10,18,1)_100%)]">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <div className="relative inline-block">
            {canEdit && <ArcaneFieldButton field="finalTitre" label="Modifier le titre de l'appel final" />}
            <h2 className="ff-titre text-3xl font-bold uppercase tracking-[0.08em] text-gradient-gold md:text-4xl">
              {content.finalTitre}
            </h2>
          </div>
          <div className="relative mx-auto mt-6 max-w-xl">
            {canEdit && <ArcaneFieldButton field="finalTexte" label="Modifier le texte de l'appel final" />}
            <p className="whitespace-pre-line ff-corps text-lg leading-relaxed text-parchemin-vieilli/85">
              {content.finalTexte}
            </p>
          </div>
          <div className="relative mt-9">
            {canEdit && <ArcaneFieldButton field="finalCtaLabel" label="Modifier le bouton final" />}
            <Button href={content.finalCtaHref} variant="or" size="lg">
              {content.finalCtaLabel}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );

  if (!canEdit) return corps;

  const targets: EditTarget[] = CHAMPS.map((champ) => ({
    field: champ.field,
    label: champ.label,
    value: content[champ.field],
    kind: champ.kind,
    multiligne: champ.multiligne,
    helper: champ.field.endsWith('Icone')
      ? 'Nom de l’icône (ex. feuille, sauge, mortier, mains, lotus, cristal).'
      : champ.field.endsWith('Href')
        ? 'Adresse interne (commence par /) ou lien complet (https://…).'
        : undefined,
  }));

  return (
    <ArcaneEditorProvider
      endpoint="/api/admin/site-pages/herboristerie"
      updatedAt={updatedAt}
      targets={targets}
    >
      {corps}
    </ArcaneEditorProvider>
  );
}
