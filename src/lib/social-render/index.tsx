/**
 * Rendu serveur des gabarits de visuels (montages graphiques automatiques).
 *
 * ImageResponse (next/og — satori) : JSX + flexbox uniquement, chaque élément
 * à plusieurs enfants doit être en display:flex. Toutes les couleurs et polices
 * viennent de la charte de la marque (src/lib/organizations.ts) — aucun code
 * couleur en dur : le même gabarit sert toutes les marques.
 *
 * Les TTF (SIL OFL, src/assets/fonts) sont lues au runtime — l'inclusion dans
 * le bundle serverless est forcée par outputFileTracingIncludes (next.config).
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReactElement, ReactNode } from 'react';
import { ImageResponse } from 'next/og';
// Import relatif : ce module est aussi exécutable par tsx (tests locaux).
import type { CharteGraphique } from '../organizations';
import { FORMATS_VISUELS, GABARITS_VISUELS_CLES } from './registry';

export type DonneesGabarit = Record<string, string>;

interface ContexteRendu {
  charte: CharteGraphique;
  nomMarque: string;
  largeur: number;
  hauteur: number;
}

/* ————— Polices ————— */

interface PoliceChargee {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 700;
  style: 'normal' | 'italic';
}

let policesCache: PoliceChargee[] | null = null;

async function chargerPolices(): Promise<PoliceChargee[]> {
  if (policesCache) return policesCache;
  const dossier = join(process.cwd(), 'src', 'assets', 'fonts');
  const lire = (fichier: string) => readFile(join(dossier, fichier));
  const [cinzel, cormorant, cormorantItalique, philosopher, philosopherGras, runique, inter, interGras] =
    await Promise.all([
      lire('Cinzel-700.ttf'),
      lire('CormorantGaramond-500.ttf'),
      lire('CormorantGaramond-500i.ttf'),
      lire('Philosopher-400.ttf'),
      lire('Philosopher-700.ttf'),
      lire('NotoSansRunic-400.ttf'),
      lire('Inter-400.ttf'),
      lire('Inter-700.ttf'),
    ]);
  policesCache = [
    { name: 'Cinzel', data: cinzel, weight: 700, style: 'normal' },
    { name: 'Cormorant Garamond', data: cormorant, weight: 500, style: 'normal' },
    { name: 'Cormorant Garamond', data: cormorantItalique, weight: 500, style: 'italic' },
    { name: 'Philosopher', data: philosopher, weight: 400, style: 'normal' },
    { name: 'Philosopher', data: philosopherGras, weight: 700, style: 'normal' },
    { name: 'Noto Sans Runic', data: runique, weight: 400, style: 'normal' },
    { name: 'Inter', data: inter, weight: 400, style: 'normal' },
    { name: 'Inter', data: interGras, weight: 700, style: 'normal' },
  ];
  return policesCache;
}

/* ————— Éléments communs ————— */

function tronquer(texte: string | undefined, max: number): string {
  const t = (texte ?? '').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/** Cadre commun : fond dégradé de la marque, liséré, contenu centré, signature. */
function Cadre({ ctx, children }: { ctx: ContexteRendu; children: ReactNode }) {
  const p = ctx.charte.palette;
  const marge = Math.round(ctx.largeur * 0.035);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(165deg, ${p.fond} 0%, ${p.fondCarte} 58%, ${p.primaireFonce} 135%)`,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: marge,
          left: marge,
          right: marge,
          bottom: marge,
          border: `3px solid ${p.accent}`,
          borderRadius: Math.round(ctx.largeur * 0.02),
          opacity: 0.7,
          display: 'flex',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${marge * 2.6}px ${marge * 2.2}px ${marge * 3.4}px`,
          textAlign: 'center',
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: Math.round(marge * 1.7),
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          fontFamily: ctx.charte.polices.accent,
          fontSize: Math.round(ctx.largeur * 0.026),
          color: p.accentClair,
          letterSpacing: '0.22em',
        }}
      >
        ᛫ {ctx.nomMarque.toUpperCase()} ᛫
      </div>
    </div>
  );
}

/* ————— Gabarits ————— */

function RuneDuJour({ ctx, donnees }: { ctx: ContexteRendu; donnees: DonneesGabarit }) {
  const p = ctx.charte.palette;
  const f = ctx.charte.polices;
  return (
    <Cadre ctx={ctx}>
      <div
        style={{
          display: 'flex',
          fontFamily: 'Noto Sans Runic',
          fontSize: Math.round(ctx.hauteur * 0.3),
          color: p.accent,
          lineHeight: 1,
        }}
      >
        {tronquer(donnees.glyphe, 3) || 'ᚠ'}
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: f.titre,
          fontSize: Math.round(ctx.largeur * 0.085),
          color: p.texte,
          marginTop: Math.round(ctx.hauteur * 0.03),
          letterSpacing: '0.08em',
        }}
      >
        {tronquer(donnees.titre, 30).toUpperCase()}
      </div>
      {donnees.sousTitre ? (
        <div
          style={{
            display: 'flex',
            fontFamily: f.accent,
            fontSize: Math.round(ctx.largeur * 0.036),
            color: p.secondaire,
            marginTop: Math.round(ctx.hauteur * 0.015),
            letterSpacing: '0.12em',
          }}
        >
          {tronquer(donnees.sousTitre, 60).toUpperCase()}
        </div>
      ) : null}
      {donnees.texte ? (
        <div
          style={{
            display: 'flex',
            fontFamily: f.corps,
            fontStyle: 'italic',
            fontSize: Math.round(ctx.largeur * 0.042),
            color: p.texte,
            marginTop: Math.round(ctx.hauteur * 0.035),
            lineHeight: 1.35,
            maxWidth: '82%',
          }}
        >
          {tronquer(donnees.texte, 180)}
        </div>
      ) : null}
    </Cadre>
  );
}

function Citation({ ctx, donnees }: { ctx: ContexteRendu; donnees: DonneesGabarit }) {
  const p = ctx.charte.palette;
  const f = ctx.charte.polices;
  const texte = tronquer(donnees.texte, 260) || '…';
  const taille = texte.length > 140 ? 0.052 : texte.length > 70 ? 0.062 : 0.075;
  return (
    <Cadre ctx={ctx}>
      <div
        style={{
          display: 'flex',
          fontFamily: f.corps,
          fontSize: Math.round(ctx.largeur * 0.16),
          color: p.accent,
          lineHeight: 0.6,
          marginBottom: Math.round(ctx.hauteur * 0.01),
        }}
      >
        «
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: f.corps,
          fontStyle: 'italic',
          fontSize: Math.round(ctx.largeur * taille),
          color: p.texte,
          lineHeight: 1.35,
          maxWidth: '84%',
        }}
      >
        {texte}
      </div>
      {donnees.auteur ? (
        <div
          style={{
            display: 'flex',
            fontFamily: f.accent,
            fontSize: Math.round(ctx.largeur * 0.032),
            color: p.accentClair,
            marginTop: Math.round(ctx.hauteur * 0.04),
            letterSpacing: '0.16em',
          }}
        >
          — {tronquer(donnees.auteur, 50).toUpperCase()}
        </div>
      ) : null}
    </Cadre>
  );
}

function Promo({ ctx, donnees }: { ctx: ContexteRendu; donnees: DonneesGabarit }) {
  const p = ctx.charte.palette;
  const f = ctx.charte.polices;
  return (
    <Cadre ctx={ctx}>
      <div
        style={{
          display: 'flex',
          fontFamily: f.titre,
          fontSize: Math.round(ctx.largeur * 0.072),
          color: p.accent,
          lineHeight: 1.15,
          maxWidth: '86%',
          letterSpacing: '0.04em',
        }}
      >
        {tronquer(donnees.titre, 70).toUpperCase()}
      </div>
      {donnees.texte ? (
        <div
          style={{
            display: 'flex',
            fontFamily: f.corps,
            fontSize: Math.round(ctx.largeur * 0.044),
            color: p.texte,
            marginTop: Math.round(ctx.hauteur * 0.032),
            lineHeight: 1.4,
            maxWidth: '80%',
          }}
        >
          {tronquer(donnees.texte, 220)}
        </div>
      ) : null}
      {donnees.cta ? (
        <div
          style={{
            display: 'flex',
            fontFamily: f.accent,
            fontSize: Math.round(ctx.largeur * 0.034),
            color: p.accentClair,
            background: `linear-gradient(135deg, ${p.primaire}, ${p.primaireFonce})`,
            border: `2px solid ${p.accent}`,
            borderRadius: 999,
            padding: `${Math.round(ctx.largeur * 0.018)}px ${Math.round(ctx.largeur * 0.05)}px`,
            marginTop: Math.round(ctx.hauteur * 0.045),
            letterSpacing: '0.1em',
          }}
        >
          {tronquer(donnees.cta, 40).toUpperCase()}
        </div>
      ) : null}
    </Cadre>
  );
}

function Annonce({ ctx, donnees }: { ctx: ContexteRendu; donnees: DonneesGabarit }) {
  const p = ctx.charte.palette;
  const f = ctx.charte.polices;
  return (
    <Cadre ctx={ctx}>
      {donnees.date ? (
        <div
          style={{
            display: 'flex',
            fontFamily: f.accent,
            fontSize: Math.round(ctx.largeur * 0.03),
            color: p.fond,
            background: p.secondaire,
            borderRadius: 999,
            padding: `${Math.round(ctx.largeur * 0.012)}px ${Math.round(ctx.largeur * 0.04)}px`,
            marginBottom: Math.round(ctx.hauteur * 0.035),
            letterSpacing: '0.12em',
          }}
        >
          {tronquer(donnees.date, 50).toUpperCase()}
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          fontFamily: f.titre,
          fontSize: Math.round(ctx.largeur * 0.07),
          color: p.texte,
          lineHeight: 1.15,
          maxWidth: '86%',
          letterSpacing: '0.04em',
        }}
      >
        {tronquer(donnees.titre, 70).toUpperCase()}
      </div>
      {donnees.texte ? (
        <div
          style={{
            display: 'flex',
            fontFamily: f.corps,
            fontSize: Math.round(ctx.largeur * 0.042),
            color: p.texte,
            marginTop: Math.round(ctx.hauteur * 0.03),
            lineHeight: 1.4,
            maxWidth: '80%',
          }}
        >
          {tronquer(donnees.texte, 220)}
        </div>
      ) : null}
    </Cadre>
  );
}

/* ————— Rendu ————— */

const COMPOSANTS: Record<string, (props: { ctx: ContexteRendu; donnees: DonneesGabarit }) => ReactElement> = {
  RUNE_DU_JOUR: RuneDuJour,
  CITATION: Citation,
  PROMO: Promo,
  ANNONCE: Annonce,
};

export interface VisuelRendu {
  png: Buffer;
  largeur: number;
  hauteur: number;
}

/** Rend un gabarit aux couleurs de la marque et retourne le PNG. */
export async function rendreGabarit(
  templateKey: string,
  formatCle: string,
  donnees: DonneesGabarit,
  charte: CharteGraphique,
  nomMarque: string,
): Promise<VisuelRendu> {
  if (!GABARITS_VISUELS_CLES.includes(templateKey)) {
    throw new Error(`Gabarit inconnu : ${templateKey}`);
  }
  const format = FORMATS_VISUELS.find((x) => x.cle === formatCle) ?? FORMATS_VISUELS[0];
  const Composant = COMPOSANTS[templateKey];
  const ctx: ContexteRendu = {
    charte,
    nomMarque,
    largeur: format.largeur,
    hauteur: format.hauteur,
  };

  const reponse = new ImageResponse(<Composant ctx={ctx} donnees={donnees} />, {
    width: format.largeur,
    height: format.hauteur,
    fonts: (await chargerPolices()).map((p) => ({
      name: p.name,
      data: p.data,
      weight: p.weight,
      style: p.style,
    })),
  });

  return {
    png: Buffer.from(await reponse.arrayBuffer()),
    largeur: format.largeur,
    hauteur: format.hauteur,
  };
}
