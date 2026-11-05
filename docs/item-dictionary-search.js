/* Display/search projection only: original filter IDs and trade queries are unchanged. */
(function(root){'use strict';
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[\s\u200b]+/gu,'').replace(/[’‘]/g,"'").replace(/쥬/g,'주');
const typeNames={unique:'고유 아이템',base:'장비 베이스',gem:'젬',currency:'화폐·재료',other:'기타 아이템',family:'분류 검색'};
const itemAliases=typeof module!=='undefined'&&module.exports?require('./item-aliases'):root.ItemNameAliases;
function create(currency,db){
 const sources={...currency.sources,...db.sources,projectaliases:{title:'공방의 아이템 검색 보조 별칭',type:'검색 보조 규칙',url:'https://github.com/mashimaru7-max/maru-poe2/blob/d8e5b85c8dba82faef869581d759a6dcdb3c7ede/scripts/build_trade_catalog.py'}},currencyByName=new Map(currency.entries.filter(x=>x.kind==='item').map(x=>[normalize(x.name),x])),covered=new Set();
 const items=db.items.map(x=>{const old=currencyByName.get(normalize(x.name));if(old)covered.add(normalize(x.name));const aliases=(old?.aliases||[]).map(a=>({...a,sources:[...a.sources]}));
  for(const [text,refs]of [...x.aliases.map(text=>[text,['projectaliases']]),...x.alternateKo.map(text=>[text,['itemdb']]),...(old&&normalize(old.ko)!==normalize(x.ko)?[[old.ko,old.nameSources]]:[])])if(!aliases.some(a=>normalize(a.text)===normalize(text)))aliases.push({text,kind:'검색 보조',sources:refs});
  return{...x,group:old?.group||x.group,kind:'item',nameSources:[...new Set(['itemdb','itemcategories',...(old?.nameSources||[])])],nameStatus:old?.nameStatus||'',aliases};
 });
 for(const old of currency.entries)if(old.kind==='family'||!covered.has(normalize(old.name)))items.push({...old,id:'currency:'+old.name,type:old.kind==='family'?'family':'currency',category:old.group,base:'',baseKo:'',categoryAliases:[],alternateKo:[],status:old.kind==='family'?'검색용 분류 묶음':'재화 사전 보완 항목 · DB 미수록'});
 Object.assign(sources,itemAliases.sources);
 for(const e of items){
  const curated=itemAliases.entries.find(x=>normalize(x.name)===normalize(e.name));
  for(const a of curated?.aliases||[]){const old=e.aliases.find(x=>normalize(x.text)===normalize(a.text));if(old){if(a.kind==='사용례 확인')Object.assign(old,{...a,sources:[...new Set([...old.sources,...a.sources])]});}else e.aliases.push({...a,sources:[...a.sources]});}
  const initials=e.type==='unique'?itemAliases.wordInitials(e.ko):null;
  if(initials&&!e.aliases.some(a=>normalize(a.text)===normalize(initials)))e.aliases.push({text:initials,kind:'검색 보조',sources:['itemHelpers'],method:'단어 첫 글자',generated:true});
 }
 items.sort((a,b)=>a.ko.localeCompare(b.ko,'ko')||a.name.localeCompare(b.name)||a.base.localeCompare(b.base));
 const compiled=items.map(e=>{const names=[e.ko,e.name,...e.alternateKo].map(normalize),aliases=e.aliases.filter(a=>!a.generated).map(a=>normalize(a.text)),initials=e.aliases.filter(a=>a.generated).map(a=>normalize(a.text)),identities=[...names,...aliases,...initials],categoryTerms=[e.category,e.group,e.itemClass,...e.categoryAliases].filter(Boolean).map(normalize),haystack=[...identities,e.ko.replace(/의 /g,' '),e.base,e.baseKo,typeNames[e.type],...categoryTerms].map(normalize).join('\n');return{e,names,aliases,initials,categoryTerms,haystack};});
 function lookup(query='',options={}){const q=normalize(query),tokens=String(query).trim().split(/\s+/u).map(normalize).filter(Boolean),pool=compiled.filter(({e})=>(!options.group||e.group===options.group)&&(!options.type||e.type===options.type)&&(!options.observedOnly||e.aliases.some(a=>a.kind==='사용례 확인')));if(!q)return pool.map(x=>x.e);const categoryQuery=pool.some(x=>x.categoryTerms.includes(q));let exact=[];if(!categoryQuery){exact=pool.filter(x=>x.names.includes(q)||x.aliases.includes(q));if(!exact.length)exact=pool.filter(x=>x.initials.includes(q));}return(exact.length?exact:pool.filter(x=>x.haystack.includes(q)||tokens.every(t=>x.haystack.includes(t)))).map(x=>x.e);}
 return{lookup,normalize,typeNames,data:{checkedAt:db.checkedAt,dbSnapshotAt:db.snapshotAt,dbCommit:db.sourceCommit,dbSourceSha256:db.sourceSha256,rawDbRows:db.rawRows,namedDbRows:db.namedRows,sources,thirdPartyNotices:[currency.thirdPartyNotice,...db.thirdPartyNotices],entries:items},stats:{items:items.filter(x=>x.kind==='item').length,dbItems:db.items.length,unique:items.filter(x=>x.type==='unique').length,groups:new Set(items.map(x=>x.group)).size,observed:items.flatMap(x=>x.aliases).filter(a=>a.kind==='사용례 확인').length}};
}
const api={create,normalize,typeNames};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ItemDictionarySearch=api;
})(typeof window!=='undefined'?window:globalThis);
