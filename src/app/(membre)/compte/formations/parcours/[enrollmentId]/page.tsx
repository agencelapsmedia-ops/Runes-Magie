import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getClientEnrollmentDetail } from '@/lib/formation-client';
import { prisma } from '@/lib/db';
import { MembreHeader } from '@/components/membre/MembrePage';

/**
 * Parcours d'une formation avec Noctura, côté cliente : progression par session,
 * cours ✅/🔓/🔒, documents des cours terminés, rencontres et paiements.
 * Sécurité : getClientEnrollmentDetail filtre par clientId de la session.
 */

function fdate(d: Date | string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(d));
}

const METHOD_FR: Record<string, string> = { INTERAC: 'Interac', CARD: 'Carte', CASH: 'Comptant', OTHER: 'Autre' };

export default async function ParcoursPage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect('/soins/auth/login?callbackUrl=/compte/formations');

  const { enrollmentId } = await params;
  const detail = await getClientEnrollmentDetail(userId, enrollmentId);
  if (!detail) notFound();

  // Réservation directe : le calendrier de Noctura (praticienne propriétaire),
  // sans passer par la page d'accueil des soins.
  const noctura = await prisma.practitioner.findFirst({ where: { isOwner: true }, select: { id: true } });
  // Présélectionne le service « Cours de formation » correspondant à la formation.
  const offeringSlug = detail.enrollment.formation.code === 'TP' ? 'cours-formation-tarot' : 'cours-formation-runes';
  const reserverUrl = noctura ? `/soins/reserver/${noctura.id}?offering=${offeringSlug}` : '/soins';

  const { enrollment: e, credits, documents, totalPaid, balance } = detail;
  const base = e.progress.filter((p) => !p.course.isOptional);
  // Décompte « X / 30 » : seulement les vrais cours (jalons d'examen non
  // numérotés exclus, mais toujours affichés dans le parcours).
  const comptes = base.filter((p) => p.course.countsInProgress);
  const done = comptes.filter((p) => p.state === 'COMPLETED').length;
  const current = base.find((p) => p.state === 'UNLOCKED');
  const sessions = Array.from(new Set(base.map((p) => p.course.sessionNumber))).sort();
  const pct = comptes.length ? Math.round((done / comptes.length) * 100) : 0;
  const complete = e.status === 'COMPLETED' || e.status === 'DIPLOMA_ELIGIBLE' || e.status === 'DIPLOMA_AWARDED';

  const cardStyle = { background: 'var(--charbon-mystere)', borderColor: 'rgba(74,45,122,0.3)' };

  return (
    <div>
      <Link href="/compte/formations" className="font-cinzel text-[0.65rem] uppercase tracking-widest text-turquoise-cristal hover:text-or-ancien">
        ← Mes formations
      </Link>

      <div className="mt-4">
        <MembreHeader emoji="ᚱ" title={e.formation.title} subtitle={e.formation.subtitle || 'Formation avec Noctura'} />
      </div>

      {complete && (
        <div className="mb-6 rounded-sm border p-5 text-center" style={{ background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.4)' }}>
          <p className="font-cinzel text-sm uppercase tracking-widest text-or-ancien">
            {e.status === 'DIPLOMA_AWARDED' ? '🎓 Diplômée — félicitations !' : '✨ Formation complétée !'}
          </p>
          {e.status !== 'DIPLOMA_AWARDED' && (
            <p className="mt-2 text-[0.8rem] text-parchemin/70">La remise de diplôme aura lieu lors d’un événement spécial avec cérémonie initiatique.</p>
          )}
        </div>
      )}

      {/* Résumé */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { v: `${done} / ${comptes.length}`, l: 'Cours complétés' },
          { v: String(credits), l: 'Jetons restants' },
          { v: current ? current.course.code : '—', l: 'Cours actuel' },
          { v: `${totalPaid.toFixed(0)} $`, l: balance != null ? `Payé (reste ${balance.toFixed(0)} $)` : 'Payé' },
        ].map((s, i) => (
          <div key={i} className="rounded-sm border p-4 text-center" style={cardStyle}>
            <div className="font-cinzel text-lg text-or-ancien">{s.v}</div>
            <div className="mt-1 font-cinzel text-[0.58rem] uppercase tracking-widest text-parchemin/45">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Progression + réserver */}
      <div className="mb-8 rounded-sm border p-5" style={cardStyle}>
        <div className="flex items-center justify-between font-cinzel text-[0.62rem] uppercase tracking-widest text-parchemin/45">
          <span>Progression</span><span>{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(74,45,122,0.3)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(to right, var(--or-ancien), var(--or-clair))' }} />
        </div>
        {current && !complete && (
          <p className="mt-4 text-[0.85rem] text-parchemin/80">
            📍 Prochain cours : <span className="text-turquoise-cristal">{current.course.code} — {current.course.title}</span>
          </p>
        )}
        <div className="mt-4">
          <Link
            href={reserverUrl}
            className="inline-block rounded-sm border px-6 py-3 font-cinzel text-[0.68rem] uppercase tracking-widest text-or-ancien transition-colors hover:bg-or-ancien/10"
            style={{ borderColor: 'rgba(201,168,76,0.5)' }}
          >
            Réserver mon cours avec Noctura →
          </Link>
          {credits > 0 && (
            <p className="mt-2 text-[0.75rem] text-parchemin/50">🪙 Tu as {credits} jeton{credits > 1 ? 's' : ''} — ta réservation pourra en utiliser un au lieu d’un paiement.</p>
          )}
        </div>
      </div>

      {/* Parcours */}
      {sessions.map((s) => (
        <div key={s} className="mb-6">
          <h2 className="mb-3 font-cinzel text-xs uppercase tracking-widest text-or-ancien">Session {s}</h2>
          <div className="space-y-2">
            {base.filter((p) => p.course.sessionNumber === s).map((p) => {
              const isDone = p.state === 'COMPLETED';
              const isOpen = p.state === 'UNLOCKED';
              const docs = documents.filter((d) => d.courseId === p.course.id);
              return (
                <div
                  key={p.id}
                  className="rounded-sm border p-4"
                  style={{
                    background: isOpen ? 'rgba(46,196,182,0.06)' : 'var(--charbon-mystere)',
                    borderColor: isOpen ? 'rgba(46,196,182,0.4)' : isDone ? 'rgba(34,197,94,0.25)' : 'rgba(74,45,122,0.25)',
                    opacity: p.state === 'LOCKED' ? 0.55 : 1,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{isDone ? '✅' : isOpen ? '🔓' : '🔒'}</span>
                    <div className="flex-1">
                      <p className="text-[0.88rem] text-parchemin">
                        <span className="font-cinzel text-[0.7rem] uppercase tracking-widest text-parchemin/60">{p.course.code}</span>{' '}
                        {p.course.title}
                        {p.course.isExam && (
                          <span className="ml-2 rounded-full px-2 py-0.5 font-cinzel text-[0.55rem] uppercase tracking-widest" style={{ color: '#d4a017', border: '1px solid rgba(201,168,76,0.35)' }}>
                            Examen
                          </span>
                        )}
                      </p>
                      {isDone && p.completedAt && (
                        <p className="mt-1 text-[0.72rem] text-parchemin/45">Complété le {fdate(p.completedAt)}</p>
                      )}
                      {docs.map((d) => (
                        <Link
                          key={d.id}
                          href={`/compte/formations/document/${d.id}`}
                          className="mt-2 inline-block rounded-sm border px-3 py-1.5 font-cinzel text-[0.6rem] uppercase tracking-widest text-turquoise-cristal transition-colors hover:text-or-ancien"
                          style={{ borderColor: 'rgba(46,196,182,0.35)' }}
                        >
                          📜 {d.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Rencontres récentes */}
      {e.appointments.length > 0 && (
        <div className="mb-8 rounded-sm border p-5" style={cardStyle}>
          <h2 className="mb-3 font-cinzel text-xs uppercase tracking-widest text-or-ancien">Mes rencontres</h2>
          <div className="space-y-1.5 text-[0.82rem] text-parchemin/70">
            {e.appointments.map((a) => (
              <p key={a.id}>
                {fdate(a.startsAt)} — {a.status === 'COMPLETED' ? 'complétée ✓' : 'confirmée'}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Paiements */}
      {e.payments.length > 0 && (
        <div className="mb-8 rounded-sm border p-5" style={cardStyle}>
          <h2 className="mb-3 font-cinzel text-xs uppercase tracking-widest text-or-ancien">
            Mes paiements — {totalPaid.toFixed(2)} $ payé{balance != null && balance > 0 ? ` · reste ${balance.toFixed(2)} $` : ''}
          </h2>
          <div className="space-y-1.5 text-[0.82rem] text-parchemin/70">
            {e.payments.map((p) => (
              <p key={p.id}>
                {fdate(p.paidAt)} — <span className="text-parchemin">{p.amount.toFixed(2)} $</span> ({METHOD_FR[p.method] ?? p.method})
                {p.status !== 'PAID' && <span className="text-or-ancien"> · {p.status === 'PENDING' ? 'en attente' : 'échoué'}</span>}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
