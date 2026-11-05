'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../docs/trade-engine');
const D=require('../docs/trade-market')(require('../docs/trade-ko')(require('../docs/trade-extra')(structuredClone(require('../docs/trade-data')))));require('../docs/trade-catalog').extend(D);require('../docs/trade-options')(D);D.modDb=require('../docs/trade-mod-data');
for(const raw of ['마나100 이상 화저40 알수없음 5딥이하 마법봉','알수없음 최대 마나 100 이상 저항40 마법봉','마나 알수없음 물피 마법봉','희귀 반지 마나100 알수없음','마나100 💛 알수없음 화저40'])test('only unknown spans removed: '+raw,()=>{const before=E.parse(raw,'weapon.wand',D);assert.ok(before.unknown);const after=E.parse(E.removeUnknownInput(raw,before),before.categoryId,D);assert.equal(after.unknown,'');for(const k of ['conditions','price','selections','itemId','categoryId'])assert.deepEqual(after[k],before[k],k);assert.deepEqual(after.ambiguities.map(a=>[a.choices,a.bounds,a.value]),before.ambiguities.map(a=>[a.choices,a.bounds,a.value]));});
