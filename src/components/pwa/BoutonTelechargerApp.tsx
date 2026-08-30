'use client';

import { useEffect, useState } from 'react';

/**
 * Bouton « Télécharger l'application » (accueil).
 *
 * Le site n'est publié sur aucune boutique d'applications : ce qu'on
 * propose, c'est l'installation de l'application web — manifeste et
 * service worker déjà en place (src/app/manifest.ts, public/sw.js, et le
 * script inline du layout racine). Une fois installée, elle a son icône
 * sur l'écran d'accueil et s'ouvre plein écran, sans barre de navigateur.
 *
 * Trois cas, parce que les navigateurs ne se comportent pas pareil :
 *
 *   • Chrome / Edge / Android → `beforeinstallprompt` nous donne la main
 *     sur l'invite native. L'événement est capté avant l'hydratation dans
 *     le layout racine (il ne se déclenche qu'une fois), on le récupère ici.
 *   • Safari iOS → n'expose aucune invite. On affiche la marche à suivre,
 *     la seule voie possible : Partager → Sur l'écran d'accueil.
 *   • Déjà installée, ou navigateur sans installation (Firefox bureau) →
 *     on n'affiche rien. Mieux vaut pas de bouton qu'un bouton mort.
 *
 * Tout est calculé dans un `useEffect` (jamais au rendu) : le serveur rend
 * toujours « rien », et le bouton n'apparaît qu'après hydratation — sinon
 * le HTML serveur et le premier rendu client divergeraient.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1);
  // Chrome et Firefox sur iOS n'offrent pas non plus « Sur l'écran d'accueil ».
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return ios && safari;
}

export default function BoutonTelechargerApp({ className = '' }: { className?: string }) {
  const [invite, setInvite] = useState<InstallPromptEvent | null>(null);
  const [installee, setInstallee] = useState(false);
  const [iosSafari, setIosSafari] = useState(false);
  const [aideIos, setAideIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstallee(true);
      return;
    }
    setIosSafari(isIosSafari());
    const lire = () =>
      setInvite(((window as unknown as { __rmInstallPrompt?: InstallPromptEvent }).__rmInstallPrompt) ?? null);
    lire(); // l'événement a pu être capté avant notre montage
    const surInstallation = () => {
      setInstallee(true);
      setInvite(null);
    };
    window.addEventListener('rm:installable', lire);
    window.addEventListener('rm:installed', surInstallation);
    return () => {
      window.removeEventListener('rm:installable', lire);
      window.removeEventListener('rm:installed', surInstallation);
    };
  }, []);

  const surClic = async () => {
    if (iosSafari && !invite) {
      setAideIos((v) => !v);
      return;
    }
    if (!invite) return;
    try {
      await invite.prompt();
      const { outcome } = await invite.userChoice;
      // L'invite ne peut servir qu'une fois : on l'oublie dans les deux cas.
      (window as unknown as { __rmInstallPrompt?: InstallPromptEvent | null }).__rmInstallPrompt = null;
      setInvite(null);
      if (outcome === 'accepted') setInstallee(true);
    } catch {
      // Invite refusée par le navigateur (déjà consommée, geste expiré) :
      // rien à signaler à la visiteuse, le bouton disparaît simplement.
      setInvite(null);
    }
  };

  if (installee) return null;
  if (!invite && !iosSafari) return null;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={surClic}
        aria-label="Télécharger l’application Runes & Magie sur votre appareil"
        aria-expanded={iosSafari && !invite ? aideIos : undefined}
        className="inline-flex items-center gap-2.5 rounded-lg border border-or-clair/60 bg-gradient-to-r from-or-ancien to-or-clair px-6 py-3 font-cinzel text-sm font-semibold uppercase tracking-[0.12em] text-charbon-mystere shadow-[0_0_25px_rgba(201,168,76,0.35)] transition hover:brightness-110 active:scale-[0.98]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Télécharger l’application
      </button>

      {aideIos && (
        <p className="max-w-xs rounded-lg border border-or-ancien/30 bg-noir-nuit/85 p-3 text-left font-philosopher text-sm leading-relaxed text-parchemin/90 backdrop-blur">
          Dans Safari, touche <strong className="font-bold text-or-ancien">Partager</strong> au bas de
          l’écran, puis <strong className="font-bold text-or-ancien">« Sur l’écran d’accueil »</strong>.
          Runes &amp; Magie s’ajoutera comme une application.
        </p>
      )}
    </div>
  );
}
