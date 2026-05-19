#!/usr/bin/env node
/**
 * check-brand-consumers.mjs
 *
 * Regression guard with two scan modes:
 *
 *  FRONTEND — brand-sensitive UI surfaces (Sidebar, Header, Auth pages,
 *  Member/Trainer headers) must NOT hardcode "MOOM" / "MOOM CLUB" — they
 *  must read from `useBrand()` / `<BrandMark/>` so saved Brand Kit
 *  propagates everywhere.
 *
 *  BACKEND — edge functions that emit user-facing content (emails, receipts,
 *  invoices, invites, push, LINE) must NOT hardcode the brand string either.
 *  See `docs/audit-brand-backend.md`.
 *
 * Allowed places to mention the literal:
 *   - src/components/branding/brandDefaults.ts (the default kit itself)
 *   - src/i18n/locales/* (member-facing copy with intentional brand wording)
 *   - test files / comments
 *   - CORS allowlist lines (frontend scanner uses target whitelist;
 *     backend scanner requires both a brand literal AND a content keyword)
 *
 * Fails CI when a banned hardcode is introduced. Override per PR title via
 * `[skip-brand-check]`.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// ---------- Frontend ----------
const FRONTEND_TARGETS = [
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

for (const rel of FRONTEND_TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  src.split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    if (BANNED.test(line)) {
      violations.push(`[frontend] ${rel}:${i + 1}  ${line.trim()}`);
    }
  });
}

// ---------- Backend (edge functions) ----------
const BACKEND_ROOT = path.join(ROOT, 'supabase/functions');
const CONTENT_KEYWORDS = /\b(mail|email|invoice|receipt|invite|sendgrid|resend|html|subject|body|template)\b/i;
const BRAND_LITERAL = /(['"`])(MOOM(\s+CLUB|\s+Gym)?|Moom\s+Club|@moomclub\.co|hello@moomclub)\1/;

const walk = (dir) => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_shared') continue; // infra, exempt
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
};

for (const file of walk(BACKEND_ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  // Only audit files that touch user-facing content.
  if (!CONTENT_KEYWORDS.test(src)) continue;
  src.split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    // Skip CORS allowlist lines — they reference moom.fit hostnames, not brand display
    if (/Access-Control-Allow-Origin|ALLOWED_ORIGINS|moom\.fit|moom\.lovable\.app/.test(line)) return;
    // Skip same line if it's only a hostname literal
    if (!CONTENT_KEYWORDS.test(line) && !CONTENT_KEYWORDS.test(src.split('\n').slice(Math.max(0, i - 3), i + 3).join('\n'))) {
      return;
    }
    if (BRAND_LITERAL.test(line)) {
      const rel = path.relative(ROOT, file);
      violations.push(`[backend]  ${rel}:${i + 1}  ${trimmed}`);
    }
  });
}

if (violations.length > 0) {
  console.error('\n❌ Brand consumer regression detected:');
  console.error('   Hardcoded brand string found.');
  console.error('   Frontend: use <BrandMark/> or `useBrand()`.');
  console.error('   Backend:  read settings.branding.brand_kit. See docs/audit-brand-backend.md\n');
  violations.forEach((v) => console.error(`   ${v}`));
  console.error('\nIf this is intentional, add [skip-brand-check] to the PR title.\n');
  process.exit(1);
}

console.log('✅ Brand consumers: frontend surfaces + edge functions clean');
