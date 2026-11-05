'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../docs/trade-engine'),M=require('../docs/trade-mod-engine');
const D=require('../docs/trade-market')(require('../docs/trade-ko')(require('../docs/trade-extra')(structuredClone(require('../docs/trade-data')))));
require('../docs/trade-catalog').extend(D);require('../docs/trade-options')(D);D.modDb=require('../docs/trade-mod-data');
const model=name=>{const item=D.catalog.items.find(x=>x.nameEn===name);assert.ok(item,name);return{raw:'',categoryId:item.category,itemId:item.key,conditions:[],errors:[],ambiguities:[],unknown:''};};
test('exact bases use their actual DB mod pools; no global category union for selected names',()=>{
 const b=model('Crude Bow'),c=M.context(b,D);assert.ok(c.known&&c.exact);assert.ok(c.ids.has('explicit.stat_210067635'));assert.ok(!c.ids.has('explicit.stat_3981240776'));assert.ok(!c.ids.has('explicit.stat_681332047'));
 const ruby=M.context(model('Ruby'),D),time=M.context(model('Time-Lost Ruby'),D);assert.notDeepEqual([...ruby.ids].sort(),[...time.ids].sort());
});
test('properties come from actual base properties, not a word mention or armour-group guess',()=>{
 for(const [name,yes,no]of [['Crude Bow',['field_dps','sockets'],['field_spirit','es']],['Rattling Sceptre',['field_spirit'],['field_dps']],['Rusted Cuirass',['ar'],['es','ev']],['Broadhead Quiver',[],['sockets','field_dps']]]){const m=model(name);for(const key of yes)assert.equal(E.propertySuggested(E.definition(key,D),m,D),true,name+' '+key);for(const key of no)assert.equal(E.propertySuggested(E.definition(key,D),m,D),false,name+' '+key);}
});
test('a named unique shows its actual fixed options, not every normal mod for its belt category',()=>{
 const c=M.context(model('Headhunter'),D);assert.ok(c.ids.has('explicit.stat_3299347043'));assert.ok(!c.ids.has('explicit.stat_1050105434'));assert.equal(M.groups('life',model('Headhunter'),D).length,0);assert.equal(M.groups('life',{categoryId:'accessory.belt'},D).length,0);
});
test('bow and melee attack-speed ladders are distinct and translate DB T1 into the correct numbers',()=>{
 const bow=model('Crude Bow'),mace=model('Anvil Maul'),id='explicit.stat_210067635',a=M.groups(id,bow,D)[0],b=M.groups(id,mace,D)[0];assert.equal(a.rows.length,5);assert.deepEqual(a.rows[0].range,[17,19]);assert.equal(b.rows.length,8);assert.deepEqual(b.rows[0].range,[26,28]);
 const selected=M.choose(id,bow,D,{itemId:bow.itemId,group:a.key,modId:a.rows[0].id,mode:'range'});assert.equal(selected.min,17);assert.equal(selected.max,19);const request=E.buildQuery({...bow,conditions:[{key:id,...selected}]},D);assert.deepEqual(request.stats[0].filters[0],{id,value:{min:17,max:19}});assert.equal(request.type,'Crude Bow');assert.ok(!JSON.stringify(request).includes('tier'));assert.equal(request.filters.type_filters.filters.ilvl,undefined);
 const above=M.choose(id,bow,D,{...selected.tierChoice,mode:'atLeast'});assert.equal(above.min,17);assert.equal(above.max,undefined);
});
test('stale, different-item and invented tier choices are rejected; manual numeric changes remove the tier badge',()=>{
 const m=model('Crude Bow'),id='explicit.stat_210067635',g=M.groups(id,m,D)[0],c={itemId:m.itemId,group:g.key,modId:g.rows[0].id,mode:'range'},r=M.choose(id,m,D,c);assert.throws(()=>M.choose(id,model('Anvil Maul'),D,c));assert.throws(()=>M.choose(id,m,D,{...c,modId:'invented'}));assert.ok(M.badge({key:id,...r},m,D));assert.equal(M.badge({key:id,...r,min:18},m,D),'');
});
test('every offered tier belongs to the selected base, has finite visible values, and round-trips',()=>{
 let count=0;for(const name of Object.keys(D.modDb.bases)){const item=D.catalog.items.find(x=>!x.unique&&x.nameEn===name);if(!item)continue;const m=model(name),ctx=M.context(m,D);for(const id of ctx.ids){const def=E.definition(id,D);if(!def)continue;for(const group of M.groups(id,m,D))for(const row of group.rows){assert.ok(ctx.rows.some(x=>x.id===row.id));assert.ok(row.range.every(Number.isFinite));assert.ok(row.range[0]<=row.range[1],row.id);const c=M.choose(id,m,D,{itemId:m.itemId,group:group.key,modId:row.id,mode:'range'});assert.equal(c.min,row.range[0]);assert.equal(c.max,row.range[1]);count++;}}}assert.ok(count>10000,count);
});
