-- Santé réelle du lien Google Agenda d'une praticienne.
--
-- Contexte : `googleCalendarConnectedAt` n'enregistre que la date de la
-- première autorisation. Quand Google a cessé d'accepter le jeton de Noctura
-- le 16 juillet 2026 (jeton expiré, écran de consentement OAuth resté en
-- statut « Testing » — 7 jours de validité), le jeton est demeuré en base et
-- le tableau de bord a continué d'afficher « Google Agenda connecté » pendant
-- trois semaines, sans qu'aucun rendez-vous ne s'y ajoute.
--
-- `googleSyncError` porte la cause du dernier refus (null = lien sain) et
-- `googleSyncCheckedAt` la date de la dernière vérification, qui sert à
-- espacer les appels à Google.
--
-- Purement additif et nullable : aucune donnée existante n'est touchée.
ALTER TABLE "Practitioner" ADD COLUMN "googleSyncError" TEXT;
ALTER TABLE "Practitioner" ADD COLUMN "googleSyncCheckedAt" TIMESTAMP(3);
