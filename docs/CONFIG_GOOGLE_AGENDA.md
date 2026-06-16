# Configuration — Sync Google Agenda (praticiennes)

> **But :** chaque praticienne connecte **son propre** Google Agenda. Quand un RDV
> est payé/confirmé, l'événement apparaît automatiquement dans son agenda (avec
> l'adresse de la boutique pour le présentiel, ou le lien vidéo pour le virtuel).
> Quand un RDV est annulé, l'événement est retiré de son agenda.
>
> **État du code :** ✅ prêt. La fonctionnalité s'active dès que les 3 variables
> d'environnement ci-dessous sont en place. Tant qu'elles sont absentes, le code
> est inerte (aucun impact sur le reste du site).

---

## 1. Créer un projet Google Cloud (gratuit)

1. Aller sur <https://console.cloud.google.com/>.
2. En haut, **sélecteur de projet → Nouveau projet**. Nom : `Runes et Magie` (peu importe). **Créer**.
3. S'assurer que ce projet est sélectionné pour la suite.

## 2. Activer l'API Google Calendar

1. Menu ☰ → **API et services → Bibliothèque**.
2. Chercher **Google Calendar API** → **Activer**.

## 3. Configurer l'écran de consentement OAuth

1. Menu ☰ → **API et services → Écran de consentement OAuth**.
2. Type d'utilisateur : **Externe** → **Créer**.
3. Renseigner :
   - **Nom de l'application** : `Runes & Magie`
   - **Courriel d'assistance** : le courriel d'Annabelle / support
   - **Logo** (optionnel)
   - **Domaines autorisés** : `runesetmagie.ca`
   - **Coordonnées du développeur** : un courriel valide
4. **Étape « Champs d'application »** → **Ajouter ou supprimer des champs** → ajouter :
   - `https://www.googleapis.com/auth/calendar`
   (c'est exactement le scope demandé par le code, voir `src/lib/google-calendar.ts`).
5. **Étape « Utilisateurs tests »** : ajouter l'adresse Gmail de **chaque praticienne**
   qui va connecter son agenda (en mode « test », seuls les comptes listés ici
   peuvent autoriser l'app — voir §7 pour passer en production).
6. **Enregistrer**.

## 4. Créer les identifiants OAuth 2.0

1. Menu ☰ → **API et services → Identifiants → Créer des identifiants → ID client OAuth**.
2. **Type d'application** : **Application Web**.
3. **Nom** : `Runes & Magie — Web`.
4. **URI de redirection autorisés** → **Ajouter un URI** (⚠️ doit correspondre **exactement** à `GOOGLE_REDIRECT_URI`) :

   ```
   https://www.runesetmagie.ca/api/holistique/auth/google/callback
   ```

   > Si le domaine de prod diffère (ex. `runesetmagie.ca` sans `www`), ajouter
   > aussi cette variante. Pour tester en local, on peut ajouter
   > `http://localhost:3000/api/holistique/auth/google/callback`, mais le dev
   > local de ce projet est cassé (voir CLAUDE.md) — on teste donc en prod.
5. **Créer**. Google affiche **l'ID client** et **le secret client** → les copier.

## 5. Ajouter les variables d'environnement sur Vercel

Dans **Vercel → projet → Settings → Environment Variables**, ajouter (scope :
Production, idéalement Preview aussi) :

| Variable | Valeur |
|---|---|
| `GOOGLE_CLIENT_ID` | l'ID client de l'étape 4 |
| `GOOGLE_CLIENT_SECRET` | le secret client de l'étape 4 |
| `GOOGLE_REDIRECT_URI` | `https://www.runesetmagie.ca/api/holistique/auth/google/callback` |

> `NEXT_PUBLIC_APP_URL` est déjà configuré (défaut `https://www.runesetmagie.ca`).
> L'`GOOGLE_REDIRECT_URI` doit être **identique** à l'URI déclaré à l'étape 4.

Après ajout des variables → **redéployer** (un nouveau push sur `main` suffit, ou
**Redeploy** depuis le dashboard Vercel) pour qu'elles soient prises en compte.

## 6. Vérifier que ça marche

1. La praticienne se connecte à son espace : `/soins/dashboard/praticien`.
2. Bandeau **« Connecte ton Google Agenda »** → bouton **Connecter Google Agenda**.
3. Elle choisit son compte Google, autorise l'accès au calendrier.
4. Retour au dashboard avec le bandeau **« Google Agenda connecté »** (+ son courriel).
5. Test bout-en-bout : faire passer un RDV en **CONFIRMED** (paiement test Stripe)
   → l'événement doit apparaître dans son Google Agenda avec le bon titre, l'adresse
   (présentiel) ou le lien vidéo (virtuel). Annuler le RDV → l'événement disparaît.

## 7. Passer de « test » à « production » (quand prêt)

Tant que l'app reste en mode **test** sur l'écran de consentement, seules les
adresses listées en **utilisateurs tests** peuvent connecter leur agenda, et
Google affiche un avertissement « application non vérifiée » (cliquer
« Paramètres avancés → Continuer » pour passer).

Pour ouvrir à toutes les praticiennes sans avertissement :
- Écran de consentement OAuth → **Publier l'application**.
- Le scope `calendar` étant « sensible », Google peut demander une **vérification**
  (logo, page de confidentialité, vidéo de démonstration). Tant qu'il y a peu de
  praticiennes, **rester en mode test + les ajouter comme utilisateurs tests** est
  le plus simple et suffit.

---

## Dépannage

- **« Google Agenda non configuré sur le serveur » (503)** : une des 3 variables
  `GOOGLE_*` manque sur Vercel, ou pas de redéploiement après ajout.
- **Connexion qui revient en erreur** : vérifier que `GOOGLE_REDIRECT_URI` est
  **exactement** l'URI déclaré dans Google Cloud (protocole, `www`, chemin).
- **L'agenda ne reçoit pas de refresh token** : le code force déjà
  `prompt: 'consent'` + `access_type: 'offline'`. Si une praticienne avait déjà
  autorisé sans refresh token, elle peut révoquer l'accès dans
  <https://myaccount.google.com/permissions> puis se reconnecter.
- **L'événement ne se crée pas** : la praticienne est-elle bien connectée
  (bandeau vert) ? Les logs serveur Vercel `[Google Calendar]` indiquent la cause.

## Référence technique

- Lib : `src/lib/google-calendar.ts` (OAuth, création/suppression d'événement).
- Routes : `src/app/api/holistique/auth/google/{connect,callback,disconnect}/route.ts`.
- Déclenchement création : webhook Stripe `src/app/api/holistique/webhooks/stripe/route.ts` (RDV → CONFIRMED).
- Déclenchement suppression : `src/app/api/holistique/appointments/[id]/route.ts` (RDV → CANCELLED).
- Colonnes DB : `Practitioner.googleRefreshToken / googleCalendarEmail / googleCalendarConnectedAt`, `HolisticAppointment.googleEventId`.
