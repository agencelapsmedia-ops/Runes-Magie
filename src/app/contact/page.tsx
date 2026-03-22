"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import RuneDivider from "@/components/ui/RuneDivider";
import Button from "@/components/ui/Button";

const subjectOptions = [
  "Renseignement general",
  "Reservation de service",
  "Question sur un produit",
  "Autre",
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    sujet: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Placeholder: no actual submission
    setSubmitted(true);
  }

  const inputClasses = [
    "w-full bg-charbon-mystere border border-violet-royal/40 rounded-lg px-4 py-3",
    "text-parchemin placeholder:text-parchemin-vieilli/40",
    "focus:outline-none focus:ring-2 focus:ring-violet-mystique/60 focus:border-violet-mystique/60",
    "transition-all duration-300",
    "font-cormorant text-lg",
  ].join(" ");

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <SectionTitle
          title="Contactez-nous"
          subtitle="Les portes du mystere sont ouvertes"
          as="h1"
        />

        <RuneDivider className="my-12" />

        {/* Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: Contact Form */}
          <div>
            {submitted ? (
              <div className="bg-charbon-mystere border border-turquoise-cristal/40 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4 select-none">&#10022;</div>
                <h2 className="font-cinzel text-xl text-or-ancien mb-3">
                  Message Envoye
                </h2>
                <p className="text-parchemin-vieilli/80 font-cormorant text-lg">
                  Merci pour votre message. Nous vous repondrons dans les
                  plus brefs delais. Que la magie vous accompagne.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nom */}
                <div>
                  <label
                    htmlFor="nom"
                    className="block font-cinzel text-sm text-or-ancien/80 mb-2 tracking-wider"
                  >
                    Nom
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    required
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Votre nom complet"
                    className={inputClasses}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block font-cinzel text-sm text-or-ancien/80 mb-2 tracking-wider"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    className={inputClasses}
                  />
                </div>

                {/* Sujet */}
                <div>
                  <label
                    htmlFor="sujet"
                    className="block font-cinzel text-sm text-or-ancien/80 mb-2 tracking-wider"
                  >
                    Sujet
                  </label>
                  <select
                    id="sujet"
                    name="sujet"
                    required
                    value={formData.sujet}
                    onChange={handleChange}
                    className={inputClasses}
                  >
                    <option value="" disabled>
                      Choisir un sujet...
                    </option>
                    {subjectOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block font-cinzel text-sm text-or-ancien/80 mb-2 tracking-wider"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Decrivez votre demande..."
                    className={inputClasses + " resize-vertical"}
                  />
                </div>

                {/* Submit */}
                <Button type="submit" variant="cta" size="lg" className="w-full">
                  Envoyer le Message
                </Button>
              </form>
            )}
          </div>

          {/* Right: Contact Info */}
          <div className="space-y-6">
            {/* Phone */}
            <div className="bg-charbon-mystere border border-violet-royal/30 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-2xl text-or-ancien select-none">
                  &#9742;
                </span>
                <h3 className="font-cinzel text-lg text-parchemin">
                  Telephone
                </h3>
              </div>
              <a
                href="tel:+15143487705"
                className="text-or-ancien hover:text-or-clair transition-colors text-lg font-philosopher"
              >
                (514) 348-7705
              </a>
            </div>

            {/* Email */}
            <div className="bg-charbon-mystere border border-violet-royal/30 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-2xl text-or-ancien select-none">
                  &#9993;
                </span>
                <h3 className="font-cinzel text-lg text-parchemin">
                  Courriel
                </h3>
              </div>
              <a
                href="mailto:info@runesetmagie.com"
                className="text-or-ancien hover:text-or-clair transition-colors text-lg font-philosopher"
              >
                info@runesetmagie.com
              </a>
            </div>

            {/* Social Media */}
            <div className="bg-charbon-mystere border border-violet-royal/30 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-2xl text-or-ancien select-none">
                  &#10038;
                </span>
                <h3 className="font-cinzel text-lg text-parchemin">
                  Reseaux Sociaux
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                <a
                  href="https://www.facebook.com/runesetmagie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-parchemin-vieilli/80 hover:text-or-ancien transition-colors font-philosopher text-lg"
                >
                  Facebook — Runes &amp; Magie
                </a>
                <a
                  href="https://www.instagram.com/runesetmagie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-parchemin-vieilli/80 hover:text-or-ancien transition-colors font-philosopher text-lg"
                >
                  Instagram — @runesetmagie
                </a>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-charbon-mystere border border-violet-royal/30 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-2xl text-or-ancien select-none">
                  &#9202;
                </span>
                <h3 className="font-cinzel text-lg text-parchemin">
                  Heures d&apos;Ouverture
                </h3>
              </div>
              <ul className="space-y-2 text-parchemin-vieilli/80 font-philosopher">
                <li className="flex justify-between">
                  <span>Lundi - Vendredi</span>
                  <span className="text-or-ancien/80">10h - 18h</span>
                </li>
                <li className="flex justify-between">
                  <span>Samedi</span>
                  <span className="text-or-ancien/80">10h - 16h</span>
                </li>
                <li className="flex justify-between">
                  <span>Dimanche</span>
                  <span className="text-or-ancien/80">Ferme</span>
                </li>
              </ul>
            </div>

            {/* Rune Decoration */}
            <div className="text-center pt-4">
              <span className="text-or-ancien/30 text-3xl tracking-[0.5em] select-none font-cinzel">
                &#5765; &#5765; &#5765;
              </span>
            </div>
          </div>
        </div>

        <RuneDivider className="mt-16" />
      </div>
    </section>
  );
}
