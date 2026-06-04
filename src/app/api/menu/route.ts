import { NextResponse } from 'next/server';
import { getVisibleMenu } from '@/lib/menu';

// Toujours frais : les changements de menu apparaissent immédiatement.
export const dynamic = 'force-dynamic';

/** Lecture publique du menu visible (pour la navbar et le footer). */
export async function GET() {
  const menu = await getVisibleMenu();
  return NextResponse.json(menu);
}
