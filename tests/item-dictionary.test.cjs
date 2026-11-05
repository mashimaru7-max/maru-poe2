'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const currency=require('../docs/currency-aliases'),db=require('../docs/item-dictionary-data'),E=require('../docs/item-dictionary-search'),S=E.create(currency,db);
test('Mageblood shorthand, translated name, reading and English initials all find the correct belt',()=>{
 for(const q of ['마피','마 피','마법사의피','메이지블러드','MB','mageblood','마피 허리띠']){const rows=S.lookup(q);assert.equal(rows.length,1,q);assert.equal(rows[0].name,'Mageblood');assert.equal(rows[0].base,'Utility Belt');}
 assert.equal(S.lookup('마피',{observedOnly:true}).length,1);
});
test('every curated unique alias points to an existing DB name and all its base variants',()=>{
 const A=require('../docs/item-aliases');
 for(const entry of A.entries){const targets=db.items.filter(e=>e.name===entry.name);assert.ok(targets.length,entry.name);for(const alias of entry.aliases){const found=S.lookup(alias.text);for(const target of targets)assert.ok(found.some(e=>e.id===target.id),alias.text+' / '+target.id);assert.ok(found.every(e=>e.name===entry.name),alias.text);}}
});
test('word initials are labelled generated helpers, preserve ambiguity and never mutate the original currency aliases',()=>{
 const generated=S.data.entries.flatMap(e=>e.aliases.filter(a=>a.generated).map(a=>({id:e.id,text:a.text})));
 assert.ok(generated.length>500);const grouped=new Map();for(const r of generated){const keys=grouped.get(r.text)||new Set();keys.add(r.id);grouped.set(r.text,keys);}let tested=0;
 for(const [q,keys]of grouped){if(keys.size<2)continue;const found=S.lookup(q),matching=found.filter(e=>keys.has(e.id));if(matching.length===found.length){assert.equal(matching.length,keys.size,q);tested++;}}
 assert.ok(tested>0);assert.equal(S.lookup('별보')[0].name,'Astramentis');
 assert.ok(!currency.entries.some(e=>e.aliases.some(a=>a.generated)));
 assert.ok(S.data.entries.flatMap(e=>e.aliases).filter(a=>a.generated).every(a=>a.kind==='검색 보조'&&a.method==='단어 첫 글자'));
});
test('trade name input uses the same curated aliases, including Mageblood with a price',()=>{
 const T=require('../docs/trade-engine'),D=require('../docs/trade-market')(require('../docs/trade-ko')(require('../docs/trade-extra')(structuredClone(require('../docs/trade-data')))));require('../docs/trade-catalog').extend(D);require('../docs/trade-options')(D);
 for(const q of ['마피 5딥이하','MB 5딥이하','메이지블러드 5딥이하']){const m=T.parse(q,'__all__',D),request=T.buildQuery(m,D);assert.equal(request.name,'Mageblood');assert.equal(request.type,'Utility Belt');assert.equal(request.filters.trade_filters.filters.price.max,5);}
});
test('all 3895 unique DB names remain searchable by both languages and alternate Korean labels',()=>{
 assert.equal(db.items.length,3895);assert.equal(S.stats.items,3905);assert.equal(S.stats.unique,766);
 for(const e of db.items)for(const q of [e.ko,e.name,...e.alternateKo])assert.ok(S.lookup(q).some(x=>x.id===e.id),e.id+' / '+q);
 assert.equal(new Set(S.data.entries.map(x=>x.id)).size,S.data.entries.length);
});
test('Headhunter, Korean shorthand, spacing, English case, and combined category terms find the same unique',()=>{
 for(const q of ['헤헌','헤드헌터',' HeAdHuNtEr ','헤 드 헌 터','헤헌 허리띠','headhunter Heavy Belt']){const rows=S.lookup(q);assert.equal(rows.length,1,q);assert.equal(rows[0].name,'Headhunter');assert.equal(rows[0].baseKo,'무거운 허리띠');assert.equal(rows[0].type,'unique');}
});
test('all original currency aliases and family keys stay connected; precise shorthand does not widen tiers',()=>{
 for(const e of currency.entries)for(const a of e.aliases)assert.ok(S.lookup(a.text).some(x=>E.normalize(x.name)===E.normalize(e.name)),e.name+' / '+a.text);
 for(const [q,name]of [['미러','Mirror of Kalandra'],['딥','Divine Orb'],['완쥬',"Perfect Jeweller's Orb"],['상쥬',"Greater Jeweller's Orb"],['락',"Hinekora's Lock"]])assert.deepEqual(S.lookup(q).map(x=>x.name),[name]);
});
test('group, type and observed-usage controls intersect and category queries show more than a generic base',()=>{
 assert.equal(S.lookup('헤헌',{group:'무기'}).length,0);assert.equal(S.lookup('헤헌',{group:'장신구',type:'unique'}).length,1);
 assert.equal(S.lookup('헤헌',{observedOnly:true}).length,1);assert.equal(S.lookup('미러',{observedOnly:true}).length,1);
 assert.ok(S.lookup('반지').length>50);assert.ok(S.lookup('반지',{type:'unique'}).length>10);
 assert.equal(S.lookup('',{type:'unique'}).length,766);assert.ok(S.lookup('화염구',{type:'gem'}).some(x=>x.name==='Fireball'));
 for(const e of S.data.entries)assert.ok(S.lookup(e.ko,{group:e.group,type:e.type}).some(x=>x.id===e.id),e.id);
});
test('the merged export preserves provenance, licenses, DB snapshot and aliases without touching filter data',()=>{
 const copy=JSON.parse(JSON.stringify(S.data));assert.equal(copy.dbCommit,'cca30662bf31eaf38bd711e2ec1a6b899a06c40e');assert.equal(copy.entries.length,3915);assert.equal(copy.thirdPartyNotices.length,3);assert.ok(copy.thirdPartyNotices.every(s=>s.includes('MIT License')));
 for(const e of copy.entries)for(const id of [...e.nameSources,...e.aliases.flatMap(a=>a.sources)])assert.ok(copy.sources[id],id);
 assert.equal(currency.entries.length,683);assert.equal(currency.entries.filter(e=>e.kind==='item').length,673);
 assert.equal(S.lookup('<script>alert(1)</script>').length,0);
});
