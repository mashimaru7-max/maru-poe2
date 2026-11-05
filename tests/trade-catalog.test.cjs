'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const E=require('../docs/trade-engine');
const D=require('../docs/trade-market')(require('../docs/trade-ko')(require('../docs/trade-extra')(structuredClone(require('../docs/trade-data')))));
const {snapshot,extend}=require('../docs/trade-catalog');extend(D);
const parse=(s,c='armour.boots')=>E.parse(s,c,D),query=(s,c)=>E.buildQuery(parse(s,c),D,{status:'securable'});
test('catalog categories, exact item names, unique names and all-category queries round-trip through compressed links',()=>{
 assert.equal(new Set(D.categories.map(c=>c.id)).size,D.categories.length);
 for(const cat of D.categories){const q=E.buildQuery({raw:cat.name,categoryId:cat.id,conditions:[],ambiguities:[],errors:[],unknown:''},D,{status:'onlineleague'});const decoded=JSON.parse(zlib.gunzipSync(Buffer.from(zlib.gzipSync(JSON.stringify(q)).toString('base64url'),'base64url')));assert.deepEqual(decoded,q);assert.equal(q.filters.type_filters.filters.category?.option,cat.id==='__all__'?undefined:cat.id);}
 for(const item of snapshot.items){const q=E.buildQuery({raw:'',itemId:item.key,categoryId:item.category,conditions:[],ambiguities:[],errors:[],unknown:''},D,{status:'securable'});assert.equal(q.type,item.type,item.key);assert.equal(q.name,item.unique?item.nameEn:undefined,item.key);assert.equal(q.filters.type_filters.filters.rarity?.option,item.unique?'unique':undefined);assert.equal(q.status.option,'securable');}
});
test('weapon derived properties are separate from explicit modifiers; no numerical conversion',()=>{
 assert.throws(()=>query('DPS500~700 物理','weapon.bow'));const q=query('DPS500~700 물리DPS400 초당공격1.5 무기치확10 활');assert.deepEqual(q.filters.equipment_filters.filters,{dps:{min:500,max:700},pdps:{min:400},aps:{min:1.5},crit:{min:10}});assert.equal(q.stats[0].filters.length,0);const spirit=query('최종정신력100 셉터');assert.equal(spirit.filters.equipment_filters.filters.spirit.min,100);assert.equal(spirit.stats[0].filters.length,0);
});
test('gem, waystone, trial, jewelry and currency dedicated filters use verified groups',()=>{
 let q=query('화염구 젬레벨20 품질20');assert.equal(q.type,'Fireball');assert.equal(q.filters.misc_filters.filters.gem_level.min,20);assert.equal(q.filters.type_filters.filters.quality.min,20);
 q=query('경로석 티어15');assert.equal(q.filters.type_filters.filters.category.option,'map.waystone');assert.equal(q.filters.map_filters.filters.map_tier.min,15);
 q=query('진 바리야 지역레벨80');assert.equal(q.filters.type_filters.filters.category.option,'map.barya');assert.equal(q.filters.misc_filters.filters.area_level.min,80);
 q=query('헤드헌터');assert.equal(q.name,'Headhunter');assert.equal(q.type,'Heavy Belt');assert.equal(q.filters.type_filters.filters.rarity.option,'unique');
 q=query('신성한 오브');assert.equal(q.type,'Divine Orb');assert.equal(E.itemFor(parse('신성한 오브').itemId,D).exchangeId,'divine');
});
test('presence-only, local weapon damage and explicit attack damage remain different',()=>{
 const glove=parse('물피 장갑'),weapon=parse('물피 활');assert.equal(glove.conditions[0].key,'addedPhysical');assert.equal(weapon.conditions[0].key,'explicit.stat_1940865751');assert.equal(E.definition(weapon.conditions[0].key,D).local,true);
 assert.deepEqual(query('마나 반지').stats[0].filters.find(s=>s.id==='explicit.stat_1050105434').value,{});
 assert.throws(()=>query('물피10~20 활'));assert.equal(query('물피평균20 활').stats[0].filters[0].value.min,20);
 assert.throws(()=>E.buildQuery({...weapon,categoryId:'armour.gloves'},D));
});
test('ambiguity resolution survives unrelated edits for curated and general exact-ID options',()=>{
 let r=parse('저항40 마나 반지'),a=r.ambiguities.find(a=>a.choices.includes('fire'));assert.ok(a);let text=E.resolveInput(r.raw,a,'fire',D);r=parse(text+' 생명100');assert.equal(r.ambiguities.filter(a=>a.choices.includes('fire')).length,0);assert.ok(r.conditions.some(c=>c.key==='fire'));
 r=parse('기절한계치100 투구');a=r.ambiguities.find(a=>a.choices.some(k=>k.startsWith('explicit.')));assert.ok(a);const key=a.choices[0];text=E.resolveInput(r.raw,a,key,D);r=parse(text+' 마나');assert.equal(r.unknown,'');assert.ok(r.conditions.some(c=>c.key===key));assert.equal(r.ambiguities.length,0);
});
test('incomplete eligibility is advisory while wrong final properties are hard failures',()=>{
 const row=snapshot.stats.find(s=>s.type==='sanctum');const m={raw:'',categoryId:'sanctum.relic',conditions:[{key:row.id}],ambiguities:[],errors:[],unknown:''};assert.ok(E.compatibility(m,D).length);assert.equal(E.blockingCompatibility(m,D).length,0);assert.doesNotThrow(()=>E.buildQuery(m,D));
 assert.throws(()=>query('DPS500 反知','accessory.ring'));assert.throws(()=>query('DPS500 반지'));assert.ok(parse('마나 알수없는표현 반지').unknown);
});
test('no unverified or POE1-only category IDs leak into the catalog',()=>{
 for(const id of ['jewel.cluster','jewel.abyss','weapon.runedagger','tincture','heistmission.contract'])assert.ok(!D.categories.some(c=>c.id===id),id);
 for(const c of D.categories.filter(c=>!c.id.startsWith('weapon')&&c.id!=='__all__'))assert.ok(c.source);
 assert.ok(snapshot.excludedItems.some(x=>x.class==='QuestItem'));
});
test('every dedicated field can be serialized for a supported category and requires an explicit number',()=>{
 for(const field of snapshot.fields){const cat=field.categories[0];assert.ok(cat,field.key);const m={raw:'',categoryId:cat,conditions:[{key:field.key,min:0,max:40}],ambiguities:[],errors:[],unknown:''};assert.deepEqual(E.buildQuery(m,D).filters[field.group].filters[field.id],{min:0,max:40});assert.throws(()=>E.buildQuery({...m,conditions:[{key:field.key}]},D));}
});
test('uncut gems use the actual base type plus gem-level field, never a synthetic bulk display name',()=>{
 let q=query('미가공 스킬 젬 (20레벨)');assert.equal(q.type,'Uncut Skill Gem');assert.deepEqual(q.filters.misc_filters.filters.gem_level,{min:20,max:20});
 q=query('미가공 스킬 젬 젬레벨18');assert.equal(q.type,'Uncut Skill Gem');assert.equal(q.filters.misc_filters.filters.gem_level.min,18);
 assert.throws(()=>query('미가공 스킬 젬 (20레벨) 젬레벨21'));
});
