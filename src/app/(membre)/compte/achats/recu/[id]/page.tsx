import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ENTREPRISE } from '@/lib/receipt-service';
import PrintButton from './PrintButton';

/**
 * Reçu imprimable (la cliente utilise Imprimer/PDF de son navigateur).
 * Sécurité : le reçu doit appartenir à la cliente de la session (admins exclus
 * du filtre pour la prévisualisation).
 */
export default async function RecuPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!user?.id) redirect('/soins/auth/login?callbackUrl=/compte/achats');

  const { id } = await params;
  const isAdmin = user.role === 'ADMIN' || user.isOwner === true;
  const r = await prisma.receipt.findFirst({
    where: { id, ...(isAdmin ? {} : { clientId: user.id }) },
    include: { client: { select: { firstName: true, lastName: true, email: true } } },
  });
  if (!r) notFound();

  const dateFr = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long', timeZone: 'America/Montreal' }).format(r.paidAt);
  const METHOD_FR: Record<string, string> = { CARD: 'Carte', INTERAC: 'Virement Interac', CASH: 'Comptant', OTHER: 'Autre' };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/compte/achats" className="font-cinzel text-[0.65rem] uppercase tracking-widest text-turquoise-cristal hover:text-or-ancien">
          ← Achats &amp; factures
        </Link>
      </div>

      {/* Le reçu lui-même : fond clair pour une impression propre */}
      <div
        className="rounded-sm border p-8"
        style={{ background: '#FDFBF5', borderColor: 'rgba(201,168,76,0.5)', color: '#1F2937' }}
      >
        <div className="mb-6 border-b pb-5 text-center" style={{ borderColor: 'rgba(201,168,76,0.4)' }}>
          <p className="font-cinzel text-xl tracking-widest" style={{ color: '#4A2D7A' }}>{ENTREPRISE.nom}</p>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
            {ENTREPRISE.proprietaire}<br />
            {ENTREPRISE.adresse}<br />
            NEQ : {ENTREPRISE.neq} · {ENTREPRISE.courriel}
          </p>
        </div>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="font-cinzel text-xs uppercase tracking-widest" style={{ color: '#6B3FA0' }}>Reçu</p>
            <p className="text-lg font-semibold">{r.number}</p>
          </div>
          <div className="text-right text-sm" style={{ color: '#6B7280' }}>
            <p>{dateFr}</p>
            <p className="mt-1">{r.client.firstName} {r.client.lastName}</p>
            {!r.client.email.endsWith('@interne.invalid') && <p>{r.client.email}</p>}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left" style={{ borderColor: 'rgba(201,168,76,0.4)', color: '#6B7280' }}>
              <th className="py-2 font-cinzel text-[0.65rem] uppercase tracking-widest">Description</th>
              <th className="py-2 text-right font-cinzel text-[0.65rem] uppercase tracking-widest">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3">{r.description}<br /><span style={{ color: '#9CA3AF' }}>Payé par {METHOD_FR[r.method] ?? r.method}</span></td>
              <td className="py-3 text-right font-semibold">{r.amount.toFixed(2)} $</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t" style={{ borderColor: 'rgba(201,168,76,0.4)' }}>
              <td className="py-3 font-semibold">Total payé</td>
              <td className="py-3 text-right text-lg font-bold" style={{ color: '#4A2D7A' }}>{r.amount.toFixed(2)} $</td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-4 text-xs" style={{ color: '#9CA3AF' }}>
          Taxes non applicables. Merci pour ta confiance ✨ — {ENTREPRISE.nom}
        </p>
      </div>

      <div className="mt-4 text-center print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
