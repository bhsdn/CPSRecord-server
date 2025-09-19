
const MS_IN_DAY = 24 * 60 * 60 * 1000;

export type ExpiryStatus = 'safe' | 'warning' | 'danger';

export function calculateExpiryDate(days?: number | null): Date | null {
  if (days === null || days === undefined) {
    return null;
  }

  const now = new Date();
  const baseDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  baseDate.setUTCDate(baseDate.getUTCDate() + days);
  return baseDate;
}

export function calculateDaysDiff(expiryDate?: Date | string | null): number | null {
  if (!expiryDate) {
    return null;
  }

  const expiry =
    typeof expiryDate === 'string' ? new Date(expiryDate) : new Date(expiryDate);
  const today = new Date();
  const startOfToday = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  return Math.ceil((expiry.getTime() - startOfToday.getTime()) / MS_IN_DAY);
}

export function resolveExpiryStatus(
  expiryDate?: Date | string | null,
): { status: ExpiryStatus; daysRemaining: number | null } | null {
  const daysRemaining = calculateDaysDiff(expiryDate);
  if (daysRemaining === null) {
    return null;
  }

  let status: ExpiryStatus;
  if (daysRemaining > 7) {
    status = 'safe';
  } else if (daysRemaining >= 3) {
    status = 'warning';
  } else {
    status = 'danger';
  }

  return { status, daysRemaining };

}
