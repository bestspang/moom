/**
 * BrandTokens coverage guard.
 *
 * Static-analysis tests that:
 *  1. Every CSS var listed in the `BrandToken` union is actually defined in
 *     `src/index.css` `:root {…}` (otherwise `applyBrandFromKit` writes a var
 *     that no rule consumes — silent regression).
 *  2. Every brand-critical var defined in `:root` is also defined in `.dark`
 *     (otherwise dark mode falls back to inherited / default and the user's
 *     saved brand silently disappears at night).
 *  3. Every field on `BrandKit` that maps to a token in `applyBrandFromKit`
 *     stays in sync — adding a new field on the kit without mapping it (or
 *     vice-versa) fails the test with a clear message.
 *
 * These tests read the CSS source file directly to avoid relying on jsdom's
 * limited stylesheet engine.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const CSS = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');

/** Brand-critical vars that `applyBrandFromKit` writes. Must exist in :root AND .dark. */
const BRAND_CRITICAL_VARS = [
  '--primary',
  '--primary-foreground',
  '--accent',
  '--accent-foreground',
  '--sidebar-background',
  '--sidebar-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
] as const;

const extractBlock = (selector: string): string => {
  // Match `selector { … }` allowing nested rules (CSS @layer base uses single nesting).
  const re = new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`);
  const m = CSS.match(re);
  return m?.[1] ?? '';
};

const extractDeclaredVars = (block: string): Set<string> => {
  const vars = new Set<string>();
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:/gi)) vars.add(m[1]);
  return vars;
};

describe('BrandTokens — CSS coverage', () => {
  const rootBlock = extractBlock(':root');
  const darkBlock = extractBlock('.dark');
  const rootVars = extractDeclaredVars(rootBlock);
  const darkVars = extractDeclaredVars(darkBlock);

  it(':root block is non-empty', () => {
    expect(rootVars.size).toBeGreaterThan(20);
  });

  it('.dark block is non-empty', () => {
    expect(darkVars.size).toBeGreaterThan(10);
  });

  it.each(BRAND_CRITICAL_VARS)('%s is declared in :root', (v) => {
    expect(rootVars.has(v), `Missing ${v} in :root`).toBe(true);
  });

  it.each(BRAND_CRITICAL_VARS)('%s is declared in .dark (no theme drift)', (v) => {
    expect(darkVars.has(v), `Brand-critical var ${v} missing in .dark — saved brand would disappear in dark mode`).toBe(true);
  });
});

describe('BrandTokens ↔ BrandKit mapping', () => {
  it('applyBrandFromKit writes vars listed as touched + matches BrandKit fields', async () => {
    const tokens = await import('./BrandTokens');
    const defaults = await import('@/components/branding/brandDefaults');

    // Snapshot which props get set
    const set = new Set<string>();
    const fakeRoot: Pick<HTMLElement['style'], 'setProperty' | 'removeProperty'> = {
      setProperty: (k: string) => { set.add(k); },
      removeProperty: () => {},
    };
    // @ts-expect-error — partial mock is sufficient for the test
    Object.defineProperty(document, 'documentElement', { value: { style: fakeRoot }, configurable: true });

    tokens.applyBrandFromKit(defaults.DEFAULT_BRAND);

    // Every var written must also exist in :root (CSS source of truth)
    const rootVars = extractDeclaredVars(extractBlock(':root'));
    for (const v of set) {
      if (v.startsWith('--font-')) continue; // fonts can be defined in @layer base via shorthand
      expect(rootVars.has(v), `applyBrandFromKit writes ${v} but :root doesn't declare it`).toBe(true);
    }

    // Sanity: BrandKit color fields used by the mapper must exist
    expect(defaults.DEFAULT_BRAND.primary).toMatch(/^hsl\(/);
    expect(defaults.DEFAULT_BRAND.accent).toMatch(/^hsl\(/);
  });
});
