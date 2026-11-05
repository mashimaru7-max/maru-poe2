'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../docs/trade-engine');
const D=require('../docs/trade-market')(require('../docs/trade-ko')(require('../docs/trade-extra')(structuredClone(require('../docs/trade-data')))));
require('../docs/trade-catalog').extend(D);require('../docs/trade-options')(D);
const parse=(s,c='__all__')=>E.parse(s,c,D),query=s=>E.buildQuery(parse(s),D);
test('weapon and global attack-speed/accuracy shorthand use different exact IDs',()=>{
 for(const [s,id]of [['공속15 활','explicit.stat_210067635'],['공속15 장갑','explicit.stat_681332047'],['명중100 활','explicit.stat_691932474'],['명중100 반지','explicit.stat_803737631']])assert.equal(query(s).stats[0].filters[0].id,id,s);
 assert.equal(E.definition('attack',D).local,false);assert.equal(E.definition('accuracy',D).local,false);
 assert.equal(E.definition('explicit.stat_210067635',D).local,true);
});
test('local armour and shield options are allowed on their actual categories',()=>{
 for(const [id,cat]of [['explicit.stat_4052037485','armour.chest'],['explicit.stat_2481353198','armour.shield']]){const m={raw:'',itemId:null,categoryId:cat,conditions:[{key:id,min:10}],ambiguities:[],errors:[],unknown:''};assert.doesNotThrow(()=>E.buildQuery(m,D));}
});
test('the full option starting with 최대 wins over a comparison word',()=>{
 const q=query('최대 막기 확률5 방패');assert.equal(q.stats[0].filters[0].id,'explicit.stat_480796730');assert.deepEqual(q.stats[0].filters[0].value,{min:5});
 const m=parse('최대이속35 신발');assert.deepEqual(m.conditions,[{key:'move',max:35}]);
});
test('all plain explicit Korean labels keep their exact intended ID or offer it as an ambiguity',()=>{
 for(const s of D.stats.filter(s=>s.type==='explicit'&&s.nameKo)){const m=parse(s.nameKo.replace(/[#%+]/g,''));const ids=[...m.conditions.map(c=>E.definition(c.key,D).id),...m.ambiguities.flatMap(a=>a.choices.map(k=>E.definition(k,D).id))];assert.ok(ids.includes(s.id),s.id+' '+s.nameKo);assert.equal(m.unknown,'',s.id);assert.equal(m.errors.length,0,s.id);assert.equal(m.itemId,null,s.id);}
});
test('formal Korean sentences with a numeric slot in the middle preserve numbers and IDs',()=>{
 for(const [s,id,n]of [['공격 속도 15% 증가 활','explicit.stat_210067635',15],['공격 속도 15% 증가 장갑','explicit.stat_681332047',15],['1초마다 생명력 12 재생 반지','explicit.stat_3325883026',12],['소환수가 주는 피해 30% 증가 투구','explicit.stat_1589917703',30]]){const m=parse(s);assert.equal(m.unknown,'',s);assert.equal(m.errors.length,0,s);assert.equal(m.ambiguities.length,0,s);const row=query(s).stats[0].filters.find(x=>x.id===id);assert.deepEqual(row?.value,{min:n},s);}
 assert.throws(()=>query('공격속도15%증가미만 활'));
});
test('an all-category ambiguous local/global choice stays resolved after text edits',()=>{
 let m=parse('공속15'),a=m.ambiguities[0];assert.ok(a);let raw=E.resolveInput(m.raw,a,'attack',D);m=parse(raw+' 생명100');assert.equal(m.ambiguities.length,0);assert.ok(m.conditions.some(c=>E.definition(c.key,D).id==='explicit.stat_681332047'&&c.min===15));
});
test('selection controls serialize each verified group and exact option ID',()=>{
 for(const d of D.selections)for(const o of d.options){const m={...parse('반지'),raw:'',selections:{[d.id]:o.id}};const q=E.buildQuery(m,D);assert.equal(q.filters[d.group].filters[d.id].option,o.id);}
 assert.throws(()=>E.validateSelections({corrupted:'maybe'},D));assert.throws(()=>E.validateSelections({invented:'true'},D));
});
test('rare, nonunique, uncorrupted and unidentified language remains explicit and conflicts block',()=>{
 let q=query('레어 비타락 미감정 생명100 반지');assert.equal(q.filters.type_filters.filters.rarity.option,'rare');assert.equal(q.filters.misc_filters.filters.corrupted.option,'false');assert.equal(q.filters.misc_filters.filters.identified.option,'false');
 assert.equal(query('고유제외반지').filters.type_filters.filters.rarity.option,'nonunique');
 assert.throws(()=>query('타락 비타락 반지'));assert.throws(()=>query('헤드헌터 희귀'));
 assert.throws(()=>query('타락저항없는반지')); // unknown negation is not silently removed
});
test('requirements, sockets and map fields keep dedicated IDs and no duplicate property keys',()=>{
 let q=query('룬소켓2 요구힘50이하 활');assert.deepEqual(q.filters.equipment_filters.filters.rune_sockets,{min:2});assert.deepEqual(q.filters.req_filters.filters.str,{max:50});
 q=query('경로석 드롭 확률100 티어15');assert.equal(q.filters.map_filters.filters.map_bonus.min,100);assert.equal(q.filters.map_filters.filters.map_tier.min,15);
 const ids=D.curated.filter(x=>x.kind==='property').map(d=>(d.group||'equipment_filters')+'.'+d.id);assert.equal(new Set(ids).size,ids.length);
});
test('3894 structured item selections serialize exact names; recognized text never selects a different item',()=>{
 let direct=0,categoryOnly=0,pickerOnly=0;
 for(const item of D.catalog.items){const m=parse(item.name,item.category),keys=[m.itemId,...m.itemAmbiguities.flatMap(a=>a.choices)].filter(Boolean);if(keys.length){assert.ok(keys.includes(item.key),item.name);assert.equal(m.unknown,'',item.name);assert.equal(m.errors.length,0,item.name);direct++;}else if(!m.unknown){assert.equal(m.categoryId,item.category,item.name);categoryOnly++;}else{assert.equal(item.name,'옷');pickerOnly++;}const q=E.buildQuery({...m,raw:'',itemId:item.key,unknown:'',itemAmbiguities:[],conditions:[],ambiguities:[],errors:[]},D);assert.equal(q.type,item.type);assert.equal(q.name,item.unique?item.nameEn:undefined);}
 assert.equal(direct+categoryOnly+pickerOnly,3894);
});
