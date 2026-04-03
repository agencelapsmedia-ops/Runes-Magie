# Suivi — Plateforme de Soins Holistiques

**Projet :** runesetmagie.ca/soins
**Dernière mise à jour :** 2026-04-02
**Architecture :** Route group `(holistique)` isolé dans le même Next.js, même Supabase

---

## ✅ COMPLÉTÉ

### Infrastructure & Auth
- [x] Modèles Prisma ajoutés au schema (`HolisticUser`, `Practitioner`, `HolisticAvailability`, `HolisticAppointment`, `HolisticPayment`, `HolisticReview`, `HolisticNotification`)
- [x] `prisma db push` — schema synchronisé avec Supabase
- [x] `src/lib/holistic-auth.ts` — NextAuth séparé (Credentials, rôles CLIENT/PRACTITIONER/ADMIN)
- [x] `src/app/api/holistique/auth/[...nextauth]/route.ts`
- [x] `src/app/api/holistique/auth/register/route.ts` — création compte avec support `isPractitioner`

### Layout & Pages de base
- [x] `src/app/(holistique)/layout.tsx` — Layout isolé sans Navbar/Footer du site principal
- [x] `src/app/(holistique)/soins/page.tsx` — Page d'accueil plateforme (hero, comment ça marche, spécialités, praticiens)
- [x] `src/app/(holistique)/soins/auth/login/page.tsx` — Connexion
- [x] `src/app/(holistique)/soins/auth/register/page.tsx` — Inscription client

### Annuaire Praticiens
- [x] `src/components/holistique/PractitionerCard.tsx` — Carte praticien (photo/initiales, spécialités, étoiles, tarif)
- [x] `src/app/(holistique)/soins/praticiens/page.tsx` — Liste tous les praticiens approuvés
- [x] `src/app/(holistique)/soins/praticiens/[slug]/page.tsx` — Profil praticien (bio, disponibilités, avis)
- [x] `src/app/api/holistique/practitioners/route.ts` — GET praticiens approuvés
- [x] `src/app/api/holistique/practitioners/[slug]/route.ts` — GET praticien par slug

---

## ✅ COMPLÉTÉ — Session 2026-04-02

### Pages
- [x] `src/app/(holistique)/soins/inscription-praticien/page.tsx` — Formulaire inscription praticien (3 étapes)
- [x] `src/app/(holistique)/soins/reserver/[practitionerId]/page.tsx` — Calendrier créneaux + paiement
- [x] `src/app/(holistique)/soins/dashboard/client/page.tsx` — Dashboard client (rdv à venir/passés)
- [x] `src/app/(holistique)/soins/dashboard/praticien/page.tsx` — Dashboard praticien (agenda, revenus, avis)
- [x] `src/app/(holistique)/soins/consultation/[appointmentId]/page.tsx` — Salle vidéo Daily.co

### API Routes
- [x] `src/app/api/holistique/practitioners/by-id/[practitionerId]/route.ts`
- [x] `src/app/api/holistique/practitioners/apply/route.ts`
- [x] `src/app/api/holistique/appointments/route.ts` (GET + POST)
- [x] `src/app/api/holistique/appointments/[id]/route.ts` (PUT confirmer/annuler)
- [x] `src/app/api/holistique/checkout/route.ts` — Stripe Connect 35% commission
- [x] `src/app/api/holistique/webhooks/stripe/route.ts` — Confirmer paiement (STRIPE_HOLISTIC_WEBHOOK_SECRET)
- [x] `src/app/api/holistique/video/[appointmentId]/route.ts` — Daily.co rooms
- [x] `src/app/api/holistique/reviews/route.ts`

### Admin
- [x] `src/app/admin/praticiens/page.tsx` — Approbation praticiens (tabs: En attente / Approuvés / Rejetés)
- [x] `src/app/admin/consultations/page.tsx` — Liste toutes les consultations
- [x] `src/app/admin/revenus-holistique/page.tsx` — Comptabilité commissions 35%
- [x] Liens sidebar dans `src/app/admin/layout.tsx` (Praticiens ᚻ, Consultations ᛜ, Revenus Holistique ᚴ)
- [x] `src/app/api/admin/holistic/practitioners/[id]/route.ts` — Approve/Reject

### Intégration site principal
- [x] Lien "Soins Holistiques" dans `src/components/layout/Navbar.tsx`
- [x] Section holistic sur `src/app/page.tsx` (homepage) — 4 cards services + CTA

### Données
- [x] `prisma/seed-holistique.ts` — 6 praticiens fictifs
- [x] Seed exécuté — 6 praticiens APPROVED en base:
  - Séraphine Beaumont (Reiki, Soins Chamaniques) — 95$/h
  - Marc-André Tremblay (Naturopathie, Coaching Spirituel) — 85$/h
  - Luna Moreau (Cristallothérapie, Reiki) — 90$/h
  - Étienne Dubois (Hypnose, Coaching Spirituel) — 110$/h
  - Isabelle Côté (Soins Chamaniques, Naturopathie) — 100$/h
  - Naomie Bergeron (Reiki, Cristallothérapie, Coaching) — 80$/h

---

## 📋 À FAIRE (sessions futures)

### Variables d'environnement à configurer
```env
DAILY_API_KEY=           # Daily.co — créer compte sur daily.co
TWILIO_ACCOUNT_SID=      # SMS rappels — optionnel MVP
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
STRIPE_WEBHOOK_SECRET_HOLISTIC=   # whsec_... depuis dashboard Stripe
COMMISSION_RATE=0.35
NEXT_PUBLIC_APP_URL=https://www.runesetmagie.ca
```
(STRIPE_SECRET_KEY et RESEND_API_KEY déjà dans .env)

### Fonctionnalités post-MVP
- [ ] Notifications SMS Twilio (rappels 24h et 1h avant)
- [ ] Emails Resend (confirmation, rappels, changement statut)
- [ ] Stripe Connect Onboarding pour les praticiens (`/api/holistique/stripe/connect`)
- [ ] Page édition profil praticien
- [ ] Gestion des disponibilités (praticien peut modifier ses créneaux)
- [ ] Système d'avis avec modération admin
- [ ] Décharge électronique LCCJTI (DischargeForm component)
- [ ] Payout automatique 24h après consultation (cron job ou webhook)
- [ ] Reminder notifications (cron: 24h avant, 1h avant)

### Tests à faire
- [ ] Tester inscription client + praticien
- [ ] Tester réservation + paiement Stripe test mode
- [ ] Tester vidéo Daily.co
- [ ] Vérifier commission 35% dans dashboard Stripe
- [ ] Tester approbation praticien admin → visible dans liste publique
- [ ] Vérifier aucune page existante du site n'est affectée

---

## 🏗️ Architecture

```
src/app/(holistique)/soins/     → runesetmagie.ca/soins/...
src/components/holistique/      → Composants isolés
src/app/api/holistique/         → API routes isolées
src/lib/holistic-auth.ts        → NextAuth séparé
prisma/seed-holistique.ts       → Données fictives
```

### Commission Stripe
- Client paie: `hourlyRate × durationHours`
- Commission Runes & Magie: 35% (`application_fee_amount`)
- Versement praticien: 65% (via `transfer_data.destination`)
- Délai virement: 24h après consultation COMPLETED

### Modèles clés
- `HolisticUser.role`: CLIENT | PRACTITIONER | ADMIN
- `Practitioner.status`: PENDING | APPROVED | REJECTED | SUSPENDED
- `HolisticAppointment.status`: PENDING | CONFIRMED | CANCELLED | COMPLETED
- `HolisticPayment.status`: PENDING | PAID | REFUNDED | FAILED

---

*Ce fichier est mis à jour automatiquement à chaque session de développement.*
