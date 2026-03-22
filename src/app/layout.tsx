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
