/**
 * Stable identifier generation. Player names are never used as identifiers.
 */

let counter = 0;

export function createId(prefix: string): string {
  counter += 1;
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}_${random}`;
}
