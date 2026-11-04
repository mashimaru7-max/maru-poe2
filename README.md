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


Filter rule search accepts case/spacing-insensitive English and Korean currency aliases (for example 디바인오브 / 신성한오브 / 딥 → Divine Orb). Alias matches inspect BaseType values, including names beyond the two shown in a rule title, and show the matching item beneath the result. The original filter text is unchanged. Run `node tests/filter-search.test.cjs [optional-local-filter-path]`.

## Researched Korean currency names and aliases
Filter results show Korean primary labels and original English names together. The normal preview, item selectors, rarity/class summaries, and effect labels use Korean only. Unmapped names show an explicit Korean placeholder; original filter text, identifiers, and advanced raw inputs are preserved.
The local search catalogue contains 673 bilingual item names, 10 search groups, 44 source-backed usage terms, and 136 clearly labeled search helpers (checked 2026-11-04). It covers currency and traded crafting materials, including essences, omens, liquids, catalysts, runes, and soul cores. It is a bounded snapshot, not every community nickname or a current-drop guarantee.

Open `docs/currency-aliases.html` to inspect names, alias provenance, groups, and download the dictionary. Exact alias resolution takes priority, preventing tier abbreviations from matching lower tiers and `락` from expanding to every name containing 타락. Ordinary English/source-line search and source preservation continue to work.

Bilingual metadata is adapted under MIT; see `docs/THIRD_PARTY_NOTICES.md`. Source URLs and per-alias distinctions between observed usage and search helpers are embedded in `docs/currency-aliases.js`.
## Korean trade search
Open `docs/trade.html`. Supports eight armour/support categories and Korean shorthand for 34 common options. A manual catalog exposes 1,822 exact stat entries, including English labels. Conditions, numeric ranges, a single-currency price bound, league and seller status become a Korean POE2 trade website link; no private trade API or account credentials are used.

Inputs start empty with a gray category-specific placeholder; examples fill the field only when explicitly requested. Category changes retain user conditions and validate them. Curated normal-option category mismatches block link generation without an override; manually selected special catalog entries still require explicit acknowledgement. Ambiguous resistance, unknown words and conflicting bounds block search until resolved. Resistance shorthand means individual explicit modifiers, not total/pseudo resistance. Elemental resistance sums use the actual pseudo stat, not three separate minima; generic total resistance wording requires the user to confirm the elemental-only scope. Chaos-inclusive sums, strict comparisons, OR conditions and currency conversion are not supported. Minion, spell, projectile, melee and elemental spell skill level aliases are included. Saved searches remain browser-local. Temporary league names must be entered exactly.

Trade catalog snapshot: 2026-09-15, from https://github.com/slickdomi/poe2-better-trade-filter/tree/ae8f72832392000ed6259d0d758bc8d8a3739c88/packages/web/src/data/filters.json . MIT notice in `docs/licenses/trade-data-MIT.txt`. This is a bounded snapshot, not a guarantee of current patch completeness. Raw options outside curated aliases can be selected manually.

Validation: `node tests/trade-engine.test.cjs` (50 cases), plus browser checks for categories, ambiguity blocking, editing and responsive layout. Native browser CompressionStream is required.

The elemental-resistance pseudo ID is independently documented in the POE2 Oracle source, with a live catalog verification date of 2026-09-22: https://github.com/mttzzz/poe2-oracle/blob/25b75b5e5c5e456e1557eacbfc0beaf0f1f472b4/crates/stat-filters/src/pseudo.rs . Only the stat identifier and its meaning are referenced; no upstream implementation is copied. Direct verification in the Korean trade UI was blocked by a security challenge in the QA browser on 2026-11-05 KST. Query construction is tested; live listings for the new pseudo were not verified.
