-- Auteur d'une note de tâche to-do (Noctura, Odalguir…). Additif : les notes
-- existantes gardent une chaîne vide et s'affichent sans auteur.
ALTER TABLE "TodoNote" ADD COLUMN "author" TEXT NOT NULL DEFAULT '';
