#!/usr/bin/env node
/**
 * check-brand-consumers.mjs
 *
 * Regression guard: ensures that brand-sensitive UI surfaces (Sidebar, Header,
 * Auth pages, Member/Trainer headers) do NOT hardcode the literal "MOOM" or
 * "MOOM CLUB" — they must read from `useBrand()` / `<BrandMark/>` so saved
 * Brand Kit propagates everywhere.
 *
 * Allowed places to mention the literal:
 *   - src/components/branding/brandDefaults.ts (the default kit itself)
 *   - src/i18n/locales/* (member-facing copy with intentional brand wording)
 *   - test files
 *   - comments / doc strings
 *
 * Fails CI when a banned hardcode is introduced. Override per PR title via
 * `[skip-brand-check]`.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGETS = [
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/Header.tsx',
  'src/apps/member/components/MemberHeader.tsx',
  'src/apps/trainer/components/TrainerHeader.tsx',
  'src/pages/Auth/AdminLogin.tsx',
  'src/pages/Auth/MemberLogin.tsx',
  'src/pages/Auth/Signup.tsx',
];

const BANNED = /["'`>](MOOM(\s+CLUB|\s+Gym|\s+Admin)?)[<"'`]/;

const violations = [];
for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  src.split('\n').forEach((line, i) => {
    // Skip comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    if (BANNED.test(line)) {
      violations.push(`${rel}:${i + 1}  ${line.trim()}`);
    }
  });
}

if (violations.length > 0) {
  console.error('\n❌ Brand consumer regression detected:');
  console.error('   Hardcoded brand string found in protected surfaces.');
  console.error('   Use <BrandMark/> or `useBrand()` instead.\n');
  violations.forEach((v) => console.error(`   ${v}`));
  console.error('\nIf this is intentional, add [skip-brand-check] to the PR title.\n');
  process.exit(1);
}

console.log('✅ Brand consumers: all surfaces read from useBrand()');
