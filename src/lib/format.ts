/**
 * Number and date formatting. Every visible number in the application goes
 * through these helpers so digits stay consistent.
 *
 * Digits are Western (0 to 9) by request. Because the interface is RTL, any
 * number carrying a sign is wrapped in a directional isolate so the sign
 * always renders to the left of the digits.
 */

/** U+2066 LEFT-TO-RIGHT ISOLATE */
export const LRI = '⁦';
/** U+2069 POP DIRECTIONAL ISOLATE */
export const PDI = '⁩';

function isolate(text: string): string {
  return `${LRI}${text}${PDI}`;
}

/** Plain digits without a sign, used inside sentences such as "3 من 13". */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return String(Math.abs(Math.trunc(value)));
}

/**
 * Formats an integer. Negative values keep their minus sign on the left of
 * the digits even inside an RTL paragraph.
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.trunc(value);
  if (rounded < 0) return isolate(`-${Math.abs(rounded)}`);
  return String(rounded);
}

/** Like `formatNumber` but always shows a sign for non-zero values. */
export function formatSignedNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.trunc(value);
  if (rounded === 0) return '0';
  if (rounded < 0) return formatNumber(rounded);
  return isolate(`+${rounded}`);
}

const dateFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(timestamp: number): string {
  try {
    return dateFormatter.format(new Date(timestamp));
  } catch {
    return '';
  }
}

export function formatDateTime(timestamp: number): string {
  try {
    return `${dateFormatter.format(new Date(timestamp))} ${timeFormatter.format(new Date(timestamp))}`;
  } catch {
    return '';
  }
}
