'use strict';
(async()=>{
 const db=await window.ItemDictionaryReady,S=window.ItemDictionarySearch.create(window.CurrencyAliasData,db),D=S.data,$=id=>document.getElementById(id),PAGE_SIZE=100;
 let page=0,results=[];
 for(const value of ['이름 '+S.stats.items.toLocaleString('ko-KR')+'종','고유 아이템 '+S.stats.unique.toLocaleString('ko-KR')+'종','사용례 표기 '+S.stats.observed+'개','확인 2026.11.05']){const span=document.createElement('span');span.textContent=value;$('dictionaryStats').append(span);}
 for(const group of [...new Set(D.entries.map(e=>e.group))].sort((a,b)=>a.localeCompare(b,'ko'))){const o=document.createElement('option');o.value=group;o.textContent=group;$('dictionaryGroup').append(o);}
 for(const [value,label]of Object.entries(S.typeNames)){const o=document.createElement('option');o.value=value;o.textContent=label;$('dictionaryType').append(o);}
 function render(){
  const q=$('dictionarySearch').value;results=S.lookup(q,{group:$('dictionaryGroup').value,type:$('dictionaryType').value,observedOnly:$('observedOnly').checked});
  const pages=Math.max(1,Math.ceil(results.length/PAGE_SIZE));page=Math.max(0,Math.min(page,pages-1));const start=page*PAGE_SIZE;
  $('dictionaryCount').textContent=results.length.toLocaleString('ko-KR')+'개 항목'+(q?' · ‘'+q+'’ 검색':'')+(results.length?' · '+(start+1)+'–'+Math.min(start+PAGE_SIZE,results.length)+' 표시':'');
  $('dictionaryPage').textContent=(page+1)+' / '+pages+' 페이지';$('dictionaryPrevious').disabled=page===0;$('dictionaryNext').disabled=page>=pages-1;
  const body=$('dictionaryRows');body.replaceChildren();
  for(const e of results.slice(start,start+PAGE_SIZE)){
   const tr=document.createElement('tr'),name=document.createElement('td'),title=document.createElement('strong'),en=document.createElement('div'),type=document.createElement('small'),base=document.createElement('small');
   title.textContent=e.ko;en.className='en-name';en.textContent=e.name;type.textContent=S.typeNames[e.type]+' · '+e.category+(e.nameStatus?' · '+e.nameStatus:'');base.textContent=e.baseKo?'베이스: '+e.baseKo+' · '+e.base:'';name.append(title,en,type);if(base.textContent)name.append(base);if(!e.categoryId&&e.status&&e.kind==='item'){const status=document.createElement('small');status.textContent=e.status;name.append(status);}tr.append(name);
   for(const confirmed of [true,false]){const cell=document.createElement('td'),list=e.aliases.filter(a=>(a.kind==='사용례 확인')===confirmed);for(const a of list){const tag=document.createElement('span');tag.className='nickname'+(!confirmed?' helper':'');tag.textContent=a.text;cell.append(tag);}if(!list.length)cell.textContent='—';tr.append(cell);}
   const refs=document.createElement('td'),ids=[...new Set([...e.nameSources,...e.aliases.flatMap(a=>a.sources)])];for(const id of ids){const src=D.sources[id];if(!src)continue;const a=document.createElement('a');a.href=src.url;a.target='_blank';a.rel='noopener noreferrer';a.className='source-link';a.textContent=src.type+' ↗';refs.append(a);}if(!ids.length)refs.textContent='검색 보조';tr.append(refs);body.append(tr);
  }
  if(!results.length){const row=document.createElement('tr'),cell=document.createElement('td');row.className='empty';cell.colSpan=4;cell.textContent='이 조건의 이름이 없어요. 분류·유형·약칭 조건을 풀거나 한글명·영문명으로 찾아보세요.';row.append(cell);body.append(row);}
  $('dictionaryTable').scrollTop=0;
 }
 for(const id of ['dictionarySearch','dictionaryGroup','dictionaryType','observedOnly'])$(id).addEventListener(id==='dictionarySearch'?'input':'change',()=>{page=0;render();});
 for(const [id,delta]of [['dictionaryPrevious',-1],['dictionaryNext',1]])$(id).addEventListener('click',()=>{page+=delta;render();});
 for(const src of Object.values(D.sources)){const li=document.createElement('li'),a=document.createElement('a');a.href=src.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=src.title;li.append(a,document.createTextNode(' · '+src.type));$('dictionarySources').append(li);}
 $('downloadDictionary').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(D,null,2)],{type:'application/json;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='maru-poe2-item-dictionary-20261105.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 $('dictionarySearch').disabled=false;$('dictionarySearch').value=new URLSearchParams(location.search).get('q')||'';render();
})().catch(e=>{document.getElementById('dictionaryCount').textContent='아이템 DB를 불러오지 못했어요. 새로고침해 주세요. '+e.message;});
