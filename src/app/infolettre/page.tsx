"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import RuneDivider from "@/components/ui/RuneDivider";
import Button from "@/components/ui/Button";

export default function InfolettrePage() {
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
  });
  const [consentEmail, setConsentEmail] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Placeholder: backend à connecter (Resend Audiences + table Subscriber)
    setSubmitted(true);
  }

  const inputClasses = [
    "w-full bg-charbon-mystere border border-violet-royal/40 rounded-lg px-4 py-3",
    "text-parchemin placeholder:text-parchemin-vieilli/40",
    "focus:outline-none focus:ring-2 focus:ring-violet-mystique/60 focus:border-violet-mystique/60",
    "transition-all duration-300",
    "font-cormorant text-lg",
  ].join(" ");

  const labelClasses =
    "block font-cinzel text-sm text-or-ancien/80 mb-2 tracking-wider";

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <SectionTitle
          title="Rejoindre l'Infolettre"
          subtitle="Recevez nos rituels, nouveautés et messages des étoiles"
          as="h1"
        />

        <RuneDivider className="my-12" />

        {/* Intro */}
        <div className="text-center mb-10">
          <p className="text-parchemin-vieilli/80 font-cormorant text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Inscrivez-vous pour recevoir nos lunaisons, ateliers à venir,
            offres exclusives et inspirations magiques — directement dans
            votre boîte de réception.
          </p>
        </div>

        {/* Form / Success */}
        {submitted ? (
          <div className="bg-charbon-mystere border border-turquoise-cristal/40 rounded-lg p-10 text-center">
            <div className="text-5xl mb-4 select-none">&#10022;</div>
            <h2 className="font-cinzel text-2xl text-or-ancien mb-3">
              Bienvenue dans le cercle
            </h2>
            <p className="text-parchemin-vieilli/80 font-cormorant text-lg max-w-xl mx-auto">
              Un courriel de confirmation vient de vous être envoyé.
              Cliquez sur le lien à l'intérieur pour finaliser votre
              inscription. Que la magie vous accompagne.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-charbon-mystere/40 border border-violet-royal/30 rounded-lg p-6 md:p-10 space-y-6"
          >
            {/* Prénom + Nom — grid 2 colonnes sur desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="prenom" className={labelClasses}>
                  Prénom <span className="text-magenta-rituel">*</span>
                </label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  required
                  minLength={2}
                  autoComplete="given-name"
                  value={formData.prenom}
                  onChange={handleChange}
                  placeholder="Votre prénom"
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="nom" className={labelClasses}>
                  Nom <span className="text-magenta-rituel">*</span>
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  required
                  minLength={2}
                  autoComplete="family-name"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Votre nom"
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Courriel */}
            <div>
              <label htmlFor="email" className={labelClasses}>
                Courriel <span className="text-magenta-rituel">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@courriel.com"
                className={inputClasses}
              />
            </div>

            {/* Téléphone */}
            <div>
              <label htmlFor="telephone" className={labelClasses}>
                Téléphone{" "}
                <span className="text-parchemin-vieilli/40 normal-case tracking-normal font-cormorant">
                  (optionnel)
                </span>
              </label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                autoComplete="tel"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="(514) 555-1234"
                className={inputClasses}
              />
              <p className="mt-2 text-xs text-parchemin-vieilli/50 font-cormorant italic">
                Permettra de recevoir nos messages SMS exclusifs lors de
                pleines lunes et événements (à venir).
              </p>
            </div>

            {/* Consentement */}
            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={consentEmail}
                onChange={(e) => setConsentEmail(e.target.checked)}
                required
                className="mt-1 h-4 w-4 accent-violet-royal flex-shrink-0"
              />
              <span className="font-cormorant text-sm leading-relaxed text-parchemin-vieilli/80">
                J'accepte de recevoir l'infolettre de Runes &amp; Magie par
                courriel. Je comprends que je peux me désabonner à tout
                moment via le lien présent dans chaque envoi.
                <span className="text-magenta-rituel"> *</span>
              </span>
            </label>

            {/* Mention légale */}
            <p className="text-xs text-parchemin-vieilli/40 font-cormorant italic leading-relaxed border-t border-violet-royal/20 pt-4">
              Vos informations sont conservées de manière confidentielle
              conformément à la Loi 25 (Québec) et à la LCAP. Aucune
              revente à des tiers. Responsable du traitement&nbsp;:
              Annabelle Dionne — Runes &amp; Magie,
              info@runesetmagie.com.
            </p>

            {/* Submit */}
            <Button type="submit" variant="cta" size="lg" className="w-full">
              Rejoindre le Cercle
            </Button>
          </form>
        )}

        <RuneDivider className="mt-16" />
      </div>
    </section>
  );
}
