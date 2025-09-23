// 一天的毫秒数，用于计算有效期剩余天数
const MS_IN_DAY = 24 * 60 * 60 * 1000;

export type ExpiryStatus = 'safe' | 'warning' | 'danger';

// 根据有效天数推算出到期日期（按 UTC 计算，避免时区问题）
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

// 计算距离到期日还剩几天，负数代表已过期
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

// 根据剩余天数得出安全状态，用于展示不同颜色
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
