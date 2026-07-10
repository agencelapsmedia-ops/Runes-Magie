'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface OfferingOption {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}
interface PractitionerOption {
  id: string;
  name: string;
  offerings: OfferingOption[];
}
interface ClientHit {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}
interface Props {
  practitioners: PractitionerOption[];
  /** Si fourni, la praticienne est imposée (cas dashboard praticienne) — pas de sélecteur. */
  lockedPractitionerId?: string;
  variant?: 'dark' | 'light';
  /** Libellé du bouton déclencheur (défaut : « + Ajouter un rendez-vous »). */
  label?: string;
  /**
   * Ouverture pilotée de l'extérieur (ex. clic sur une plage du calendrier) :
   * ouvre le modal avec la date/heure pré-remplie. `nonce` change à chaque clic
   * pour permettre de rouvrir sur la même plage.
   */
  prefill?: { startsAt: string; nonce: number } | null;
}

export default function ManualAppointmentButton({
  practitioners,
  lockedPractitionerId,
  variant = 'dark',
  label: triggerLabel = '+ Ajouter un rendez-vous',
  prefill = null,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [practitionerId, setPractitionerId] = useState(lockedPractitionerId ?? practitioners[0]?.id ?? '');
  const [offeringId, setOfferingId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [mode, setMode] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'STRIPE_LINK' | 'INTERAC'>('CASH');
  const [notes, setNotes] = useState('');

  const offerings = useMemo(
    () => practitioners.find((p) => p.id === practitionerId)?.offerings ?? [],
    [practitioners, practitionerId],
  );
  const hasEmail = email.trim().length > 0;

  // Recherche de client existant (admin/propriétaire uniquement — la route est
  // gardée par requireAdmin) : pré-remplit la fiche, la dédup serveur par courriel
  // fait le reste. Debounce 300 ms.
  const [clientSearch, setClientSearch] = useState('');
  const [clientHits, setClientHits] = useState<ClientHit[]>([]);
  useEffect(() => {
    const q = clientSearch.trim();
    if (q.length < 2) {
      setClientHits([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/clients/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const j = await res.json();
          setClientHits(j.clients ?? []);
        }
      } catch {
        // silencieux : la recherche est un confort, pas un blocage
      }
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  // Clic sur une plage du calendrier → ouvre le modal avec la date/heure pré-remplie.
  useEffect(() => {
    if (prefill?.startsAt) {
      setStartsAt(prefill.startsAt);
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.nonce]);

  function pickClient(c: ClientHit) {
    setFirstName(c.firstName);
    setLastName(c.lastName);
    setPhone(c.phone ?? '');
    setEmail(c.email ?? '');
    setClientSearch('');
    setClientHits([]);
  }

  function reset() {
    setOfferingId(''); setFirstName(''); setLastName(''); setPhone(''); setEmail('');
    setStartsAt(''); setMode('IN_PERSON'); setPaymentMode('CASH'); setNotes('');
    setClientSearch(''); setClientHits([]);
    setError(null); setInfo(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null);
    if (!practitionerId || !offeringId || !firstName || !lastName || !phone || !startsAt) {
      setError('Remplis la praticienne, le soin, la cliente (prénom, nom, téléphone) et la date.');
      return;
    }
    if (!hasEmail && paymentMode !== 'CASH') {
      setError('Sans courriel, seul le paiement comptant est possible.');
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/holistique/appointments/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            practitionerId,
            offeringId,
            startsAt: new Date(startsAt).toISOString(),
            mode,
            paymentMode,
            notes: notes.trim() || undefined,
            client: { firstName, lastName, phone, email: email.trim() || undefined },
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(j.error ?? 'Échec de la création.');
          return;
        }
        if (j.paymentLink) {
          setInfo('RDV créé. Lien de paiement envoyé par courriel.');
        }
        reset();
        setOpen(false);
        router.refresh();
      } catch {
        setError('Impossible de joindre le serveur.');
      }
    });
  }

  const triggerStyle: React.CSSProperties =
    variant === 'light'
      ? { padding: '10px 18px', fontSize: '0.85rem', background: '#6B3FA0', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }
      : { padding: '10px 20px', fontFamily: 'var(--font-cinzel)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(201,168,76,0.12)', color: 'var(--or-ancien)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '2px', cursor: 'pointer' };

  const field: React.CSSProperties = { width: '100%', padding: '9px 11px', marginTop: '4px', borderRadius: '4px', border: '1px solid #C4B5FD', background: '#fff', color: '#1F2937', fontSize: '0.9rem' };
  const label: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: '#4B5563', marginBottom: '10px', fontWeight: 600 };
  const payOption = (active: boolean, disabled = false): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start', textAlign: 'left',
    width: '100%', padding: '11px 14px', borderRadius: '8px',
    border: `2px solid ${active ? '#6B3FA0' : '#E5E7EB'}`,
    background: active ? 'rgba(107,63,160,0.08)' : '#fff',
    color: disabled ? '#9CA3AF' : '#1F2937',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
  });
  const payHint: React.CSSProperties = { fontSize: '0.75rem', color: '#6B7280' };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={triggerStyle}>{triggerLabel}</button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 1000, overflowY: 'auto' }}
          onClick={() => !pending && setOpen(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '520px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.25rem', color: '#2D1B4E', marginBottom: '20px' }}>Nouveau rendez-vous</h2>
            <form onSubmit={submit}>
              {!lockedPractitionerId && practitioners.length > 1 && (
                <label style={label}>Praticienne
                  <select value={practitionerId} onChange={(e) => { setPractitionerId(e.target.value); setOfferingId(''); }} style={field}>
                    {practitioners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
              )}

              <label style={label}>Soin
                <select value={offeringId} onChange={(e) => setOfferingId(e.target.value)} style={field}>
                  <option value="">— Choisir un soin —</option>
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.durationMinutes} min — {o.price.toFixed(2)} $)</option>
                  ))}
                </select>
              </label>

              {variant === 'light' && (
                <div style={{ marginBottom: '4px' }}>
                  <label style={label}>Rechercher un client existant (nom, courriel ou téléphone)
                    <input
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Ex. Sara, sara@…, 514…"
                      style={field}
                    />
                  </label>
                  {clientHits.length > 0 && (
                    <div style={{ border: '1px solid #C4B5FD', borderRadius: '6px', background: '#fff', marginTop: '-4px', marginBottom: '10px', overflow: 'hidden' }}>
                      {clientHits.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => pickClient(c)}
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: '#fff', border: 'none', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', fontSize: '0.85rem', color: '#1F2937' }}
                        >
                          <strong>{c.firstName} {c.lastName}</strong>
                          <span style={{ color: '#6B7280' }}> — {c.email || 'sans courriel'}{c.phone ? ` · ${c.phone}` : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: '0.72rem', color: '#9CA3AF', margin: '0 0 10px', fontWeight: 400 }}>
                    Nouveau client ? Remplis simplement les champs ci-dessous.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ ...label, flex: 1 }}>Prénom
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={field} />
                </label>
                <label style={{ ...label, flex: 1 }}>Nom
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={field} />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ ...label, flex: 1 }}>Téléphone
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} style={field} />
                </label>
                <label style={{ ...label, flex: 1 }}>Courriel (optionnel)
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      // Sans courriel, seul le comptant est possible → on y revient.
                      if (!e.target.value.trim() && paymentMode !== 'CASH') setPaymentMode('CASH');
                    }}
                    style={field}
                  />
                </label>
              </div>

              <label style={label}>Date et heure
                <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={field} />
              </label>

              <div style={label}>Mode
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontWeight: 400 }}>
                  <label style={{ fontSize: '0.85rem' }}><input type="radio" checked={mode === 'IN_PERSON'} onChange={() => setMode('IN_PERSON')} /> Présentiel</label>
                  <label style={{ fontSize: '0.85rem' }}><input type="radio" checked={mode === 'VIRTUAL'} onChange={() => setMode('VIRTUAL')} /> Virtuel</label>
                </div>
              </div>

              <div style={label}>Paiement
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', fontWeight: 400 }}>
                  <button type="button" onClick={() => setPaymentMode('CASH')} style={payOption(paymentMode === 'CASH')}>
                    <strong style={{ fontSize: '0.9rem' }}>💵 Comptant</strong>
                    <span style={payHint}>Payé sur place — marqué payé tout de suite.</span>
                  </button>
                  <button
                    type="button"
                    disabled={!hasEmail}
                    onClick={() => hasEmail && setPaymentMode('STRIPE_LINK')}
                    style={payOption(paymentMode === 'STRIPE_LINK', !hasEmail)}
                  >
                    <strong style={{ fontSize: '0.9rem' }}>💳 À payer en ligne</strong>
                    <span style={payHint}>La cliente reçoit un courriel avec carte ET virement Interac — elle choisit.</span>
                  </button>
                </div>
                {!hasEmail && <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '8px 0 0', fontWeight: 400 }}>Ajoute un courriel pour proposer le paiement en ligne. Sinon : comptant.</p>}
              </div>

              <label style={label}>Notes (optionnel)
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...field, minHeight: '60px' }} />
              </label>

              {error && <p style={{ color: '#DC2626', fontSize: '0.85rem', margin: '8px 0' }}>{error}</p>}
              {info && <p style={{ color: '#065F46', fontSize: '0.85rem', margin: '8px 0' }}>{info}</p>}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => { reset(); setOpen(false); }} disabled={pending} style={{ padding: '10px 18px', background: 'transparent', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer' }}>Annuler</button>
                <button type="submit" disabled={pending} style={{ padding: '10px 18px', background: '#6B3FA0', color: '#fff', border: 'none', borderRadius: '6px', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.6 : 1 }}>{pending ? 'Création…' : 'Créer le RDV'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
