import type { Metadata } from 'next';
import Link from 'next/link';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import { BOUTIQUE_ADDRESS, BOUTIQUE_PHONE, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Runes & Magie',
  description:
    'Comment Runes & Magie recueille, utilise et protège vos renseignements personnels, conformément à la Loi 25 (Québec).',
  alternates: { canonical: `${SITE_URL}/confidentialite` },
};

/** Date de dernière révision — à mettre à jour à chaque modification du texte. */
const DERNIERE_MAJ = '6 août 2026';

const COURRIEL_RESPONSABLE = 'info@runesetmagie.com';

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-cinzel text-xl md:text-2xl text-or-ancien tracking-wide">{titre}</h2>
      <div className="mt-4 space-y-4 font-cormorant text-lg leading-relaxed text-parchemin/85">
        {children}
      </div>
    </section>
  );
}

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-noir-nuit text-parchemin">
      {/* En-tête */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-royal/10 blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <SectionTitle as="h1" title="Politique de confidentialité" />
          <p className="mt-6 font-cormorant text-lg text-parchemin-vieilli italic">
            Dernière mise à jour : {DERNIERE_MAJ}
          </p>
        </div>
      </section>

      <RuneDivider />

      <div className="max-w-3xl mx-auto px-6 pb-24">
        <p className="mt-12 font-cormorant text-lg leading-relaxed text-parchemin/85">
          Chez Runes &amp; Magie, la confiance est au cœur de notre pratique. Cette politique explique
          en termes simples quels renseignements personnels nous recueillons, pourquoi, avec qui ils
          sont partagés et quels sont vos droits. Elle est rédigée conformément à la{' '}
          <em>Loi sur la protection des renseignements personnels dans le secteur privé</em> du Québec,
          telle que modifiée par la <strong>Loi 25</strong>.
        </p>

        <Section titre="1. Qui est responsable de vos renseignements">
          <p>
            <strong>Runes &amp; Magie</strong>, exploitée par Annabelle Dionne, située au{' '}
            {BOUTIQUE_ADDRESS}.
          </p>
          <p>
            La <strong>responsable de la protection des renseignements personnels</strong> est
            Annabelle Dionne. Vous pouvez la joindre en tout temps :
          </p>
          <ul className="list-none space-y-1 pl-4">
            <li>
              Courriel :{' '}
              <a href={`mailto:${COURRIEL_RESPONSABLE}`} className="text-turquoise-cristal hover:text-or-ancien transition-colors">
                {COURRIEL_RESPONSABLE}
              </a>
            </li>
            <li>Téléphone : {BOUTIQUE_PHONE}</li>
            <li>Poste : {BOUTIQUE_ADDRESS}</li>
          </ul>
        </Section>

        <Section titre="2. Les renseignements que nous recueillons">
          <p>Nous ne recueillons que ce qui est nécessaire, et seulement dans ces situations :</p>

          <p className="text-or-clair font-philosopher">Lors de la création d&apos;un compte</p>
          <p>Prénom, nom, adresse courriel, mot de passe (chiffré, jamais lisible par nous) et, si vous le fournissez, votre numéro de téléphone.</p>

          <p className="text-or-clair font-philosopher">Lors d&apos;une réservation de soin ou de consultation</p>
          <p>
            La date et le service choisis, la praticienne, le mode (en personne ou en ligne), ainsi que
            les notes que vous choisissez de nous transmettre. Si une décharge électronique est signée,
            nous conservons la date, une empreinte numérique du document et l&apos;adresse IP de
            signature, comme l&apos;exige la loi québécoise encadrant les documents technologiques.
          </p>

          <p className="text-or-clair font-philosopher">Lors d&apos;un achat</p>
          <p>
            Les articles commandés, le montant et vos coordonnées de livraison ou de facturation.{' '}
            <strong>Nous ne voyons jamais votre numéro de carte de crédit</strong> : le paiement est
            traité directement par notre fournisseur sécurisé.
          </p>

          <p className="text-or-clair font-philosopher">Lors d&apos;une inscription à l&apos;infolettre</p>
          <p>
            Votre adresse courriel, la date de votre consentement et l&apos;adresse IP à ce moment —
            cette preuve est exigée par la loi canadienne anti-pourriel.
          </p>

          <p className="text-or-clair font-philosopher">Lors d&apos;une inscription à un événement</p>
          <p>
            Prénom, nom, courriel, téléphone et toute note que vous ajoutez. Votre prénom
            n&apos;apparaît publiquement dans la liste des participants{' '}
            <strong>que si vous cochez expressément cette case</strong>.
          </p>

          <p className="text-or-clair font-philosopher">Lors d&apos;un échange avec Noctura, notre guide virtuelle</p>
          <p>
            Le contenu de la conversation, et vos coordonnées uniquement si vous choisissez de les
            donner. Voir la section 9 à ce sujet.
          </p>

          <p className="text-or-clair font-philosopher">Lors de votre navigation</p>
          <p>
            Des témoins (« cookies ») strictement nécessaires au fonctionnement du site : garder votre
            session ouverte et retenir le contenu de votre panier. Nous n&apos;utilisons pas de témoins
            publicitaires ni de traçage à des fins de profilage.
          </p>
        </Section>

        <Section titre="3. Pourquoi nous les utilisons">
          <ul className="list-disc pl-6 space-y-2">
            <li>Vous offrir les services que vous demandez : rendez-vous, commandes, formations, événements.</li>
            <li>Vous envoyer les confirmations, rappels et informations pratiques liés à ces services.</li>
            <li>Répondre à vos questions et assurer le suivi de votre dossier.</li>
            <li>Vous transmettre notre infolettre, <strong>uniquement si vous y avez consenti</strong>.</li>
            <li>Respecter nos obligations comptables, fiscales et légales.</li>
            <li>Assurer la sécurité du site et prévenir les usages frauduleux.</li>
          </ul>
          <p>
            Nous ne vendons, ne louons ni n&apos;échangeons vos renseignements personnels à des tiers.
            Jamais.
          </p>
        </Section>

        <Section titre="4. Avec qui ils sont partagés">
          <p>
            Nous faisons appel à des fournisseurs spécialisés qui agissent pour notre compte et sont
            liés par des engagements de confidentialité. Chacun ne reçoit que ce qui lui est nécessaire :
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Hébergement du site</strong> — pour afficher les pages et faire fonctionner l&apos;application.</li>
            <li><strong>Base de données et stockage des images</strong> — pour conserver votre dossier et les visuels.</li>
            <li><strong>Traitement des paiements en ligne</strong> — pour encaisser de façon sécurisée sans que nous voyions vos données bancaires.</li>
            <li><strong>Caisse de la boutique physique</strong> — pour les achats faits sur place.</li>
            <li><strong>Envoi des courriels</strong> — confirmations, rappels et infolettre.</li>
            <li><strong>Visioconférence</strong> — pour les consultations à distance.</li>
            <li><strong>Intelligence artificielle conversationnelle</strong> — pour le fonctionnement de Noctura (voir section 9).</li>
          </ul>
          <p>
            Nous pouvons également communiquer des renseignements si la loi l&apos;exige, notamment à la
            demande d&apos;une autorité compétente.
          </p>
        </Section>

        <Section titre="5. Conservation à l'extérieur du Québec">
          <p>
            Plusieurs de ces fournisseurs conservent ou traitent les données{' '}
            <strong>à l&apos;extérieur du Québec, notamment aux États-Unis</strong>. Nous les
            sélectionnons en tenant compte de la sensibilité des renseignements confiés, des mesures de
            sécurité qu&apos;ils appliquent et des engagements contractuels qui les lient. Vos
            renseignements y bénéficient d&apos;une protection que nous jugeons adéquate.
          </p>
        </Section>

        <Section titre="6. Combien de temps nous les conservons">
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Compte client</strong> : tant que votre compte est actif, puis trois ans après votre dernière activité.</li>
            <li><strong>Factures et transactions</strong> : six ans, comme l&apos;exigent nos obligations fiscales.</li>
            <li><strong>Décharges signées</strong> : trois ans après la dernière séance.</li>
            <li><strong>Infolettre</strong> : jusqu&apos;à votre désabonnement, puis nous gardons seulement la trace du retrait afin de ne plus vous écrire.</li>
            <li><strong>Conversations du chat</strong> : douze mois.</li>
            <li><strong>Inscriptions aux événements</strong> : douze mois après l&apos;événement.</li>
          </ul>
          <p>Au terme de ces périodes, les renseignements sont détruits ou anonymisés de façon irréversible.</p>
        </Section>

        <Section titre="7. Comment nous les protégeons">
          <ul className="list-disc pl-6 space-y-2">
            <li>Tout le site est chiffré (HTTPS) de bout en bout.</li>
            <li>Les mots de passe sont irréversiblement chiffrés — personne, pas même nous, ne peut les lire.</li>
            <li>L&apos;accès à l&apos;administration est réservé aux personnes autorisées et protégé par mot de passe.</li>
            <li>Les clés d&apos;accès à nos services externes sont chiffrées et ne sont jamais affichées.</li>
            <li>Seules les personnes qui en ont besoin dans l&apos;exercice de leurs fonctions consultent vos renseignements.</li>
          </ul>
        </Section>

        <Section titre="8. Vos droits">
          <p>La loi québécoise vous reconnaît les droits suivants, que vous pouvez exercer gratuitement :</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Accès</strong> — obtenir la liste des renseignements que nous détenons sur vous.</li>
            <li><strong>Rectification</strong> — faire corriger un renseignement inexact ou incomplet.</li>
            <li><strong>Retrait du consentement</strong> — cesser de recevoir l&apos;infolettre ou toute communication facultative, en tout temps.</li>
            <li><strong>Suppression</strong> — demander l&apos;effacement de vos renseignements, sous réserve de ce que la loi nous oblige à conserver.</li>
            <li><strong>Portabilité</strong> — recevoir vos renseignements dans un format technologique structuré et couramment utilisé.</li>
            <li><strong>Plainte</strong> — si notre réponse ne vous satisfait pas, vous adresser à la Commission d&apos;accès à l&apos;information du Québec.</li>
          </ul>
          <p>
            Écrivez simplement à{' '}
            <a href={`mailto:${COURRIEL_RESPONSABLE}`} className="text-turquoise-cristal hover:text-or-ancien transition-colors">
              {COURRIEL_RESPONSABLE}
            </a>
            . Nous répondons dans un délai maximal de <strong>30 jours</strong>.
          </p>
        </Section>

        <Section titre="9. Noctura et l'intelligence artificielle">
          <p>
            Noctura, la guide virtuelle du site, fonctionne à l&apos;aide d&apos;un service
            d&apos;intelligence artificielle. Le contenu de votre conversation est transmis à ce
            fournisseur uniquement pour générer la réponse affichée à l&apos;écran.
          </p>
          <p>
            Noctura ne prend <strong>aucune décision</strong> vous concernant : elle informe et oriente.
            Elle n&apos;offre pas d&apos;avis médical, psychologique ou thérapeutique. Nous vous
            invitons à ne pas y écrire de renseignements sensibles — notamment de nature médicale.
            Si vous souhaitez parler à une personne de l&apos;équipe, elle vous transmettra nos
            coordonnées avec plaisir.
          </p>
        </Section>

        <Section titre="10. Notifications sur votre appareil">
          <p>
            Si vous ajoutez Runes &amp; Magie à l&apos;écran d&apos;accueil de votre téléphone et que
            vous acceptez les notifications, nous conservons un identifiant technique propre à votre
            appareil, afin de pouvoir vous les transmettre. Cet identifiant ne révèle ni votre identité
            ni votre position.
          </p>
          <p>
            Vous pouvez désactiver ces notifications à tout moment, depuis les réglages de votre
            appareil ou depuis votre compte. Nous cessons alors immédiatement de vous en envoyer.
          </p>
        </Section>

        <Section titre="11. Personnes mineures">
          <p>
            Nos services s&apos;adressent aux personnes de 14 ans et plus. Pour une personne de moins de
            14 ans, le consentement du parent ou du tuteur est requis. Si vous constatez qu&apos;un
            enfant nous a transmis des renseignements sans cette autorisation, écrivez-nous et nous les
            supprimerons.
          </p>
        </Section>

        <Section titre="12. En cas d'incident">
          <p>
            Si un incident de confidentialité risquait de vous causer un préjudice sérieux, nous vous
            en informerions dans les meilleurs délais et en aviserions la Commission d&apos;accès à
            l&apos;information, comme la loi l&apos;exige. Nous tenons un registre de tout incident.
          </p>
        </Section>

        <Section titre="13. Modifications de cette politique">
          <p>
            Nous pouvons faire évoluer ce texte pour refléter nos pratiques ou la loi. La date de mise à
            jour figure en haut de la page. Tout changement important vous sera signalé sur le site ou
            par courriel.
          </p>
        </Section>

        <Section titre="14. Nous joindre">
          <p>
            Une question, une inquiétude, une demande ? Écrivez à{' '}
            <a href={`mailto:${COURRIEL_RESPONSABLE}`} className="text-turquoise-cristal hover:text-or-ancien transition-colors">
              {COURRIEL_RESPONSABLE}
            </a>{' '}
            ou téléphonez au {BOUTIQUE_PHONE}. Nous vous répondrons avec attention.
          </p>
          <p className="pt-4">
            <Link href="/contact" className="text-turquoise-cristal hover:text-or-ancien transition-colors">
              Formulaire de contact →
            </Link>
          </p>
        </Section>
      </div>
    </main>
  );
}
