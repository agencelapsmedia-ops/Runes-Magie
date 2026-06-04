# 📝 Choses à faire — Runes & Magie

Idées et tâches en réserve, à planifier plus tard.
Chaque grosse fonctionnalité sera d'abord proposée en **plan** avant d'être codée.

_Dernière mise à jour : 2026-06-04_

---

## 🌐 Module « Gestion site web » — prochaines cartes

- [ ] 🖼️ **Bannières / Carrousel** — gérer les images du hero (haut de l'accueil) depuis l'admin.
- [ ] 🔎 **SEO** — titre + description (balises meta) éditables par page.
- [ ] 📄 **Pages éditables** — modifier les textes de « À Propos » et « Contact » sans toucher au code.
- [ ] 📱 **Réseaux sociaux** — gérer les liens Facebook / Instagram / TikTok du pied de page
      (actuellement des « # » à remplacer par les vraies URL).

## 🧭 Menu de navigation — extensions possibles

- [ ] Gérer aussi la colonne **« Services »** du pied de page (actuellement fixe, pointe vers /soins).
- [ ] Exposer l'option **« ouvrir dans un nouvel onglet »** dans l'éditeur de menu
      (le champ `openInNewTab` existe déjà en base, il suffit de l'afficher).

## ✨ Autres idées en réserve

- [ ] Boutons d'action **œil (masquer) + supprimer** sur d'autres listes admin (Clients, Inventaire).
- [ ] **École** : libellé « S'inscrire » au lieu de « Réserver » pour les cours / ateliers (à décider).
- [ ] **Rune sur les photos** : ajuster la position / la taille si besoin (coin, centré, plus gros…).

## 🔧 Notes techniques (pour le dev)

- [ ] **Sécurité** : révoquer + régénérer le jeton GitHub exposé dans la config git locale.
- [ ] Corriger l'erreur TypeScript pré-existante dans
      `src/app/admin/praticiens/modifications/actions.ts` (cast `AvailabilityPayload`).

---

## ✅ Déjà fait (pour mémoire)

- ✅ Image sur les services (carte + page détail).
- ✅ Sélecteur visuel des 24 runes Elder Futhark (champ Emoji / Rune).
- ✅ Bouton doré « Réserver » sur les cartes + page détail.
- ✅ Rune superposée en haut de la photo.
- ✅ Page d'accueil en rendu live (services toujours à jour).
- ✅ **Gestionnaire de menu façon WordPress** (haut + pied de page) — module « Gestion site web ».
