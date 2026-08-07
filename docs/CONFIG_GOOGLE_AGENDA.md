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
   peuvent autoriser l'app).
6. **Enregistrer**.

> ⚠️ **Ne pas rester en mode « test ».** Passer en production dès maintenant :
> voir §7. En mode test, Google **révoque le jeton au bout de 7 jours** et la
> synchro s'arrête en silence.

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

## 7. Publier l'application — ⚠️ obligatoire, pas optionnel

**Le mode « test » fait expirer le jeton de rafraîchissement au bout de 7 jours.**
C'est une règle de Google, pas un réglage : passé ce délai, Google répond
`invalid_grant`, la synchro s'arrête, et **rien ne le signalait avant août 2026**
(voir « Ce qui s'est passé » plus bas).

Correctif permanent :

1. **API et services → Écran de consentement OAuth** (dans le **bon projet** :
   celui dont le numéro est le préfixe du `GOOGLE_CLIENT_ID`, avant le tiret).
2. Si l'état affiché est **« Test »** → bouton **« Publier l'application »** →
   confirmer **« Confirmer »**. L'état passe à **« En production »**.
3. La praticienne doit ensuite **se reconnecter** (§8) : publier ne ressuscite
   pas un jeton déjà mort, ça empêche seulement les prochains d'expirer.

**Ce que « publier sans vérification Google » implique :**

- Google affiche « Google n'a pas validé cette application » au moment de
  connecter l'agenda → cliquer **« Paramètres avancés » → « Continuer vers… »**.
  C'est un avertissement, pas un blocage.
- Limite de **100 utilisateurs** pour une app publiée non vérifiée. On en a 4.
  Aucun impact.
- La vérification Google (logo, page de confidentialité, vidéo de démo) ne
  devient nécessaire que pour dépasser 100 comptes connectés.

**Ce qui s'est passé (juillet 2026) :** l'app était restée en mode test. Le jeton
de Noctura, obtenu le 9 juillet, a été révoqué par Google dans la fenêtre du
14–19 juillet. Pendant **trois semaines**, tous les RDV confirmés ont cessé
d'apparaître dans son agenda sans le moindre signal — l'interface affichait
toujours « connecté ». Le bandeau d'alerte du §9 a été ajouté pour ça.

## 8. Reconnecter l'agenda d'une praticienne

Après un refus de jeton (bandeau rouge sur son tableau de bord) :

1. `/soins/dashboard/praticien` → **Déconnecter Google Agenda** (vide le jeton mort).
2. **Connecter Google Agenda** → choisir son compte → « Paramètres avancés →
   Continuer » si l'avertissement s'affiche → autoriser l'accès au calendrier.
3. Le rattrapage est **automatique** : `syncFutureConfirmedAppointments` pousse
   tous les RDV futurs déjà confirmés qui n'ont pas encore d'événement.

## 9. Surveillance de l'état du lien

`verifierConnexionGoogle()` (dans `src/lib/google-calendar.ts`) redemande un jeton
d'accès à Google au plus toutes les 30 minutes et consigne le verdict dans
`Practitioner.googleSyncError` / `googleSyncCheckedAt`. Le bandeau du tableau de
bord lit ces champs : il distingue « connectée » de « connectée un jour, mais
Google n'en veut plus ». Les pannes passagères (réseau, quota) ne condamnent pas
le lien — seul `invalid_grant` / `unauthorized_client` le fait.

Diagnostic en ligne de commande (lecture seule, tous les comptes d'un coup) :

```bash
npx tsx scripts/_diag-google-agenda.ts
```

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
- **`invalid_grant` / « Google a refusé l'autorisation enregistrée »** : le jeton
  est mort. **Cause n° 1 : l'app est repassée ou restée en mode « test » (§7).**
  Vérifier l'état de publication AVANT de reconnecter, sinon ça recasse dans
  7 jours. Puis reconnecter (§8).
- **L'événement ne se crée pas** : la praticienne est-elle bien connectée
  (bandeau vert) ? Les logs serveur Vercel `[Google Calendar]` indiquent la cause.

## Référence technique

- Lib : `src/lib/google-calendar.ts` (OAuth, création/suppression d'événement).
- Routes : `src/app/api/holistique/auth/google/{connect,callback,disconnect}/route.ts`.
- Déclenchement création : webhook Stripe `src/app/api/holistique/webhooks/stripe/route.ts` (RDV → CONFIRMED).
- Déclenchement suppression : `src/app/api/holistique/appointments/[id]/route.ts` (RDV → CANCELLED).
- Colonnes DB : `Practitioner.googleRefreshToken / googleCalendarEmail / googleCalendarConnectedAt`, `HolisticAppointment.googleEventId`.
