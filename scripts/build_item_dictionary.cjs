'use strict';
// Name-only projection of the same pinned POE2 database used by the trade tool.
// node scripts/build_item_dictionary.cjs PATH/TO/items.ndjson [--check]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),source=process.argv[2];
if(!source)throw Error('Provide the pinned renderer/public/data/ko/items.ndjson file.');
const bytes=fs.readFileSync(source),sha=crypto.createHash('sha256').update(bytes).digest('hex');
if(sha!=='66171815f015812419419d009f0aed5e37e73a54249b28b08f8dfcffa44c7233')throw Error('Source differs from the reviewed snapshot. Review provenance before updating the hash.');
const raw=bytes.toString('utf8').trim().split('\n').map(JSON.parse),catalog=require('../docs/trade-catalog').snapshot;
const byKey=new Map(catalog.items.map(x=>[x.key,x])),categories=new Map(catalog.categories.map(c=>[c.id,c])),groups=new Map(catalog.groups.map(g=>[g.id,g.name]));
const rows=new Map();
for(const x of raw){
 if(!x.name||!x.refName)continue;
 const key=x.refName+'|'+(x.unique?.base||''),matched=byKey.get(key),cat=categories.get(matched?.category),group=groups.get(cat?.group==='all'?'other':cat?.group)||'기타';
 if(rows.has(key)){const old=rows.get(key);if(old.ko!==x.name&&!old.alternateKo.includes(x.name))old.alternateKo.push(x.name);continue;}
 const itemClass=matched?.itemClass||x.craftable?.category||'',unique=x.namespace==='UNIQUE';
 const type=unique?'unique':x.namespace==='GEM'?'gem':['weapon','armour','accessory','jewel','flask'].includes(cat?.group)?'base':cat?.group==='currency'?'currency':'other';
 rows.set(key,{id:key,name:x.refName,ko:x.name,alternateKo:[],group,type,category:cat?.name||'기타 · 분류 미확인',categoryId:matched?.category||null,base:x.unique?.base||'',baseKo:matched?.baseKo||'',itemClass,aliases:matched?.aliases||[],categoryAliases:cat?.aliases||[],status:matched?'DB 명칭 · 현재 매물·출시 여부 별도 확인':'DB 명칭 · 분류·현재 사용 여부 미확인'});
}
const data={checkedAt:'2026-11-05',snapshotAt:'2026-09-06',sourceCommit:'cca30662bf31eaf38bd711e2ec1a6b899a06c40e',sourceSha256:sha,rawRows:raw.length,namedRows:raw.filter(x=>x.name&&x.refName).length,items:[...rows.values()],sources:{itemdb:{title:'POE2 아이템 DB · 한국어/영문 이름',type:'아이템 DB',url:'https://github.com/Kvan7/Exiled-Exchange-2/blob/cca30662bf31eaf38bd711e2ec1a6b899a06c40e/renderer/public/data/ko/items.ndjson'},itemcategories:{title:'POE2 아이템 분류 · 고정 자료',type:'분류 자료',url:'https://github.com/slickdomi/poe2-better-trade-filter/blob/ae8f72832392000ed6259d0d758bc8d8a3739c88/packages/web/src/data/filters.json'}},thirdPartyNotices:[fs.readFileSync(path.join(root,'docs/licenses/trade-ko-MIT.txt'),'utf8'),fs.readFileSync(path.join(root,'docs/licenses/trade-data-MIT.txt'),'utf8')]};
const encoded=zlib.gzipSync(JSON.stringify(data)).toString('base64');
const output=`/* Generated name-only POE2 DB. See scripts/build_item_dictionary.cjs. */\n(function(root){'use strict';const encoded=${JSON.stringify(encoded)};if(typeof module!=='undefined'&&module.exports)module.exports=JSON.parse(require('node:zlib').gunzipSync(Buffer.from(encoded,'base64')).toString('utf8'));else root.ItemDictionaryReady=(async()=>{if(typeof DecompressionStream==='undefined')throw Error('아이템 DB를 열려면 최신 브라우저가 필요해요.');const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));return JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text());})();})(typeof window!=='undefined'?window:globalThis);\n`;
const target=path.join(root,'docs/item-dictionary-data.js');
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==output)throw Error('Generated dictionary is stale.');}else fs.writeFileSync(target,output);
console.log(`${data.items.length} unique DB names from ${data.namedRows} named rows; ${Buffer.byteLength(output)} bytes`);
