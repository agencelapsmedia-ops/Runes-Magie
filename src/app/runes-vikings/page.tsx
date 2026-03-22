import type { Metadata } from "next";
import Link from "next/link";
import SectionTitle from "@/components/ui/SectionTitle";
import RuneDivider from "@/components/ui/RuneDivider";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Les Runes Vikings | Runes & Magie",
  description:
    "Explorez l'alphabet sacre Elder Futhark, la magie runique nordique, les trois Aetts et les secrets de la sorcellerie scandinave.",
};

/* ------------------------------------------------------------------
   Data
   ------------------------------------------------------------------ */

const aetts = [
  {
    name: "1er Aett — Freyr & Freyja",
    runes: "ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ",
    theme: "Fertilite, force, abondance",
    description:
      "Le premier Aett est gouverne par les divinites Vanir de la fertilite et de l'amour. Ces huit runes representent les forces fondamentales de la creation, de la richesse materielle et de la joie terrestre.",
  },
  {
    name: "2e Aett — Heimdall",
    runes: "ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ",
    theme: "Protection, defense, cycles",
    description:
      "Le deuxieme Aett est place sous la garde de Heimdall, le gardien du pont Bifrost. Ces runes evoquent les epreuves de la vie, les cycles naturels et les forces cosmiques qui defient l'humanite.",
  },
  {
    name: "3e Aett — Tyr",
    runes: "ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ",
    theme: "Justice, transformation, heritage",
    description:
      "Le troisieme Aett est consacre a Tyr, dieu du courage et de la justice. Ces runes touchent a l'experience humaine profonde : la naissance, la mort, l'heritage ancestral et l'eveil spirituel.",
  },
];

const elderFuthark = [
  { symbol: "ᚠ", name: "Fehu", sound: "F", meaning: "Richesse / abondance" },
  { symbol: "ᚢ", name: "Uruz", sound: "U", meaning: "Force vitale" },
  { symbol: "ᚦ", name: "Thurisaz", sound: "TH", meaning: "Pouvoir protecteur" },
  { symbol: "ᚨ", name: "Ansuz", sound: "A", meaning: "Parole sacree" },
  { symbol: "ᚱ", name: "Raidho", sound: "R", meaning: "Voyage / quete" },
  { symbol: "ᚲ", name: "Kaunan", sound: "K", meaning: "Connaissance" },
  { symbol: "ᚷ", name: "Gebo", sound: "G", meaning: "Don / offrande" },
  { symbol: "ᚹ", name: "Wunjo", sound: "W", meaning: "Joie / harmonie" },
  { symbol: "ᚺ", name: "Hagalaz", sound: "H", meaning: "Destruction / chaos" },
  { symbol: "ᚾ", name: "Nauthiz", sound: "N", meaning: "Besoin / destin" },
  { symbol: "ᛁ", name: "Isa", sound: "I", meaning: "Glace / immobilite" },
  { symbol: "ᛃ", name: "Jera", sound: "J", meaning: "Cycle / recolte" },
  { symbol: "ᛇ", name: "Eihwaz", sound: "EI", meaning: "Vie et mort" },
  { symbol: "ᛈ", name: "Perthro", sound: "P", meaning: "Mystere / divination" },
  { symbol: "ᛉ", name: "Algiz", sound: "Z", meaning: "Protection divine" },
  { symbol: "ᛊ", name: "Sowilo", sound: "S", meaning: "Soleil / victoire" },
  { symbol: "ᛏ", name: "Tiwaz", sound: "T", meaning: "Justice / sacrifice" },
  { symbol: "ᛒ", name: "Berkana", sound: "B", meaning: "Naissance / croissance" },
  { symbol: "ᛖ", name: "Ehwaz", sound: "E", meaning: "Mouvement / loyaute" },
  { symbol: "ᛗ", name: "Mannaz", sound: "M", meaning: "L'humain / conscience" },
  { symbol: "ᛚ", name: "Laguz", sound: "L", meaning: "Eau / magie / intuition" },
  { symbol: "ᛜ", name: "Ingwaz", sound: "ING", meaning: "Fertilite / potentiel" },
  { symbol: "ᛞ", name: "Dagaz", sound: "D", meaning: "Transformation / eveil" },
  { symbol: "ᛟ", name: "Othala", sound: "O", meaning: "Heritage / ancetres" },
];

const protectionRunes = [
  {
    symbol: "ᛉ",
    name: "Algiz",
    power: "Protection supreme",
    usage:
      "Gravee sur les boucliers et les seuils de porte pour repousser les forces malveillantes. C'est la rune de protection la plus puissante du Futhark.",
  },
  {
    symbol: "ᛏ",
    name: "Tiwaz",
    power: "Victoire et justice",
    usage:
      "Gravee sur les epees et les lances avant la bataille. Invoquee pour obtenir la victoire juste et le courage du guerrier.",
  },
  {
    symbol: "ᚦ",
    name: "Thurisaz",
    power: "Defense active",
    usage:
      "Representant le marteau de Thor, cette rune est utilisee pour briser les obstacles et repousser les ennemis par la force brute.",
  },
  {
    symbol: "ᛊ",
    name: "Sowilo",
    power: "Lumiere et guerison",
    usage:
      "Associee au soleil, elle chasse les tenebres et les maladies. Utilisee dans les rituels de guerison et pour renforcer la volonte.",
  },
  {
    symbol: "ᛚ",
    name: "Laguz",
    power: "Magie intuitive",
    usage:
      "Liee aux eaux profondes et a l'intuition feminine. Utilisee par les voelvas pour ouvrir le troisieme oeil et voir au-dela du voile.",
  },
  {
    symbol: "ᚷ",
    name: "Gebo",
    power: "Alliance sacree",
    usage:
      "Rune des pactes et des serments. Gravee pour sceller les alliances entre clans et invoquer la reciprocite divine.",
  },
];

/* ------------------------------------------------------------------
   Page Component
   ------------------------------------------------------------------ */

export default function RunesVikingsPage() {
  return (
    <main className="min-h-screen bg-noir-nuit text-parchemin">
      {/* ============================================================
          HERO
          ============================================================ */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Decorative background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-royal/10 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <SectionTitle
            title="Les Runes Vikings"
            subtitle="Alphabet Sacre & Sorcellerie Scandinave"
            as="h1"
          />

          {/* Quote block */}
          <blockquote className="mt-12 max-w-2xl mx-auto border-l-2 border-or-ancien/40 pl-6 text-left">
            <p className="font-cormorant text-xl md:text-2xl italic text-parchemin-vieilli leading-relaxed">
              &laquo;&thinsp;Les runes ne sont pas de simples lettres &mdash;
              elles sont des portes vers les dieux.&thinsp;&raquo;
            </p>
            <footer className="mt-3 font-cinzel text-sm text-or-ancien/70 tracking-wider">
              &mdash; Havamal
            </footer>
          </blockquote>
        </div>
      </section>

      <RuneDivider symbols="ᚠ ᚢ ᚦ" />

      {/* ============================================================
          INTRODUCTION — L'Origine des Runes
          ============================================================ */}
      <section className="py-16 md:py-24 max-w-4xl mx-auto px-6">
        <SectionTitle title="L'Origine des Runes" className="mb-12" />

        <div className="space-y-6 font-cormorant text-lg md:text-xl leading-relaxed text-parchemin/85">
          <p>
            Selon la mythologie nordique, les runes furent decouvertes par Odin
            lui-meme, le Pere-de-Tout. Afin d'obtenir la sagesse supreme, il se
            pendit a l'arbre cosmique Yggdrasil pendant neuf jours et neuf
            nuits, transperce par sa propre lance Gungnir, sans nourriture ni
            eau.
          </p>
          <p>
            Au terme de cette epreuve sacrificielle, les runes se revelerent a
            lui dans les profondeurs de l'abime. Ce n'etait pas une simple
            invention humaine &mdash; c'etait un don arrache au tissu meme de
            l'univers.
          </p>
          <p>
            Le mot <em className="text-or-ancien">&laquo;&thinsp;rune&thinsp;&raquo;</em>{" "}
            vient du vieux norrois <em className="text-or-ancien">run</em>, qui
            signifie{" "}
            <strong className="text-or-ancien">
              &laquo;&thinsp;secret murmure&thinsp;&raquo;
            </strong>
            . Les runes ne sont donc pas de simples lettres d'un alphabet : elles
            portent en elles un pouvoir magique intrinseque, un mystere sacre que
            seuls les inities peuvent dechiffrer.
          </p>
        </div>
      </section>

      <RuneDivider symbols="ᚨ ᚱ ᚲ" />

      {/* ============================================================
          LES TROIS AETTS
          ============================================================ */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-6">
        <SectionTitle
          title="Les Trois Aetts"
          subtitle="Les 24 runes du Futhark ancien sont divisees en trois familles de huit"
          className="mb-16"
        />

        <div className="grid md:grid-cols-3 gap-8">
          {aetts.map((aett) => (
            <div
              key={aett.name}
              className="relative group rounded-lg border border-violet-royal/30 bg-charbon-mystere/60 p-8 text-center
                hover:border-or-ancien/40 hover:shadow-[0_0_30px_rgba(201,168,76,0.1)] transition-all duration-500"
            >
              {/* Rune characters */}
              <p
                className="text-3xl md:text-4xl tracking-[0.3em] leading-relaxed mb-6 select-none"
                style={{ color: "#C9A84C" }}
                aria-label={`Runes: ${aett.runes}`}
              >
                {aett.runes}
              </p>

              {/* Aett name */}
              <h3 className="font-cinzel text-lg text-parchemin font-semibold mb-2">
                {aett.name}
              </h3>

              {/* Theme tag */}
              <p className="font-philosopher text-sm text-or-ancien/80 italic mb-4">
                {aett.theme}
              </p>

              {/* Description */}
              <p className="font-cormorant text-base text-parchemin/70 leading-relaxed">
                {aett.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <RuneDivider symbols="ᛁ ᛃ ᛇ" />

      {/* ============================================================
          ALPHABET COMPLET — Elder Futhark
          ============================================================ */}
      <section className="py-16 md:py-24 max-w-5xl mx-auto px-6">
        <SectionTitle
          title="Alphabet Complet"
          subtitle="Les 24 runes du Futhark Ancien (Elder Futhark)"
          className="mb-16"
        />

        <div className="overflow-x-auto rounded-lg border border-violet-royal/30">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-violet-profond/80 border-b border-violet-royal/40">
                <th className="px-6 py-4 font-cinzel text-sm uppercase tracking-wider text-or-ancien">
                  Rune
                </th>
                <th className="px-6 py-4 font-cinzel text-sm uppercase tracking-wider text-or-ancien">
                  Nom
                </th>
                <th className="px-6 py-4 font-cinzel text-sm uppercase tracking-wider text-or-ancien">
                  Son
                </th>
                <th className="px-6 py-4 font-cinzel text-sm uppercase tracking-wider text-or-ancien">
                  Signification
                </th>
              </tr>
            </thead>
            <tbody>
              {elderFuthark.map((rune, i) => (
                <tr
                  key={rune.name}
                  className={
                    i % 2 === 0
                      ? "bg-charbon-mystere/60"
                      : "bg-violet-profond/30"
                  }
                >
                  <td
                    className="px-6 py-4 text-3xl select-none"
                    style={{ color: "#C9A84C" }}
                  >
                    {rune.symbol}
                  </td>
                  <td className="px-6 py-4 font-cinzel text-parchemin">
                    {rune.name}
                  </td>
                  <td className="px-6 py-4 font-philosopher text-parchemin/70">
                    {rune.sound}
                  </td>
                  <td className="px-6 py-4 font-cormorant text-lg text-parchemin/80">
                    {rune.meaning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <RuneDivider symbols="ᛈ ᛉ ᛊ" />

      {/* ============================================================
          LA MAGIE RUNIQUE
          ============================================================ */}
      <section className="py-16 md:py-24 max-w-5xl mx-auto px-6">
        <SectionTitle
          title="La Magie Runique"
          subtitle="Deux traditions complementaires de sorcellerie nordique"
          className="mb-16"
        />

        <div className="grid md:grid-cols-2 gap-10">
          {/* Le Galdr */}
          <div className="rounded-lg border border-violet-royal/30 bg-charbon-mystere/60 p-8">
            <div className="flex items-center gap-3 mb-6">
              <span
                className="text-4xl select-none"
                style={{ color: "#C9A84C" }}
                aria-hidden="true"
              >
                ᚨ
              </span>
              <h3 className="font-cinzel text-xl text-parchemin font-semibold">
                Le Galdr
              </h3>
            </div>
            <div className="space-y-4 font-cormorant text-lg text-parchemin/80 leading-relaxed">
              <p>
                Le Galdr est la magie des chants runiques &mdash; une pratique
                vocale ou chaque rune est invoquee par son nom, repetee en
                incantation rythmique pour liberer son pouvoir.
              </p>
              <p>
                Tradition <strong className="text-or-ancien">masculine</strong>{" "}
                liee directement a Odin, le Galdr est considere comme une magie
                active et volontaire. Le praticien impose sa volonte sur le
                tissu de la realite en gravant et en chantant les runes.
              </p>
              <p>
                Les guerriers vikings utilisaient le Galdr avant les batailles
                pour se proteger et terrifier leurs ennemis.
              </p>
            </div>
          </div>

          {/* Le Seidr */}
          <div className="rounded-lg border border-violet-royal/30 bg-charbon-mystere/60 p-8">
            <div className="flex items-center gap-3 mb-6">
              <span
                className="text-4xl select-none"
                style={{ color: "#C9A84C" }}
                aria-hidden="true"
              >
                ᛈ
              </span>
              <h3 className="font-cinzel text-xl text-parchemin font-semibold">
                Le Seidr
              </h3>
            </div>
            <div className="space-y-4 font-cormorant text-lg text-parchemin/80 leading-relaxed">
              <p>
                Le Seidr est la magie des visions et du destin &mdash; une
                pratique chamanique ou la praticienne (voelva) entre en transe
                pour percevoir les fils du destin et influencer le cours des
                evenements.
              </p>
              <p>
                Tradition <strong className="text-or-ancien">feminine</strong>{" "}
                liee a la deesse Freyja, le Seidr est une magie receptive et
                intuitive. C'est Freyja qui enseigna cette pratique a Odin
                lui-meme, bien que cela fut considere comme tabou pour un homme.
              </p>
              <p>
                Les voelvas etaient respectees et craintes dans toute la
                Scandinavie pour leur capacite a predire l'avenir.
              </p>
            </div>
          </div>
        </div>
      </section>

      <RuneDivider symbols="ᛏ ᛒ ᛖ" />

      {/* ============================================================
          RUNES DE PROTECTION
          ============================================================ */}
      <section className="py-16 md:py-24 max-w-5xl mx-auto px-6">
        <SectionTitle
          title="Runes de Protection"
          subtitle="Les runes les plus puissantes pour la protection et la magie"
          className="mb-16"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {protectionRunes.map((rune) => (
            <div
              key={rune.name}
              className="rounded-lg border border-violet-royal/30 bg-charbon-mystere/60 p-6
                hover:border-or-ancien/40 hover:shadow-[0_0_25px_rgba(201,168,76,0.08)] transition-all duration-500"
            >
              <div className="text-center mb-4">
                <span
                  className="text-5xl select-none block mb-2"
                  style={{ color: "#C9A84C" }}
                >
                  {rune.symbol}
                </span>
                <h3 className="font-cinzel text-lg text-parchemin font-semibold">
                  {rune.name}
                </h3>
                <p className="font-philosopher text-sm text-or-ancien/80 italic">
                  {rune.power}
                </p>
              </div>
              <p className="font-cormorant text-base text-parchemin/70 leading-relaxed">
                {rune.usage}
              </p>
            </div>
          ))}
        </div>
      </section>

      <RuneDivider symbols="ᛗ ᛚ ᛜ" />

      {/* ============================================================
          LES BIND-RUNES
          ============================================================ */}
      <section className="py-16 md:py-24 max-w-4xl mx-auto px-6">
        <SectionTitle
          title="Les Bind-Runes"
          subtitle="L'art de combiner les runes pour amplifier leur pouvoir"
          className="mb-12"
        />

        <div className="space-y-6 font-cormorant text-lg md:text-xl leading-relaxed text-parchemin/85">
          <p>
            Les bind-runes (ou <em className="text-or-ancien">bandruna</em> en
            vieux norrois) sont des symboles crees en superposant ou en
            combinant deux runes ou plus en un seul glyphe. Cette pratique
            permet de fusionner les pouvoirs de plusieurs runes pour creer un
            talisman d'une puissance accrue.
          </p>
          <p>
            Par exemple, combiner{" "}
            <span style={{ color: "#C9A84C" }} className="text-2xl">
              ᛉ
            </span>{" "}
            (Algiz &mdash; protection) avec{" "}
            <span style={{ color: "#C9A84C" }} className="text-2xl">
              ᛊ
            </span>{" "}
            (Sowilo &mdash; victoire) cree un puissant symbole de protection
            victorieuse, souvent grave sur les amulettes des guerriers.
          </p>
          <p>
            La creation de bind-runes est un art subtil : les runes choisies
            doivent etre harmonieuses entre elles, et l'intention du createur
            doit etre claire et focalisee. Une bind-rune mal concue peut
            produire des effets inattendus ou contradictoires.
          </p>
        </div>

        {/* Examples grid */}
        <div className="mt-12 grid sm:grid-cols-3 gap-6">
          {[
            {
              combo: "ᛉ + ᛊ",
              label: "Protection & Victoire",
              desc: "Bouclier solaire pour les guerriers",
            },
            {
              combo: "ᚠ + ᚷ",
              label: "Richesse & Generosite",
              desc: "Attire l'abondance par le don",
            },
            {
              combo: "ᛏ + ᚱ",
              label: "Justice & Voyage",
              desc: "Protection pour les voyageurs en quete de verite",
            },
          ].map((example) => (
            <div
              key={example.label}
              className="text-center rounded-lg border border-violet-royal/20 bg-violet-profond/20 p-6"
            >
              <p
                className="text-2xl mb-2 select-none font-cinzel"
                style={{ color: "#C9A84C" }}
              >
                {example.combo}
              </p>
              <h4 className="font-cinzel text-sm text-parchemin font-semibold mb-1">
                {example.label}
              </h4>
              <p className="font-philosopher text-sm text-parchemin/60">
                {example.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <RuneDivider symbols="ᛞ ᛟ ᚠ" />

      {/* ============================================================
          CTA
          ============================================================ */}
      <section className="py-20 md:py-28 text-center px-6">
        <div className="max-w-2xl mx-auto">
          <p
            className="text-6xl mb-6 select-none"
            style={{ color: "#C9A84C" }}
            aria-hidden="true"
          >
            ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ
          </p>
          <h2 className="font-cinzel-decorative text-2xl md:text-3xl text-gradient-gold mb-4">
            Pret a commencer votre voyage runique ?
          </h2>
          <p className="font-cormorant text-lg text-parchemin/70 mb-10">
            Decouvrez nos sets de runes artisanaux, graves a la main dans le
            respect des traditions ancestrales scandinaves.
          </p>
          <Button href="/boutique" variant="cta" size="lg">
            Decouvrir nos Sets de Runes
          </Button>
        </div>
      </section>
    </main>
  );
}
