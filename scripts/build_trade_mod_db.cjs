'use strict';
// node scripts/build_trade_mod_db.cjs RAW_FOLDER [--check]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),raw=path.resolve(process.argv[2]||'../trade-db-raw');
const read=n=>JSON.parse(fs.readFileSync(path.join(raw,n+'.json'),'utf8'));
(async()=>{
 const M=await import('./trade-db/matchStatIds.mjs'),B=await import('./trade-db/buildEligibility.mjs');
 const bases=read('base_items'),mods=read('mods'),byBase=read('mods_by_base');
 const expected={base_items:'0f8ec99e4226ef705276bfc741a10a13ae2bfe0f',mods:'d542147523db97a8cac28c266ee5f507dff7c6d7',mods_by_base:'342bf790196f6e33af7495f9f2d12a3f985cd43b'};
 for(const [name,sha]of Object.entries(expected)){const bytes=fs.readFileSync(path.join(raw,name+'.json')),actual=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');if(actual!==sha)throw Error('Unreviewed source: '+name);}
 const D=require('../docs/trade-market')(require('../docs/trade-ko')(require('../docs/trade-extra')(structuredClone(require('../docs/trade-data')))));require('../docs/trade-catalog').extend(D);
 const F=JSON.parse(fs.readFileSync(path.join(raw,'../trade-tier-source.json'),'utf8'));
 const stats=new Map(D.stats.map(s=>[s.id,{id:s.id,text:s.nameEn||s.name,type:s.type}]));for(const s of F.stats)stats.set(s.id,{id:s.id,text:s.text,type:s.type});
 const index=M.buildTradeStatIndex([...new Set([...stats.values()].map(s=>s.type))].map(id=>({id,entries:[...stats.values()].filter(s=>s.type===id)})));
 const ko=fs.readFileSync(path.join(raw,'ko-stats.ndjson'),'utf8').trim().split('\n').map(JSON.parse),internal=new Map(ko.map(s=>[s.id,s]));
 const known=new Map(D.stats.map(s=>[s.id,s]));
 const pobBases={};for(const file of fs.readdirSync(path.join(raw,'pob-bases')).filter(x=>x.endsWith('.json')))Object.assign(pobBases,JSON.parse(fs.readFileSync(path.join(raw,'pob-bases',file),'utf8')));
 const localVariants=M.buildLocalVariantIndex(index);
 const templateRows=[...stats.values()].filter(s=>['explicit','implicit','skill'].includes(s.type)).map(s=>{const text=s.text.replace(/ \(Local\)$/,'');const pattern=text.split('#').map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('([+-]?\\d+(?:\\.\\d+)?)');return{s,regex:new RegExp('^'+pattern+'$'),slots:(text.match(/#/g)||[]).length};});
 function resolve(text,slot,local,min,max){const order=slot==='implicit'||slot==='corrupted'?['implicit','explicit']:['explicit','implicit'];return M.resolveTradeStatId(index,order,M.normalizeRepoeText(text,min,max),local);}
 function visibleRange(text,rawStats){const ranges=[...text.matchAll(/\((-?\d+(?:\.\d+)?)(?:-(-?\d+(?:\.\d+)?))?\)/g)].map(m=>{const a=Number(m[1]),b=Number(m[2]??m[1]);return[Math.min(a,b),Math.max(a,b)];});if(ranges.length===1&&rawStats.length===1)return ranges[0];if(ranges.length===2&&rawStats.length===2)return[(ranges[0][0]+ranges[1][0])/2,(ranges[0][1]+ranges[1][1])/2];if(rawStats.length===1&&rawStats[0].min===rawStats[0].max)return[rawStats[0].min,rawStats[0].max];if(rawStats.length===2&&rawStats.every(s=>s.min===s.max))return[(rawStats[0].min+rawStats[1].min)/2,(rawStats[0].max+rawStats[1].max)/2];return null;}
 const rows={},missing=new Set();
 function modRow(id){if(rows[id])return rows[id];const m=mods[id];if(!m?.text)return null;
  let resolved=resolve(m.text,m.generation_type,m.stats.some(s=>M.isLocalRepoeStatId(s.id)),m.stats[0]?.min,m.stats[0]?.max),range=visibleRange(m.text,m.stats);if(!resolved){const clean=M.normalizeRepoeText(m.text),matches=templateRows.filter(t=>t.regex.test(clean)),preferred=matches.find(t=>t.s.type===(m.generation_type==='implicit'?'implicit':'explicit')&&t.s.text.includes('(Local)')===m.stats.some(s=>M.isLocalRepoeStatId(s.id)))||matches.find(t=>t.s.type===(m.generation_type==='implicit'?'implicit':'explicit'));if(preferred)resolved=preferred.s;}
  if(resolved?.id&&m.domain==='desecrated'){const key='desecrated.'+resolved.id.split('.')[1];if(known.has(key))resolved={...resolved,id:key};else resolved=null;}
  if(resolved&&!known.has(resolved.id))resolved=null;const stat=resolved&&known.get(resolved.id);
  const numeric=!!resolved&&!!range&&stat&&!stat.numericUnsupported&&((m.stats.length===1&&(stat.nameEn?.match(/#/g)||[]).length===1)||(m.stats.length===2&&stat.rangeStat));
  const source=m.domain==='desecrated'?'Desecrated':m.generation_type==='prefix'||m.generation_type==='suffix'?'Base':{implicit:'Implicit',corrupted:'Corrupted',essence:'Essence',unique:'Unique'}[m.generation_type]||'Other';
  const row={id,statId:resolved?.id||null,text:m.text,source,slot:m.generation_type,family:m.type||m.groups.join('|'),requiredLevel:m.required_level,range:numeric?range:null,rangeStat:!!stat?.rangeStat};
  // A hybrid's individual stats still belong to this base. Only exact internal
  // IDs with a verified trade mapping are admitted; no substring ID guessing.
  if(!resolved&&m.stats.length>1){row.components=[];for(const s of m.stats){const k=internal.get(s.id);if(!k)continue;const ids=k.trade?.ids?.explicit||[],candidate=ids.map(id=>stats.get(id)).filter(Boolean).find(x=>x.text.includes('(Local)')===M.isLocalRepoeStatId(s.id))||ids.map(id=>stats.get(id)).find(Boolean);if(candidate&&known.has(candidate.id))row.components.push(candidate.id);}}
  if(!row.statId&&!row.components?.length)missing.add(id);rows[id]=row;return row;
 }
 const poolLookup=new Map(),poolRecords={},baseRecords={},categoryBases={};
 const poolEntries=new Map();for(const cls of Object.values(byBase))for(const [tags,entry]of Object.entries(cls))poolEntries.set(tags,entry);
 const rawByName=new Map();for(const [id,b]of Object.entries(bases)){if(!b.name)continue;const a=rawByName.get(b.name)||[];a.push({id,...b});rawByName.set(b.name,a);}
 const residual=B.buildResidualMods(mods,B.collectCoveredModIds(B.flattenModsByBase(byBase)));
 for(const item of D.catalog.items.filter(x=>!x.unique)){
  let choices=rawByName.get(item.nameEn)||[];if(choices.length>1){const preferred=choices.filter(b=>b.release_state==='released');if(preferred.length)choices=preferred;}
  if(!choices.length)continue;
  const signatures=new Set(choices.map(b=>JSON.stringify([b.tags,b.implicits,b.properties,b.requirements])));if(signatures.size!==1)continue;const b=choices[0],p=poolEntries.get(b.tags.join(','));
  const normal=p?[...new Set(Object.values(p.mods||{}).flatMap(g=>Object.values(g).flatMap(Object.keys)))].filter(id=>mods[id]?.generation_type!=='unique'):[];
  const extra=B.residualEligibleModIdsForBase(b,residual).filter(id=>mods[id]?.domain==='desecrated');
  const ids=[...new Set([...normal,...extra,...(b.implicits||[])])].sort(),conditional=[...new Set((Array.isArray(p?.conditional_mods)?p.conditional_mods:[]).filter(id=>!ids.includes(id)))].sort();for(const id of [...ids,...conditional])modRow(id);
  const signature=ids.join('|')+';conditional:'+conditional.join('|');let pool=poolLookup.get(signature);if(!pool){pool='p'+poolLookup.size;poolLookup.set(signature,pool);poolRecords[pool]={mods:ids.filter(id=>rows[id]),conditionalMods:conditional.filter(id=>rows[id])};}
  baseRecords[item.nameEn]={name:item.nameEn,categoryId:item.category,class:b.item_class,pool,properties:b.properties,pob:pobBases[item.nameEn]||null,requirements:b.requirements,implicits:b.implicits||[],tags:b.tags};(categoryBases[item.category]??=[]).push(item.nameEn);
 }
 const uniqueRecords={};
 for(const file of fs.readdirSync(path.join(raw,'uniques')).filter(x=>x.endsWith('.json'))){for(const block of JSON.parse(fs.readFileSync(path.join(raw,'uniques',file),'utf8'))){const lines=block.trim().split('\n'),name=lines[0],items=D.catalog.items.filter(x=>x.unique&&x.nameEn===name);if(!items.length)continue;const variants=lines.filter(x=>x.startsWith('Variant: ')).map(x=>x.slice(9)),current=variants.findIndex(x=>/^Current$/i.test(x))+1;let count=0,implicitCount=0;const out=[];
  for(let line of lines.slice(2)){if(/^Implicits: \d+$/.test(line)){implicitCount=Number(line.split(' ')[1]);count=0;continue;}if(/^(?:Has Alt Variant|Selected(?: Alt)? Variant|Allow Duplicate Variants|Requires Level)/.test(line))continue;if(!line.trim()||/^(League|Source|Variant|Requires|Selected Variant|Has Alt|Sockets|Quality|Catalyst|Radius|Limited to|LevelReq|Crafted|Corrupted|Unreleased|Shaper|Elder|Crusader|Redeemer|Hunter|Warlord):/.test(line))continue;
   const variant=line.match(/^\{variant:([\d,]+)\}/);if(variant&&current&&!variant[1].split(',').includes(String(current)))continue;line=line.replace(/^(?:\{[^}]+\})+/,'');
   const slot=count++<implicitCount?'implicit':'unique';let resolved=resolve(line,slot,false),range=visibleRange(line,[{min:NaN,max:NaN}]);
   if(!resolved){const clean=M.normalizeRepoeText(line);const matches=templateRows.filter(t=>t.regex.test(clean));const preferred=matches.find(t=>t.s.type===(slot==='implicit'?'implicit':'explicit'))||matches[0];if(preferred){resolved=preferred.s;const values=preferred.regex.exec(clean).slice(1).map(Number);if(values.length===1)range=[values[0],values[0]];}}
   if(resolved){const local=localVariants.get(resolved.id);if(local&&items.some(item=>{const b=baseRecords[item.type];return b&&poolRecords[b.pool].mods.some(id=>rows[id]?.statId===local);}))resolved=stats.get(local)||resolved;}
   if(resolved&&!known.has(resolved.id))resolved=null;const s=resolved&&known.get(resolved.id);
   out.push({statId:resolved?.id||null,text:line,source:slot==='implicit'?'Implicit':'Unique',slot,range:s&&!s.numericUnsupported&&(s.nameEn?.match(/#/g)||[]).length===1?range:null});
  }
  uniqueRecords[name]={rows:out};
 }}
 const supplements=JSON.parse(fs.readFileSync(path.join(root,'scripts/trade-db/unique-supplement.json'),'utf8'));
 for(const u of supplements){if(u.status!=='ok'||uniqueRecords[u.name])continue;const items=D.catalog.items.filter(x=>x.unique&&x.nameEn===u.name),out=[];for(const row of u.rows){let resolved=resolve(row.text,row.slot,false),range=visibleRange(row.text,[{min:NaN,max:NaN}]);if(!resolved){const clean=M.normalizeRepoeText(row.text),matches=templateRows.filter(t=>t.regex.test(clean)),preferred=matches.find(t=>t.s.type===(row.slot==='implicit'?'implicit':'explicit'))||matches[0];if(preferred){resolved=preferred.s;const vals=preferred.regex.exec(clean).slice(1).map(Number);if(vals.length===1)range=[vals[0],vals[0]];}}if(resolved){const local=localVariants.get(resolved.id);if(local&&items.some(item=>{const b=baseRecords[item.type];return b&&poolRecords[b.pool].mods.some(id=>rows[id]?.statId===local);}))resolved=stats.get(local)||resolved;}if(resolved&&!known.has(resolved.id))resolved=null;const st=resolved&&known.get(resolved.id);out.push({statId:resolved?.id||null,text:row.text,source:row.slot==='implicit'?'Implicit':'Unique',slot:row.slot,range:st&&!st.numericUnsupported&&(st.nameEn?.match(/#/g)||[]).length===1?range:null});}uniqueRecords[u.name]={rows:out,url:u.url};}
 const data={checkedAt:'2026-11-05',version:'0.5.5.5',repoeCommit:'fbffebf2bd2a0ebc46dcf5b0b3640f94fb2677f6',pobCommit:'f49119fd4f5f7434f7c4910527e0a52448fe4b99',bases:baseRecords,pools:poolRecords,mods:rows,uniques:uniqueRecords,categoryBases,coverage:{bases:Object.keys(baseRecords).length,pools:Object.keys(poolRecords).length,mods:Object.keys(rows).length,unmappedMods:missing.size,uniques:Object.keys(uniqueRecords).length}};
 const compressed=zlib.gzipSync(JSON.stringify(data)).toString('base64'),code=`/* Generated exact-base mod pools and DB roll ranges. See TRADE_MOD_DB.md. */\n(function(root){const encoded=${JSON.stringify(compressed)};if(typeof module!=='undefined'&&module.exports)module.exports=JSON.parse(require('node:zlib').gunzipSync(Buffer.from(encoded,'base64')).toString());else root.TradeCatalogReady=Promise.resolve(root.TradeCatalogReady).then(async()=>{const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));root.TradeData.modDb=JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text());});})(typeof window!=='undefined'?window:globalThis);\n`;
 const target=path.join(root,'docs/trade-mod-data.js');if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==code)throw Error('Generated mod DB is stale');}else fs.writeFileSync(target,code);
 fs.writeFileSync(path.join(root,'../trade-mod-coverage.json'),JSON.stringify(data.coverage,null,2));console.log(data.coverage,'compressed',code.length);
})().catch(e=>{console.error(e);process.exitCode=1;});
