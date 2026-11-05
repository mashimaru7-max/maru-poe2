/* Browser speech -> editable text. Never starts recording without a button click. */
(function(root){'use strict';
function bindVoice({Recognition,input,button,status,onText,setTimer=setTimeout,clearTimer=clearTimeout}){
 let session=null,inputRevision=0;
 const fallback='이 브라우저에서는 버튼 음성입력을 사용할 수 없어요. 입력창을 누른 뒤 키보드의 마이크로 입력해 주세요.';
 input.addEventListener('input',()=>{inputRevision++;});
 const idle=()=>{button.textContent='🎤 말로 입력';button.setAttribute('aria-pressed','false');};
 idle();
 if(!Recognition){button.disabled=true;status.textContent=fallback;return;}
 function finish(s){
  if(session!==s)return;session=null;clearTimer(s.timer);idle();
  if(s.error){status.textContent=s.error;return;}
  const text=[...s.finals.entries()].sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join(' ').trim();
  if(inputRevision!==s.revision||input.value!==s.before){status.textContent='입력 내용이 바뀌어 음성을 덧붙이지 않았어요. 다시 눌러 말해 주세요.';return;}
  if(!text){status.textContent='말소리를 인식하지 못했어요. 다시 눌러 말해 주세요.';return;}
  const next=(s.before.trim()+' '+text).trim();
  if(next.length>input.maxLength){status.textContent='입력 가능한 글자 수를 넘어서 추가하지 않았어요. 조건을 줄여 주세요.';return;}
  input.value=next;onText();status.textContent='말한 내용을 입력했어요. 옵션과 숫자를 확인해 주세요.';
 }
 button.addEventListener('click',()=>{
  if(session){try{session.rec.stop();status.textContent='음성입력을 마무리하고 있어요…';}catch{session.error='음성입력을 중지했어요.';finish(session);}return;}
  let rec;try{rec=new Recognition();}catch{status.textContent=fallback;return;}
  const s={rec,before:input.value,revision:inputRevision,finals:new Map(),timer:null,error:''};session=s;
  rec.lang='ko-KR';rec.continuous=false;rec.interimResults=true;rec.maxAlternatives=1;
  button.textContent='■ 음성입력 끝내기';button.setAttribute('aria-pressed','true');status.textContent='마이크 허용 후 조건을 말해 주세요. 기존 글 뒤에 추가돼요.';
  rec.onstart=()=>{if(session===s)status.textContent='듣고 있어요… 예: 에너지 보호막 600 정신력 40 갑옷';};
  rec.onresult=e=>{if(session!==s)return;let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i],t=r[0].transcript;if(r.isFinal)s.finals.set(i,t);else interim+=t+' ';}status.textContent='인식 중: '+[...s.finals.values(),interim].join(' ').trim();};
  rec.onerror=e=>{if(session!==s)return;const messages={'not-allowed':'마이크 또는 음성인식 권한이 거부됐어요. 브라우저 사이트 설정에서 허용하거나 키보드 마이크를 사용하세요.','service-not-allowed':'브라우저 음성인식 서비스를 사용할 수 없어요. 키보드 마이크를 사용해 주세요.','audio-capture':'마이크를 사용할 수 없어요. 연결과 다른 앱의 사용 여부를 확인해 주세요.','no-speech':'말소리를 인식하지 못했어요. 다시 눌러 말해 주세요.','network':'음성인식 연결에 실패했어요. 인터넷 연결을 확인하거나 키보드 마이크를 사용하세요.','language-not-supported':'이 브라우저에서 한국어 음성인식을 지원하지 않아요. 키보드 마이크를 사용하세요.','aborted':'음성입력을 취소했어요.'};s.error=messages[e.error]||'음성인식을 마치지 못했어요. 다시 시도하거나 키보드 마이크를 사용하세요.';finish(s);try{rec.abort();}catch{}};
  rec.onend=()=>finish(s);
  s.timer=setTimer(()=>{if(session!==s)return;s.error='음성입력 시간이 끝났어요. 다시 눌러 말해 주세요.';finish(s);try{rec.abort();}catch{}},30000);
  try{rec.start();}catch{s.error='음성입력을 시작하지 못했어요. 권한을 확인하거나 키보드 마이크를 사용하세요.';finish(s);}
 });
 const cancel=()=>{const s=session;if(!s)return;s.error='입력이 바뀌어 음성입력을 취소했어요.';finish(s);try{s.rec.abort();}catch{}};
 return{cancel};
}
if(typeof module!=='undefined'&&module.exports)module.exports=bindVoice;
else{
 const voice=bindVoice({Recognition:root.SpeechRecognition||root.webkitSpeechRecognition,input:document.getElementById('tradeInput'),button:document.getElementById('voiceTrade'),status:document.getElementById('voiceStatus'),onText:()=>document.getElementById('tradeInput').dispatchEvent(new Event('input',{bubbles:true}))});
 if(voice){for(const id of ['tradeInput','tradeCategories','parseTrade','clearTrade','exampleBasic','showTextInput','toggleCatalog','exampleAmbiguous','exampleRange','savedTrades'])document.getElementById(id).addEventListener(id==='tradeInput'?'input':'click',voice.cancel);root.addEventListener('pagehide',voice.cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)voice.cancel();});}
}
})(typeof window!=='undefined'?window:globalThis);
