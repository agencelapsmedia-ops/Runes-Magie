import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StarryBackground from "@/components/effects/StarryBackground";
import FloatingRunes from "@/components/effects/FloatingRunes";
import { CartProvider } from "@/components/cart/CartProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import NocturaChat from "@/components/chat/NocturaChat";
import BarreOnglets from "@/components/layout/BarreOnglets";
import ZonePrincipale from "@/components/layout/ZonePrincipale";
import {
  SITE_URL,
  SITE_LOGO_URL,
  BOUTIQUE_NAME,
  BOUTIQUE_ADDRESS,
  INTERAC_EMAIL,
} from "@/lib/constants";

const SITE_DESCRIPTION =
  "École de magie dédiée aux runes vikings, à la magie ancestrale et aux arts mystiques. Découvrez votre chemin spirituel avec Annabelle Dionne — Noctura Anna.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Runes & Magie | École de Magie",
    // Les sous-pages fournissent juste leur titre ; le suffixe est ajouté ici.
    template: "%s | Runes & Magie",
  },
  description: SITE_DESCRIPTION,
  applicationName: BOUTIQUE_NAME,
  keywords: [
    "runes",
    "magie",
    "sorcellerie",
    "runes vikings",
    "tirage de runes",
    "boutique ésotérique",
    "Annabelle Dionne",
    "Noctura Anna",
    "tarot",
    "cristaux",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_CA",
    siteName: BOUTIQUE_NAME,
    url: SITE_URL,
    title: "Runes & Magie | École de Magie",
    description: SITE_DESCRIPTION,
    images: [{ url: SITE_LOGO_URL, alt: BOUTIQUE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Runes & Magie | École de Magie",
    description: SITE_DESCRIPTION,
    images: [SITE_LOGO_URL],
  },
  appleWebApp: {
    capable: true,
    title: "Runes & Magie",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#2D1B4E",
  width: "device-width",
  initialScale: 1,
};

/** Données structurées Organization (logo, contact, adresse) — affichées sur toutes les pages. */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BOUTIQUE_NAME,
  url: SITE_URL,
  logo: SITE_LOGO_URL,
  email: INTERAC_EMAIL,
  address: {
    "@type": "PostalAddress",
    streetAddress: "149 Rue Saint-Eustache",
    addressLocality: "Saint-Eustache",
    addressRegion: "QC",
    postalCode: "J7R 2L5",
    addressCountry: "CA",
  },
  description: `${BOUTIQUE_NAME} — ${BOUTIQUE_ADDRESS}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        {/* Préconnexion aux serveurs Google Fonts pour gagner les allers-retours
            DNS/TLS, puis chargement de la feuille de styles des polices dès le
            <head> (au lieu d'un @import CSS bloquant et découvert tardivement). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;500;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&family=MedievalSharp&display=swap"
        />
        {/* ── Installation (PWA) ──
            Enregistrement du service worker et capture de l'invite
            d'installation. Inline plutôt qu'en composant : `beforeinstallprompt`
            ne se déclenche qu'UNE fois, souvent avant l'hydratation React — un
            écouteur posé dans un composant le raterait et le bouton
            « Télécharger l'application » n'apparaîtrait jamais. L'événement est
            mis de côté ici, puis relayé à l'app par un événement maison.
            Voir src/components/pwa/BoutonTelechargerApp.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (e) {
      console.warn('Service worker non enregistre :', e);
    });
  });
}
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  window.__rmInstallPrompt = e;
  window.dispatchEvent(new Event('rm:installable'));
});
window.addEventListener('appinstalled', function () {
  window.__rmInstallPrompt = null;
  window.dispatchEvent(new Event('rm:installed'));
});`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      {/*
        Échelle d'empilement du site, à garder cohérente :
        fonds animés (0) < <main> (10) < navbar (50) < barre d'onglets (90)
        < bulle de chat (91) < panier (92 / 93) < fenêtre de chat (96).
        Le padding bas laisse respirer le pied de page au-dessus de la barre
        d'onglets — il est posé sur <body> et non sur <main>, car <Footer> est
        en dehors de <main>.
      */}
      <body className="min-h-full flex flex-col bg-noir-nuit text-parchemin pb-[76px] lg:pb-0">
        <CartProvider>
          <StarryBackground />
          <FloatingRunes />
          <Navbar />
          <CartDrawer />
          <NocturaChat />
          <ZonePrincipale>{children}</ZonePrincipale>
          <Footer />
          <BarreOnglets />
        </CartProvider>
      </body>
    </html>
  );
}
