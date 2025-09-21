export function calculateExpiryDate(days?: number | null): Date | null {
  if (!days && days !== 0) {
    return null;
  }
  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(now.getDate() + days);
  return expiry;
}
