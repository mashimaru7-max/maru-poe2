/* Original deterministic Korean trade-query parser. No network/API calls. */
(function(root){'use strict';
const number='[+-]?\\d+(?:\\.\\d+)?',escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function normalize(s){return String(s).normalize('NFKC').toLowerCase().replace(/(\d),(?=\d{3}(?:\D|$))/g,'$1').replace(/(\d)\s+(?=[+-]?\d)/g,'$1;').replace(/\s+/g,'').replace(/최대생명력/g,'생명력최대치').replace(/최대마나/g,'마나최대치');}
function definition(key,data){const curated=data.curated.find(s=>s.key===key);if(curated)return curated;const stat=data.stats.find(s=>s.id===key);if(!stat)return undefined;return{key,id:key,kind:'stat',name:stat.nameKo?(stat.nameKo+((stat.nameEn||'').includes('(Local)')?' (장비 자체)':'')):'한국어 문구 미확인',nameEn:stat.nameEn||stat.name,unit:(stat.nameEn||stat.name).includes('%')?'%':'',numericSlots:((stat.nameEn||stat.name).match(/#/g)||[]).length,detail:'직접 선택한 거래 옵션'};}
function mergeConditions(rows){const result=[],errors=[];for(const r of rows){const old=result.find(x=>x.key===r.key);if(!old)result.push({...r});else{if(r.min!==undefined)old.min=old.min===undefined?r.min:Math.max(old.min,r.min);if(r.max!==undefined)old.max=old.max===undefined?r.max:Math.min(old.max,r.max);}}for(const r of result){if(r.min!==undefined&&r.max!==undefined&&r.min>r.max)errors.push('최솟값이 최댓값보다 큰 조건: '+r.key);if([r.min,r.max].some(v=>v!==undefined&&(!Number.isFinite(v)||Math.abs(v)>100000000)))errors.push('수치 범위를 확인하세요: '+r.key);}return{conditions:result,errors};}
// Prefer the longest complete alias at each position. Korean catalog labels become
// candidates by exact trade ID; identical labels never select an arbitrary ID.
const lexicons=new WeakMap();
function lexicon(data){if(lexicons.has(data))return lexicons.get(data);const byAlias=new Map(),canonical=new Map(data.curated.map(d=>[d.id,d.key]));function add(alias,key){alias=normalize(alias);if(!alias||alias.length<2&&!data.curated.some(d=>d.key===key))return;const keys=byAlias.get(alias)||new Set();keys.add(key);byAlias.set(alias,keys);}for(const d of data.curated)for(const a of d.aliases)add(a,d.key);for(const d of data.stats){if(d.type!=='explicit'||!d.nameKo)continue;const key=canonical.get(d.id)||d.id,full=d.nameKo.replace(/[#%+]/g,'');for(const alias of new Set([full,full.replace(/증가\s*$/,'')])){const existing=byAlias.get(normalize(alias));if(existing&&[...existing].some(k=>data.curated.some(c=>c.key===k)))continue;add(alias,key);}}const names=[...byAlias.keys()].sort((a,b)=>b.length-a.length);const result={byAlias,names};lexicons.set(data,result);return result;}
function parse(raw,categoryId,data){
 if(typeof raw!=='string'||raw.length>1200)throw Error('입력은 1,200자 이하로 작성해 주세요.');
 let text=normalize(raw),conditions=[],ambiguities=[],errors=[];
 const aliases=data.categories.flatMap(c=>c.aliases.map(a=>({alias:normalize(a),id:c.id}))).sort((a,b)=>b.alias.length-a.alias.length);
 const protectedText=text.replace(new RegExp(lexicon(data).names.map(escape).join('|'),'g'),m=>' '.repeat(m.length));const found=[];text=text.replace(new RegExp(aliases.map(x=>escape(x.alias)).join('|'),'g'),(m,offset)=>{if(!protectedText.slice(offset,offset+m.length).trim())return m;found.push(aliases.find(a=>a.alias===m).id);return';'.repeat(m.length);});
 const unique=[...new Set(found)];if(unique.length>1)errors.push('장비 종류가 여러 개예요. 한 종류씩 검색해 주세요.');if(unique.length===1)categoryId=unique[0];if(!data.categories.some(c=>c.id===categoryId))errors.push('지원하는 장비 종류를 선택하세요.');
 let price=null;const currencyNames={'신성한오브':'divine','디바인':'divine','딥':'divine','엑잘티드오브':'exalted','엑잘티드':'exalted','엑잘':'exalted','엑':'exalted','카오스오브':'chaos','카오스':'chaos','카옵':'chaos'};
 const money=new RegExp('(최대|최소|<=|>=)?('+number+')('+Object.keys(currencyNames).sort((a,b)=>b.length-a.length).map(escape).join('|')+')(?!저항|저|피해|스킬)(이하|이상|까지|안쪽)?','g');
 text=text.replace(money,(all,prefix,n,currency,suffix)=>{const amount=Number(n),unit=currencyNames[currency];if(amount<0)errors.push('가격은 0 이상이어야 해요.');if(price&&price.currency!==unit)errors.push('화폐가 서로 다른 가격 조건을 함께 쓸 수 없어요.');price??={currency:unit};const bound=prefix==='최소'||prefix==='>='||suffix==='이상'?'min':'max';price[bound]=price[bound]===undefined?amount:bound==='min'?Math.max(price[bound],amount):Math.min(price[bound],amount);return';';});if(price&&price.min!==undefined&&price.max!==undefined&&price.min>price.max)errors.push('가격의 최소·최대가 서로 충돌해요.');
 const aggregate=new RegExp('(?<!원소)(저항종합|저항총합|저항합계|저항합산|저항총|총저항|종합저항|합산저항)('+number+')(%)?(이상|이하)?','g');
 text=text.replace(aggregate,(all,label,n,percent,suffix)=>{ambiguities.push({id:'aggregate-'+ambiguities.length,label:all,value:Number(n),bound:suffix==='이하'?'max':'min',choices:['totalElemental'],kind:'aggregate'});return';';});
 const dict=lexicon(data),bound='(최소|최대|>=|<=)?';
 // Units are separate tokens: 2렙 / 2레벨 / 2lv / +2 all mean the same level.
 const pattern=new RegExp(bound+'('+dict.names.map(escape).join('|')+')'+bound+'(?:('+number+')(?:[~～]('+number+'))?)?(%|레벨|렙|lv\\.?|level)?(이상|이하|까지|↑|↓)?(?:레벨|렙)?(?:옵션)?(?:이있는|있는|있음|유무만|유무|수치무관|수치상관없이|인|이고|이면서|이랑|랑)?','g');
 text=text.replace(pattern,(all,prefix,alias,middle,n,range,unit,suffix)=>{
  let keys=[...dict.byAlias.get(alias)];
  // The item category can disambiguate equal official names, but never invent a match.
  if(keys.length>1){const eligible=keys.filter(k=>{const d=definition(k,data);return d&&(d.kind==='property'?data.properties[categoryId]?.includes(d.id):data.eligibility[categoryId]?.includes(d.id));});if(eligible.length)keys=eligible;}
  const row={};const lower=prefix==='최소'||prefix==='>='||middle==='최소'||middle==='>='||suffix==='이상'||suffix==='↑',upper=prefix==='최대'||prefix==='<='||middle==='최대'||middle==='<='||suffix==='이하'||suffix==='까지'||suffix==='↓';
  if(lower&&upper)errors.push(alias+': 이상·이하 표현이 충돌해요.');
  if(n!==undefined){if(range!==undefined){row.min=Number(n);row.max=Number(range);if(prefix||middle||suffix)errors.push(alias+': 범위와 이상·이하를 중복하지 마세요.');}else row[upper?'max':'min']=Number(n);}else if(prefix||middle||suffix)errors.push(alias+': 비교할 수치를 입력해 주세요.');
  if(keys.length>1){ambiguities.push({id:'option-'+ambiguities.length,label:alias,choices:keys,kind:'option',bounds:row});return';';}
  const key=keys[0],stat=definition(key,data);row.key=key;
  if(unit==='%'&&stat.unit!=='%')errors.push(stat.name+': 최종 수치와 % 증가 옵션을 구분해 주세요.');
  if(unit&&unit!=='%'&&!/Level of|레벨/.test((stat.nameEn||'')+' '+stat.name))errors.push(stat.name+': 레벨 단위를 사용할 수 없는 옵션이에요.');
  if(stat.kind==='property'&&n===undefined)errors.push(stat.name+': 장비 최종 수치에는 최소 또는 최대 수치가 필요해요.');
  if(stat.kind==='property'&&n!==undefined&&Number(n)<0)errors.push(stat.name+'은 0 이상이어야 해요.');
  if(stat.numericSlots===0&&n!==undefined)errors.push(stat.name+': 수치가 없는 옵션이에요. 옵션 이름만 입력해 주세요.');
  if(stat.numericSlots>1&&n!==undefined)errors.push(stat.name+': 여러 수치가 있는 옵션이에요. 목록에서 정확한 옵션과 검색 수치를 확인해 주세요.');
  conditions.push(row);return';';
 });
 const generic=new RegExp('저항(?:('+number+')(%)?(이상|이하)?)?','g');text=text.replace(generic,(all,n,percent,suffix)=>{ambiguities.push({id:'resistance-'+ambiguities.length,label:all,value:n===undefined?undefined:Number(n),bound:suffix==='이하'?'max':'min',choices:['fire','cold','lightning','chaos']});return';';});
 text=text.replace(/[·,;\/]/g,'').replace(/찾아주세요|찾아줘|검색해주세요|검색해줘|원해요|원해|짜리/g,'');if(price)text=text.replace(/예산/g,'');const merged=mergeConditions(conditions);errors.push(...merged.errors);
 return{raw,categoryId,conditions:merged.conditions,ambiguities,errors,unknown:text?text.slice(0,240):'',price};
}
function combine(model,manual,resolutions,data){const chosen=[...model.conditions];for(const a of model.ambiguities){const key=resolutions[a.id];if(key&&a.choices.includes(key))chosen.push({key,...(a.bounds||{}),...(a.value===undefined?{}:{[a.bound]:a.value})});}for(const r of manual){const def=definition(r.key,data);if(!def)continue;chosen.push({...r});}const merged=mergeConditions(chosen);return{...model,conditions:merged.conditions,ambiguities:model.ambiguities.filter(a=>!a.choices.includes(resolutions[a.id])),errors:[...model.errors,...merged.errors]};}
function compatibility(model,data){return model.conditions.filter(c=>{const d=definition(c.key,data);return d&&d.kind!=='pseudo'&&(d.kind==='property'?!data.properties[model.categoryId]?.includes(d.id):!data.eligibility[model.categoryId]?.includes(d.id));}).map(c=>c.key);}
function blockingCompatibility(model,data){return compatibility(model,data).filter(key=>data.curated.some(d=>d.key===key));}
function buildQuery(model,data,options={}){if(blockingCompatibility(model,data).length)throw Error('선택한 부위에서 지원하지 않는 일반 옵션이에요. 조건을 삭제하거나 부위를 바꿔 주세요.');if(model.unknown||model.errors.length||model.ambiguities.length)throw Error('아직 확인할 입력이 있어요.');if(!data.categories.some(c=>c.id===model.categoryId))throw Error('장비 종류를 확인하세요.');if(!model.raw.trim()&&!model.conditions.length)throw Error('조건을 입력하거나 옵션을 추가하세요.');const rows=mergeConditions(model.conditions);if(rows.errors.length)throw Error(rows.errors[0]);const filters={type_filters:{filters:{category:{option:model.categoryId}}}},stats=[];for(const row of rows.conditions){const d=definition(row.key,data);if(!d)throw Error('알 수 없는 옵션');const value={};for(const key of ['min','max'])if(row[key]!==undefined){if(!Number.isFinite(row[key])||Math.abs(row[key])>100000000)throw Error('수치 범위를 확인하세요.');value[key]=row[key];}if(d.kind==='property'){if(!Object.keys(value).length)throw Error('장비 최종 수치에는 최소 또는 최대 수치가 필요해요.');if(Object.values(value).some(v=>v<0))throw Error('장비 수치는 0 이상이어야 해요.');(filters.equipment_filters??={filters:{}}).filters[d.id]=value;}else stats.push({id:d.id,value});}
 if(model.price){const p=model.price;if(!['divine','exalted','chaos'].includes(p.currency))throw Error('가격 화폐를 확인하세요.');const price={option:p.currency};for(const k of ['min','max'])if(p[k]!==undefined){if(!Number.isFinite(p[k])||p[k]<0||p[k]>100000000)throw Error('가격 수치를 확인하세요.');price[k]=p[k];}if(price.min!==undefined&&price.max!==undefined&&price.min>price.max)throw Error('가격 범위가 충돌해요.');filters.trade_filters={filters:{price}};}
 return{status:{option:options.status==='online'?'online':'any'},stats:[{type:'and',filters:stats}],filters};}
function stripCategory(raw,data){let text=raw;const aliases=data.categories.flatMap(c=>c.aliases).sort((a,b)=>b.length-a.length);for(const a of aliases)text=text.replace(new RegExp(escape(a),'gi'),'');return text.trim();}
const api={normalize,parse,combine,definition,mergeConditions,compatibility,blockingCompatibility,buildQuery,stripCategory,lexicon};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TradeEngine=api;
})(typeof window!=='undefined'?window:globalThis);
