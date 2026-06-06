import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const CARDS = [
  {
    href: '/compte/formations',
    emoji: '🎓',
    title: 'Mes formations',
    desc: 'Reprenez vos cours là où vous les avez laissés.',
  },
  {
    href: '/compte/merestegere',
    emoji: '📖',
    title: 'Le Merestegere',
    desc: 'Notre grimoire des membres, à lire et à télécharger.',
  },
  {
    href: '/compte/veillees',
    emoji: '🌙',
    title: 'Les Veillées de Noctura',
    desc: 'La diffusion de la semaine et ses replays.',
  },
  {
    href: '/compte/achats',
    emoji: '🛒',
    title: 'Achats & factures',
    desc: 'Votre historique de commandes et vos factures.',
  },
  {
    href: '/compte/bibliotheque',
    emoji: '📚',
    title: 'Bibliothèque',
    desc: 'Ressources, ebooks et méditations des membres.',
  },
];

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

const STATUS: Record<string, { label: string; color: string; border: string; bg: string }> = {
  PENDING: { label: 'En attente', color: '#d4a017', border: 'rgba(201,168,76,0.35)', bg: 'rgba(201,168,76,0.12)' },
  CONFIRMED: { label: 'Confirmé', color: 'var(--turquoise-cristal)', border: 'rgba(46,196,182,0.35)', bg: 'rgba(46,196,182,0.1)' },
  COMPLETED: { label: 'Complété', color: '#4ade80', border: 'rgba(34,197,94,0.3)', bg: 'rgba(34,197,94,0.1)' },
  CANCELLED: { label: 'Annulé', color: '#f87171', border: 'rgba(196,29,110,0.3)', bg: 'rgba(196,29,110,0.1)' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.PENDING;
  return (
    <span
      className="inline-block rounded-full px-3 py-1 font-cinzel text-[0.62rem] uppercase tracking-widest"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

function Avatar({
  photoUrl,
  firstName,
  lastName,
}: {
  photoUrl: string | null;
  firstName: string;
  lastName: string;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
        style={{ border: '1px solid rgba(74, 45, 122, 0.5)' }}
      />
    );
  }
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  return (
    <span
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-cinzel text-sm text-or-ancien"
      style={{ background: 'rgba(74, 45, 122, 0.4)', border: '1px solid rgba(74, 45, 122, 0.6)' }}
    >
      {initials}
    </span>
  );
}

export default async function CompteDashboardPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const member = userId
    ? await prisma.holisticUser.findUnique({
        where: { id: userId },
        select: { firstName: true },
      })
    : null;
  const firstName = member?.firstName ?? 'cher membre';

  const appointments = userId
    ? await prisma.holisticAppointment.findMany({
        where: { clientId: userId, NOT: { status: 'PENDING' } },
        include: {
          practitioner: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { startsAt: 'desc' },
      })
    : [];

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => new Date(a.startsAt) >= now && a.status !== 'CANCELLED',
  );
  const past = appointments.filter(
    (a) => new Date(a.startsAt) < now || a.status === 'COMPLETED' || a.status === 'CANCELLED',
  );
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  const stats = [
    { label: 'Consultations', value: appointments.length, symbol: 'ᚠ' },
    { label: 'À venir', value: upcoming.length, symbol: 'ᛏ' },
    { label: 'Complétées', value: completedCount, symbol: 'ᛉ' },
  ];

  const sectionTitle =
    'mb-5 border-b pb-2.5 font-cinzel text-[0.82rem] uppercase tracking-[0.18em] text-or-ancien';

  return (
    <div>
      {/* En-tête */}
      <header className="mb-8">
        <div aria-hidden className="mb-2 font-cinzel-decorative text-3xl text-or-ancien/30">
          ᚹ
        </div>
        <h1 className="font-cinzel-decorative text-2xl text-or-ancien sm:text-3xl">
          Bienvenue, {firstName}
        </h1>
        <p className="mt-2 font-cormorant text-lg italic text-parchemin/50">
          Votre espace personnel chez Runes &amp; Magie
        </p>
      </header>

      {/* Statistiques */}
      <div className="mb-10 grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-sm border p-4 text-center sm:p-6"
            style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(201, 168, 76, 0.2)' }}
          >
            <div aria-hidden className="mb-2 font-cinzel-decorative text-xl text-or-ancien/35">
              {stat.symbol}
            </div>
            <div className="font-cinzel text-2xl text-or-ancien sm:text-3xl">{stat.value}</div>
            <div className="mt-1 font-cinzel text-[0.6rem] uppercase tracking-widest text-parchemin/40">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Rendez-vous à venir */}
      <section className="mb-10">
        <h2 className={sectionTitle}>Mes rendez-vous à venir</h2>
        {upcoming.length === 0 ? (
          <div
            className="rounded-sm border px-8 py-10 text-center"
            style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(74, 45, 122, 0.3)' }}
          >
            <p className="mb-5 font-cormorant text-lg italic text-parchemin/45">
              Aucun rendez-vous à venir pour le moment.
            </p>
            <Link
              href="/soins/praticiens"
              className="inline-flex items-center font-cinzel text-xs uppercase tracking-widest text-turquoise-cristal transition-colors hover:text-or-ancien"
            >
              Trouver un praticien →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((appt) => {
              const startsAt = new Date(appt.startsAt);
              const isVirtual = ((appt.notes ?? '') as string).toLowerCase().includes('virtuel');
              const canJoin = appt.status === 'CONFIRMED' && isVirtual;
              const prac = appt.practitioner;
              const pracUser = prac?.user;
              return (
                <div
                  key={appt.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-sm border p-5"
                  style={{
                    background: 'var(--charbon-mystere)',
                    borderColor: canJoin ? 'rgba(46, 196, 182, 0.4)' : 'rgba(74, 45, 122, 0.35)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      photoUrl={prac?.photoUrl ?? null}
                      firstName={pracUser?.firstName ?? '?'}
                      lastName={pracUser?.lastName ?? '?'}
                    />
                    <div>
                      <p className="font-cinzel text-sm text-parchemin">
                        {pracUser?.firstName} {pracUser?.lastName}
                      </p>
                      {prac?.specialties && prac.specialties.length > 0 && (
                        <p className="font-cormorant text-base text-turquoise-cristal/80">
                          {prac.specialties.slice(0, 2).join(' · ')}
                        </p>
                      )}
                      <p className="mb-2 font-cormorant text-base text-parchemin/45">
                        {formatDate(startsAt)} à {formatTime(startsAt)}
                      </p>
                      <StatusBadge status={appt.status} />
                    </div>
                  </div>
                  {canJoin && (
                    <Link
                      href={`/soins/consultation/${appt.id}`}
                      className="inline-flex items-center rounded-sm border px-5 py-2.5 font-cinzel text-[0.7rem] uppercase tracking-widest text-turquoise-cristal transition-colors"
                      style={{ borderColor: 'rgba(46, 196, 182, 0.4)', background: 'rgba(46, 196, 182, 0.12)' }}
                    >
                      Rejoindre la séance →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Rendez-vous passés */}
      {past.length > 0 && (
        <section className="mb-10">
          <h2 className={sectionTitle}>Rendez-vous passés</h2>
          <div className="flex flex-col gap-2">
            {past.slice(0, 5).map((appt) => {
              const startsAt = new Date(appt.startsAt);
              const prac = appt.practitioner;
              const pracUser = prac?.user;
              return (
                <div
                  key={appt.id}
                  className="flex items-center gap-3 rounded-sm border p-4"
                  style={{ background: 'rgba(26, 26, 46, 0.5)', borderColor: 'rgba(74, 45, 122, 0.25)' }}
                >
                  <Avatar
                    photoUrl={prac?.photoUrl ?? null}
                    firstName={pracUser?.firstName ?? '?'}
                    lastName={pracUser?.lastName ?? '?'}
                  />
                  <div>
                    <p className="font-cinzel text-sm text-parchemin/65">
                      {pracUser?.firstName} {pracUser?.lastName}
                    </p>
                    <p className="mb-1.5 font-cormorant text-base text-parchemin/40">
                      {formatDate(startsAt)} à {formatTime(startsAt)}
                    </p>
                    <StatusBadge status={appt.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Accès rapide aux sections membre */}
      <section>
        <h2 className={sectionTitle}>Mon espace membre</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col rounded-sm border p-6 transition-all duration-200"
              style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(74, 45, 122, 0.3)' }}
            >
              <span aria-hidden className="mb-3 text-2xl">
                {card.emoji}
              </span>
              <span className="font-cinzel text-sm uppercase tracking-widest text-parchemin transition-colors duration-200 group-hover:text-or-ancien">
                {card.title}
              </span>
              <span className="mt-2 font-cormorant text-base text-parchemin/50">{card.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
