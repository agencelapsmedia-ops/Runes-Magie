import Image from 'next/image';
import Button from '@/components/ui/Button';
import type { OfferingView } from '@/lib/offerings';
import {
  buildServiceJsonLd,
  buildServiceLandingContent,
  buildFaqJsonLd,
  buildBreadcrumbJsonLd,
  FONTS,
} from '@/lib/service-landing';
import { SITE_URL } from '@/lib/constants';
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
  const faqJsonLd = buildFaqJsonLd(offering);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(offering);

  // Colonne de texte partagée par les deux variantes de hero.
  const heroText = (titleClassName: string) => (
    <div className="relative z-10">
      <div className="relative inline-block">
        {canEdit && <ArcaneFieldButton field="eyebrow" label="Modifier le petit texte au-dessus du titre" />}
        <p className="ff-label text-xs uppercase tracking-[0.36em] text-[#00D9D9]">
          {content.eyebrow}
        </p>
      </div>
      <div className="relative mt-5">
        {canEdit && <ArcaneFieldButton field="name" label="Modifier le titre du service" />}
        <h1 className={titleClassName} style={{ fontFamily: FONTS[content.heroTitleFont].css }}>{content.title}</h1>
      </div>
      <div className="relative mt-7 max-w-xl">
        {canEdit && <ArcaneFieldButton field="subtitle" label="Modifier le sous-titre" />}
        <p className="ff-label text-sm uppercase tracking-[0.18em] text-[#E6C87A]/90 md:text-base">
          {content.subtitle}
        </p>
      </div>
      <div className="relative mt-6 max-w-xl">
        {canEdit && <ArcaneFieldButton field="intro" label="Modifier le texte d'ouverture" />}
        <p className="ff-corps text-xl italic leading-relaxed text-parchemin-vieilli/90 md:text-2xl">
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
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,17,0.12)_0%,rgba(5,7,17,0.18)_38%,rgba(5,7,17,0.88)_55%,rgba(5,7,17,0.96)_100%)] md:bg-[linear-gradient(90deg,rgba(5,7,17,0.92)_0%,rgba(5,7,17,0.6)_38%,rgba(5,7,17,0.25)_70%)]" />
      <div className="absolute inset-0 hidden bg-[linear-gradient(0deg,rgba(5,7,17,0.85)_0%,transparent_45%)] md:block" />

      {canEdit && <ArcaneFieldButton field="backgroundUrl" label="Modifier l'image de fond du hero" position="left-3 top-3" />}
      {canEdit && <ArcaneFieldButton field="imageAlt" label="Modifier le texte alternatif du fond (SEO)" position="left-3 top-14" />}

      {/* Personnage détouré */}
      {content.characterUrl && (
        <div className="pointer-events-none absolute left-1/2 top-20 h-[46vh] w-[92%] -translate-x-1/2 opacity-100 sm:top-24 sm:h-[54vh] sm:w-[72%] md:bottom-0 md:top-auto md:h-[92%] md:w-[44%] lg:w-[46%]">
          <Image
            src={content.characterUrl}
            alt={content.imageAlt}
            fill
            priority
            quality={85}
            sizes="(max-width: 640px) 92vw, (max-width: 768px) 72vw, 46vw"
            className="object-contain object-top drop-shadow-[0_0_60px_rgba(106,0,255,0.4)] md:object-bottom"
          />
        </div>
      )}
      <div className="pointer-events-none absolute left-1/2 top-[48vh] h-28 w-[88%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(5,7,17,0.82)_0%,rgba(5,7,17,0.42)_45%,transparent_72%)] blur-sm md:hidden" />
      {canEdit && <ArcaneFieldButton field="characterUrl" label="Modifier l'image du personnage (PNG transparent)" position="right-3 top-3" />}

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-start gap-10 px-5 pb-16 pt-[54vh] sm:pt-[58vh] md:grid md:grid-cols-[1.05fr_0.95fr] md:items-center md:justify-center md:px-8 md:py-16 lg:px-10">
        {heroText(
          'ff-titre text-[clamp(3rem,9vw,7.5rem)] font-black uppercase leading-[0.85] tracking-[0.04em] bg-gradient-to-br from-[#E7D6FF] via-[#A56BFF] to-[#6A00FF] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(106,0,255,0.45)]',
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
                  <span aria-hidden className="w-7 shrink-0 text-center ff-titre text-2xl text-[#E6C87A] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                    {content.pillarRunes[index % content.pillarRunes.length]}
                  </span>
                )}
                <span className="ff-label text-sm uppercase tracking-[0.12em] text-parchemin/90">
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
          'ff-titre text-[clamp(3rem,9vw,8rem)] font-black uppercase leading-[0.85] tracking-[0.05em] text-gradient-gold drop-shadow-[0_0_28px_rgba(212,175,55,0.22)]',
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
    <article
      className="overflow-hidden bg-[#050711] text-parchemin"
      style={
        {
          '--ff-titre': FONTS[content.titleFont].css,
          '--ff-label': FONTS[content.labelFont].css,
          '--ff-corps': FONTS[content.bodyFont].css,
        } as React.CSSProperties
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {heroSection}

      <section className="relative overflow-hidden bg-[#050711] px-5 py-16 md:min-h-[520px] md:px-8 md:py-20">
        <Image
          src="/images/services/arcane/background-rituel-1920-web.webp"
          alt=""
          aria-hidden
          fill
          quality={88}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,17,0.92),rgba(5,7,17,0.78)_40%,rgba(5,7,17,0.9)),linear-gradient(90deg,rgba(5,7,17,0.96)_0%,rgba(5,7,17,0.72)_48%,rgba(5,7,17,0.28)_100%)] md:bg-[linear-gradient(90deg,rgba(5,7,17,0.95)_0%,rgba(5,7,17,0.64)_42%,rgba(5,7,17,0.16)_74%,rgba(5,7,17,0.5)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#6A00FF]/70 to-transparent" />

        <div className="relative mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div className="max-w-md">
            <div className="relative">
              {canEdit && <ArcaneFieldButton field="recognitionTitle" label="Modifier le titre de la section reconnaissance" />}
              {canEdit && <ArcaneFieldButton field="recognitionTitleFont" label="Police du titre reconnaissance" position="-right-12 top-0" />}
              <h2 className="ff-titre text-3xl font-bold uppercase leading-tight tracking-[0.08em] text-[#E6C87A] drop-shadow-[0_0_18px_rgba(212,175,55,0.28)] md:text-5xl" style={{ fontFamily: FONTS[content.recognitionTitleFont].css }}>
                {content.recognitionTitle}
              </h2>
            </div>
            <div className="relative mt-5">
              {canEdit && <ArcaneFieldButton field="recognitionIntro" label="Modifier le texte d'introduction reconnaissance" />}
              <p className="ff-corps text-xl font-semibold leading-snug text-parchemin-vieilli/85 md:text-2xl">
                {content.recognitionIntro}
              </p>
            </div>

            <ul className="relative mt-7 space-y-4">
              {canEdit && <ArcaneFieldButton field="recognitionItems" label="Modifier la liste de reconnaissance" />}
              {content.recognitionItems.map((item) => (
                <li key={item} className="flex gap-3 ff-corps text-lg leading-snug text-parchemin/88">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C47BFF]/80 text-xs text-white shadow-[0_0_12px_rgba(196,123,255,0.55)]">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="relative mt-9 flex gap-4 text-[#DDB7FF]">
              {canEdit && <ArcaneFieldButton field="recognitionFinalText" label="Modifier la phrase finale reconnaissance" />}
              <span aria-hidden className="ff-titre text-4xl leading-none">✥</span>
              <p className="whitespace-pre-line ff-corps text-xl font-semibold leading-snug">
                {content.recognitionFinalText}
              </p>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="relative max-w-sm text-center ff-corps text-3xl font-semibold leading-relaxed text-parchemin drop-shadow-[0_0_18px_rgba(196,123,255,0.35)] md:mr-20 md:text-4xl">
              {canEdit && <ArcaneFieldButton field="recognitionPortalText" label="Modifier le texte du portail" />}
              <p className="whitespace-pre-line">{content.recognitionPortalText}</p>
              <div className="mx-auto mt-7 h-px w-28 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-[#D4AF37]/20 bg-[linear-gradient(180deg,#050711,#0A1028)] px-5 py-20 md:py-28">
        <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent" />
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.82fr_1.18fr] md:items-center">
          <div className="relative">
            {canEdit && <ArcaneFieldButton field="sanctuaryTitle" label="Modifier le titre du sanctuaire" />}
            <p className="ff-label text-xs uppercase tracking-[0.3em] text-[#FF4FD8]">Le sanctuaire</p>
            <h2 className="mt-4 ff-titre text-4xl font-bold uppercase leading-tight text-gradient-gold md:text-6xl" style={{ fontFamily: FONTS[content.sanctuaryTitleFont].css }}>
              {content.sanctuaryTitle}
            </h2>
          </div>
          <div className="relative rounded-sm border border-[#D4AF37]/35 bg-[#0A1028]/72 p-7 shadow-[0_0_40px_rgba(106,0,255,0.22)] md:p-10">
            {canEdit && <ArcaneFieldButton field="sanctuaryText" label="Modifier le texte du sanctuaire" />}
            <p className="ff-corps text-2xl italic leading-relaxed text-parchemin-vieilli/90">
              {content.sanctuaryText}
            </p>
          </div>
        </div>
      </section>

      <section className="relative bg-[radial-gradient(circle_at_50%_0%,rgba(106,0,255,0.28),transparent_34%),#080812] px-5 py-20 md:py-28">
        <div className="relative mx-auto max-w-6xl">
          {canEdit && <ArcaneFieldButton field="pillarsTitle" label="Modifier le titre de la section des bienfaits" />}
          <p className="text-center ff-label text-xs uppercase tracking-[0.34em] text-[#00D9D9]">Activation</p>
          <h2 className="mx-auto mt-4 max-w-4xl text-center ff-titre text-4xl font-bold uppercase text-gradient-gold md:text-6xl" style={{ fontFamily: FONTS[content.pillarsTitleFont].css }}>
            {content.pillarsTitle}
          </h2>
          <div className="relative mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {canEdit && <ArcaneFieldButton field="benefits" label="Modifier les bienfaits du rituel" />}
            {content.benefits.map((benefit, index) => (
              <div
                key={`${benefit}-${index}`}
                className="group relative overflow-hidden rounded-sm border border-[#D4AF37]/25 bg-[#101431]/80 p-6 shadow-[0_0_24px_rgba(45,27,105,0.32)]"
              >
                <span className="ff-titre text-5xl text-[#D4AF37]/28">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <p className="mt-5 ff-label text-sm uppercase tracking-[0.16em] text-[#E6C87A]">
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
            <h2 className="ff-titre text-4xl font-bold uppercase text-gradient-gold md:text-6xl">
              {content.processTitle}
            </h2>
          </div>
          <div className="relative mt-12 grid gap-5 md:grid-cols-4 lg:grid-cols-5">
            {canEdit && <ArcaneFieldButton field="steps" label="Modifier les étapes du déroulement" />}
            {content.steps.map((step) => (
              <div key={step.number} className="border-l border-[#D4AF37]/40 pl-5">
                <span className="ff-label text-sm tracking-[0.25em] text-[#FF4FD8]">{step.number}</span>
                <h3 className="mt-4 ff-label text-lg uppercase tracking-[0.12em] text-[#E6C87A]">
                  {step.title}
                </h3>
                <p className="mt-4 ff-corps text-lg leading-relaxed text-parchemin-vieilli/75">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid bg-[#050711] md:grid-cols-[0.9fr_1.1fr]">
        {/* Colonne gauche : image carrée (recommandé 1080 × 1080) */}
        <div className="relative min-h-[420px] md:min-h-[720px]">
          {canEdit && <ArcaneFieldButton field="faqImageUrl" label="Changer l'image de la FAQ (médiathèque)" position="left-3 top-3" />}
          {canEdit && <ArcaneFieldButton field="faqImageAlt" label="Modifier le texte alternatif de l'image FAQ (SEO)" position="left-3 top-14" />}
          {faqImage && (
            <Image
              src={faqImage}
              alt={content.faqImageAlt}
              fill
              quality={85}
              sizes="(max-width: 768px) 100vw, 44vw"
              className="object-cover"
            />
          )}
        </div>

        {/* Colonne droite : titre + questions à icônes */}
        <div className="relative px-5 py-16 md:px-10 md:py-20">
          <div className="relative">
            {canEdit && <ArcaneFieldButton field="faqTitle" label="Modifier le titre de la section FAQ" />}
            <p className="ff-label text-xs uppercase tracking-[0.4em] text-[#00D9D9] drop-shadow-[0_0_12px_rgba(0,217,217,0.6)]">
              Questions fréquemment posées
            </p>
            <h2 className="mt-3 ff-titre text-4xl font-black uppercase leading-none tracking-[0.06em] text-[#F8B7FF] drop-shadow-[0_0_22px_rgba(255,79,216,0.6)] md:text-6xl" style={{ fontFamily: FONTS[content.faqTitleFont].css }}>
              {content.title}
            </h2>
            <div className="mt-5 flex max-w-md items-center gap-4">
              <span className="h-px flex-1 bg-gradient-to-r from-[#D4AF37]/70 to-[#D4AF37]/10" />
              <span className="h-3 w-3 rotate-45 border border-[#FF4FD8] shadow-[0_0_14px_rgba(255,79,216,0.9)]" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
            </div>
            <p className="mt-4 ff-label text-xs uppercase tracking-[0.28em] text-[#E6C87A]/85">
              {content.faqTitle}
            </p>
          </div>

          <div className="relative mt-10">
            {canEdit && <ArcaneFieldButton field="faqs" label="Modifier les questions fréquentes" />}
            <div className="space-y-0">
              {content.faqs.map((faq, index) => {
                const icon = content.pillarIcons.length
                  ? content.pillarIcons[index % content.pillarIcons.length]?.trim()
                  : '';
                return (
                  <div
                    key={faq.question}
                    className="grid grid-cols-[auto_1fr] items-start gap-4 border-t border-[#D4AF37]/20 py-6 first:border-t-0 md:gap-6"
                  >
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#F8B7FF]/70 bg-[#0A1028]/80 shadow-[0_0_22px_rgba(255,79,216,0.4),inset_0_0_20px_rgba(0,217,217,0.12)] md:h-20 md:w-20">
                      <div className="absolute inset-2 rounded-full border border-[#00D9D9]/35" />
                      {icon ? (
                        <Image
                          src={icon}
                          alt=""
                          aria-hidden
                          width={48}
                          height={48}
                          unoptimized
                          className="relative h-10 w-10 object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.65)] md:h-12 md:w-12"
                        />
                      ) : (
                        <span aria-hidden className="relative ff-titre text-3xl text-[#E6C87A] drop-shadow-[0_0_12px_rgba(212,175,55,0.8)]">
                          {content.pillarRunes[index % content.pillarRunes.length]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="ff-label text-sm uppercase tracking-[0.16em] text-[#00D9D9] drop-shadow-[0_0_10px_rgba(0,217,217,0.5)] md:text-base">
                        {faq.question}
                      </h3>
                      <p className="mt-2 ff-corps text-lg leading-relaxed text-parchemin-vieilli/82 md:text-xl">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_30%,rgba(255,0,184,0.28),transparent_30%),linear-gradient(180deg,#2D1B69,#050711)] px-5 py-24 text-center md:py-32">
        <div className="absolute inset-x-10 top-12 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          {canEdit && <ArcaneFieldButton field="finalTitle" label="Modifier le titre de l'appel final" />}
          <h2 className="ff-titre text-4xl font-black uppercase leading-tight text-gradient-gold md:text-7xl" style={{ fontFamily: FONTS[content.finalTitleFont].css }}>
            {content.finalTitle}
          </h2>
        </div>
        <div className="relative mx-auto mt-8 max-w-3xl">
          {canEdit && <ArcaneFieldButton field="finalText" label="Modifier le texte de l'appel final" />}
          <p className="ff-corps text-2xl italic leading-relaxed text-parchemin-vieilli/85">
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

  const autoTitle = `${offering.name} avec ${offering.practitionerName} | La Voie des Arcanes`;
  const autoDescription =
    content.intro.length > 155 ? `${content.intro.slice(0, 152)}...` : content.intro;
  const seoBodyText = [
    content.subtitle,
    content.intro,
    content.recognitionTitle,
    content.recognitionIntro,
    ...content.recognitionItems,
    content.recognitionFinalText,
    content.recognitionPortalText,
    content.sanctuaryText,
    ...offering.features,
    ...content.benefits,
    ...content.steps.map((s) => `${s.title} ${s.text}`),
    ...content.faqs.map((f) => `${f.question} ${f.answer}`),
    content.finalText,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ArcaneEditorProvider
      offeringId={offering.id}
      seo={{
        slug: offering.slug,
        detailHref: offering.detailHref,
        adminEditHref: `/admin/offerings/${offering.id}/edit`,
        siteUrl: SITE_URL,
        metaTitle: content.metaTitle,
        metaDescription: content.metaDescription,
        focusKeyword: content.focusKeyword,
        ogImage: content.ogImage,
        autoTitle,
        autoDescription,
        heroImage: content.heroImage ?? '',
        h1: content.title,
        intro: content.intro,
        bodyText: seoBodyText,
        imageAlts: [content.imageAlt, content.faqImageAlt],
        faqCount: content.faqs.length,
      }}
      targets={[
        { field: 'name', label: 'Titre principal du service', value: offering.name },
        { field: 'titleFont', label: 'Police des grands titres', value: content.titleFont },
        { field: 'labelFont', label: 'Police des sous-titres et labels', value: content.labelFont },
        { field: 'bodyFont', label: 'Police des paragraphes', value: content.bodyFont },
        { field: 'eyebrow', label: 'Petit texte au-dessus du titre', value: content.eyebrow },
        { field: 'subtitle', label: 'Sous-titre (sous le grand titre)', value: content.subtitle },
        { field: 'intro', label: "Texte d'ouverture (paragraphe sous le titre + méta description)", value: content.intro },
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
        { field: 'sanctuaryText', label: 'Texte du sanctuaire', value: content.sanctuaryText },
        { field: 'recognitionTitleFont', label: 'Police du titre de reconnaissance', value: content.recognitionTitleFont },
        { field: 'recognitionTitle', label: 'Titre de la section reconnaissance', value: content.recognitionTitle },
        { field: 'recognitionIntro', label: 'Introduction de la section reconnaissance', value: content.recognitionIntro },
        {
          field: 'recognitionItems',
          label: 'Liste de reconnaissance',
          value: content.recognitionItems,
          helper: 'Un point par ligne. Ces éléments s’affichent avec les pastilles violettes.',
        },
        { field: 'recognitionFinalText', label: 'Phrase finale de reconnaissance', value: content.recognitionFinalText },
        {
          field: 'recognitionPortalText',
          label: 'Texte dans le portail',
          value: content.recognitionPortalText,
          helper: 'Texte court recommandé pour rester lisible dans le portail.',
        },
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
