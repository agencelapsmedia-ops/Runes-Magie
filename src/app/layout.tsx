import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StarryBackground from "@/components/effects/StarryBackground";
import FloatingRunes from "@/components/effects/FloatingRunes";
import { CartProvider } from "@/components/cart/CartProvider";
import CartDrawer from "@/components/cart/CartDrawer";

export const metadata: Metadata = {
  title: "Runes & Magie | Boutique-École de Sorcellerie",
  description:
    "Boutique-école de sorcellerie dédiée aux runes vikings, à la magie ancestrale et aux arts mystiques. Découvrez votre chemin spirituel avec Annabelle Dionne — Noctura Anna.",
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
      </head>
      <body className="min-h-full flex flex-col bg-noir-nuit text-parchemin">
        <CartProvider>
          <StarryBackground />
          <FloatingRunes />
          <Navbar />
          <CartDrawer />
          <main className="relative z-10 flex-1 min-h-screen pt-18 lg:pt-20">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
