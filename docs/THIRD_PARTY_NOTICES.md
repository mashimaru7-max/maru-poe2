# Third-party name metadata

## Exact-base modifier data (2026-11-05)

trade-mod-data.js projects factual game data from repoe-fork/poe2 commit
fbffebf2bd2a0ebc46dcf5b0b3640f94fb2677f6 and repoe-fork/pob-data commit
f49119fd4f5f7434f7c4910527e0a52448fe4b99. Missing unique records are
supplemented by individually attributed PoE2DB pages in
scripts/trade-db/unique-supplement.json. Game data belongs to Grinding
Gear Games. See TRADE_MOD_DB.md for source links and limitations.

scripts/trade-db/matchStatIds.mjs and buildEligibility.mjs adapt helpers
from slickdomi/poe2-better-trade-filter commit
ae8f72832392000ed6259d0d758bc8d8a3739c88 under the MIT license retained in
licenses/trade-data-MIT.txt. Internal stat mappings reuse Kvan7/Exiled-Exchange-2
at the commit listed below, with licenses/trade-ko-MIT.txt retained.

## Currency name metadata

English–Korean name pairs in currency-aliases.js are adapted from
Ifan24/poe2-market-arbitrage-desk, lib/currency-names.ko.json, commit
cf20feaf67b555ea5fbbecd1c5c049193f0907d2 (retrieved 2026-11-04).
https://github.com/Ifan24/poe2-market-arbitrage-desk

Only name metadata is adapted. Search implementation, aliases, provenance,
classification, and interface are maintained for this project.
Game names and Path of Exile belong to Grinding Gear Games. This is an
unofficial tool. Community source links are recorded in the dataset.

MIT License

Copyright (c) 2026 Ruiqi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## Full item dictionary

item-dictionary-data.js adapts name metadata from Kvan7/Exiled-Exchange-2,
renderer/public/data/ko/items.ndjson at commit
cca30662bf31eaf38bd711e2ec1a6b899a06c40e (2026-09-06; retrieved 2026-11-05).
https://github.com/Kvan7/Exiled-Exchange-2

Classification reuses the pinned metadata in trade-catalog.js. See
TRADE_COVERAGE.md and licenses/trade-data-MIT.txt. The item DB license is
licenses/trade-ko-MIT.txt. Full notices are included in the JSON export.
Only names, categories and search aliases are projected; no item art or
stat descriptions are copied. The DB does not verify current availability.
