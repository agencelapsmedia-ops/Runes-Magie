-- Photo de profil du membre (espace membre).
-- Purement additif et nullable : aucune donnée existante n'est touchée.
ALTER TABLE "HolisticUser" ADD COLUMN "avatarUrl" TEXT;
