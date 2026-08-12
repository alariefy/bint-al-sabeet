import { describe, expect, it } from 'vitest';
import { LRI, PDI, formatCount, formatNumber, formatSignedNumber } from './format';

describe('formatNumber', () => {
  it('renders Western digits', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(5)).toBe('5');
    expect(formatNumber(13)).toBe('13');
    expect(formatNumber(152)).toBe('152');
  });

  it('renders negative scores with the sign attached on the left in RTL', () => {
    expect(formatNumber(-5)).toBe(`${LRI}-5${PDI}`);
    expect(formatNumber(-25)).toBe(`${LRI}-25${PDI}`);
    expect(formatNumber(-152)).toBe(`${LRI}-152${PDI}`);
  });

  it('isolates the sign so RTL reordering cannot move it', () => {
    const text = formatNumber(-25);
    expect(text.startsWith(LRI)).toBe(true);
    expect(text.endsWith(PDI)).toBe(true);
    expect(text.slice(1, -1)).toBe('-25');
    expect(text).not.toContain('−');
  });

  it('strips the isolate for positive values, which need no protection', () => {
    expect(formatNumber(25)).not.toContain(LRI);
  });

  it('never returns NaN text', () => {
    expect(formatNumber(Number.NaN)).toBe('0');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('0');
  });
});

describe('formatSignedNumber', () => {
  it('shows an explicit plus for positive round changes', () => {
    expect(formatSignedNumber(25)).toBe(`${LRI}+25${PDI}`);
  });

  it('shows a bare zero', () => {
    expect(formatSignedNumber(0)).toBe('0');
  });

  it('shows negatives exactly like formatNumber', () => {
    expect(formatSignedNumber(-25)).toBe(formatNumber(-25));
  });
});

describe('formatCount', () => {
  it('drops the sign', () => {
    expect(formatCount(13)).toBe('13');
    expect(formatCount(-13)).toBe('13');
  });

  it('stays free of directional marks so it reads inside a sentence', () => {
    expect(formatCount(13)).not.toContain(LRI);
  });
});
