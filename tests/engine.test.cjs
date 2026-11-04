const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../docs/engine.js');const ctx={window:{}};vm.runInNewContext(fs.readFileSync('docs/data.js','utf8'),ctx);const data=Array.from(ctx.window.MOD_DATA);
for(const lo of [0,1,9,10,15,30,99,100,101,999,1000,9999]){const re=new RegExp('^'+E.numRange(lo)+'$');for(let n=0;n<10010;n++)assert.equal(re.test(String(n)),n>=lo&&n<=9999,`threshold ${lo} input ${n}`);}
const config=(rows,mode='all',custom=[])=>({rows,mode,custom,normalization:'NFD',limit:250});
let pass=0;
for(const d of data){const c=config([{id:d.id,min:'',exclude:false}]),r=E.build(c,data);assert.ok(E.evaluate(r,d.example,'NFD','all').matched,d.label);assert.ok(!E.evaluate(r,'검색할 내용 없음','NFD','all').matched,d.label);pass++;}
const life=data.find(d=>d.label==='생명력 최대치 +#'),cold=data.find(d=>d.label==='냉기 저항 +#%');
let r=E.build(config([{id:life.id,min:'100',exclude:false},{id:cold.id,min:'',exclude:true}]),data);
assert.equal(E.evaluate(r,'생명력 최대치 +130','NFD','all').matched,true);
assert.equal(E.evaluate(r,'생명력 최대치 +99','NFD','all').matched,false);
assert.equal(E.evaluate(r,'생명력 최대치 +130\n냉기 저항 +30%','NFD','all').matched,false);
r=E.build(config([{id:life.id,min:'',exclude:false},{id:cold.id,min:'',exclude:false}],'any'),data);assert.equal(E.evaluate(r,'냉기 저항 +30%','NFD','any').matched,true);
r=E.build(config([], 'all', [{text:'냉기 (강화)',exclude:false}]),data);assert.equal(E.evaluate(r,'냉기 (강화)','NFD','all').matched,true);assert.equal(E.evaluate(r,'냉기 강화','NFD','all').matched,false);
assert.throws(()=>E.build(config([{id:life.id,min:'-1'}]),data));
r=E.build({...config([]),custom:[{text:'아'.repeat(150),exclude:false}],limit:50},data);assert.ok(r.over);assert.ok(r.length>50);
console.log(`PASS: 12 thresholds × 10010 values, ${pass} catalog patterns, AND/OR/exclusion, numeric boundary, literal escaping, length guard.`);
console.log('life >=100 query length',E.build(config([{id:life.id,min:'100'}]),data).length);
