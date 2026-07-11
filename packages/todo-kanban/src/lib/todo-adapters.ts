/**
 * KIT TO-DO KANBAN — Point de branchement unique (« les 3 prises »).
 *
 * Copie ce fichier dans `src/lib/todo-adapters.ts` du site hôte, puis adapte
 * les 3 exports ci-dessous à ce site. C'EST LE SEUL FICHIER À MODIFIER —
 * le tableau et les routes API n'importent QUE depuis ici.
 *
 * ── Ci-dessous : le branchement tel qu'utilisé sur Runes & Magie. ──
 */

// 1) BASE DE DONNÉES — le client Prisma du site (exposant TodoTask/TodoNote/TodoAttachment).
export { prisma } from '@/lib/db';

// 2) CONNEXION ADMIN — gardien des routes API.
//    Contrat : () => Promise<Response | null>
//      • renvoie une Response (401 / redirection) si l'utilisateur N'EST PAS admin ;
//      • renvoie null (ou undefined) si l'accès est autorisé.
//    Les routes font : const guard = await requireAdmin(); if (guard) return guard;
export { requireAdmin } from '@/lib/admin-guard';

// 3) STOCKAGE DE FICHIERS — téléverse un fichier et renvoie son URL publique.
//    Contrat : (file: File, folder?: string) => Promise<string>
export { uploadFile } from '@/lib/supabase';

/*
 * ── Exemple d'adaptation si le site hôte n'a PAS ces fichiers ──
 *
 *   import { PrismaClient } from '@prisma/client';
 *   export const prisma = new PrismaClient();
 *
 *   import { NextResponse } from 'next/server';
 *   import { auth } from '@/lib/auth'; // ta propre auth
 *   export async function requireAdmin() {
 *     const session = await auth();
 *     if (session?.user?.role !== 'ADMIN')
 *       return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
 *     return null;
 *   }
 *
 *   export async function uploadFile(file: File, folder = 'todo'): Promise<string> {
 *     // ta logique de stockage (Supabase, S3, disque…) → retourne l'URL publique
 *   }
 */
