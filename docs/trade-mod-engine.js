/* Exact-base DB scope and tier-to-value translation; no live API calls. */
(function(root){'use strict';
const sourceNames={Base:'일반 부여',Implicit:'고정 속성',Corrupted:'타락',Desecrated:'훼손',Essence:'에센스',Unique:'고유 고정 옵션',Other:'기타',Conditional:'조건부 부여'};
const slots={prefix:'접두',suffix:'접미',implicit:'고정',corrupted:'타락',unique:'고유',essence:'에센스'};
const caches=new WeakMap();
function itemFor(model,D){return D.catalog?.items.find(x=>x.key===model.itemId);}
function context(model,D){
 if(!D.modDb)return{known:false,exact:false,rows:[],ids:new Set(),bases:[],item:null,unmapped:0};
 let cache=caches.get(D);if(!cache){cache=new Map();caches.set(D,cache);}const key=model.categoryId+'|'+(model.itemId||'');if(cache.has(key))return cache.get(key);
 const db=D.modDb,item=itemFor(model,D);let bases=[],rows=[],known=false;
 if(item?.unique){const u=db.uniques[item.nameEn];known=!!u;rows=u?.rows||[];const b=db.bases[item.type];if(b)bases=[b];}
 else if(item){const b=db.bases[item.type]||db.bases[item.nameEn];if(b){bases=[b];known=true;}}
 else{bases=Object.values(db.bases).filter(b=>model.categoryId==='__all__'||b.categoryId===model.categoryId||b.categoryId.startsWith(model.categoryId+'.'));known=bases.length>0;}
 if(!item?.unique){const ids=[...new Set(bases.flatMap(b=>db.pools[b.pool]?.mods||[]))];rows=ids.map(id=>db.mods[id]).filter(Boolean);const conditional=[...new Set(bases.flatMap(b=>db.pools[b.pool]?.conditionalMods||[]))].filter(id=>!ids.includes(id));rows.push(...conditional.map(id=>db.mods[id]?{...db.mods[id],source:'Conditional'}:null).filter(Boolean));}
 const ids=new Set(rows.flatMap(r=>[r.statId,...(r.components||[])].filter(Boolean))),value={known,exact:!!item,unique:!!item?.unique,item,bases,rows,ids,unmapped:rows.filter(r=>!r.statId&&!r.components?.length).length};cache.set(key,value);return value;
}
function propertyKeys(model,D){if(/^(gem|map|sanctum|currency)(\.|$)/.test(model.categoryId))return null;const c=context(model,D);if(!c.known)return null;const keys=new Set(),add=(g,id)=>keys.add(g+'.'+id);
 for(const b of c.bases){const p=b.properties||{},pb=b.pob||{},armour=pb.armour||{};
  for(const [id,raw,key]of [['ar','armour','Armour'],['ev','evasion','Evasion'],['es','energy_shield','EnergyShield'],['ward','ward','Ward'],['block','block','BlockChance']])if(p[raw]!=null||armour[key]!=null)add('equipment_filters',id);
  if(p.attack_time!=null||pb.weapon?.AttackRateBase!=null)for(const id of ['damage','aps','crit','dps','pdps','edps'])add('equipment_filters',id);
  if(pb.weapon&&Object.keys(pb.weapon).some(k=>/reload/i.test(k)))add('equipment_filters','reload_time');
  if(pb.socketLimit>0)add('equipment_filters','rune_sockets');
  if(pb.spirit>0)add('equipment_filters','spirit');
  if(Object.hasOwn(pb,'quality'))add('type_filters','quality');
  if(b.categoryId&&!b.categoryId.startsWith('currency'))add('type_filters','ilvl');
  const r=b.requirements||{},pr=pb.req||{};if(r.level||pr.level||c.rows.length)add('req_filters','lvl');for(const [id,raw]of [['str','strength'],['dex','dexterity'],['int','intelligence']])if(r[raw]>0||pr[id]>0)add('req_filters',id);
 }
 if(c.ids.has('explicit.stat_3981240776')||c.ids.has('implicit.stat_3981240776'))add('equipment_filters','spirit');
 return keys;
}
function propertyAllowed(d,model,D){const keys=propertyKeys(model,D);return keys===null?null:keys.has((d.group||'equipment_filters')+'.'+d.id);}
function idFor(key,D){return D.curated.find(x=>x.key===key)?.id||key;}
function groups(key,model,D){const c=context(model,D),id=idFor(key,D);if(!c.known||!c.exact||c.unique)return[];
 const map=new Map();for(const row of c.rows){if(row.statId!==id||!row.range||!['Base','Conditional'].includes(row.source)||!['prefix','suffix'].includes(row.slot))continue;const k=row.source+'|'+row.slot+'|'+row.family;const a=map.get(k)||[];a.push(row);map.set(k,a);}
 return[...map].map(([key,rows])=>{const distinct=[...new Map(rows.map(r=>[JSON.stringify([r.requiredLevel,r.range]),r])).values()].sort((a,b)=>b.requiredLevel-a.requiredLevel||b.range[1]-a.range[1]||a.id.localeCompare(b.id));return{key,label:(sourceNames[distinct[0].source]||distinct[0].source)+' · '+(slots[distinct[0].slot]||'옵션'),rows:distinct.map((r,i)=>({...r,tier:i+1})),source:distinct[0].source};});
}
function choose(key,model,D,choice){if(!choice||!['range','atLeast'].includes(choice.mode))throw Error('DB 등급 선택을 확인하세요.');if(choice.itemId!==model.itemId)throw Error('아이템이 바뀌었어요. DB 등급을 다시 선택하세요.');const group=groups(key,model,D).find(g=>g.key===choice.group),row=group?.rows.find(r=>r.id===choice.modId);if(!row)throw Error('이 아이템에서 확인된 DB 등급이 아니에요.');const min=row.range[0],max=choice.mode==='range'?row.range[1]:undefined;return{min,max,tierChoice:{itemId:model.itemId,group:group.key,modId:row.id,mode:choice.mode},label:'DB T'+row.tier+' · '+(choice.mode==='range'?'해당 수치 범위':'이상 수치'),requiredLevel:row.requiredLevel};}
function badge(row,model,D){if(!row.tierChoice)return'';try{const selected=choose(row.key,model,D,row.tierChoice);return selected.min===row.min&&selected.max===row.max?selected.label+' · 실제 접사 등급 확정 아님':'';}catch{return'';}}
function provenance(key,model,D){const id=idFor(key,D),c=context(model,D);return[...new Set(c.rows.filter(r=>r.statId===id||r.components?.includes(id)).map(r=>(sourceNames[r.source]||r.source)+(slots[r.slot]?' · '+slots[r.slot]:'')))].join(' / ');}
const api={context,propertyKeys,propertyAllowed,groups,choose,badge,provenance,idFor,sourceNames,slots};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TradeModEngine=api;
})(typeof window!=='undefined'?window:globalThis);
