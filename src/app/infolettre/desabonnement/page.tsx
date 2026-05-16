'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import Button from '@/components/ui/Button';

function DesabonnementContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<'loading' | 'success' | 'already' | 'invalid' | 'missing' | 'error'>(
    token ? 'loading' : 'missing',
  );
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function unsubscribe() {
      try {
        const res = await fetch(`/api/infolettre/unsubscribe?token=${encodeURIComponent(token!)}`);
        const data = await res.json();

        if (!res.ok) {
          setState('invalid');
          return;
        }

        setEmail(data.email ?? null);
        setState(data.alreadyUnsubscribed ? 'already' : 'success');
      } catch {
        setState('error');
      }
    }

    unsubscribe();
  }, [token]);

  return (
    <section className="py-16 md:py-24 px-4 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <SectionTitle title="Désabonnement" subtitle="Infolettre Runes & Magie" as="h1" />

        <RuneDivider className="my-10" />

        <div className="bg-charbon-mystere/40 border border-violet-royal/30 rounded-lg p-6 md:p-10 text-center">
          {state === 'loading' && (
            <div>
              <div
                className="font-cinzel-decorative text-5xl mb-6 select-none animate-pulse"
                style={{ color: 'rgba(201, 168, 76, 0.5)' }}
                aria-hidden="true"
              >
                ᛟ
              </div>
              <p className="text-parchemin/70 font-cormorant text-lg">
                Traitement de votre désabonnement…
              </p>
            </div>
          )}

          {state === 'success' && (
            <div>
              <div className="text-5xl mb-6 select-none">&#10022;</div>
              <h2 className="font-cinzel text-2xl text-or-ancien mb-4">
                Vous êtes désabonné(e)
              </h2>
              <p className="text-parchemin-vieilli/80 font-cormorant text-lg mb-6">
                {email ? (
                  <>
                    L'adresse <strong className="text-turquoise-cristal">{email}</strong> ne recevra
                    plus l'infolettre de Runes &amp; Magie.
                  </>
                ) : (
                  'Vous ne recevrez plus l\'infolettre de Runes & Magie.'
                )}
              </p>
              <p className="text-parchemin/50 font-cormorant text-sm italic mb-8">
                Merci d'avoir fait partie de notre cercle. Vous pouvez vous réinscrire à tout moment.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="secondary" size="md" href="/">
                  Retour à l'accueil
                </Button>
                <Button variant="mystique" size="md" href="/infolettre">
                  Se réinscrire
                </Button>
              </div>
            </div>
          )}

          {state === 'already' && (
            <div>
              <div className="text-5xl mb-6 select-none text-turquoise-cristal">ᚱ</div>
              <h2 className="font-cinzel text-2xl text-or-ancien mb-4">
                Déjà désabonné(e)
              </h2>
              <p className="text-parchemin-vieilli/80 font-cormorant text-lg mb-6">
                {email ? (
                  <>
                    L'adresse <strong>{email}</strong> est déjà désinscrite de notre infolettre.
                  </>
                ) : (
                  'Cette adresse est déjà désinscrite.'
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="secondary" size="md" href="/">
                  Retour à l'accueil
                </Button>
                <Button variant="mystique" size="md" href="/infolettre">
                  Se réinscrire
                </Button>
              </div>
            </div>
          )}

          {state === 'invalid' && (
            <div>
              <div className="text-5xl mb-6 select-none text-magenta-rituel/60">ᛉ</div>
              <h2 className="font-cinzel text-2xl text-or-ancien mb-4">Lien invalide</h2>
              <p className="text-parchemin-vieilli/80 font-cormorant text-lg mb-6">
                Ce lien de désabonnement est invalide ou a déjà été utilisé.
              </p>
              <p className="text-parchemin/50 font-cormorant text-sm italic mb-8">
                Si vous souhaitez tout de même vous désabonner, écrivez-nous à{' '}
                <a
                  href="mailto:info@runesetmagie.com"
                  className="text-turquoise-cristal hover:text-or-ancien transition-colors"
                >
                  info@runesetmagie.com
                </a>
                .
              </p>
              <Button variant="secondary" size="md" href="/">
                Retour à l'accueil
              </Button>
            </div>
          )}

          {state === 'missing' && (
            <div>
              <div className="text-5xl mb-6 select-none text-or-ancien/40">ᚦ</div>
              <h2 className="font-cinzel text-2xl text-or-ancien mb-4">Lien incomplet</h2>
              <p className="text-parchemin-vieilli/80 font-cormorant text-lg mb-6">
                Aucun token de désabonnement n'a été fourni. Veuillez utiliser le lien
                « Se désabonner » présent dans nos courriels.
              </p>
              <p className="text-parchemin/50 font-cormorant text-sm italic mb-8">
                Vous pouvez aussi nous écrire à{' '}
                <a
                  href="mailto:info@runesetmagie.com"
                  className="text-turquoise-cristal hover:text-or-ancien transition-colors"
                >
                  info@runesetmagie.com
                </a>{' '}
                pour un désabonnement manuel.
              </p>
              <Button variant="secondary" size="md" href="/">
                Retour à l'accueil
              </Button>
            </div>
          )}

          {state === 'error' && (
            <div>
              <div className="text-5xl mb-6 select-none text-magenta-rituel/60">ᚺ</div>
              <h2 className="font-cinzel text-2xl text-or-ancien mb-4">Erreur serveur</h2>
              <p className="text-parchemin-vieilli/80 font-cormorant text-lg mb-6">
                Impossible de traiter le désabonnement pour l'instant. Réessayez dans quelques
                instants ou écrivez-nous à{' '}
                <a
                  href="mailto:info@runesetmagie.com"
                  className="text-turquoise-cristal hover:text-or-ancien transition-colors"
                >
                  info@runesetmagie.com
                </a>
                .
              </p>
              <Button variant="secondary" size="md" href="/">
                Retour à l'accueil
              </Button>
            </div>
          )}
        </div>

        <RuneDivider className="mt-16" />

        <p className="text-center mt-8 text-xs text-parchemin/30 font-cormorant italic leading-relaxed">
          Conformément à la Loi 25 (Québec) et à la LCAP, le désabonnement est immédiat
          et définitif. Aucune confirmation n'est requise.
        </p>

        <p className="text-center mt-4">
          <Link
            href="/"
            className="font-philosopher text-xs text-parchemin/30 hover:text-parchemin/60 transition-colors duration-200"
          >
            ← Retour au site
          </Link>
        </p>
      </div>
    </section>
  );
}

export default function DesabonnementPage() {
  return (
    <Suspense
      fallback={
        <section className="py-16 px-4 min-h-screen text-center">
          <p className="text-parchemin/50 font-cormorant text-lg">Chargement…</p>
        </section>
      }
    >
      <DesabonnementContent />
    </Suspense>
  );
}
