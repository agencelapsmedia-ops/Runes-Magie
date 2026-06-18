import Image from 'next/image';
import Button from '@/components/ui/Button';
import type { OfferingView } from '@/lib/offerings';
import { buildServiceJsonLd, buildServiceLandingContent } from '@/lib/service-landing';
import ArcaneInlineEditor, { ArcaneFieldButton } from '@/components/services/ArcaneInlineEditor';

interface ServiceLandingTemplateProps {
  offering: OfferingView;
  canEdit: boolean;
}

const RITUAL_STEPS = [
  {
    number: '01',
    title: 'Accueil du seuil',
    text: "Noctura t'accueille dans un espace calme, protégé, sans jugement. Tu peux nommer ce qui pèse ou simplement arriver avec ton silence.",
  },
  {
    number: '02',
    title: 'Lecture de ce qui pèse',
    text: "Le rituel s'ouvre par l'écoute de ton énergie, de ton souffle, de tes tensions et de ce que l'invisible révèle.",
  },
  {
    number: '03',
    title: 'Transmutation',
    text: "Les outils sacrés, les chants, les éléments et la présence de Noctura accompagnent la dissolution des charges qui ne t'appartiennent plus.",
  },
  {
    number: '04',
    title: 'Retour au souffle',
    text: "Le soin se referme doucement pour que ton corps, ton coeur et ton âme puissent intégrer l'apaisement.",
  },
];

export default function ServiceLandingTemplate({ offering, canEdit }: ServiceLandingTemplateProps) {
  const content = buildServiceLandingContent(offering);
  const heroImage = content.heroImage;
  const faqImage = offering.slug === 'soin-rituel'
    ? '/images/services/arcane/soin-rituel-faq.jpg'
    : heroImage;
  const jsonLd = buildServiceJsonLd(offering);

  return (
    <article className="overflow-hidden bg-[#050711] text-parchemin">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[radial-gradient(circle_at_70%_30%,rgba(255,0,184,0.28),transparent_28%),linear-gradient(135deg,#0A1028_0%,#2D1B69_48%,#050711_100%)]">
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(115deg,transparent_0_44%,rgba(212,175,55,0.18)_45%,transparent_46%),radial-gradient(circle_at_18%_18%,rgba(0,217,217,0.18),transparent_22%)]" />
        <div className="absolute left-1/2 top-10 h-[82vh] w-[82vh] -translate-x-1/2 rounded-full border border-[#D4AF37]/20 opacity-70 shadow-[0_0_90px_rgba(106,0,255,0.45)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-[0.92fr_1.08fr] md:px-8 lg:px-10">
          <div className="z-10">
            <p className="font-cinzel text-xs uppercase tracking-[0.36em] text-[#00D9D9]">
              {content.eyebrow}
            </p>
            <div className="relative mt-5">
              {canEdit && <ArcaneFieldButton field="name" label="Modifier le titre du service" />}
              <h1 className="font-cinzel-decorative text-[clamp(3rem,9vw,8rem)] font-black uppercase leading-[0.85] tracking-[0.05em] text-gradient-gold drop-shadow-[0_0_28px_rgba(212,175,55,0.22)]">
                {content.title}
              </h1>
            </div>
            <p className="mt-7 max-w-2xl font-cinzel text-sm uppercase tracking-[0.18em] text-[#E6C87A]/90 md:text-base">
              {content.subtitle}
            </p>
            <div className="relative mt-7 max-w-2xl">
              {canEdit && <ArcaneFieldButton field="description" label="Modifier le texte d'ouverture" />}
              <p className="font-cormorant text-2xl italic leading-relaxed text-parchemin-vieilli/90 md:text-3xl">
                {content.intro}
              </p>
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button href={offering.bookingHref} variant="or" size="lg">
                {content.ctaLabel}
              </Button>
              <p className="font-philosopher text-sm text-parchemin/60">
                {offering.priceLabel} · {offering.durationLabel}
              </p>
            </div>
          </div>

          <div className="relative min-h-[420px] md:min-h-[680px]">
            {canEdit && <ArcaneFieldButton field="imageUrl" label="Modifier l'image principale du service" />}
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

      <section className="relative border-y border-[#D4AF37]/20 bg-[linear-gradient(180deg,#050711,#0A1028)] px-5 py-20 md:py-28">
        <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent" />
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.82fr_1.18fr] md:items-center">
          <div>
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
        <div className="mx-auto max-w-6xl">
          <p className="text-center font-cinzel text-xs uppercase tracking-[0.34em] text-[#00D9D9]">Activation</p>
          <h2 className="mx-auto mt-4 max-w-4xl text-center font-cinzel-decorative text-4xl font-bold uppercase text-gradient-gold md:text-6xl">
            {content.pillarsTitle}
          </h2>
          <div className="relative mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {canEdit && <ArcaneFieldButton field="features" label="Modifier les piliers du soin" />}
            {offering.features.map((feature, index) => (
              <div
                key={`${feature}-${index}`}
                className="group relative overflow-hidden rounded-sm border border-[#D4AF37]/25 bg-[#101431]/80 p-6 shadow-[0_0_24px_rgba(45,27,105,0.32)]"
              >
                <span className="font-cinzel-decorative text-5xl text-[#D4AF37]/28">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <p className="mt-5 font-cinzel text-sm uppercase tracking-[0.16em] text-[#E6C87A]">
                  {feature}
                </p>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#FF00B8] to-transparent opacity-60" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(135deg,#0A1028,#2D1B69_55%,#050711)] px-5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-cinzel-decorative text-4xl font-bold uppercase text-gradient-gold md:text-6xl">
            {content.processTitle}
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {RITUAL_STEPS.map((step) => (
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
          {faqImage && (
            <Image
              src={faqImage}
              alt="Questions fréquentes sur le Soin Rituel"
              fill
              quality={85}
              sizes="(max-width: 768px) 100vw, 44vw"
              className="object-cover opacity-80"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050711] md:bg-gradient-to-l" />
        </div>
        <div className="px-5 py-20 md:px-12 md:py-28">
          <p className="font-cinzel text-xs uppercase tracking-[0.34em] text-[#00D9D9]">Avant de réserver</p>
          <h2 className="mt-4 font-cinzel-decorative text-4xl font-bold uppercase text-gradient-gold md:text-6xl">
            {content.faqTitle}
          </h2>
          <div className="mt-10 space-y-5">
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
        <h2 className="mx-auto max-w-5xl font-cinzel-decorative text-4xl font-black uppercase leading-tight text-gradient-gold md:text-7xl">
          {content.finalTitle}
        </h2>
        <p className="mx-auto mt-8 max-w-3xl font-cormorant text-2xl italic leading-relaxed text-parchemin-vieilli/85">
          {content.finalText}
        </p>
        <div className="mt-10">
          <Button href={offering.bookingHref} variant="or" size="lg">
            {content.ctaLabel}
          </Button>
        </div>
      </section>

      {canEdit && (
        <ArcaneInlineEditor
          offeringId={offering.id}
          targets={[
            { field: 'name', label: 'Titre principal du service', value: offering.name },
            { field: 'description', label: "Texte d'ouverture et méta description automatique", value: offering.description },
            { field: 'longDescription', label: 'Texte du sanctuaire', value: offering.longDescription },
            {
              field: 'imageUrl',
              label: 'Image du service',
              value: offering.imageUrl ?? '',
              helper: 'Colle une URL publique. Si le champ reste vide, le template utilise le visuel Noctura + Caracal fourni.',
            },
            {
              field: 'features',
              label: 'Piliers du soin',
              value: offering.features,
              helper: 'Un pilier par ligne.',
            },
          ]}
        />
      )}
    </article>
  );
}
