import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  inscrire,
  placesRestantes,
  EvenementComplet,
  DejaInscrit,
  EvenementIndisponible,
  EvenementPasse,
  EvenementIntrouvable,
} from '@/lib/evenements';
import { envoyerConfirmationInscription, envoyerNotificationAdmin } from '@/lib/evenement-email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json(
      { error: 'Connexion requise pour vous inscrire.', code: 'NON_CONNECTE' },
      { status: 401 },
    );
  }

  // L'identifiant de session peut appartenir a un AdminUser : on revérifie
  // qu'il s'agit bien d'un membre (meme motif que /api/membre/profil).
  const membre = await prisma.holisticUser.findUnique({ where: { id: userId } });
  if (!membre) {
    return NextResponse.json(
      { error: 'Compte membre introuvable.', code: 'NON_CONNECTE' },
      { status: 401 },
    );
  }

  const evenement = await prisma.event.findUnique({ where: { slug } });
  if (!evenement) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }

  let note: string | null = null;
  // Seul le booléen strict `true` vaut consentement — toute autre valeur
  // (absente, `false`, chaîne, nombre…) est traitée comme un refus. C'est une
  // donnée Loi 25 sensible : en cas de doute sur l'intention, on ne publie pas.
  let afficherPubliquement = false;
  try {
    const corps = (await req.json()) as { note?: unknown; afficherPubliquement?: unknown };
    if (typeof corps.note === 'string' && corps.note.trim()) {
      note = corps.note.trim().slice(0, 1000);
    }
    afficherPubliquement = corps.afficherPubliquement === true;
  } catch {
    // Corps vide ou invalide : message optionnel absent, pas de consentement.
  }

  try {
    const inscription = await inscrire({
      eventId: evenement.id,
      userId: membre.id,
      email: membre.email,
      firstName: membre.firstName,
      lastName: membre.lastName,
      phone: membre.phone,
      note,
      showPublicly: afficherPubliquement,
    });

    const restantes = await placesRestantes(evenement.id);
    const donnees = {
      prenom: membre.firstName,
      nom: membre.lastName,
      courriel: membre.email,
      titre: evenement.title,
      debut: evenement.startsAt,
      lieu: evenement.location,
      enLigne: evenement.isOnline,
      lienEnLigne: evenement.onlineUrl,
      aApporter: evenement.bringItems,
      note,
      jetonAnnulation: inscription.cancelToken,
    };

    // Un echec d'envoi ne doit pas annuler une inscription valide.
    try {
      await Promise.all([
        envoyerConfirmationInscription(donnees),
        envoyerNotificationAdmin(donnees, evenement.capacity - restantes, evenement.capacity),
      ]);
    } catch (erreurCourriel) {
      console.error('[Evenements] Envoi de courriel echoue :', erreurCourriel);
    }

    return NextResponse.json({ ok: true, placesRestantes: restantes }, { status: 201 });
  } catch (erreur) {
    if (erreur instanceof EvenementComplet) {
      return NextResponse.json(
        { error: 'Toutes les places sont prises.', code: 'COMPLET' },
        { status: 409 },
      );
    }
    if (erreur instanceof DejaInscrit) {
      return NextResponse.json(
        { error: 'Vous êtes déjà inscrit à cet événement.', code: 'DEJA_INSCRIT' },
        { status: 409 },
      );
    }
    if (erreur instanceof EvenementIndisponible) {
      return NextResponse.json(
        { error: 'Cet événement n’accepte plus d’inscriptions.', code: 'INDISPONIBLE' },
        { status: 409 },
      );
    }
    if (erreur instanceof EvenementPasse) {
      return NextResponse.json(
        { error: 'Cet événement a déjà eu lieu.', code: 'PASSE' },
        { status: 409 },
      );
    }
    if (erreur instanceof EvenementIntrouvable) {
      return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
    }
    console.error('[Evenements] Inscription echouee :', erreur);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
