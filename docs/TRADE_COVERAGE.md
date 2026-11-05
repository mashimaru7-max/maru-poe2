# 거래 검색 확장 범위와 검증 기록

## 2026-11-05 추가 오류 점검

기준 커밋: `1aad7ce`. 별도 전수 대조에서 발견한 다음 문제를 수정했습니다.

- 문장으로 입력한 아이템 이름을 지웠을 때 이전 이름 제한이 남는 문제. 이름 목록에서 직접 선택한 아이템은 별도로 유지합니다.
- `공속15 활`, `명중100 활`이 장신구·장갑용 일반 옵션 ID를 쓰는 문제. 선택 종류에 따라 무기 자체 옵션과 일반 옵션을 구분하고, 전체 검색에서 모호하면 선택을 요청합니다.
- 한 한국어 매처에 여러 거래 ID가 연결된 원본 자료의 `local_` 표시를 모든 ID에 적용하던 문제. 로컬/일반이 명시적으로 나뉜 ID 묶음은 정확한 ID별 자료로 교정했습니다. 방어구·방패의 자체 옵션도 해당 종류에서 허용합니다.
- `최대 막기 확률` 등을 비교 지시어 ‘최대’로 쪼개던 문제. 전체 옵션 이름을 우선하며, 여전히 `최대이속35`는 이동 속도 최대 35로 읽습니다.
- `공격 속도 15% 증가`, `1초마다 생명력 12 재생`처럼 한글 문구 중간에 수치가 있는 단일 수치 옵션을 정확한 문구로 읽습니다. 복합·반전 수치는 임의 변환하지 않습니다.
- `미감정`의 ‘감정’을 감정 주문서 이름으로 읽던 충돌을 방지했습니다.
- `경로석 드롭 확률`의 자연스러운 이름과 전용 조건을 연결했습니다.

`trade-options.js`는 동일하게 고정된 분류 자료의 필드 ID를 사용합니다. 요구 레벨·힘·민첩·지능 4개 숫자 조건을 추가하여 기존 수치를 포함한 전용 숫자 조건은 32개입니다. 아이템 등급·감정·분열·타락·축성·이중 타락·배양된 바알 고유·미공개·훼손·제작·예지·복제 12개 선택 조건을 추가했습니다. 입력은 선택 사항이며 저장·복원에 포함됩니다. 존재하는 분류별 자료만으로 최신 실제 매물 존재까지 보증하지 않습니다.

검증: 기존 Node 검사와 신규 회귀 검사를 합쳐 29개 최상위 검사 통과. 3,894개 이름을 구조화된 검색 요청으로 직렬화하고, 한국어 명시 옵션 문구 1,807개의 원래 ID가 결과 또는 모호성 후보에 남는지 전수 대조했습니다. 동일 문구에 여러 ID가 있으면 임의로 하나를 고르지 않습니다. ‘균열석’·‘반지’ 등 분류와 같은 이름은 문장에서는 분류 검색이며, 한 글자 베이스 ‘옷’은 이름 목록 선택을 사용합니다.

남은 제한: 최신 공식 전체 메타데이터 및 매물 응답은 보안 확인으로 검증하지 못했습니다. 이 고정 자료의 한국어 옵션 4,553개는 최신 전체 옵션 수를 뜻하지 않습니다. 선택값이 필요한 옵션 ID 13개는 자동 변환에서 제외하며, 한글 문구가 없는 기존 옵션 2개는 목록에 표시하지 않습니다. OR·가중치·옵션 개수 검색, 임의 비공개 리그, 대량 교환 조건 자동 채움은 지원하지 않습니다. 게임 아이템을 클립보드에서 그대로 해석하는 기능도 제공하지 않습니다.

확인일: 2026-11-05 (한국). **현재 거래소의 최신 전체 목록과 실제 매물까지 검증한 상태가 아닙니다.** 공식 거래소 접근은 웹 조회 403 및 브라우저 보안 확인으로 제한되었습니다. 아래는 공개 POE2 도구의 명시된 스냅샷을 대조한 구현 범위입니다. 출시 전 데이터도 포함될 수 있어 분류 존재와 현재 거래 가능 여부를 구분합니다.

## 구현 범위

분류 57종 + 분류 제한 없는 전체 검색, 한국어 이름 3,894개, 정확한 ID에 연결한 옵션 자료 4,553개, 전용 숫자 필드 23종. 옵션 숫자에는 순수 계산을 추가하지 않습니다. 퀘스트·레거시 분류와 이름 없는 항목은 제외합니다. 별칭은 기존 사전의 이름에 정확히 연결하며 데이터 갱신 때 함께 다시 생성합니다.

| 대분류 | 확인한 거래 분류 ID | 한국어 표시 | 이름 수 | 전용 숫자 필드 | 근거 |
|---|---|---|---:|---|---|
|all|`__all__`|전체 아이템|9|`ward`|분류 필드 생략; 전체 이름 검색|
|weapon|`weapon.oneaxe`|한손 도끼|18|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.onemace`|한손 철퇴|58|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.spear`|창|57|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.onemelee`|한손 근접 무기 전체|0|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.twoaxe`|양손 도끼|18|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.twomace`|양손 철퇴|63|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.warstaff`|육척봉|49|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.twomelee`|양손 근접 무기 전체|0|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.talisman`|부적|40|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.bow`|활|50|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.crossbow`|쇠뇌|39|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `reload_time`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.ranged`|원거리 무기 전체|0|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.wand`|마법봉|20|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.sceptre`|셉터|14|`spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.staff`|지팡이|23|`spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon.caster`|주문 무기 전체|0|`spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|weapon|`weapon`|무기 전체|0|`damage`, `aps`, `crit`, `dps`, `pdps`, `edps`, `reload_time`, `spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|armour|`armour.helmet`|투구|334|`spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|armour|`armour.chest`|갑옷|440|`spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|armour|`armour.gloves`|장갑|253|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|armour|`armour.boots`|장화|214|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|armour|`armour.quiver`|화살통|19|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|armour|`armour.shield`|방패|167|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|armour|`armour.focus`|집중구|61|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|armour|`armour.buckler`|버클러|62|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|armour|`armour`|방어구 전체|0|`spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|accessory|`accessory.amulet`|목걸이|50|`spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|accessory|`accessory.belt`|허리띠|38|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|accessory|`accessory.ring`|반지|62|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|accessory|`accessory`|장신구 전체|0|`spirit`, `ilvl`, `quality`|filters; 자료 스냅샷 기준|
|jewel|`jewel`|주얼|24|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|flask|`flask.life`|생명력 플라스크|9|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|flask|`flask.mana`|마나 플라스크|9|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|flask|`flask.charm`|호신부|24|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|flask|`flask`|플라스크 전체|6|`ilvl`, `quality`|filters; 자료 스냅샷 기준|
|map|`map.waystone`|경로석|16|`ilvl`, `quality`, `map_tier`, `area_level`, `map_packsize`, `map_magic_monsters`, `map_iir`, `map_rare_monsters`, `map_revives`, `map_bonus`, `map_gold`, `map_experience`|filters; 자료 스냅샷 기준|
|map|`map.tablet`|서판|18|`ilvl`, `quality`, `area_level`|filters; 자료 스냅샷 기준|
|gem|`gem.activegem`|스킬 젬|246|`ilvl`, `quality`, `gem_level`, `gem_sockets`|oracle+exchange; 자료 스냅샷 기준|
|gem|`gem.supportgem`|보조 젬|594|`ilvl`, `quality`, `gem_level`, `gem_sockets`|oracle+exchange; 자료 스냅샷 기준|
|gem|`gem.metagem`|메타 젬|20|`ilvl`, `quality`, `gem_level`, `gem_sockets`|oracle+exchange; 자료 스냅샷 기준|
|map|`sanctum.relic`|유물|13|`ilvl`, `quality`, `area_level`|oracle+exchange; 자료 스냅샷 기준|
|map|`map.fragment`|조각|12|`ilvl`, `quality`, `area_level`|oracle+exchange; 자료 스냅샷 기준|
|map|`map.barya`|진 바리야|1|`ilvl`, `quality`, `area_level`|oracle+exchange; 자료 스냅샷 기준|
|map|`map.ultimatum`|새겨진 결전|1|`ilvl`, `quality`, `area_level`|oracle+exchange; 자료 스냅샷 기준|
|map|`map.logbook`|탐험 일지|1|`ilvl`, `quality`, `area_level`|oracle+exchange; 자료 스냅샷 기준|
|map|`map.breachstone`|균열석|1|`ilvl`, `quality`, `area_level`|oracle+exchange; 자료 스냅샷 기준|
|map|`map.bosskey`|최종 보스 열쇠|10|`ilvl`, `quality`, `area_level`|oracle+exchange; 자료 스냅샷 기준|
|currency|`currency`|화폐·제작 재료|309||oracle+exchange; 자료 스냅샷 기준|
|currency|`currency.socketable`|장착 재료|300||oracle+exchange; 자료 스냅샷 기준|
|currency|`currency.omen`|징조|50||oracle+exchange; 자료 스냅샷 기준|
|weapon|`weapon.claw`|클로|0|`ilvl`, `quality`|oracle+exchange; 거래 분류 확인 · 출시·매물 미확인|
|weapon|`weapon.dagger`|단검|18|`ilvl`, `quality`|oracle+exchange; 거래 분류 확인 · 출시·매물 미확인|
|weapon|`weapon.onesword`|한손 검|19|`ilvl`, `quality`|oracle+exchange; 거래 분류 확인 · 출시·매물 미확인|
|weapon|`weapon.twosword`|양손 검|18|`ilvl`, `quality`|oracle+exchange; 거래 분류 확인 · 출시·매물 미확인|
|weapon|`weapon.flail`|도리깨|17|`ilvl`, `quality`|oracle+exchange; 거래 분류 확인 · 출시·매물 미확인|
|weapon|`weapon.rod`|낚싯대|0|`ilvl`, `quality`|oracle+exchange; 거래 분류 확인 · 출시·매물 미확인|
|other|`card`|점술 카드|0||oracle+exchange; 거래 분류 확인 · 출시·매물 미확인|

## 일반 검색과 대량 교환

- 모든 위 분류: 기존 방식인 base64url(gzip(JSON)) 링크를 생성합니다. `__all__`은 가짜 거래 분류 ID가 아니라 내부 UI 값이며, 쿼리에서는 category를 생략합니다.
- 베이스: `type`에 확인된 영문 베이스명. 고유 아이템: `name`에 고유명, `type`에 베이스, rarity=unique. 한국어 표시와 이름은 Exiled Exchange 2의 동일 레코드로 연결합니다. 이름 정확 검색은 영문 공식 사이트에 보내 언어별 이름 추측을 피합니다. 이름 없는 분류·옵션 검색은 기존 한국 거래소를 유지합니다.
- `tradeTag`가 있는 항목: 확인된 대량 교환 ID와 별도 교환 화면을 표시합니다. 일반 검색의 스탯/장비/가격 조건을 대량 교환용 조건으로 바꾸지 않습니다.
- **대량 교환 자동 조건 채움은 미지원**: 현재 교환 화면의 URL 인코딩 규칙을 직접 검증할 수 없어 임의의 쿼리를 만들지 않습니다. 원하는 항목·지불 화폐·재고 조건은 교환 화면에서 선택해야 합니다. 일반 매물 검색은 별도로 사용할 수 있습니다.

## 수치와 옵션 판정

- 무기 DPS/pDPS/eDPS/APS/치명타/평균 피해는 equipment_filters의 최종 장비 수치입니다. 명시 옵션의 증가율과 구분하며 계산·환산하지 않습니다.
- 젬 레벨은 misc_filters.gem_level, 품질·아이템 레벨은 type_filters, 경로석 티어는 map_filters.map_tier입니다.
- 숫자 없는 명시·고정·고유·룬 등 옵션은 존재 조건을 보냅니다. 무기의 로컬 추가 물리 피해(`explicit.stat_1940865751`)와 공격에 추가되는 물리 피해(`explicit.stat_3032590688`)를 구분합니다. 무기에 전자를, 장갑에 후자를 우선 연결합니다. 이름이 같고 범위로 구분할 수 없으면 선택을 요청합니다.
- 추가 피해의 거래 수치는 두 끝값의 평균 범위입니다. 문장에 평균 기준을 명시하지 않은 양끝값 입력은 거부합니다. 그 외 다중 숫자·방향 반전 옵션은 수치 입력을 제한하며, 유무 검색만 지원할 수 있습니다.
- 일반/고유 eligibility는 **양성 근거**입니다. 목록에서 빠졌다고 게임에 없는 것으로 단정하지 않고 확인 체크를 요청합니다. 무기 로컬 옵션을 방어구에 넣거나 적용 대상이 다른 최종 수치를 넣는 명확한 불일치는 차단합니다.
- 특정 스킬/패시브 등 **선택값이 필요한 옵션 ID**는 자동 번역·변환하지 않고 이 확장 카탈로그에서 제외합니다. 이름을 모르는 신규 패치 옵션, 전체 게임 속어, 모든 조건부 조합, 카오스를 포함한 총저항 합계, OR 조건 등은 전체 지원을 주장하지 않습니다.
- 룬 수호 필드는 ID 존재만 확인되고 종류별 적용 근거가 부족하여 분류 없는 전체 검색에서만 직접 선택하도록 제한합니다.

- 미가공 젬의 레벨별 대량 교환 표시명은 실제 일반 검색의 베이스명으로 보내지 않습니다. `create-item-filters.ts:createUncutGemFilters`의 구조에 맞춰 기본 베이스와 `misc_filters.gem_level`로 분리합니다. 특정 레벨의 이름을 선택하면 같은 레벨의 최소·최대를 고정하고 충돌 수치를 차단합니다.

## 상태와 범위 보존

종류·직접 이름 선택 시 이전 입력/직접 옵션/전용 조건/가격을 비웁니다. 리그·구매 방식은 유지합니다. 예문/명시적 재적용도 직접 조건·가격을 초기화합니다. 입력의 일부를 수정할 때는 변경되지 않은 직접 편집을 유지하고, 문장 자체에서 종류나 아이템이 바뀌면 이전 종류의 직접 조건을 비웁니다. 저장한 검색은 종류·선택 이름·전용 조건·가격·리그·구매 방식을 복원합니다. 입력·전용 필드·가격 변경 즉시 이전 링크를 무효화하고 마지막 압축 결과만 연결합니다.

## 자료·라이선스·갱신

1. GGG 공식 개발자 문서: https://www.pathofexile.com/developer/docs (확인 2026-11-05). 문서화된 개발자 API와 웹 거래 내부 엔드포인트는 다릅니다. 이 사이트는 계정 인증·쿠키·거래 API를 사용하지 않습니다.
2. POE2 Better Trade Filter, MIT: https://github.com/slickdomi/poe2-better-trade-filter/tree/ae8f72832392000ed6259d0d758bc8d8a3739c88 . `packages/web/src/data/filters.json` (2026-09-15), `categoryItemClasses.ts`, `equipmentFilters.ts`, `tradeUrl.ts`. 분류 37종, 일반/고유 옵션 범위, 실제 필드 그룹과 URL 인코딩 근거. `licenses/trade-data-MIT.txt` 유지.
3. Exiled Exchange 2 공식 저장소, MIT: https://github.com/Kvan7/Exiled-Exchange-2/tree/cca30662bf31eaf38bd711e2ec1a6b899a06c40e . `renderer/public/data/ko/items.ndjson`, `stats.ndjson` (2026-09-06), `renderer/src/web/price-check/trade/pathofexile-trade.ts`, `pathofexile-bulk.ts`, `filters/create-item-filters.ts`. 한국어 이름/정확한 스탯 ID/로컬 표기/교환 ID/젬 레벨/고유 이름과 베이스의 쿼리 구조. `licenses/trade-ko-MIT.txt` 유지.
4. POE2 Oracle: https://github.com/mttzzz/poe2-oracle/blob/25b75b5e5c5e456e1557eacbfc0beaf0f1f472b4/crates/item-parser/src/categories.rs (2026-09-22 명시). 장비 밖의 실제 POE2 분류 ID 근거: gem, currency, socketable, omen, map.barya/ultimatum/logbook/breachstone/bosskey, sanctum.relic, card 등. 클라이언트의 레거시 항목을 그대로 거래 분류로 쓰지 않는 근거로도 사용합니다. 코드 복사 없이 ID/사실만 참고했습니다.
5. 약칭: 기존 `currency-aliases.js`에 기록된 이름·출처별 약칭을 exact English name으로 결합합니다. 사전 코드 자체는 수정하지 않습니다.

게임 데이터 저작권은 Grinding Gear Games에 있습니다. 원본 데이터의 패치일과 본 작업의 확인일을 혼동하지 않습니다. 자동 실시간 갱신은 하지 않습니다.

재생성: 위 두 데이터 저장소를 명시된 커밋으로 체크아웃하고 `python scripts/build_trade_catalog.py --filters-source /path/to/poe2-better-trade-filter --exchange-source /path/to/Exiled-Exchange-2`를 실행합니다. 이 명령은 로컬 파일만 읽고 내부 API를 조회하지 않습니다. 새 패치로 갱신할 때는 분류 ID 출처와 이름/필드/옵션의 의미·한국어 연결을 다시 검토하고 원본 커밋/날짜/제외 항목·테스트를 함께 업데이트해야 합니다.

## 실제 검증과 미확인 구분

자동 검사: `node --test tests/*.test.cjs`, `python -m unittest discover -s tests -p 'test*.py'`, `python scripts/build_web.py --check`. 카탈로그 테스트는 모든 확인 분류와 모든 이름의 쿼리 직렬화, gzip/base64url 복원, 대표 무기·젬·경로석·시험·고유·화폐 조건의 필드/ID, 로컬과 전역의 구분, 수치 없는 옵션, 모호한 선택의 재편집, 알려지지 않은 입력 차단을 확인합니다.

브라우저 검증 결과는 작업 완료 시 아래에 기록합니다. 문서로 구조를 확인한 것과 실제 거래소에서 매물을 확인한 것을 구분합니다. 게임 내 적용·실물 휴대폰·현재 전체 매물은 검증 대상 밖 또는 접근 제한입니다.

### 실행한 브라우저 확인 (2026-11-05)

- 9개 대분류의 대표 검색에서 UI 입력 → 링크 생성 → gzip/base64url 복호화를 실제 실행했습니다. 무기 DPS/pDPS/APS, 장갑 추가 피해, 반지 마나 유무, 주얼 아이템 레벨, 플라스크 품질, 스킬 젬 레벨·품질, 경로석 티어, 신성한 오브 이름, 점술 카드 분류의 실제 생성 JSON을 대조했습니다. 이것은 매물 검증이 아닙니다.
- 360/390/768/1440px iframe viewport에서 9개 대분류(36조합)의 페이지 가로 넘침과 입력/선택/버튼의 화면 밖 이탈을 측정했습니다. 해당 검사에서 넘침 0건입니다. 390px에서 젬 전용 조건을 펼쳐 실제 입력창 폭과 화면도 확인했습니다.
- 종류 전환 시 입력·이전 조건 제거, 저장한 무기 조건 복원(종류/DPS/APS/치명타), 고유 이름 복원, 직접 전용 수치 DPS600·가격5 저장 복원과 가격 수정 즉시 이전 링크/복사 무효화, 고유 이름·베이스/rarity 직렬화, 링크 복사, 모호한 저항 선택 후 재편집 시 재질문 없음, 직접 옵션 추가·삭제를 실행했습니다.
- 공식 거래소의 생성된 Fireball/레벨20/품질20 링크를 실제로 열었습니다. 한 차례 새로고침 후에도 Cloudflare 보안 확인이 유지되어 사이트의 조건 패널과 실제 매물은 확인할 수 없었습니다. 우회·다른 앱 인증·쿠키·내부 API는 사용하지 않았습니다. 관련 제한 설명: https://help.openai.com/articles/20001280-using-cloud-browser-in-chatgpt#when-a-website-blocks-the-task
- 사이트 자체의 콘솔 오류는 관찰되지 않았습니다. 검증 브라우저 확장의 메타데이터 전송 오류는 별도로 구분했습니다.
- Node 검사 19개(기존 10개 테스트 파일과 확장 검사 9개), Python 공통 빌드/데스크톱 HTTP 검사 2개 통과. 인게임 검색·필터·사전의 코드와 생성 HTML은 기준 커밋 대비 동일함을 별도로 확인합니다.
