# 유배자의 공방

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


## POE2 filter editor (first version)
Open `docs/filter.html`. Files are processed locally; no login, upload server or API.
- Read a UTF-8 `.filter` (up to 2MB); inspect rule conditions, source lines and supported syntax.
- Edit one existing rule's Show/Hide, font size, text/border colors and built-in alert sound.
- Preserve original comments, BOM, line endings, rule order and unknown lines; original is not overwritten.
- Simulate registered item fixtures with ordered first-match and Continue paths; missing data branches rather than assuming false.
- Protected hides, unresolved visibility/style, unsupported directives and syntax errors block `.filter` download. A `.txt` draft is available.
- Editing invalidates prior checks. Restore a rule or undo the last edit, then recheck.
- Default fixtures are explicitly hypothetical rare tier 14/15/16 waystones in area 83; tiers 15/16 are protected. These are not whole-game coverage.
- Import and custom audio remain unsupported. Exact/partial string matching, compact numeric operators, HasExplicitMod count predicates (given explicit modifier-name arrays), and legacy drop-sound flag arguments are supported. Relevant missing item inputs are explained with source lines. Unrelated unsupported blocks no longer poison a known item result; unsupported syntax still blocks game-file export.
- The simulation picker generates hypothetical examples from the selected rule’s base names and satisfying condition values, plus the separately registered protection cases. Inputs and assumptions are visible and editable as JSON. Explicit modifier names are never invented; provide HasExplicitMod when required. This is not exhaustive generation.
- The example is for editor testing, not a gameplay filter. Only PC local-file workflow is provided.

Run `node tests/filter-engine.test.cjs` and `node tests/engine.test.cjs`.
Run `node tests/filter-preview.test.cjs` and `node tests/filter-simulation.test.cjs` for preview and simulation regressions. An optional `node tests/filter-real-file.cjs <local-filter-path>` integration check reads an existing compatible filter without changing or uploading it.

The default preview renders names and valid visual settings directly from the selected rule, side by side before/after. It remains available when other rules use unsupported syntax. Hidden labels are shown dimmed for editing. Missing settings use illustrative defaults; Continue and actual whole-filter matching can change the final appearance. Whole-filter simulation is a separate preview mode and remains the only path used by export validation. On mobile the appearance panel sits between the rule list and editor.
Official syntax: https://www.pathofexile.com/item-filter/about
The site checker is not the GGG client parser and is not proof of current-patch compatibility.

