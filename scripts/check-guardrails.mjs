#!/usr/bin/env node
/**
 * Guardrails CI check — warns when a PR touches files listed in
 * PROTECTED_FILES.md Tier 1 ("Do not touch"). Designed for GitHub Actions.
 *
 * Behavior:
 *  - Only runs when GITHUB_BASE_REF is present (PR context). No-op locally.
 *  - Reads PROTECTED_FILES.md, extracts files under the "## Tier 1" heading
 *    until the next "## " heading.
 *  - Diffs against origin/$GITHUB_BASE_REF.
 *  - If any protected file is in the diff AND the PR title does NOT contain
 *    "[skip-guardrails]", exits non-zero.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const baseRef = process.env.GITHUB_BASE_REF;
if (!baseRef) {
  console.log('[guardrails] No GITHUB_BASE_REF — skipping (local run).');
  process.exit(0);
}

const prTitle = process.env.PR_TITLE || '';
if (prTitle.includes('[skip-guardrails]')) {
  console.log('[guardrails] PR title contains [skip-guardrails] — skipping.');
  process.exit(0);
}

let protectedDoc = '';
try {
  protectedDoc = readFileSync('PROTECTED_FILES.md', 'utf8');
} catch {
  console.log('[guardrails] PROTECTED_FILES.md not found — skipping.');
  process.exit(0);
}

// Extract Tier 1 block
const tier1Match = protectedDoc.match(/##\s*Tier\s*1[^\n]*\n([\s\S]*?)(?:\n##\s|\n$)/i);
if (!tier1Match) {
  console.log('[guardrails] No "## Tier 1" section found in PROTECTED_FILES.md — skipping.');
  process.exit(0);
}

// Pull file paths from backtick code spans inside the Tier 1 block
const tier1Block = tier1Match[1];
const protectedFiles = new Set();
const fileRegex = /`([^`\n]+\.[a-z]{1,5})`/gi;
let m;
while ((m = fileRegex.exec(tier1Block)) !== null) {
  protectedFiles.add(m[1].trim());
}

if (protectedFiles.size === 0) {
  console.log('[guardrails] No protected file paths parsed — skipping.');
  process.exit(0);
}

let changedFiles = '';
try {
  execSync(`git fetch --no-tags --depth=1 origin ${baseRef}`, { stdio: 'pipe' });
  changedFiles = execSync(`git diff --name-only origin/${baseRef}...HEAD`, {
    encoding: 'utf8',
  });
} catch (err) {
  console.log('[guardrails] Could not compute diff — skipping.', err.message);
  process.exit(0);
}

const touched = changedFiles
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)
  .filter((f) => protectedFiles.has(f));

if (touched.length === 0) {
  console.log('[guardrails] OK — no protected files touched.');
  process.exit(0);
}

console.error('\n❌ [guardrails] Protected files modified in this PR:');
for (const f of touched) console.error(`   - ${f}`);
console.error('\nThese files are in PROTECTED_FILES.md Tier 1.');
console.error('If the change is intentional, add "[skip-guardrails]" to the PR title.\n');
process.exit(1);
