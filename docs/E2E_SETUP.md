# End-to-End Test Setup

The Playwright suite under `e2e/` covers the full QR check-in flow.
It is **opt-in** — disabled by default so forks and contributors without
test credentials see green CI.

## Enable in CI

1. In the GitHub repository, go to **Settings → Secrets and variables → Actions**.
2. Add the following **repository secrets**:

   | Secret | Description |
   |---|---|
   | `E2E_ADMIN_EMAIL` | Email of a seeded Admin / Owner user in the dev DB |
   | `E2E_ADMIN_PASSWORD` | That user's password |
   | `E2E_TEST_LOCATION_ID` | A known `locations.id` (UUID) for QR generation |
   | `E2E_BASE_URL` *(optional)* | Override target URL. If unset, the workflow runs `bun run build && bun run preview` and points to `http://localhost:4173`. Set to `https://moom.lovable.app` to run against the published staging environment. |

3. Add the **repository variable** `E2E_ENABLED` with the value `true`.
   The workflow is gated by `if: ${{ vars.E2E_ENABLED == 'true' }}` and skips
   without this variable.

## Run locally

```bash
bun install
bunx playwright install chromium

# Either rely on Playwright spinning up `bun run preview` for you:
export E2E_ADMIN_EMAIL=...
export E2E_ADMIN_PASSWORD=...
export E2E_TEST_LOCATION_ID=...
bunx playwright test

# Or point at a running dev server:
export E2E_BASE_URL=http://localhost:8080
bunx playwright test
```

## What is covered

| Scenario | File |
|---|---|
| Admin generates a QR code in `/lobby`, a fresh browser context "scans" it, admin Lobby remains live after realtime refresh | `e2e/qr-checkin.spec.ts` |

## Adding new specs

- Keep specs **deterministic** — never rely on a member being present in the
  database. If your test needs a member, seed one in a beforeAll hook via
  the admin UI and clean it up afterwards.
- Use `data-testid` attributes for stable selectors. Adding new test ids to
  production code is **encouraged** (zero UX impact, zero behavior change).
- Avoid screenshot diffs; we rely on assertions, not pixels.

## Skip semantics

- `test.skip(!hasCreds, ...)` at the top of each spec means: if any required
  env var is missing, the test reports as **skipped**, not failed.
- This makes it safe to run the suite in any environment, including local
  dev without credentials configured.
