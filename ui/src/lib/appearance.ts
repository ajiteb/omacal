/** The appearance fields shared by startup, Settings' live preview, and IPC. */
export type EventCornerStyle = 'rounded' | 'square';

/** Which typeface the calendar window is set in. Nothing is bundled: both
 *  values name families the machine already has. */
export type FontFamily = 'system' | 'fira-code';

export type AppearancePreferences = {
  backgroundTransparency: number;
  inactiveBackgroundTransparency?: number;
  eventTransparency: number;
  eventCornerStyle: EventCornerStyle;
  fontFamily: FontFamily;
};

/**
 * The stack `fira-code` asks for, most specific first.
 *
 * Fira Code is not shipped with omacal — packaging a font means carrying its
 * licence, its four weights and a megabyte per build, for one face. So this
 * names the family as every installer spells it, including the two Nerd Font
 * repacks that Omarchy setups usually have instead of the plain one, and
 * then falls through the platform's own monospace faces. The point of the
 * setting is a monospaced calendar; an install without Fira Code still gets
 * that rather than silently landing back on the system's sans-serif — and
 * the settings tab says which of the two it ended up with.
 */
export const FIRA_CODE_STACK =
  "'Fira Code', 'FiraCode Nerd Font', 'Fira Code Nerd Font', 'Fira Mono', " +
  'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const current = new WeakMap<HTMLElement, AppearancePreferences>();
const focused = new WeakMap<HTMLElement, boolean>();

/** Track window focus, not focus moving between controls inside the app. */
export function observeAppearanceFocus(root = document.documentElement): () => void {
  const window = root.ownerDocument.defaultView!;
  const update = (active: boolean) => {
    focused.set(root, active);
    const preferences = current.get(root);
    if (preferences) applyBackground(preferences, root);
  };
  const activate = () => update(true);
  const deactivate = () => update(false);
  update(root.ownerDocument.hasFocus());
  window.addEventListener('focus', activate);
  window.addEventListener('blur', deactivate);
  return () => {
    window.removeEventListener('focus', activate);
    window.removeEventListener('blur', deactivate);
    focused.delete(root);
  };
}

function applyBackground(preferences: AppearancePreferences, root: HTMLElement) {
  const active = focused.get(root) ?? root.ownerDocument.hasFocus();
  const value = active ? preferences.backgroundTransparency
    : preferences.inactiveBackgroundTransparency ?? preferences.backgroundTransparency;
  setTransparency(root, 'backgroundTransparency', '--background-fill-opacity', percent(value, 50));
}

/**
 * Applies absolute transparency: 0 is opaque, and the cap for each surface
 * is as clear as it goes — 50 for the canvas, 25 for event fills. Both are
 * expressed in tenths of a percent, so Omarchy's own blend is reachable.
 *
 * Omacal opts out of Omarchy's whole-window opacity when these controls are
 * installed, then reproduces that former baseline in the stored defaults.
 * Keeping alpha on the two painted surfaces is what lets them move
 * independently without fading text, outlines, menus, or dialogs.
 */
export function applyAppearance(
  preferences: AppearancePreferences,
  root: HTMLElement = document.documentElement,
): void {
  current.set(root, { ...preferences });
  const events = percent(preferences.eventTransparency, 25);

  applyBackground(preferences, root);
  setTransparency(root, 'eventTransparency', '--event-fill-opacity', events);

  if (preferences.eventCornerStyle === 'square') {
    root.dataset.eventCorners = 'square';
    root.style.setProperty('--event-card-radius', '0px');
    root.style.setProperty('--event-chip-radius', '0px');
    root.style.setProperty('--event-pill-radius', '0px');
  } else {
    delete root.dataset.eventCorners;
    root.style.removeProperty('--event-card-radius');
    root.style.removeProperty('--event-chip-radius');
    root.style.removeProperty('--event-pill-radius');
  }

  // One variable, read by `body`'s own `font-family` with the system stack
  // as its fallback — so `system` is the absence of the property rather than
  // a second copy of that stack to keep in step. Everything else in the app
  // inherits or says `font: inherit`, which is why no component needs to
  // know this setting exists.
  if (preferences.fontFamily === 'fira-code') {
    root.dataset.fontFamily = 'fira-code';
    root.style.setProperty('--app-font-family', FIRA_CODE_STACK);
  } else {
    delete root.dataset.fontFamily;
    root.style.removeProperty('--app-font-family');
  }
}

function percent(value: number, cap: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, Math.min(cap, value)) * 10) / 10;
}

function setTransparency(
  root: HTMLElement,
  dataKey: 'backgroundTransparency' | 'eventTransparency',
  property: string,
  transparency: number,
): void {
  root.dataset[dataKey] = String(transparency);
  root.style.setProperty(property, `${100 - transparency}%`);
}
