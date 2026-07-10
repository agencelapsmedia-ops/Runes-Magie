'use client';

import Link from 'next/link';

const modules = [
  { rune: 'ᚤ', label: 'Boutique', href: '/admin/boutique', desc: 'Commandes, inventaire, catégories et caisse Clover.', sub: 'Hub e-commerce' },
  { rune: 'ᚹ', label: 'Soins & Cours', href: '/admin/services', desc: 'Calendrier, services, praticiennes, formations et revenus.', sub: 'Hub holistique' },
  { rune: 'ᛗ', label: 'CRM / Clients', href: '/admin/clients', desc: 'Comptes clients et abonnés à l’infolettre.', sub: 'CRM & infolettre' },
  { rune: 'ᛟ', label: 'Site', href: '/admin/site', desc: 'Menu de navigation, sliders et structure du site public.', sub: 'Navigation & pages' },
];

// Étoiles décoratives — positions déterministes (stables SSR/CSR, pas de Math.random au rendu)
const STARS = Array.from({ length: 50 }, (_, i) => ({
  size: 1 + ((i * 13) % 26) / 10,
  top: (i * 17) % 100,
  left: (i * 41) % 100,
  duration: (1.5 + ((i * 7) % 30) / 10).toFixed(1),
  opacity: (0.2 + ((i * 11) % 60) / 100).toFixed(2),
  delay: ((i * 23) % 40) / 10,
}));

export default function AdminDashboardPage() {
  return (
    <div>
      {/* Banner de bienvenue mystique */}
      <div className="relative min-h-[280px] flex flex-col items-center justify-center overflow-hidden bg-[#0d0a1a] rounded-2xl p-10 text-center mb-8">
        {/* Etoiles animees */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {STARS.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-[twinkle_var(--d)_ease-in-out_infinite_alternate]"
              style={{
                width: s.size, height: s.size,
                top: `${s.top}%`, left: `${s.left}%`,
                '--d': `${s.duration}s`,
                '--o': s.opacity,
                animationDelay: `${s.delay}s`,
                opacity: 0,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Lune */}
        <svg className="w-14 h-14 mb-5 animate-[float_4s_ease-in-out_infinite] drop-shadow-[0_0_18px_rgba(200,170,255,0.5)]" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="mg" cx="40%" cy="35%" r="55%">
              <stop offset="0%" stopColor="#e8d5ff"/>
              <stop offset="100%" stopColor="#8b5fc0"/>
            </radialGradient>
          </defs>
          <circle cx="30" cy="30" r="28" fill="url(#mg)"/>
          <circle cx="42" cy="20" r="20" fill="#0d0a1a"/>
        </svg>

        <p className="font-cinzel-decorative text-[11px] tracking-[0.35em] text-[#a78bca] uppercase mb-4 animate-[fadein_1.2s_ease_0.3s_forwards] opacity-0">
          Bienvenue dans ton sanctuaire
        </p>

        <p className="font-cormorant italic font-light text-[28px] leading-relaxed text-[#f0e8ff] max-w-[560px] mx-auto mb-5 animate-[fadein_1.4s_ease_0.7s_forwards] opacity-0" style={{ textShadow: '0 0 40px rgba(180,140,255,0.3)' }}>
          N&apos;oublie jamais ta <em className="text-[#c9a9f5]">beaute</em> et ta <em className="text-[#c9a9f5]">force</em>,<br/>je te vois.
        </p>

        <div className="flex items-center gap-2.5 animate-[fadein_1.6s_ease_1.2s_forwards] opacity-0">
          <div className="w-[60px] h-px bg-gradient-to-r from-transparent to-[#6b4fa0]" />
          <div className="w-1.5 h-1.5 bg-[#c9a9f5] rotate-45 shadow-[0_0_8px_rgba(200,170,255,0.8)]" />
          <div className="w-[60px] h-px bg-gradient-to-l from-transparent to-[#6b4fa0]" />
        </div>

        <style jsx>{`
          @keyframes twinkle {
            0% { opacity: 0; transform: scale(0.8); }
            100% { opacity: var(--o); transform: scale(1.2); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes fadein {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>

      {/* ====== MODULES ====== */}
      <p className="font-cinzel text-xs tracking-[0.3em] text-violet-profond/60 uppercase mb-4">
        Modules
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group flex items-start gap-5 bg-charbon-mystere border border-violet-royal/40 rounded-xl p-8 transition-all duration-300 hover:border-or-ancien/60 hover:shadow-[0_0_25px_rgba(201,168,76,0.18)]"
          >
            <span className="text-6xl text-or-ancien select-none leading-none">{m.rune}</span>
            <div>
              <h3 className="font-cinzel text-2xl text-parchemin group-hover:text-or-ancien transition-colors">
                {m.label}
              </h3>
              <p className="font-cormorant text-base text-parchemin-vieilli/70 mt-1">{m.desc}</p>
              <span className="font-cinzel text-[0.6rem] tracking-[0.2em] uppercase text-turquoise-cristal/70 mt-3 block">
                {m.sub}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
