/**
 * Aides serveur pour les comptes réseaux sociaux.
 * Le jeton n'est JAMAIS exposé : seulement `tokenMasque` (•••• + 4 derniers).
 */

export interface CompteSerialise {
  id: string;
  network: string;
  label: string;
  externalId: string;
  tokenMasque: string;
  tokenExpiresAt: Date | string | null;
  connectionStatus: string;
  lastTestedAt: Date | string | null;
  lastTestSucceeded: boolean | null;
  lastTestError: string | null;
  isActive: boolean;
  parentAccountId: string | null;
  createdAt: Date | string;
}

/** Sérialise un compte SANS jamais exposer le jeton. */
export function serialiserCompte(a: {
  id: string;
  network: string;
  label: string;
  externalId: string;
  tokenLastFour: string | null;
  tokenExpiresAt: Date | null;
  connectionStatus: string;
  lastTestedAt: Date | null;
  lastTestSucceeded: boolean | null;
  lastTestError: string | null;
  isActive: boolean;
  parentAccountId: string | null;
  createdAt: Date;
}): CompteSerialise {
  return {
    id: a.id,
    network: a.network,
    label: a.label,
    externalId: a.externalId,
    tokenMasque: a.tokenLastFour ? `••••${a.tokenLastFour}` : '••••',
    tokenExpiresAt: a.tokenExpiresAt,
    connectionStatus: a.connectionStatus,
    lastTestedAt: a.lastTestedAt,
    lastTestSucceeded: a.lastTestSucceeded,
    lastTestError: a.lastTestError,
    isActive: a.isActive,
    parentAccountId: a.parentAccountId,
    createdAt: a.createdAt,
  };
}
