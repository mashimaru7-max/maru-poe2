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
Open `docs/trade.html`. Supports eight armour/support categories and Korean shorthand for 47 common options. A manual catalog uses 1,783 exact-ID Korean translations out of 1,785 unique stat identifiers (1,822 upstream rows include duplicates). Two untranslated identifiers are excluded from the selector. Korean catalog labels also generate text-parser candidates; identical names require a choice unless the item category identifies a single candidate. Conditions, numeric ranges, a single-currency price bound, league and seller status become a Korean POE2 trade website link; no private trade API or account credentials are used.

Inputs start empty with a gray category-specific placeholder; examples fill the field only when explicitly requested. Category changes retain typed conditions and validate them, while clearing manual conditions and picker state. Explicit reparse, all example buttons, category buttons and clear reset manually added conditions, picker search/scope/selection/bounds. Automatic text parsing keeps independently added options until an explicit reset. Curated normal-option category mismatches block link generation without an override; manually selected special catalog entries still require explicit acknowledgement. Ambiguous resistance, unknown words and conflicting bounds block search until resolved. Resistance shorthand means individual explicit modifiers, not total/pseudo resistance. Elemental resistance sums use the actual pseudo stat, not three separate minima; generic total resistance wording requires the user to confirm the elemental-only scope. Chaos-inclusive sums, strict comparisons, OR conditions and currency conversion are not supported. Minion, spell, projectile, melee and elemental spell skill level aliases are included, along with common damage, regeneration and percentage defence/resource aliases. Level suffixes such as 렙, 레벨, lv and level are recognized. 소환2렙 / 솬수2렙 select minion skill level; unqualified 솬수 / 소환 / 소환수 ask whether skill level or damage is intended, rather than guessing from the selected item category. Bare modifier names become existence filters with an empty value object; zero remains a real bound. Numeric ranges are optional for modifier rows in both the parser and manual picker. Final item properties still need a bound. Saved searches remain browser-local. Six trade-enabled league IDs are selectable with Korean labels, including both current event/challenge leagues and their hardcore variants; manual league entry is removed. SSF is excluded because it cannot trade. League metadata is a dated, maintained snapshot, not a live API feed.

Trade catalog snapshot: 2026-09-15, from https://github.com/slickdomi/poe2-better-trade-filter/tree/ae8f72832392000ed6259d0d758bc8d8a3739c88/packages/web/src/data/filters.json . MIT notice in `docs/licenses/trade-data-MIT.txt`. This is a bounded snapshot, not a guarantee of current patch completeness. Raw options outside curated aliases can be selected manually.

Validation: `node tests/trade-engine.test.cjs` (96 cases), plus browser checks for categories, ambiguity blocking, editing and responsive layout. Native browser CompressionStream is required.

The elemental-resistance pseudo ID is independently documented in the POE2 Oracle source, with a live catalog verification date of 2026-09-22: https://github.com/mttzzz/poe2-oracle/blob/25b75b5e5c5e456e1557eacbfc0beaf0f1f472b4/crates/stat-filters/src/pseudo.rs . Only the stat identifier and its meaning are referenced; no upstream implementation is copied. Direct verification in the Korean trade UI was blocked by a security challenge in the QA browser on 2026-11-05 KST. Query construction is tested; live listings for the new pseudo were not verified.

Korean labels: https://github.com/Kvan7/Exiled-Exchange-2/blob/cca30662bf31eaf38bd711e2ec1a6b899a06c40e/renderer/public/data/ko/stats.ndjson (2026-09-06 source, inspected 2026-11-05). Source license is retained in `docs/licenses/trade-ko-MIT.txt`. Translation selection keeps the canonical matcher and excludes negative/value-specific variants from the default label; reduced/increased alternatives are not interchangeable. No upstream implementation is copied.

Presence-filter representation is corroborated by `tradeIdToQuery` and `getMinMax` in the same POE2 project's `renderer/src/web/price-check/trade/pathofexile-trade.ts`, and its 0.15.7 release notes describing cleared numeric bounds: https://github.com/Kvan7/Exiled-Exchange-2/releases/tag/v0.15.7 . The app only builds a browser link, not a private API request. Actual trade-site acceptance and listings remain unverified in the QA browser because of the previously observed security challenge. Complex clauses, arbitrary slang, unknown typos, and all natural language are not guaranteed. Multiple-value stat templates require explicit review through the picker.

Purchase settings expose all five POE2 status options verified in the referenced POE2 Oracle source: available, securable, onlineleague, online, any. Price minimum/maximum can be applied directly with divine/exalted/chaos as the supported price units; a pending price draft disables the previous link. Applied UI price overrides text price, and can be explicitly cleared. Saved searches preserve the applied price and purchase status. No sale_type field is fabricated.

League metadata checked 2026-11-05 against the official Korean Forbidden Rites FAQ: https://poe.kakaogames.com/forum/view-thread/4000434 . Exact six IDs are also in the original POE2 trade snapshot. The official league API requires service:leagues and is not called from the static page. Purchase status mapping: https://github.com/mttzzz/poe2-oracle/blob/25b75b5e5c5e456e1557eacbfc0beaf0f1f472b4/crates/trade-client/src/lib.rs . All six league URL paths, five status query modes, price apply/clear/save/restore and picker resets are validated locally; final listings remain the official site's responsibility.

Explicit ambiguity choices for curated options rewrite the matching original input span into a canonical phrase (e.g. 저항 40 → 화저40이상). Original spacing and unrelated text are retained, including unknown text that still requires correction. Re-parsing or editing another condition therefore does not discard the chosen meaning. Generic choices are scoped to that occurrence; a new independent 저항 clause still needs its own choice. Tests cover repeated clauses, preceding prices, full-width numbers, NFD Korean, bare-presence choices and stale UI choices.

The upstream normal-affix eligibility snapshot omitted ranged attack damage. Four exact attack-added physical/fire/cold/lightning stat IDs are restored to the glove picker using the data-mined original glove prefix table: https://poe2db.tw/kr/Gloves ; physical spawn tag evidence: https://poe2db.tw/cache2/kr/Poe_Data_Mods_hover/ac0a962d969a8deccb3ae212dba928bb35c7948d24bb66c5c1e43e983b4c6ea2 (inspected 2026-11-05). 물피 selects attack-added physical damage existence, not local weapon damage or increased physical damage. Numeric text requires an explicit average alias (물피평균15이상); a two-number damage range is not silently treated as a range of averages. Picker numeric bounds are labeled as averages. Averaged ranged stat semantics are corroborated in POE2 Oracle's crates/item-parser/src/catalog_match.rs (rolled/rolled_runs) at the recorded source commit.

## Navigation and edit-state fixes (2026-11-05)
All three tools use the same three-link navigation above the hero, with shared layout and active-state styles in `docs/site-shell.css`. Filter search/category changes clear a selection that is no longer visible; editing and previews stay hidden until a visible rule is selected. Downloads show the generated filename and browser-download/game-folder steps; the preparation panel explains the separate account-follow workflow.

Automatic trade text changes preserve the applied UI price and row overrides for unchanged text clauses. Changing or removing a clause discards its old override; independent manual rows keep theirs. Explicit reparse, examples, category changes and clear still reset manual conditions as documented. Saved searches retain their overrides. Run `node --test tests/*.test.cjs`; the edit-state suite covers unrelated edits, removed clauses, deleted conditions, independent manual rows and zero versus presence.

Spirit correction (2026-11-05): `정신력` / `정신` use the exact explicit modifier `explicit.stat_3981240776` (# to Spirit), including presence-only and ranged conditions. They no longer target the equipment `spirit` property. ES still targets the final equipment value. Exact stat ID and chest/helmet eligibility come from the bundled trade and Korean-label snapshots.

## Optional Korean voice input
Trade input has an opt-in microphone button using browser SpeechRecognition/webkitSpeechRecognition with ko-KR. A completed transcript is appended as editable text and passed to the existing parser; no automatic search or game action is performed. Partial results stay in a separate status, and concurrent typing, explicit resets, navigation and hidden tabs cancel recording. Unsupported browsers show keyboard-dictation guidance. Browser/provider recognition may send audio to their servers and may require network access; the project does not host transcription or store audio. The button requests microphone permission only after a click. Recognition accuracy, especially game shorthand and numbers, requires user review. Reference: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition .
