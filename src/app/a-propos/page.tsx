import type { Metadata } from "next";
import Image from "next/image";
import SectionTitle from "@/components/ui/SectionTitle";
import RuneDivider from "@/components/ui/RuneDivider";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "A Propos de Noctura Anna | Runes & Magie",
  description:
    "Decouvrez l'histoire de Noctura Anna, guide spirituelle, passionnee de runes vikings, tarot, cristaux et magie naturelle. Fondatrice de Runes & Magie Boutique-Ecole.",
};

const galleryImages = [
  {
    src: "/images/about/noctura-capuche.jpg",
    alt: "Noctura Anna en capuche mystique",
  },
  {
    src: "/images/about/noctura-viking.jpg",
    alt: "Noctura Anna en tenue viking",
  },
  {
    src: "/images/about/noctura-boutique.jpg",
    alt: "Noctura Anna dans sa boutique",
  },
  {
    src: "/images/about/noctura-fleurs.jpg",
    alt: "Noctura Anna entouree de fleurs",
  },
  {
    src: "/images/about/noctura-festival.jpg",
    alt: "Noctura Anna lors d'un festival",
  },
  {
    src: "/images/about/noctura-ceremonie.jpg",
    alt: "Noctura Anna en ceremonie",
  },
];

export default function AProposPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/about/noctura-capuche.jpg"
            alt="Noctura Anna"
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-noir-nuit/60 via-noir-nuit/40 to-noir-nuit" />
        </div>

        {/* Overlay Text */}
        <div className="relative text-center px-4">
          <h1 className="font-cinzel-decorative text-4xl md:text-6xl lg:text-7xl font-bold text-gradient-gold mb-4">
            Noctura Anna
          </h1>
          <p className="font-philosopher text-xl md:text-2xl text-parchemin-vieilli italic">
            Votre Sorciere
          </p>
        </div>
      </section>

      {/* Mon Histoire */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <SectionTitle
            title="Mon Histoire"
            subtitle="Le chemin d'une ame guidee par les runes"
            as="h2"
          />

          <RuneDivider className="my-12" />

          <div className="space-y-6 text-parchemin-vieilli/90 text-lg leading-relaxed font-cormorant">
            <p>
              Je m&apos;appelle Annabelle Dionne, mais le monde spirituel me connait
              sous le nom de <strong className="text-or-ancien">Noctura Anna</strong>.
              Depuis mon plus jeune age, j&apos;ai ressenti un lien profond avec les
              forces invisibles qui tissent la trame de notre existence. Les murmures
              du vent, la sagesse des pierres, la danse des flammes — tout me parlait
              d&apos;un monde au-dela du visible, un monde de magie ancestrale et de
              connaissances oubliees.
            </p>

            <p>
              Mon chemin m&apos;a conduite vers les <strong className="text-or-ancien">runes
              vikings du Futhark ancien</strong>, ces symboles sacres graves dans la pierre
              par nos ancetres nordiques. Dans chaque rune, j&apos;ai decouvert une porte
              vers la comprehension de soi et du cosmos. Le tarot, les cristaux, les
              herbes magiques et les rituels ancestraux sont devenus mes compagnons
              quotidiens, mes outils de guerison et de transformation.
            </p>

            <p>
              Guide Spirituelle de vocation, j&apos;ai fonde{" "}
              <strong className="text-or-ancien">Runes &amp; Magie Boutique-Ecole</strong>{" "}
              avec une mission claire : transmettre ces savoirs ancestraux a ceux et
              celles qui ressentent l&apos;appel de la magie. Ma boutique-ecole, situee au
              coeur du Quebec, est un sanctuaire ou la sorcellerie se vit, s&apos;apprend
              et se partage dans le respect des traditions et la bienveillance.
            </p>

            <p>
              Au fil des annees, j&apos;ai eu le privilege de celebrer des{" "}
              <strong className="text-or-ancien">ceremonies sacrees</strong> — mariages
              spirituels, baptemes de lumiere, et celebrations de memoire pour ceux qui
              nous ont quittes. Chaque ceremonie est un acte d&apos;amour, un pont entre
              le visible et l&apos;invisible, une benediction qui honore les grands
              passages de la vie.
            </p>

            <p>
              J&apos;enseigne la sorcellerie avec passion et authenticite, offrant des
              cours et formations pour tous les niveaux. Mes <strong className="text-or-ancien">
              soins energetiques</strong> et seances de <strong className="text-or-ancien">
              deblocage emotionnel</strong> aident ceux qui portent des blessures
              invisibles a retrouver leur equilibre et leur lumiere interieure. Chaque
              personne qui franchit ma porte repart avec un peu plus de magie dans
              le coeur.
            </p>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <RuneDivider symbols="&#5765; &#10022; &#5765;" />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square overflow-hidden rounded-lg border border-violet-royal/30 group"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-noir-nuit/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ma Mission */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <SectionTitle
            title="Ma Mission"
            subtitle="Eclairer les ames, guerir les coeurs"
            as="h2"
          />

          <RuneDivider className="my-12" />

          <div className="space-y-6 text-parchemin-vieilli/90 text-lg leading-relaxed font-cormorant">
            <p>
              Ma mission est de creer un espace sacre ou chaque personne peut
              reconnecter avec sa propre magie interieure. Dans un monde qui nous
              pousse a oublier notre nature profonde, je crois que les arts
              ancestraux — la divination, la magie naturelle, le travail energetique —
              sont des chemins de retour vers soi.
            </p>

            <p>
              A travers Runes &amp; Magie, je souhaite batir une communaute de
              chercheurs et chercheuses spirituels, un cercle de lumiere ou le savoir
              se transmet avec generosite et ou chacun trouve sa place. Que vous soyez
              au debut de votre eveil ou praticien aguerri, ma porte vous est toujours
              ouverte.
            </p>

            <p className="text-center italic text-or-ancien/80 font-philosopher text-xl pt-4">
              &laquo; La magie n&apos;est pas un don reserve a quelques elus.
              Elle vit en chacun de nous, attendant d&apos;etre eveillee. &raquo;
            </p>
            <p className="text-center text-or-ancien font-cinzel text-sm tracking-wider">
              — Noctura Anna
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <RuneDivider />

          <div className="mt-12">
            <h2 className="font-cinzel text-2xl text-parchemin mb-4">
              Envie de me rencontrer?
            </h2>
            <p className="text-parchemin-vieilli/70 font-philosopher text-lg mb-8">
              Prenez rendez-vous pour une consultation ou venez decouvrir la boutique.
            </p>
            <Button href="/contact" variant="cta" size="lg">
              Prendre Rendez-vous
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
