import Image from 'next/image';
import Button from '@/components/ui/Button';
import RuneDivider from '@/components/ui/RuneDivider';
import IconeCategorie from '@/components/ui/IconeCategorie';
import ArcaneEditorProvider, {
  ArcaneFieldButton,
  type EditTarget,
  type TypeChamp,
} from '@/components/services/ArcaneInlineEditor';
import { FONTS } from '@/lib/service-landing';
import type { ContenuCeremonies } from '@/lib/pages/ceremonies';

/**
 * Page « Cérémonies & Animations privées ».
 *
 * Chaque texte et chaque image porte son propre bouton d'édition : l'admin
 * clique sur ce qu'elle veut changer, là où elle le voit. C'est le même
 * pupitre que les pages de services, branché sur /api/admin/site-pages.
 */

type Champ = keyof ContenuCeremonies;

/** Déclaration des champs éditables : nom, libellé du pupitre, nature. */
const CHAMPS: Array<{ field: Champ; label: string; kind?: TypeChamp; multiligne?: boolean }> = [
  // Hero
  { field: 'heroTitre', label: 'Modifier le titre de la page' },
  { field: 'heroAccroche', label: "Modifier l'accroche sous le titre", multiligne: true },
  { field: 'heroImage', label: "Changer l'image du haut de page", kind: 'image' },
  { field: 'heroImageAlt', label: "Décrire l'image du haut (accessibilité et référencement)" },
  { field: 'heroCta1Label', label: 'Modifier le texte du premier bouton' },
  { field: 'heroCta1Href', label: 'Modifier la destination du premier bouton' },
  { field: 'heroCta2Label', label: 'Modifier le texte du second bouton' },
  { field: 'heroCta2Href', label: 'Modifier la destination du second bouton' },

  // Célébrez autrement
  { field: 'introTitre', label: 'Modifier le titre « Célébrez autrement »' },
  { field: 'introTexte', label: 'Modifier le texte de présentation', multiligne: true },
  { field: 'introImage', label: "Changer l'image de la présentation", kind: 'image' },
  { field: 'introImageAlt', label: "Décrire l'image de la présentation" },

  // Nos cérémonies
  { field: 'ceremoniesTitre', label: 'Modifier le titre « Nos cérémonies »' },
  { field: 'ceremonie1Titre', label: 'Modifier le titre de la 1re cérémonie' },
  { field: 'ceremonie1Texte', label: 'Modifier la description de la 1re cérémonie', multiligne: true },
  { field: 'ceremonie1Icone', label: "Changer l'icône de la 1re cérémonie" },
  { field: 'ceremonie1Image', label: "Changer l'image de la 1re cérémonie", kind: 'image' },
  { field: 'ceremonie2Titre', label: 'Modifier le titre de la 2e cérémonie' },
  { field: 'ceremonie2Texte', label: 'Modifier la description de la 2e cérémonie', multiligne: true },
  { field: 'ceremonie2Icone', label: "Changer l'icône de la 2e cérémonie" },
  { field: 'ceremonie2Image', label: "Changer l'image de la 2e cérémonie", kind: 'image' },
  { field: 'ceremonie3Titre', label: 'Modifier le titre de la 3e cérémonie' },
  { field: 'ceremonie3Texte', label: 'Modifier la description de la 3e cérémonie', multiligne: true },
  { field: 'ceremonie3Icone', label: "Changer l'icône de la 3e cérémonie" },
  { field: 'ceremonie3Image', label: "Changer l'image de la 3e cérémonie", kind: 'image' },
  { field: 'ceremonie4Titre', label: 'Modifier le titre de la 4e cérémonie' },
  { field: 'ceremonie4Texte', label: 'Modifier la description de la 4e cérémonie', multiligne: true },
  { field: 'ceremonie4Icone', label: "Changer l'icône de la 4e cérémonie" },
  { field: 'ceremonie4Image', label: "Changer l'image de la 4e cérémonie", kind: 'image' },

  // Animations privées
  { field: 'animationsTitre', label: 'Modifier le titre « Animations privées »' },
  { field: 'animationsAccroche', label: "Modifier l'accroche des animations" },
  { field: 'animationsOccasions', label: 'Modifier la liste des occasions (une par ligne)', multiligne: true },
  { field: 'animationsFormule1', label: 'Modifier la 1re formule proposée' },
  { field: 'animationsFormule1Icone', label: "Changer l'icône de la 1re formule" },
  { field: 'animationsFormule2', label: 'Modifier la 2e formule proposée' },
  { field: 'animationsFormule2Icone', label: "Changer l'icône de la 2e formule" },
  { field: 'animationsFormule3', label: 'Modifier la 3e formule proposée' },
  { field: 'animationsFormule3Icone', label: "Changer l'icône de la 3e formule" },
  { field: 'animationsFormule4', label: 'Modifier la 4e formule proposée' },
  { field: 'animationsFormule4Icone', label: "Changer l'icône de la 4e formule" },
  { field: 'animationsCtaLabel', label: 'Modifier le texte du bouton des animations' },
  { field: 'animationsCtaHref', label: 'Modifier la destination du bouton des animations' },
  { field: 'animationsImage', label: "Changer l'image des animations", kind: 'image' },
  { field: 'animationsImageAlt', label: "Décrire l'image des animations" },

  // Sur mesure
  { field: 'etapesTitre', label: 'Modifier le titre « Une expérience créée sur mesure »' },
  { field: 'etape1Titre', label: 'Modifier le titre de la 1re étape' },
  { field: 'etape1Texte', label: 'Modifier le texte de la 1re étape', multiligne: true },
  { field: 'etape1Icone', label: "Changer l'icône de la 1re étape" },
  { field: 'etape2Titre', label: 'Modifier le titre de la 2e étape' },
  { field: 'etape2Texte', label: 'Modifier le texte de la 2e étape', multiligne: true },
  { field: 'etape2Icone', label: "Changer l'icône de la 2e étape" },
  { field: 'etape3Titre', label: 'Modifier le titre de la 3e étape' },
  { field: 'etape3Texte', label: 'Modifier le texte de la 3e étape', multiligne: true },
  { field: 'etape3Icone', label: "Changer l'icône de la 3e étape" },
  { field: 'etape4Titre', label: 'Modifier le titre de la 4e étape' },
  { field: 'etape4Texte', label: 'Modifier le texte de la 4e étape', multiligne: true },
  { field: 'etape4Icone', label: "Changer l'icône de la 4e étape" },

  // Entreprises
  { field: 'corpoTitre', label: 'Modifier le titre de la section entreprises' },
  { field: 'corpoTexte', label: 'Modifier le texte de la section entreprises', multiligne: true },
  { field: 'corpoImage', label: "Changer l'image de la section entreprises", kind: 'image' },
  { field: 'corpoImageAlt', label: "Décrire l'image de la section entreprises" },
  { field: 'corpoAtout1', label: 'Modifier le 1er atout corporatif' },
  { field: 'corpoAtout1Icone', label: "Changer l'icône du 1er atout" },
  { field: 'corpoAtout2', label: 'Modifier le 2e atout corporatif' },
  { field: 'corpoAtout2Icone', label: "Changer l'icône du 2e atout" },
  { field: 'corpoAtout3', label: 'Modifier le 3e atout corporatif' },
  { field: 'corpoAtout3Icone', label: "Changer l'icône du 3e atout" },
  { field: 'corpoAtout4', label: 'Modifier le 4e atout corporatif' },
  { field: 'corpoAtout4Icone', label: "Changer l'icône du 4e atout" },
  { field: 'corpoCtaLabel', label: 'Modifier le texte du bouton corporatif' },
  { field: 'corpoCtaHref', label: 'Modifier la destination du bouton corporatif' },

  // Galerie
  { field: 'galerieTitre', label: 'Modifier le titre de la galerie' },
  { field: 'galerie1', label: 'Changer la 1re photo de la galerie', kind: 'image' },
  { field: 'galerie2', label: 'Changer la 2e photo de la galerie', kind: 'image' },
  { field: 'galerie3', label: 'Changer la 3e photo de la galerie', kind: 'image' },
  { field: 'galerie4', label: 'Changer la 4e photo de la galerie', kind: 'image' },
  { field: 'galerie5', label: 'Changer la 5e photo de la galerie', kind: 'image' },

  // Final
  { field: 'finalTitre', label: "Modifier le titre de l'appel final" },
  { field: 'finalTexte', label: "Modifier le texte de l'appel final", multiligne: true },
  { field: 'finalCtaLabel', label: 'Modifier le texte du bouton final' },
  { field: 'finalCtaHref', label: 'Modifier la destination du bouton final' },
  { field: 'signature', label: 'Modifier la signature du bas de page' },

  // Polices
  { field: 'titleFont', label: 'Changer la police des grands titres', kind: 'police' },
  { field: 'labelFont', label: 'Changer la police des libellés', kind: 'police' },
  { field: 'bodyFont', label: 'Changer la police des paragraphes', kind: 'police' },
];

/** Cadre d'image : la vraie image si elle existe, un aplat discret sinon. */
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
        className={`flex items-center justify-center bg-[linear-gradient(135deg,#1A1A2E_0%,#2D1B4E_100%)] ${className ?? ''}`}
        aria-hidden="true"
      >
        <span className="font-cinzel-decorative text-4xl text-or-ancien/25">ᛉ</span>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} quality={82} className="object-cover" />
    </div>
  );
}

export default function CeremoniesTemplate({
  content,
  canEdit,
  updatedAt,
}: {
  content: ContenuCeremonies;
  canEdit: boolean;
  updatedAt?: string;
}) {
  const ceremonies = [1, 2, 3, 4].map((n) => ({
    n,
    titre: content[`ceremonie${n}Titre` as Champ],
    texte: content[`ceremonie${n}Texte` as Champ],
    icone: content[`ceremonie${n}Icone` as Champ],
    image: content[`ceremonie${n}Image` as Champ],
  }));

  const formules = [1, 2, 3, 4].map((n) => ({
    n,
    label: content[`animationsFormule${n}` as Champ],
    icone: content[`animationsFormule${n}Icone` as Champ],
  }));

  const etapes = [1, 2, 3, 4].map((n) => ({
    n,
    titre: content[`etape${n}Titre` as Champ],
    texte: content[`etape${n}Texte` as Champ],
    icone: content[`etape${n}Icone` as Champ],
  }));

  const atouts = [1, 2, 3, 4].map((n) => ({
    n,
    label: content[`corpoAtout${n}` as Champ],
    icone: content[`corpoAtout${n}Icone` as Champ],
  }));

  const galerie = [1, 2, 3, 4, 5].map((n) => content[`galerie${n}` as Champ]);

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
      <section className="relative -mt-18 flex min-h-[62vh] items-end overflow-hidden lg:-mt-20 lg:min-h-[72vh]">
        <div className="absolute inset-0">
          <Visuel src={content.heroImage} alt={content.heroImageAlt} className="h-full w-full" sizes="100vw" priority />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,18,0.55)_0%,rgba(10,10,18,0.35)_45%,rgba(10,10,18,0.92)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-16 pt-32 text-center">
          <div className="relative inline-block">
            {canEdit && <ArcaneFieldButton field="heroImage" label="Changer l'image du haut de page" position="-left-12 top-0" />}
            {canEdit && <ArcaneFieldButton field="heroTitre" label="Modifier le titre de la page" />}
            <h1 className="ff-titre text-[clamp(2.2rem,6.5vw,4.5rem)] font-bold uppercase leading-[1.05] tracking-[0.04em] text-gradient-gold">
              {content.heroTitre}
            </h1>
          </div>

          <div className="relative mx-auto mt-6 max-w-2xl">
            {canEdit && <ArcaneFieldButton field="heroAccroche" label="Modifier l'accroche sous le titre" />}
            <p className="whitespace-pre-line ff-corps text-lg leading-relaxed text-parchemin-vieilli/90 md:text-xl">
              {content.heroAccroche}
            </p>
          </div>

          <div className="relative mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {canEdit && <ArcaneFieldButton field="heroCta1Label" label="Modifier le texte du premier bouton" />}
            <Button href={content.heroCta1Href} variant="or" size="lg">
              {content.heroCta1Label}
            </Button>
            <Button href={content.heroCta2Href} variant="secondary" size="lg">
              {content.heroCta2Label}
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════ CÉLÉBREZ AUTREMENT ═══════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="relative inline-block">
              {canEdit && <ArcaneFieldButton field="introTitre" label="Modifier le titre « Célébrez autrement »" />}
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

      <RuneDivider symbols="ᚨ ᛊ ᚹ" />

      {/* ═══════════════ NOS CÉRÉMONIES ═══════════════ */}
      <section id="nos-ceremonies" className="mx-auto max-w-[1500px] px-6 py-16 md:py-20">
        <div className="relative mx-auto mb-12 inline-block w-full text-center">
          {canEdit && <ArcaneFieldButton field="ceremoniesTitre" label="Modifier le titre « Nos cérémonies »" />}
          <h2 className="ff-titre text-3xl font-bold uppercase tracking-[0.08em] text-gradient-gold md:text-4xl">
            {content.ceremoniesTitre}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {ceremonies.map((c) => (
            <article
              key={c.n}
              className="group relative overflow-hidden rounded-lg border border-or-ancien/30 bg-charbon-mystere/60 transition-all duration-500 hover:border-or-ancien/60 hover:shadow-[0_0_28px_rgba(201,168,76,0.15)]"
            >
              {canEdit && (
                <ArcaneFieldButton field={`ceremonie${c.n}Image`} label={`Changer l'image de la cérémonie ${c.n}`} position="right-3 top-3" />
              )}
              <Visuel
                src={c.image}
                alt={c.titre}
                className="aspect-[4/3] w-full"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              />

              <div className="relative -mt-8 flex justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-or-ancien/60 bg-noir-nuit text-or-ancien shadow-[0_0_18px_rgba(201,168,76,0.25)]">
                  <IconeCategorie nom={c.icone} taille={28} />
                </span>
                {canEdit && (
                  <ArcaneFieldButton field={`ceremonie${c.n}Icone`} label={`Changer l'icône de la cérémonie ${c.n}`} position="-right-2 top-0" />
                )}
              </div>

              <div className="px-6 pb-7 pt-4 text-center">
                <div className="relative inline-block">
                  {canEdit && <ArcaneFieldButton field={`ceremonie${c.n}Titre`} label={`Modifier le titre de la cérémonie ${c.n}`} />}
                  <h3 className="ff-titre text-lg font-semibold uppercase tracking-[0.06em] text-or-clair">
                    {c.titre}
                  </h3>
                </div>
                <div className="relative mt-3">
                  {canEdit && <ArcaneFieldButton field={`ceremonie${c.n}Texte`} label={`Modifier la description de la cérémonie ${c.n}`} />}
                  <p className="whitespace-pre-line ff-corps text-base leading-relaxed text-parchemin-vieilli/75">
                    {c.texte}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <RuneDivider symbols="ᛈ ᛉ ᛊ" />

      {/* ═══════════════ ANIMATIONS PRIVÉES ═══════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="relative inline-block">
              {canEdit && <ArcaneFieldButton field="animationsTitre" label="Modifier le titre « Animations privées »" />}
              <h2 className="ff-titre text-3xl font-bold uppercase tracking-[0.06em] text-or-ancien md:text-4xl">
                {content.animationsTitre}
              </h2>
            </div>
            <div className="relative mt-3">
              {canEdit && <ArcaneFieldButton field="animationsAccroche" label="Modifier l'accroche des animations" />}
              <p className="ff-label text-sm uppercase tracking-[0.16em] text-turquoise-cristal">
                {content.animationsAccroche}
              </p>
            </div>
            <div className="relative mt-6">
              {canEdit && <ArcaneFieldButton field="animationsOccasions" label="Modifier la liste des occasions" />}
              <p className="whitespace-pre-line ff-corps text-lg leading-relaxed text-parchemin-vieilli/80">
                {content.animationsOccasions}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {formules.map((f) => (
                <div key={f.n} className="relative flex flex-col items-center text-center">
                  {canEdit && <ArcaneFieldButton field={`animationsFormule${f.n}`} label={`Modifier la formule ${f.n}`} position="-right-1 -top-1" />}
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-or-ancien/50 text-or-ancien">
                    <IconeCategorie nom={f.icone} taille={24} />
                  </span>
                  <span className="mt-2 ff-label text-[0.62rem] uppercase leading-tight tracking-[0.12em] text-parchemin-vieilli/80">
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative mt-9">
              {canEdit && <ArcaneFieldButton field="animationsCtaLabel" label="Modifier le bouton des animations" />}
              <Button href={content.animationsCtaHref} variant="mystique" size="lg">
                {content.animationsCtaLabel}
              </Button>
            </div>
          </div>

          <div className="relative">
            {canEdit && <ArcaneFieldButton field="animationsImage" label="Changer l'image des animations" />}
            <Visuel
              src={content.animationsImage}
              alt={content.animationsImageAlt}
              className="aspect-[4/3] w-full rounded-lg border border-or-ancien/25"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <RuneDivider symbols="ᚹ ᛟ ᚱ" />

      {/* ═══════════════ SUR MESURE ═══════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="relative mb-12 text-center">
          {canEdit && <ArcaneFieldButton field="etapesTitre" label="Modifier le titre de la section sur mesure" />}
          <h2 className="ff-titre text-3xl font-bold uppercase tracking-[0.08em] text-gradient-gold md:text-4xl">
            {content.etapesTitre}
          </h2>
        </div>

        <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {etapes.map((e) => (
            <li key={e.n} className="relative text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-or-ancien/50 text-or-ancien">
                <IconeCategorie nom={e.icone} taille={28} />
              </span>
              <div className="relative mt-4 inline-block">
                {canEdit && <ArcaneFieldButton field={`etape${e.n}Titre`} label={`Modifier le titre de l'étape ${e.n}`} />}
                <h3 className="ff-label text-xs uppercase tracking-[0.16em] text-or-clair">{e.titre}</h3>
              </div>
              <div className="relative mt-3">
                {canEdit && <ArcaneFieldButton field={`etape${e.n}Texte`} label={`Modifier le texte de l'étape ${e.n}`} />}
                <p className="whitespace-pre-line ff-corps text-base leading-relaxed text-parchemin-vieilli/75">
                  {e.texte}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ═══════════════ ENTREPRISES ═══════════════ */}
      <section className="border-y border-violet-royal/25 bg-charbon-mystere/40">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:py-20 lg:grid-cols-2 lg:gap-14">
          <div className="relative order-2 lg:order-1">
            {canEdit && <ArcaneFieldButton field="corpoImage" label="Changer l'image de la section entreprises" />}
            <Visuel
              src={content.corpoImage}
              alt={content.corpoImageAlt}
              className="aspect-[4/3] w-full rounded-lg border border-or-ancien/25"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative inline-block">
              {canEdit && <ArcaneFieldButton field="corpoTitre" label="Modifier le titre de la section entreprises" />}
              <h2 className="ff-titre text-2xl font-bold uppercase tracking-[0.06em] text-or-ancien md:text-3xl">
                {content.corpoTitre}
              </h2>
            </div>
            <div className="relative mt-5">
              {canEdit && <ArcaneFieldButton field="corpoTexte" label="Modifier le texte de la section entreprises" />}
              <p className="whitespace-pre-line ff-corps text-lg leading-relaxed text-parchemin-vieilli/85">
                {content.corpoTexte}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {atouts.map((a) => (
                <div key={a.n} className="relative flex flex-col items-center text-center">
                  {canEdit && <ArcaneFieldButton field={`corpoAtout${a.n}`} label={`Modifier l'atout ${a.n}`} position="-right-1 -top-1" />}
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-turquoise-cristal/40 text-turquoise-cristal">
                    <IconeCategorie nom={a.icone} taille={22} />
                  </span>
                  <span className="mt-2 ff-label text-[0.6rem] uppercase leading-tight tracking-[0.12em] text-parchemin-vieilli/75">
                    {a.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative mt-8">
              {canEdit && <ArcaneFieldButton field="corpoCtaLabel" label="Modifier le bouton corporatif" />}
              <Button href={content.corpoCtaHref} variant="secondary" size="md">
                {content.corpoCtaLabel}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ GALERIE ═══════════════ */}
      <section className="mx-auto max-w-[1500px] px-6 py-16 md:py-20">
        <div className="relative mb-10 text-center">
          {canEdit && <ArcaneFieldButton field="galerieTitre" label="Modifier le titre de la galerie" />}
          <h2 className="ff-titre text-2xl font-bold uppercase tracking-[0.08em] text-or-ancien md:text-3xl">
            {content.galerieTitre}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {galerie.map((src, index) => (
            <div key={index} className="relative">
              {canEdit && (
                <ArcaneFieldButton field={`galerie${index + 1}`} label={`Changer la photo ${index + 1}`} position="right-2 top-2" />
              )}
              <Visuel
                src={src}
                alt=""
                className="aspect-square w-full rounded-md border border-or-ancien/20"
                sizes="(max-width: 768px) 50vw, 20vw"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ APPEL FINAL ═══════════════ */}
      <section className="border-t border-violet-royal/25 bg-[linear-gradient(160deg,rgba(45,27,78,0.55)_0%,rgba(10,10,18,1)_100%)]">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
          <div className="relative inline-block">
            {canEdit && <ArcaneFieldButton field="finalTitre" label="Modifier le titre de l'appel final" />}
            <h2 className="ff-titre text-3xl font-bold uppercase tracking-[0.08em] text-gradient-gold md:text-4xl">
              {content.finalTitre}
            </h2>
          </div>
          <div className="relative mx-auto mt-6 max-w-2xl">
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
          <div className="relative mt-12">
            {canEdit && <ArcaneFieldButton field="signature" label="Modifier la signature" />}
            <p className="font-cormorant text-xl italic text-or-ancien/70">{content.signature}</p>
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
      ? 'Nom de l’icône. Voir la liste des noms disponibles dans IconeCategorie (ex. anneaux, flamme, groupe, lotus).'
      : champ.field.endsWith('Href')
        ? 'Adresse interne (commence par /) ou lien complet (https://…).'
        : undefined,
  }));

  return (
    <ArcaneEditorProvider
      endpoint="/api/admin/site-pages/ceremonies"
      updatedAt={updatedAt}
      targets={targets}
    >
      {corps}
    </ArcaneEditorProvider>
  );
}
