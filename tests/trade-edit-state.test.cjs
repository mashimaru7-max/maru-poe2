'use strict';
const assert=require('node:assert/strict');
const E=require('../docs/trade-engine');
const before=[{key:'fire',min:40},{key:'life',min:100}];
const edits={fire:{min:50},life:{min:120}};
// Changing an unrelated clause must not discard a row's applied value.
assert.deepEqual(E.reconcileEdits(before,[{key:'fire',min:40},{key:'life',min:110}],[],edits,[]),{overrides:{fire:{min:50}},excluded:[]});
// Removing a text clause must not resurrect it through the override map.
assert.deepEqual(E.reconcileEdits(before,[{key:'life',min:100}],[],edits,['fire']),{overrides:{life:{min:120}},excluded:[]});
// An unchanged, explicitly deleted text clause remains deleted.
assert.deepEqual(E.reconcileEdits(before,before,[],{},['fire']),{overrides:{},excluded:['fire']});
// Directly added rows retain their independent edits during text changes.
assert.deepEqual(E.reconcileEdits(before,before,[{key:'mana'}],{mana:{min:70}},[]),{overrides:{mana:{min:70}},excluded:[]});
// Zero and presence-only constraints have distinct meanings.
assert.deepEqual(E.reconcileEdits([{key:'mana',min:0}],[{key:'mana'}],[],{mana:{min:20}},[]),{overrides:{},excluded:[]});
console.log('PASS 5 trade edit-state regressions');
