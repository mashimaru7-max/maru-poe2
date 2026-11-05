'use strict';
(()=>{
 const $=id=>document.getElementById(id),catalog=$('tradeCatalogPanel'),text=$('textInputPane'),source=$('openTrade'),mobile=$('mobileOpenTrade');
 function syncMode(){const manual=!catalog.hidden;text.hidden=manual;$('showTextInput').setAttribute('aria-pressed',String(!manual));$('toggleCatalog').setAttribute('aria-pressed',String(manual));}
 $('showTextInput').addEventListener('click',()=>{if(!catalog.hidden)$('toggleCatalog').click();syncMode();$('tradeInput').focus({preventScroll:true});});
 new MutationObserver(syncMode).observe(catalog,{attributes:true,attributeFilter:['hidden']});syncMode();
 function syncSearch(){const disabled=source.getAttribute('aria-disabled')==='true',href=source.getAttribute('href');mobile.setAttribute('aria-disabled',String(disabled));mobile.textContent=disabled?(source.textContent.includes('입력해')?'조건 입력하기':'조건 확인 필요'):'거래소 검색 ↗';if(href&&!disabled)mobile.setAttribute('href',href);else mobile.removeAttribute('href');const n=$('tradeConditions').querySelectorAll('.mt-criterion').length;$('conditionCount').textContent=n+'개 옵션';const price=$('tradePrice');$('marketPriceSummary').textContent=price.hidden?'제한 없음':price.textContent.replace(/^가격:\s*/,'');$('mobileConditionCount').textContent='옵션 '+n+'개';}
 function runSearch(e){e.preventDefault();if(source.getAttribute('aria-disabled')==='true'){if(source.textContent.includes('입력해')){const target=catalog.hidden?$('tradeInput'):$('catalogSearch');target.focus();}else $('tradeStatus').scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});return;}source.click();}mobile.addEventListener('click',runSearch);
 mobile.addEventListener('keydown',e=>{if(e.key==='Enter')runSearch(e);});
 new MutationObserver(syncSearch).observe(source,{attributes:true,childList:true,subtree:true});new MutationObserver(syncSearch).observe($('tradeConditions'),{childList:true});new MutationObserver(syncSearch).observe($('tradePrice'),{attributes:true,childList:true,subtree:true});syncSearch();
 const keyboardState=()=>document.body.classList.toggle('is-editing',['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName));document.addEventListener('focusin',keyboardState);document.addEventListener('focusout',()=>setTimeout(keyboardState,0));
})();
