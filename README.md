# 유배자의 검색 공방

Buildless POE2 Korean stash/vendor search-expression workbench.

## Features
- Vendor / waystone / equipment / tablet catalogs (41 equipment, 32 waystone, 85 tablet entries).
- Include ALL/ANY; exclusions; integer minimums (0–9999), literal custom text.
- NFD/NFC switch; configurable length guard; clipboard fallback.
- Per-category browser-local state and favorites; favorites JSON import/export.
- Reference-only JavaScript item-text matcher. No game automation or account access.

## Validation
`node tests/engine.test.cjs`
- Exhaustive checks of 12 numeric thresholds over 0–10009.
- Positive and negative synthetic fixtures for all 158 catalog patterns.
- Include/exclude, numeric boundaries, escaping, length guard.
Browser QA: category navigation, preset selection, minimum value, matcher, clipboard, favorites.
Game client behavior and current patch completeness are NOT verified. Limits 50/250 are selectable reference settings, not a guarantee.

## Sources / provenance
Game modifier descriptions referenced from the POE2-generated Korean data in veiset/poe.re, commit 5b21d111932406929d9d671028b134d50973ef9d (retrieved 2026-11-04):
https://github.com/veiset/poe.re/tree/5b21d111932406929d9d671028b134d50973ef9d/poe2/generated
Only selected game descriptions / category labels are included. No upstream generator implementation or optimized regex table is copied. Expression generation and UI are written for this project.
Data is a bounded snapshot, not a claim of full patch coverage. One untranslated tablet entry is excluded.
Game text and Path of Exile are property of Grinding Gear Games. This product is not affiliated with or endorsed by GGG.

## Runtime
No dependencies, external requests, analytics, or AI service. Serve docs/ as static files.
Browser storage is local to each device/profile; export favorites for backup.

## GitHub Pages
Publish the main branch /docs folder in Repository Settings → Pages. Assets use relative paths and work under /maru-poe2/. No secrets or account credentials are required.
