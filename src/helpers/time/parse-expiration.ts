export function parseExpirationToSeconds(value: string): number {
  if (!value) return 0;
  const trimmed = String(value).trim();
  const match = /^(\d+)\s*([smhd])?$/.exec(trimmed);
  if (!match) {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : 0;
  }
  const amount = parseInt(match[1], 10);
  const unit = match[2] || 's';
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return amount * multipliers[unit];
}
