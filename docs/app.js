'use strict';
const $=id=>document.getElementById(id),DATA=window.MOD_DATA,E=window.SearchEngine;
const pages={vendor:{name:'상점 검색',icon:'⌂',en:'VENDOR',desc:'레벨업할 때, 놓치기 아까운 옵션을 한 번에 찾아요.',domain:'item'},waystone:{name:'경로석 검색',icon:'◇',en:'WAYSTONE',desc:'원하는 속성은 찾고, 피하고 싶은 속성은 걸러내세요.',domain:'waystone'},item:{name:'아이템 검색',icon:'⚒',en:'EQUIPMENT',desc:'창고 속 장비에서 내게 필요한 옵션을 찾아요.',domain:'item'},tablet:{name:'서판 검색',icon:'▤',en:'TABLET',desc:'콘텐츠별 서판 옵션을 골라 검색식을 만들어요.',domain:'tablet'}};
const groupNames={default:'공통',map_key_low:'경로석 속성',map_key_medium:'경로석 속성',map_key_high:'경로석 속성',map_key_highest:'경로석 속성',breach:'균열',ritual:'의식',delirium:'환영',abyss:'심연',expedition:'탐험',incursion:'사원',irradiated:'조사',overseer:'감시자',map_boss:'지도 보스'};
const blank=()=>({rows:[],custom:[],mode:'all',normalization:'NFD',limit:250});
let active='vendor',configs=Object.fromEntries(Object.keys(pages).map(k=>[k,blank()])),favorites=[],current=null;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validateConfig(c){
 if(!c||!Array.isArray(c.rows)||!Array.isArray(c.custom)||c.rows.length>200||c.custom.length>40)throw Error('지원하지 않는 저장 형식입니다.');
 return {rows:c.rows.filter(r=>r&&DATA.some(d=>d.id===r.id)).map(r=>({id:r.id,exclude:!!r.exclude,min:typeof r.min==='number'||typeof r.min==='string'?String(r.min).slice(0,6):''})),custom:c.custom.filter(t=>t&&typeof t.text==='string').map(t=>({text:t.text.slice(0,150),exclude:!!t.exclude})),mode:c.mode==='any'?'any':'all',normalization:c.normalization==='NFC'?'NFC':'NFD',limit:c.limit===50?50:250};
}
try{const saved=JSON.parse(localStorage.getItem('poe2-search-v1'));if(saved){if(pages[saved.active])active=saved.active;for(const k of Object.keys(pages))if(saved.configs?.[k])configs[k]=validateConfig(saved.configs[k]);favorites=(saved.favorites||[]).filter(f=>f&&pages[f.page]&&typeof f.name==='string').slice(0,100).map(f=>({...f,name:f.name.slice(0,100),config:validateConfig(f.config)}));}}catch{}
const uid=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const cfg=()=>configs[active];
function persist(){try{localStorage.setItem('poe2-search-v1',JSON.stringify({active,configs,favorites}));}catch{toast('브라우저 저장 공간을 사용할 수 없어요. 내보내기로 보관해 주세요.');}}
let timer;function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>$('toast').classList.remove('show'),2600);}
function visibleData(){return DATA.filter(d=>d.domain===pages[active].domain);}
function navigate(k){active=k;$('optionSearch').value='';$('testText').value='';renderPage();persist();}
function renderPage(){
 const counts={vendor:'육성 장비 · 옵션',waystone:'위험 속성 · 보상',item:'장비 · 능력치',tablet:'콘텐츠 · 서판 속성'};
 $('nav').innerHTML=Object.entries(pages).map(([k,p],i)=>`<button class="nav-btn ${k===active?'active':''}" data-page="${k}" aria-label="${p.name}" aria-current="${k===active?'page':'false'}"><span class="category-art art-${k}" aria-hidden="true"></span><span class="category-shade" aria-hidden="true"></span><span class="category-copy"><small>0${i+1} / ${p.en}</small><strong>${p.name}</strong><span>${counts[k]}</span></span><span class="category-active" aria-hidden="true">${k===active?'선택됨':'열기'}</span></button>`).join('');
 const p=pages[active];$('pageTitle').textContent=p.name;$('pageDesc').textContent=p.desc;$('stepLabel').textContent=`0${Object.keys(pages).indexOf(active)+1} / ${p.en}`;
 const groups=[...new Set(visibleData().map(d=>d.group.startsWith('map_key_')?'map_key_low':d.group))];$('groupFilter').innerHTML='<option value="">전체 분류</option>'+groups.map(g=>`<option value="${safe(g)}">${safe(groupNames[g]||g)}</option>`).join('');
 $('dataCount').textContent=`${visibleData().length}개 옵션`;
 const presets=active==='vendor'?[['leveling','육성 장비 찾기'],['caster','주문 무기 찾기']]:active==='item'?[['resists','저항 옵션 찾기'],['resources','생명력·마나 찾기']]:active==='waystone'?[['recovery','회복 저하 제외'],['critical','치명타 속성 찾기']]:[['breach','균열 옵션 찾기'],['expedition','탐험 옵션 찾기']];
 $('presets').innerHTML=presets.map(([id,name])=>`<button class="preset" data-preset="${id}">＋ ${name}</button>`).join('');
 $('normalization').value=cfg().normalization;$('limit').value=cfg().limit;renderCatalog();renderSelection();updateResults();$('favCount').textContent=favorites.length;
}
const aliases={'이속':'이동 속도','피통':'생명력 최대치','피':'생명력','마나통':'마나 최대치','에쉴':'에너지 보호막','레지':'저항','캐속':'시전 속도','공속':'공격 속도','물피':'물리 피해','치피':'치명타 피해','치확':'치명타 명중','맵':'지도'};
function renderCatalog(){
 let q=$('optionSearch').value.trim();q=aliases[q]||q;const group=$('groupFilter').value;
 const list=visibleData().filter(d=>(!group||d.group===group||(group==='map_key_low'&&d.group.startsWith('map_key_')))&&(!q||(d.label+' '+(groupNames[d.group]||d.group)).includes(q)));
 $('optionList').innerHTML=list.length?list.map(d=>{const row=cfg().rows.find(r=>r.id===d.id);return `<button class="option ${row?'selected':''}" data-mod="${d.id}" aria-pressed="${!!row}"><span class="box">${row?(row.exclude?'−':'✓'):''}</span><span>${safe(d.label)}</span></button>`;}).join(''):'<div class="empty">일치하는 옵션이 없어요.<br>아래에서 검색할 문구를 직접 추가할 수 있어요.</div>';
}
function renderSelection(){
 $('allMode').setAttribute('aria-pressed',cfg().mode==='all');$('anyMode').setAttribute('aria-pressed',cfg().mode==='any');
 const rows=cfg().rows.map((r,i)=>{const d=DATA.find(m=>m.id===r.id),can=(d.template.match(/#/g)||[]).length===1;return `<div class="selected-row"><span class="label">${safe(d.label)}<small>${r.exclude?'제외할 옵션':'찾을 옵션'}${can?' · 최소값 선택 가능':''}</small></span>${can?`<input type="number" min="0" max="9999" step="1" value="${safe(r.min)}" data-min="${i}" placeholder="최소값" aria-label="${safe(d.label)} 최소값">`:'<span class="micro">문구 검색</span>'}<button class="kind ${r.exclude?'exclude':''}" data-kind="${i}">${r.exclude?'제외':'포함'}</button><button class="remove" data-remove="${i}" aria-label="${safe(d.label)} 삭제">✕</button></div>`;});
 cfg().custom.forEach((t,i)=>rows.push(`<div class="selected-row"><span class="label">${safe(t.text)}<small>직접 입력한 문구</small></span><span></span><button class="kind ${t.exclude?'exclude':''}" data-customkind="${i}">${t.exclude?'제외':'포함'}</button><button class="remove" data-customremove="${i}" aria-label="직접 조건 삭제">✕</button></div>`));
 $('selection').innerHTML=rows.join('')||'<div class="empty">아직 선택한 조건이 없어요.</div>';
}
function updateResults(){
 try{
  current=E.build(cfg(),DATA);$('query').value=current.query;$('length').textContent=`${current.length} / ${cfg().limit}`;$('length').classList.toggle('over',current.over);
  const yes=current.details.filter(d=>!d.exclude).length,no=current.details.filter(d=>d.exclude).length;
  $('explain').textContent=current.query?`포함 ${yes}개 · ${cfg().mode==='all'?'모두 일치':'하나 이상'}${no?' / 제외 '+no+'개 · 하나라도 일치 시 제외':''}`:'조건을 선택하면 검색식이 자동으로 만들어져요.';
  $('error').hidden=!current.over;$('error').textContent=current.over?'설정한 길이 기준을 넘었어요. 조건을 줄이거나 검색식을 나눠 주세요. 잘라서 복사하지 않습니다.':'';
  $('copy').disabled=!current.query||current.over;$('save').disabled=!current.query||current.over;
 }catch(e){current=null;$('query').value='';$('length').textContent='오류';$('error').hidden=false;$('error').textContent=e.message;$('copy').disabled=true;$('save').disabled=true;}
 evaluate();persist();
}
function evaluate(){
 const text=$('testText').value;if(!text.trim()||!current?.query){$('testResult').innerHTML='<span class="micro">조건과 아이템 텍스트를 넣으면 일치 여부가 표시돼요.</span>';return;}
 try{const r=E.evaluate(current,text,cfg().normalization,cfg().mode);$('testResult').innerHTML=`<span class="verdict ${r.matched?'':'fail'}">${r.matched?'✓ 검색 조건에 일치':'− 검색 조건에 불일치'} <small>· 웹 참고 검사</small></span>`+r.checks.map(c=>`<div class="check ${c.exclude&&c.matched||!c.exclude&&!c.matched?'bad':''}"><b>${c.matched?'발견':'없음'}</b> · ${c.exclude?'제외':'포함'} · ${safe(c.label)}</div>`).join('');}catch{$('testResult').textContent='텍스트 검사 중 오류가 발생했어요.';}
}
function applyPreset(id){
 const list=visibleData();let picked=[],mode='any',exclude=false;
 if(id==='leveling')picked=list.filter(d=>['이동 속도 #% 증가','생명력 최대치 +#','모든 원소 저항 +#%'].includes(d.label));
 if(id==='caster')picked=list.filter(d=>['모든 주문 스킬 레벨 +#','주문 피해 #% 증가','시전 속도 #% 증가'].includes(d.label));
 if(id==='resists')picked=list.filter(d=>['화염 저항 +#%','냉기 저항 +#%','번개 저항 +#%','카오스 저항 +#%'].includes(d.label));
 if(id==='resources')picked=list.filter(d=>['생명력 최대치 +#','마나 최대치 +#'].includes(d.label));
 if(id==='recovery'){picked=list.filter(d=>d.label.includes('회복 속도'));exclude=true;mode='all';}
 if(id==='critical')picked=list.filter(d=>d.label.includes('치명타'));
 if(id==='breach')picked=list.filter(d=>d.group==='breach'&&d.label.includes('무리 규모')).slice(0,2);
 if(id==='expedition')picked=list.filter(d=>d.group==='expedition'&&d.label.includes('베리시움')).slice(0,2);
 configs[active]={...blank(),normalization:cfg().normalization,limit:cfg().limit,mode,rows:picked.map(d=>({id:d.id,exclude,min:''}))};
 renderCatalog();renderSelection();updateResults();toast('추천 조건을 불러왔어요. 원하는 대로 수정하세요.');
}
$('nav').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)navigate(b.dataset.page);});
$('optionList').addEventListener('click',e=>{const b=e.target.closest('[data-mod]');if(!b)return;const i=cfg().rows.findIndex(r=>r.id===b.dataset.mod);if(i>=0)cfg().rows.splice(i,1);else cfg().rows.push({id:b.dataset.mod,exclude:false,min:''});renderCatalog();renderSelection();updateResults();});
$('presets').addEventListener('click',e=>{const b=e.target.closest('[data-preset]');if(b)applyPreset(b.dataset.preset);});
$('optionSearch').oninput=renderCatalog;$('groupFilter').onchange=renderCatalog;
$('selection').addEventListener('input',e=>{if(e.target.dataset.min!==undefined){cfg().rows[+e.target.dataset.min].min=e.target.value;updateResults();}});
$('selection').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.kind!==undefined){const r=cfg().rows[+b.dataset.kind];r.exclude=!r.exclude;}if(b.dataset.remove!==undefined)cfg().rows.splice(+b.dataset.remove,1);if(b.dataset.customkind!==undefined){const r=cfg().custom[+b.dataset.customkind];r.exclude=!r.exclude;}if(b.dataset.customremove!==undefined)cfg().custom.splice(+b.dataset.customremove,1);renderCatalog();renderSelection();updateResults();});
$('allMode').onclick=()=>{cfg().mode='all';renderSelection();updateResults();};$('anyMode').onclick=()=>{cfg().mode='any';renderSelection();updateResults();};
$('clear').onclick=()=>{configs[active]=blank();renderPage();persist();};
function addCustom(){const text=$('customText').value.trim();if(!text)return;if(text.length>150||/["\n\r]/.test(text)){toast('150자 이내, 큰따옴표·줄바꿈 없이 입력해 주세요.');return;}if(cfg().custom.length>=40){toast('직접 조건은 40개까지 저장할 수 있어요.');return;}cfg().custom.push({text,exclude:$('customKind').value==='exclude'});$('customText').value='';renderSelection();updateResults();}
$('addCustom').onclick=addCustom;$('customText').onkeydown=e=>{if(e.key==='Enter')addCustom();};
$('copy').onclick=async()=>{if(!current?.query||current.over)return;try{await navigator.clipboard.writeText(current.query);toast('복사했어! 게임 검색창에 붙여넣어 줘.');}catch{$('query').focus();$('query').select();toast('자동 복사가 막혔어요. 선택된 검색식을 직접 복사해 주세요.');}};
$('normalization').onchange=()=>{cfg().normalization=$('normalization').value;updateResults();};$('limit').onchange=()=>{cfg().limit=Number($('limit').value);updateResults();};
$('advancedToggle').onclick=()=>{$('advanced').hidden=!$('advanced').hidden;};$('helpToggle').onclick=()=>{$('help').hidden=!$('help').hidden;};
$('testText').oninput=evaluate;$('sample').onclick=()=>{if(!current?.details.length){toast('조건부터 선택해 주세요.');return;}$('testText').value='합성 테스트 아이템 (실제 게임 데이터 아님)\n--------\n'+current.details.filter(d=>!d.exclude).map(d=>d.custom?d.label:DATA.find(m=>m.id===d.id).template.replace(/#/g,d.min!==''&&d.min!=null?String(d.min):'30')).join('\n');evaluate();};
$('save').onclick=()=>{if(!current?.query||current.over)return;if(favorites.length>=100){toast('즐겨찾기는 100개까지 저장할 수 있어요.');return;}favorites.unshift({id:uid(),name:pages[active].name+' · '+(current.details[0]?.label||'내 검색'),page:active,config:structuredClone(cfg())});$('favCount').textContent=favorites.length;persist();toast('즐겨찾기에 저장했어요.');};
function renderFavorites(){
 $('favoriteList').innerHTML=favorites.length?favorites.map((f,i)=>`<div class="favorite"><div><input class="favorite-name" data-rename="${i}" aria-label="즐겨찾기 이름" value="${safe(f.name)}" maxlength="100"><small>${pages[f.page].name} · 조건 ${f.config.rows.length+f.config.custom.length}개</small></div><div class="favorite-actions"><button class="small-btn" data-load="${i}">열기</button><button class="quiet" data-delete="${i}" aria-label="즐겨찾기 삭제">✕</button></div></div>`).join(''):'<div class="empty">저장한 검색식이 없어요.<br>검색식을 만든 후 ☆ 버튼으로 저장하세요.</div>';
}
$('favoritesToggle').onclick=()=>{renderFavorites();$('favorites').showModal();};$('closeFavorites').onclick=()=>$('favorites').close();
$('favoriteList').addEventListener('change',e=>{if(e.target.dataset.rename!==undefined){favorites[+e.target.dataset.rename].name=e.target.value.trim()||'내 검색';persist();}});
$('favoriteList').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.load!==undefined){const f=favorites[+b.dataset.load];configs[f.page]=validateConfig(f.config);navigate(f.page);$('favorites').close();toast('저장한 조건을 불러왔어요.');}if(b.dataset.delete!==undefined){favorites.splice(+b.dataset.delete,1);persist();renderFavorites();$('favCount').textContent=favorites.length;}});
$('exportFavorites').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,favorites},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='poe2-search-favorites.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('importFavorites').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>200000)throw Error('파일은 200KB 이하여야 합니다.');const d=JSON.parse(await file.text());if(d.version!==1||!Array.isArray(d.favorites))throw Error('이 도구에서 내보낸 JSON 파일을 선택해 주세요.');const next=d.favorites.slice(0,100).map(f=>{if(!pages[f.page]||typeof f.name!=='string')throw Error('즐겨찾기 형식이 맞지 않습니다.');return {id:uid(),name:f.name.slice(0,100),page:f.page,config:validateConfig(f.config)};});favorites=[...next,...favorites].slice(0,100);persist();renderFavorites();$('favCount').textContent=favorites.length;toast('즐겨찾기를 가져왔어요.');}catch(err){toast(err.message);}e.target.value='';};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('favorites').open){e.preventDefault();$('optionSearch').focus();}});
renderPage();
