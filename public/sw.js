/*
 * Service worker Runes & Magie — stratégie « réseau d'abord ».
 *
 * Choix délibéré (repris d'AGRIPRO, éprouvé en production) : on ne sert
 * JAMAIS du cache quand le réseau répond. Un service worker « cache
 * d'abord » enfermerait les visiteuses sur une version périmée après
 * chaque déploiement Vercel, et le seul recours serait de leur faire
 * vider les données du site. Ici le cache ne sert que de filet hors ligne.
 *
 * Le SW existe surtout pour rendre le site installable (« Télécharger
 * l'application » sur l'accueil). L'accélération n'est pas l'objectif.
 *
 * Pour tout désactiver en cas de problème : remplacer le contenu de ce
 * fichier par `self.registration.unregister()` et redéployer.
 */

const CACHE = 'runes-magie-v1';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
    // Prend la main immédiatement, sans attendre la fermeture des onglets
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE).then((c) => c.addAll([OFFLINE_URL]).catch(() => {}))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Uniquement les GET de notre propre origine. Les appels Stripe,
    // Supabase et autres tiers ne passent pas par le cache : ils portent
    // des jetons d'authentification et des données par personne.
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // L'espace Noctura et l'API restent hors du service worker : contenu
    // authentifié, jamais mis en cache (même « réseau d'abord », on ne
    // veut pas de copie sur le disque de l'appareil).
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                // On ne met en cache que les réponses complètes et valides
                if (response && response.status === 200 && response.type === 'basic') {
                    const copy = response.clone();
                    caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
                }
                return response;
            })
            .catch(async () => {
                // Réseau indisponible : on retombe sur le cache
                const cached = await caches.match(request);
                if (cached) return cached;
                // Navigation sans cache : on sert l'accueil déjà en cache
                if (request.mode === 'navigate') {
                    const shell = await caches.match(OFFLINE_URL);
                    if (shell) return shell;
                }
                return new Response('Hors ligne', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                });
            })
    );
});
