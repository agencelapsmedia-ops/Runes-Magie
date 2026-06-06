import SectionTitle from '@/components/ui/SectionTitle';
import Button from '@/components/ui/Button';

/* ── Elder Futhark — the three Aettir ──────────────────────── */
const aettir = [
  {
    name: "Aett de Freya",
    runes: [
      { char: 'ᚠ', name: 'Fehu' },
      { char: 'ᚢ', name: 'Uruz' },
      { char: 'ᚦ', name: 'Thurisaz' },
      { char: 'ᚨ', name: 'Ansuz' },
      { char: 'ᚱ', name: 'Raidho' },
      { char: 'ᚲ', name: 'Kenaz' },
      { char: 'ᚷ', name: 'Gebo' },
      { char: 'ᚹ', name: 'Wunjo' },
    ],
  },
  {
    name: "Aett de Heimdall",
    runes: [
      { char: 'ᚺ', name: 'Hagalaz' },
      { char: 'ᚾ', name: 'Nauthiz' },
      { char: 'ᛁ', name: 'Isa' },
      { char: 'ᛃ', name: 'Jera' },
      { char: 'ᛇ', name: 'Eihwaz' },
      { char: 'ᛈ', name: 'Perthro' },
      { char: 'ᛉ', name: 'Algiz' },
      { char: 'ᛊ', name: 'Sowilo' },
    ],
  },
  {
    name: "Aett de Tyr",
    runes: [
      { char: 'ᛏ', name: 'Tiwaz' },
      { char: 'ᛒ', name: 'Berkano' },
      { char: 'ᛖ', name: 'Ehwaz' },
      { char: 'ᛗ', name: 'Mannaz' },
      { char: 'ᛚ', name: 'Laguz' },
      { char: 'ᛜ', name: 'Ingwaz' },
      { char: 'ᛞ', name: 'Dagaz' },
      { char: 'ᛟ', name: 'Othala' },
    ],
  },
];

/**
 * Section « Les Runes Vikings » — aperçu de l'ancien Futhark (les trois Aettir).
 *
 * ⚠️ Gardée en réserve : retirée de la page d'accueil le 2026-06, mais conservée
 * ici pour être réutilisée sur une autre page (ex. /runes-vikings) plus tard.
 */
export default function RunesPreviewSection() {
  return (
    <section className="px-4 py-16 md:py-24 max-w-7xl mx-auto">
      <SectionTitle
        title="Les Runes Vikings"
        subtitle="L'alphabet sacr&eacute; de l'ancien Futhark"
      />

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {aettir.map((aett) => (
          <div
            key={aett.name}
            className="rounded-sm border border-violet-royal/20 bg-charbon-mystere p-6 text-center"
          >
            <h3 className="font-cinzel text-or-ancien text-lg mb-6">
              {aett.name}
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {aett.runes.map((rune) => (
                <div
                  key={rune.name}
                  className="flex flex-col items-center gap-1 w-12"
                  title={rune.name}
                >
                  <span className="text-3xl text-parchemin drop-shadow-[0_0_6px_rgba(201,168,76,0.3)]">
                    {rune.char}
                  </span>
                  <span className="text-[0.6rem] text-parchemin-vieilli/60 font-cinzel">
                    {rune.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Button variant="secondary" size="lg" href="/runes-vikings">
          Explorer les Runes
        </Button>
      </div>
    </section>
  );
}
