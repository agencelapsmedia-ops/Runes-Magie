-- Consentement d'affichage public dans « Le cercle » (Loi 25 : opt-in requis
-- pour révéler qu'une personne participe à un rituel). Additive uniquement :
-- défaut false, aucune inscription existante ne devient publique.
ALTER TABLE "EventRegistration" ADD COLUMN "showPublicly" BOOLEAN NOT NULL DEFAULT false;
