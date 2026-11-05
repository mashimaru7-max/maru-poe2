'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../docs/trade-engine'),D=require('../docs/trade-market')(require('../docs/trade-ko')(require('../docs/trade-extra')(structuredClone(require('../docs/trade-data')))));
require('../docs/trade-catalog').extend(D);require('../docs/trade-options')(D);
const fields=categoryId=>D.curated.filter(d=>d.kind==='property'&&E.propertySuggested(d,{categoryId},D)).map(d=>d.id);
test('bow default fields contain attack and item properties but omit inferred final Spirit',()=>{
 const ids=fields('weapon.bow');for(const id of ['damage','aps','crit','dps','pdps','edps','rune_sockets','ilvl','quality'])assert.ok(ids.includes(id),id);assert.ok(!ids.includes('spirit'));
});
test('final Spirit is suggested for sceptres and not inferred from arbitrary text on other categories',()=>{
 assert.ok(fields('weapon.sceptre').includes('spirit'));
 for(const c of ['weapon.crossbow','weapon.staff','weapon.warstaff','armour.helmet','armour.chest','accessory.amulet'])assert.ok(!fields(c).includes('spirit'),c);
 assert.ok(fields('weapon').includes('spirit'));assert.ok(fields('__all__').includes('spirit'));
});
test('an explicitly requested advanced Spirit query survives; presentation never deletes saved constraints',()=>{
 const d=E.definition('field_spirit',D),model=E.parse('최종정신력15 활','weapon.bow',D);
 assert.equal(E.propertyAllowed(d,model,D),true);assert.equal(E.propertySuggested(d,model,D),false);
 assert.deepEqual(E.buildQuery(model,D).filters.equipment_filters.filters.spirit,{min:15});
 assert.equal(E.definition('spirit',D).kind,'stat'); // explicit +Spirit remains distinct
});
test('all suggested properties remain supported by the underlying category scope',()=>{
 for(const c of D.categories)for(const d of D.curated.filter(d=>d.kind==='property'))if(E.propertySuggested(d,{categoryId:c.id},D))assert.equal(E.propertyAllowed(d,{categoryId:c.id},D),true,c.id+' '+d.id);
});
