import { expect, test } from '@playwright/test';
import { isFontAvailable } from '../src/lib/fontcheck';

/**
 * The rule the Appearance tab's warning stands on, pinned without needing a
 * font installed: a family is "available" only when asking for it *changes
 * the measurement* against the generic behind it. The measurer is injected,
 * so each case here is a machine with a known set of faces on it.
 *
 * `document.fonts.check()` is the API this replaces and the reason the file
 * exists: Chromium answers `true` for a family nobody has, because the
 * fallback is available. A warning built on that would never appear.
 */
test.describe('isFontAvailable', () => {
  /** A machine with `installed` on it: those faces measure wider than the
   *  generics, and a family nobody has falls through to the generic and so
   *  measures exactly as it does. */
  const machineWith = (installed: string[]) => (_text: string, font: string) => {
    const width: Record<string, number> = { monospace: 100, 'sans-serif': 110, serif: 120 };
    const generic = Object.keys(width).find((g) => font.endsWith(g))!;
    const asked = font.match(/"([^"]+)"/)?.[1];
    return asked && installed.includes(asked) ? 200 : width[generic];
  };

  test('an installed family changes the measurement', () => {
    expect(isFontAvailable('Fira Code', machineWith(['Fira Code']))).toBe(true);
  });

  test('a family nobody has measures as the fallback and is refused', () => {
    expect(isFontAvailable('Fira Code', machineWith([]))).toBe(false);
    expect(isFontAvailable('Fira Code', machineWith(['Fira Mono']))).toBe(false);
  });

  /**
   * Why there are three generics rather than one. A real face can be metric
   * compatible with the platform's monospace — Fira Mono against Menlo is
   * that case — and a single-generic probe would call it missing. It cannot
   * also match the proportional ones, so one disagreement is enough.
   */
  test('a family matching one generic exactly is still found through another', () => {
    const metricTwin = (_text: string, font: string) => {
      if (font.includes('"Fira Code"')) return 100;
      return font.endsWith('monospace') ? 100 : 110;
    };
    expect(isFontAvailable('Fira Code', metricTwin)).toBe(true);
  });
});
