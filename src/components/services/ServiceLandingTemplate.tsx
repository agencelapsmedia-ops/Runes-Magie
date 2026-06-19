import Image from 'next/image';
import Button from '@/components/ui/Button';
import type { OfferingView } from '@/lib/offerings';
import { buildServiceJsonLd, buildServiceLandingContent } from '@/lib/service-landing';
import ArcaneEditorProvider, { ArcaneFieldButton } from '@/components/services/ArcaneInlineEditor';

interface ServiceLandingTemplateProps {
  offering: OfferingView;
  canEdit: boolean;
}

export default function ServiceLandingTemplate({ offering, canEdit }: ServiceLandingTemplateProps) {
  const content = buildServiceLandingContent(offering);
  const heroImage = content.heroImage;
  const faqImage = content.faqImageUrl ?? heroImage;
  const jsonLd = buildServiceJsonLd(offering);

  // Colonne de texte partagée par les deux variantes de hero.
  const heroText = (titleClassName: string) => (
    <div className="relative z-10">
      <div className="relative inline-block">
        {canEdit && <ArcaneFieldButton field="eyebrow" label="Modifier le petit texte au-dessus du titre" />}
        <p className="font-cinzel text-xs uppercase tracking-[0.36em] text-[#00D9D9]">
          {content.eyebrow}
        </p>
      </div>
      <div className="relative mt-5">
        {canEdit && <ArcaneFieldButton field="name" label="Modifier le titre du service" />}
        <h1 className={titleClassName}>{content.title}</h1>
      </div>
      <div className="relative mt-7 max-w-xl">
        {canEdit && <ArcaneFieldButton field="subtitle" label="Modifier le sous-titre" />}
        <p className="font-cinzel text-sm uppercase tracking-[0.18em] text-[#E6C87A]/90 md:text-base">
          {content.subtitle}
        </p>
      </div>
      <div className="relative mt-6 max-w-xl">
        {canEdit && <ArcaneFieldButton field="description" label="Modifier le texte d'ouverture" />}
        <p className="font-cormorant text-xl italic leading-relaxed text-parchemin-vieilli/90 md:text-2xl">
          {content.intro}
        </p>
      </div>
      <div className="relative mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
        {canEdit && <ArcaneFieldButton field="ctaLabel" label="Modifier le texte des boutons de réservation" />}
        <Button href={offering.bookingHref} variant="or" size="lg">
          {content.ctaLabel}
        </Button>
        <p className="font-philosopher text-sm text-parchemin/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          {offering.priceLabel} · {offering.durationLabel}
        </p>
      </div>
    </div>
  );

  // Hero immersif : fond pleine largeur + personnage détouré + panneau des piliers.
  const immersiveHero = (
    <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#050711]">
      {content.backgroundUrl && (
        <Image
          src={content.backgroundUrl}
          alt={content.imageAlt}
          fill
          priority
          quality={82}
          sizes="100vw"
          className="object-cover"
        />
      )}
      {/* Voile sombre pour la lisibilité (plus dense à gauche et en bas) */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,17,0.92)_0%,rgba(5,7,17,0.6)_38%,rgba(5,7,17,0.25)_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,7,17,0.85)_0%,transparent_45%)]" />

      {canEdit && <ArcaneFieldButton field="backgroundUrl" label="Modifier l'image de fond du hero" position="left-3 top-3" />}
      {canEdit && <ArcaneFieldButton field="imageAlt" label="Modifier le texte alternatif du fond (SEO)" position="left-3 top-14" />}

      {/* Personnage détouré */}
      {content.characterUrl && (
        <div className="pointer-events-none absolute bottom-0 right-0 h-[58%] w-[88%] opacity-45 sm:h-[72%] sm:w-[62%] sm:opacity-100 md:h-[90%] md:w-[52%]">
          <Image
            src={content.characterUrl}
            alt={content.imageAlt}
            fill
            priority
            quality={85}
            sizes="(max-width: 768px) 88vw, 52vw"
            className="object-contain object-bottom drop-shadow-[0_0_60px_rgba(106,0,255,0.4)]"
          />
        </div>
      )}
      {canEdit && <ArcaneFieldButton field="characterUrl" label="Modifier l'image du personnage (PNG transparent)" position="right-3 top-3" />}

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-center gap-10 px-5 py-16 md:grid md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-8 lg:px-10">
        {heroText(
          'font-cinzel-decorative text-[clamp(3rem,9vw,7.5rem)] font-black uppercase leading-[0.85] tracking-[0.04em] bg-gradient-to-br from-[#E7D6FF] via-[#A56BFF] to-[#6A00FF] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(106,0,255,0.45)]',
        )}

        {/* Panneau des piliers (verre) */}
        <div className="relative z-10 ml-auto w-full max-w-md rounded-2xl border border-[#D4AF37]/30 bg-[#0A1028]/55 p-6 shadow-[0_0_40px_rgba(106,0,255,0.3)] backdrop-blur-md md:p-7">
          {canEdit && <ArcaneFieldButton field="features" label="Modifier la liste du panneau (hero)" />}
          {canEdit && <ArcaneFieldButton field="pillarIcons" label="Modifier les icônes des piliers" position="-right-3 top-8" />}
          <ul className="flex flex-col">
            {offering.features.map((feature, index) => {
              const icon = content.pillarIcons[index]?.trim();
              return (
              <li
                key={`${feature}-${index}`}
                className="flex items-center gap-4 border-b border-[#D4AF37]/12 py-3 last:border-b-0"
              >
                {icon ? (
                  <Image
                    src={icon}
                    alt=""
                    aria-hidden
                    width={28}
                    height={28}
                    unoptimized
                    className="h-7 w-7 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                  />
                ) : (
                  <span aria-hidden className="w-7 shrink-0 text-center font-cinzel-decorative text-2xl text-[#E6C87A] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                    {content.pillarRunes[index % content.pillarRunes.length]}
                  </span>
                )}
                <span className="font-cinzel text-sm uppercase tracking-[0.12em] text-parchemin/90">
                  {feature}
                </span>
              </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );

  // Ancien hero (dégradé) : conservé pour les services sans image de fond définie.
  const classicHero = (
    <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[radial-gradient(circle_at_70%_30%,rgba(255,0,184,0.28),transparent_28%),linear-gradient(135deg,#0A1028_0%,#2D1B69_48%,#050711_100%)]">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(115deg,transparent_0_44%,rgba(212,175,55,0.18)_45%,transparent_46%),radial-gradient(circle_at_18%_18%,rgba(0,217,217,0.18),transparent_22%)]" />
      <div className="absolute left-1/2 top-10 h-[82vh] w-[82vh] -translate-x-1/2 rounded-full border border-[#D4AF37]/20 opacity-70 shadow-[0_0_90px_rgba(106,0,255,0.45)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-[0.92fr_1.08fr] md:px-8 lg:px-10">
        {heroText(
          'font-cinzel-decorative text-[clamp(3rem,9vw,8rem)] font-black uppercase leading-[0.85] tracking-[0.05em] text-gradient-gold drop-shadow-[0_0_28px_rgba(212,175,55,0.22)]',
        )}

        <div className="relative min-h-[420px] md:min-h-[680px]">
          {canEdit && <ArcaneFieldButton field="imageUrl" label="Modifier l'image principale du service" />}
          {canEdit && <ArcaneFieldButton field="imageAlt" label="Modifier le texte alternatif de l'image (SEO)" position="-right-3 top-8" />}
          {canEdit && <ArcaneFieldButton field="backgroundUrl" label="Activer le hero immersif : ajouter une image de fond" position="-right-3 top-20" />}
          {heroImage && (
            <Image
              src={heroImage}
              alt={content.imageAlt}
              fill
              priority
              quality={85}
              sizes="(max-width: 768px) 100vw, 54vw"
              className="object-contain drop-shadow-[0_0_55px_rgba(255,0,184,0.34)]"
            />
          )}
        </div>
      </div>
    </section>
  );

  const heroSection = content.backgroundUrl ? immersiveHero : classicHero;

  const body = (
    <article className="overflow-hidden bg-[#050711] text-parchemin">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {heroSection}

      <section className="relative border-y border-[#D4AF37]/20 bg-[linear-gradient(180deg,#050711,#0A1028)] px-5 py-20 md:py-28">
        <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent" />
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.82fr_1.18fr] md:items-center">
          <div className="relative">
            {canEdit && <ArcaneFieldButton field="sanctuaryTitle" label="Modifier le titre du sanctuaire" />}
            <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-[#FF4FD8]">Le sanctuaire</p>
            <h2 className="mt-4 font-cinzel-decorative text-4xl font-bold uppercase leading-tight text-gradient-gold md:text-6xl">
              {content.sanctuaryTitle}
            </h2>
          </div>
          <div className="relative rounded-sm border border-[#D4AF37]/35 bg-[#0A1028]/72 p-7 shadow-[0_0_40px_rgba(106,0,255,0.22)] md:p-10">
            {canEdit && <ArcaneFieldButton field="longDescription" label="Modifier le texte du sanctuaire" />}
            <p className="font-cormorant text-2xl italic leading-relaxed text-parchemin-vieilli/90">
              {content.sanctuaryText}
            </p>
          </div>
        </div>
      </section>

      <section className="relative bg-[radial-gradient(circle_at_50%_0%,rgba(106,0,255,0.28),transparent_34%),#080812] px-5 py-20 md:py-28">
        <div className="relative mx-auto max-w-6xl">
          {canEdit && <ArcaneFieldButton field="pillarsTitle" label="Modifier le titre de la section des bienfaits" />}
          <p className="text-center font-cinzel text-xs uppercase tracking-[0.34em] text-[#00D9D9]">Activation</p>
          <h2 className="mx-auto mt-4 max-w-4xl text-center font-cinzel-decorative text-4xl font-bold uppercase text-gradient-gold md:text-6xl">
            {content.pillarsTitle}
          </h2>
          <div className="relative mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {canEdit && <ArcaneFieldButton field="benefits" label="Modifier les bienfaits du rituel" />}
            {content.benefits.map((benefit, index) => (
              <div
                key={`${benefit}-${index}`}
                className="group relative overflow-hidden rounded-sm border border-[#D4AF37]/25 bg-[#101431]/80 p-6 shadow-[0_0_24px_rgba(45,27,105,0.32)]"
              >
                <span className="font-cinzel-decorative text-5xl text-[#D4AF37]/28">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <p className="mt-5 font-cinzel text-sm uppercase tracking-[0.16em] text-[#E6C87A]">
                  {benefit}
                </p>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#FF00B8] to-transparent opacity-60" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(135deg,#0A1028,#2D1B69_55%,#050711)] px-5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="relative inline-block">
            {canEdit && <ArcaneFieldButton field="processTitle" label="Modifier le titre de la section des étapes" />}
            <h2 className="font-cinzel-decorative text-4xl font-bold uppercase text-gradient-gold md:text-6xl">
              {content.processTitle}
            </h2>
          </div>
          <div className="relative mt-12 grid gap-5 md:grid-cols-4">
            {canEdit && <ArcaneFieldButton field="steps" label="Modifier les étapes du déroulement" />}
            {content.steps.map((step) => (
              <div key={step.number} className="border-l border-[#D4AF37]/40 pl-5">
                <span className="font-cinzel text-sm tracking-[0.25em] text-[#FF4FD8]">{step.number}</span>
                <h3 className="mt-4 font-cinzel text-lg uppercase tracking-[0.12em] text-[#E6C87A]">
                  {step.title}
                </h3>
                <p className="mt-4 font-cormorant text-lg leading-relaxed text-parchemin-vieilli/75">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid bg-[#050711] md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[360px] md:min-h-[760px]">
          {canEdit && <ArcaneFieldButton field="faqImageUrl" label="Changer l'image de la FAQ (médiathèque)" position="left-3 top-3" />}
          {canEdit && <ArcaneFieldButton field="faqImageAlt" label="Modifier le texte alternatif de l'image FAQ (SEO)" position="left-3 top-14" />}
          {faqImage && (
            <Image
              src={faqImage}
              alt={content.faqImageAlt}
              fill
              quality={85}
              sizes="(max-width: 768px) 100vw, 44vw"
              className="object-cover opacity-80"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050711] md:bg-gradient-to-l" />
        </div>
        <div className="relative px-5 py-20 md:px-12 md:py-28">
          {canEdit && <ArcaneFieldButton field="faqTitle" label="Modifier le titre de la section FAQ" />}
          <p className="font-cinzel text-xs uppercase tracking-[0.34em] text-[#00D9D9]">Avant de réserver</p>
          <h2 className="mt-4 font-cinzel-decorative text-4xl font-bold uppercase text-gradient-gold md:text-6xl">
            {content.faqTitle}
          </h2>
          <div className="relative mt-10 space-y-5">
            {canEdit && <ArcaneFieldButton field="faqs" label="Modifier les questions fréquentes" />}
            {content.faqs.map((faq) => (
              <details key={faq.question} className="rounded-sm border border-[#D4AF37]/25 bg-[#0A1028]/70 p-5">
                <summary className="font-cinzel text-sm uppercase tracking-[0.13em] text-[#E6C87A]">
                  {faq.question}
                </summary>
                <p className="mt-4 font-cormorant text-xl leading-relaxed text-parchemin-vieilli/75">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_30%,rgba(255,0,184,0.28),transparent_30%),linear-gradient(180deg,#2D1B69,#050711)] px-5 py-24 text-center md:py-32">
        <div className="absolute inset-x-10 top-12 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          {canEdit && <ArcaneFieldButton field="finalTitle" label="Modifier le titre de l'appel final" />}
          <h2 className="font-cinzel-decorative text-4xl font-black uppercase leading-tight text-gradient-gold md:text-7xl">
            {content.finalTitle}
          </h2>
        </div>
        <div className="relative mx-auto mt-8 max-w-3xl">
          {canEdit && <ArcaneFieldButton field="finalText" label="Modifier le texte de l'appel final" />}
          <p className="font-cormorant text-2xl italic leading-relaxed text-parchemin-vieilli/85">
            {content.finalText}
          </p>
        </div>
        <div className="mt-10">
          <Button href={offering.bookingHref} variant="or" size="lg">
            {content.ctaLabel}
          </Button>
        </div>
      </section>

    </article>
  );

  if (!canEdit) return body;

  return (
    <ArcaneEditorProvider
      offeringId={offering.id}
      targets={[
        { field: 'name', label: 'Titre principal du service', value: offering.name },
        { field: 'eyebrow', label: 'Petit texte au-dessus du titre', value: content.eyebrow },
        { field: 'subtitle', label: 'Sous-titre (sous le grand titre)', value: content.subtitle },
        { field: 'description', label: "Texte d'ouverture et méta description automatique", value: offering.description },
        { field: 'ctaLabel', label: 'Texte des boutons de réservation', value: content.ctaLabel },
        {
          field: 'imageUrl',
          label: 'Image du service',
          value: offering.imageUrl ?? '',
          helper: 'Colle une URL publique. Si le champ reste vide, le template utilise le visuel Noctura + Caracal fourni.',
        },
        { field: 'imageAlt', label: "Texte alternatif de l'image principale (SEO)", value: content.imageAlt },
        {
          field: 'backgroundUrl',
          label: 'Image de fond du hero',
          value: content.backgroundUrl ?? '',
          helper: 'URL publique. Recommandé : 1920 × 1080 px (paysage), JPG ou PNG. Vide = ancien hero en dégradé.',
        },
        {
          field: 'characterUrl',
          label: 'Image du personnage (premier plan)',
          value: content.characterUrl ?? '',
          helper: 'URL publique d\'un PNG/WebP TRANSPARENT (sujet détouré). Recommandé : ~1400 × 1600 px (portrait).',
        },
        {
          field: 'pillarIcons',
          label: 'Icônes devant les piliers',
          value: offering.features.map((_, i) => content.pillarIcons[i] ?? ''),
          items: offering.features,
          helper: 'Une icône par pilier (image transparente, idéalement WebP/PNG ~128 px). Laisse vide pour afficher une rune par défaut.',
        },
        { field: 'sanctuaryTitle', label: 'Titre de la section « sanctuaire »', value: content.sanctuaryTitle },
        { field: 'longDescription', label: 'Texte du sanctuaire', value: offering.longDescription },
        { field: 'pillarsTitle', label: 'Titre de la section des bienfaits', value: content.pillarsTitle },
        {
          field: 'features',
          label: 'Liste du panneau (hero)',
          value: offering.features,
          helper: 'Un élément par ligne. Aligné avec les icônes du panneau. Indépendant des bienfaits.',
        },
        {
          field: 'benefits',
          label: 'Bienfaits du rituel (cartes numérotées)',
          value: content.benefits,
          helper: 'Un bienfait par ligne. Section indépendante du panneau du hero.',
        },
        { field: 'processTitle', label: 'Titre de la section des étapes', value: content.processTitle },
        {
          field: 'steps',
          label: 'Étapes du déroulement',
          value: content.steps.map((step) => `${step.title} || ${step.text}`),
          helper: 'Une étape par ligne, au format : Titre || Description. La numérotation (01, 02…) est automatique.',
        },
        { field: 'faqTitle', label: 'Titre de la section FAQ', value: content.faqTitle },
        {
          field: 'faqs',
          label: 'Questions fréquentes',
          value: content.faqs.map((faq) => `${faq.question} || ${faq.answer}`),
          helper: 'Une question par ligne, au format : Question || Réponse.',
        },
        {
          field: 'faqImageUrl',
          label: 'Image de la section FAQ',
          value: content.faqImageUrl ?? '',
          helper: 'Recommandé : 1080 × 1080 px (carré). Téléverse ou choisis dans la médiathèque.',
        },
        { field: 'faqImageAlt', label: "Texte alternatif de l'image FAQ (SEO)", value: content.faqImageAlt },
        { field: 'finalTitle', label: "Titre de l'appel final", value: content.finalTitle },
        { field: 'finalText', label: "Texte de l'appel final", value: content.finalText },
      ]}
    >
      {body}
    </ArcaneEditorProvider>
  );
}
