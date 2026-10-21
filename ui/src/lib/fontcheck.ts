/**
 * Whether a font family is installed on this machine.
 *
 * omacal bundles no fonts, so "FiraCode Nerd Font Mono" is a request the
 * machine either can or cannot honour — and CSS answers a request it cannot
 * honour by silently drawing something else. Without this the Appearance
 * tab would show the font selected on a machine that has never had it, and
 * the only clue would be that the calendar looked unchanged.
 *
 * `document.fonts.check()` is the API that looks right and is not: for a
 * family nobody has, Chromium answers `true` (the fallback is available, so
 * the string "can be rendered"). So this measures instead, the way every
 * font-detection library does: the same text in the candidate family with a
 * generic fallback behind it, and in that generic fallback alone. A family
 * that is not installed cannot change the width, because it *is* the
 * fallback that gets drawn. Three fallbacks keep metric-identical real faces
 * detectable.
 *
 * `measure` is injected so the rule above is testable without a font
 * installed, and so the canvas is created once per call rather than per
 * probe.
 */
export type MeasureText = (text: string, font: string) => number;

/** Wide enough to accumulate a difference, and mixed so a face that differs
 *  only in its digits or only in its letters still shows up. */
const PROBE = "mmmmmmmmmmlli0Oo1234567890";

/** The generics every engine resolves to a real, and different, face. */
const FALLBACKS = ["monospace", "sans-serif", "serif"] as const;

export function isFontAvailable(family: string, measure: MeasureText): boolean {
  return FALLBACKS.some(
    (fallback) =>
      measure(PROBE, `72px "${family}", ${fallback}`) !==
      measure(PROBE, `72px ${fallback}`),
  );
}

/** Canvas text measurement, or `null` where there is no 2D context to use —
 *  a caller with no answer must not draw a warning it cannot stand behind. */
export function canvasMeasure(): MeasureText | null {
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return null;
  return (text, font) => {
    context.font = font;
    return context.measureText(text).width;
  };
}

/**
 * Whether this machine has the requested font for the `fira-code` setting,
 * or `null` when there is nothing to measure with. One exported rule rather
 * than logic in the settings tab, so a spec can ask the same question the
 * modal asked instead of hard-coding what the test host happens to have
 * installed.
 */
export function firaCodeInstalled(
  measure: MeasureText | null = canvasMeasure(),
): boolean | null {
  if (!measure) return null;
  return isFontAvailable("FiraCode Nerd Font Mono", measure);
}
