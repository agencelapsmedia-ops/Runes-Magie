import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { trouverGabarit } from '@/lib/pages/registre';

/**
 * PATCH /api/admin/site-pages/[slug]
 *
 * Enregistre une modification faite depuis le pupitre d'édition en ligne, sur
 * une page éditoriale du site. Pendant que la route jumelle
 * `/api/admin/offerings/[id]/landing` sert les pages de services, celle-ci sert
 * les pages libres — même pupitre, même geste pour la personne qui édite.
 *
 * Les champs acceptés dépendent du gabarit de la page (voir le registre) : le
 * navigateur ne peut pas écrire une clé arbitraire dans le JSON.
 */

/** Champs stockés en colonnes plutôt que dans le JSON `content`. */
const CHAMPS_COLONNES = ['title', 'metaTitle', 'metaDescription'] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { slug } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const page = await prisma.sitePage.findUnique({
    where: { slug },
    select: { id: true, template: true, content: true, updatedAt: true },
  });
  if (!page) {
    return NextResponse.json(
      { error: "Cette page n'existe pas encore en base. Lance « npm run db:seed:pages »." },
      { status: 404 },
    );
  }

  const gabarit = trouverGabarit(page.template);
  if (!gabarit) {
    return NextResponse.json(
      { error: `Gabarit « ${page.template} » inconnu.` },
      { status: 400 },
    );
  }

  // Verrou optimiste : si la page qui envoie la modification a été rendue AVANT
  // une autre sauvegarde (deuxième onglet, retour navigateur), on refuse plutôt
  // que d'écraser du contenu plus récent.
  if (typeof body.expectedUpdatedAt === 'string' && body.expectedUpdatedAt) {
    if (page.updatedAt.toISOString() !== body.expectedUpdatedAt) {
      return NextResponse.json(
        {
          error:
            'Cette page a été modifiée depuis son affichage (autre onglet ou sauvegarde plus récente). Recharge la page, puis refais ta modification.',
        },
        { status: 409 },
      );
    }
  }

  const data: Prisma.SitePageUpdateInput = {};

  // 1) Colonnes
  for (const champ of CHAMPS_COLONNES) {
    if (!(champ in body)) continue;
    if (typeof body[champ] !== 'string') {
      return NextResponse.json({ error: `Le champ ${champ} doit être du texte.` }, { status: 400 });
    }
    const valeur = (body[champ] as string).trim();
    if (champ === 'title') {
      if (!valeur) {
        return NextResponse.json({ error: 'Le titre ne peut pas être vide.' }, { status: 400 });
      }
      data.title = valeur;
    } else {
      // Vidé = on retire la personnalisation.
      data[champ] = valeur || null;
    }
  }

  // 2) Champs du gabarit, fusionnés dans le JSON `content`
  const patch: Record<string, unknown> = {};
  for (const champ of Object.keys(body)) {
    if (champ === 'expectedUpdatedAt') continue;
    if ((CHAMPS_COLONNES as readonly string[]).includes(champ)) continue;
    if (!gabarit.champs.has(champ)) {
      return NextResponse.json(
        { error: `Le champ « ${champ} » n'appartient pas à ce gabarit.` },
        { status: 400 },
      );
    }
    if (typeof body[champ] !== 'string') {
      return NextResponse.json({ error: `Le champ ${champ} doit être du texte.` }, { status: 400 });
    }
    patch[champ] = body[champ];
  }

  if (Object.keys(patch).length > 0) {
    const existant =
      page.content && typeof page.content === 'object' && !Array.isArray(page.content)
        ? (page.content as Record<string, unknown>)
        : {};
    // Un champ vidé est conservé vide ici ; c'est le `parse` du gabarit qui le
    // fait retomber sur son texte par défaut à l'affichage.
    data.content = { ...existant, ...patch } as Prisma.InputJsonValue;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Aucun champ modifiable fourni.' }, { status: 400 });
  }

  const misAJour = await prisma.sitePage.update({
    where: { slug },
    data,
    select: { slug: true, updatedAt: true },
  });

  revalidatePath(`/${misAJour.slug}`);

  // Le nouvel horodatage permet d'enchaîner plusieurs scellements dans le même
  // onglet sans déclencher le verrou optimiste.
  return NextResponse.json({ ok: true, updatedAt: misAJour.updatedAt.toISOString() });
}
