# Critical-Path Audit — Templ Constructions website

Standard applied: **The Seven Critical Path Rules** (`ai-era-critical-path-coding-standard.md`).
Date: 2026-06-08.

## Classification

This is a static HTML/CSS/JS marketing site with **no build step, no backend, no
database, no auth, and no server-side code**.

- **Sketch / static-design path:** all page markup, styling, GSAP animations,
  loading screen, page transitions, gallery grids. These cannot affect
  production data and are not imported by any runtime.
- **Critical path (one surface only):** the **contact enquiry form**
  (`contact.html` + the submit handler in `js/main.js`). It carries
  customer/user data to Netlify Forms. A dropped or falsely-confirmed enquiry
  is lost business — so this surface is treated as critical path.

## Per-rule result

| # | Rule | Result |
|---|------|--------|
| 1 | No dynamic execution (`eval`, `new Function`, string timers) | **Pass.** None present. All `setTimeout` calls pass function references, not strings. |
| 2 | No sketch imports into runtime code | **Pass / N/A.** No module imports at all. |
| 3 | SQL parameters + identifier allowlists | **N/A.** No SQL anywhere in the project. |
| 4 | Broad handlers must log / re-raise / return typed error — no silent swallow or fake-success | **Fixed.** Two findings, both corrected (see below). |
| 5 | No new large critical-path functions | **Pass.** Handlers are small and single-purpose. |
| 6 | Critical-path behavior needs a test / smoke check / documented guardrail | **Partial — documented guardrail below.** No JS test runner available on this machine (no Node). |
| 7 | Regressions posted to canonical VPS context-server | **N/A.** No regression; no VPS access from this machine. |

## Findings fixed under Rule 4

1. **Fake-success on enquiry submit (critical path).** The form handler called
   `fetch('/').then(showThanks)`. Because `fetch` only rejects on network
   failure, an HTTP 4xx/5xx from Netlify would still have shown the customer
   "Thank you" while their enquiry was silently dropped. Fixed: only confirm on
   `response.ok`; on any non-OK status or network error, fall back to a real
   native `form.submit()` so the enquiry is actually delivered. No path now
   shows success without the POST being accepted.

2. **Silently swallowed video autoplay rejection.** `video.play().catch(() => {})`
   swallowed the error. Changed to log a `console.warn` so a blocked hero video
   is observable instead of invisible.

## Verification

- **Static asset + serve smoke check (run):**
  ```bash
  cd ~/templ-website && python3 -m http.server 8765
  # all 5 pages return HTTP 200; logo + gallery images return 200
  ```
- **Manual rule walk-through:** completed, recorded in the table above.

## Not verified / could not run

- The reusable guard template (`scripts/critical-path-check.mjs`) was **not**
  installed: this machine has no `node`, the project has no `package.json`, and
  the template paths in the standard belong to a different user/VPS
  (`/Users/tahaemahaki/...`, `/root/SOPs/...`). When this site is wired into a
  Node/CI environment, install the guard and add `node scripts/critical-path-check.mjs`
  to the ship/pre-push path.
- The enquiry form's `response.ok` / fallback behavior was reasoned through and
  hardened but not exercised against a live failing Netlify endpoint (no deploy
  yet). Re-check after first deploy by submitting a test enquiry.
