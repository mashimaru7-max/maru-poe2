/* Original search-expression builder. Game descriptions are attributed in Sources. */
(function(root){
 const esc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 function numRange(lo,hi=9999){
  if(!Number.isInteger(lo)||!Number.isInteger(hi)||lo<0||hi>9999||lo>hi)throw Error('수치는 0~9999 정수로 입력해 주세요.');
  function fixed(a,b,n){
   if(n===0)return '';
   if(a===0&&b===10**n-1)return n===1?'[0-9]':`[0-9]{${n}}`;
   const p=10**(n-1),groups=[];
   for(let d=Math.floor(a/p);d<=Math.floor(b/p);d++){
    const low=d===Math.floor(a/p)?a%p:0,high=d===Math.floor(b/p)?b%p:p-1;
    const tail=fixed(low,high,n-1),last=groups[groups.length-1];
    if(last&&last.tail===tail&&last.end===d-1)last.end=d;
    else groups.push({start:d,end:d,tail});
   }
   const parts=groups.map(g=>(g.start===g.end?String(g.start):g.end===g.start+1?'['+g.start+g.end+']':'['+g.start+'-'+g.end+']')+g.tail);
   return parts.length===1?parts[0]:'('+parts.join('|')+')';
  }
  const parts=[];
  for(let n=1;n<=4;n++){
   const a=Math.max(lo,n===1?0:10**(n-1)),b=Math.min(hi,10**n-1);
   if(a<=b)parts.push(fixed(a,b,n));
  }
  return parts.length===1?parts[0]:'('+parts.join('|')+')';
 }
 function simplePattern(template){return template.split('#').map(esc).join('[0-9]+');}
 function keyword(template,corpus){
  const candidates=[];
  for(const segment of template.split('#')){
   const words=segment.replace(/[+%~()0-9]/g,' ').trim().split(/\s+/).filter(Boolean);
   for(let n=1;n<=4;n++)for(let i=0;i+n<=words.length;i++){
    const s=words.slice(i,i+n).join(' ');
    if(s.length>=4&&template.includes(s)&&/[가-힣]/.test(s)&&!corpus.some(x=>x!==template&&x.includes(s)))candidates.push(s);
   }
  }
  candidates.sort((a,b)=>a.length-b.length||a.localeCompare(b));
  return candidates.length?esc(candidates[0]):simplePattern(template);
 }
 function patternFor(row,data){
  const mod=data.find(m=>m.id===row.id);if(!mod)throw Error('없는 옵션입니다.');
  if(row.min!==''&&row.min!=null){
   if((mod.template.match(/#/g)||[]).length!==1)throw Error('이 옵션은 최소 수치를 설정할 수 없습니다.');
   const n=Number(row.min);if(!String(row.min).trim()||!Number.isInteger(n)||n<0||n>9999)throw Error('최소 수치는 0~9999 정수입니다.');
   // A following boundary prevents a suffix of 130 from matching a threshold of 30.
   const [before,after]=mod.template.split('#');
   return esc(before)+numRange(n)+(after?esc(after):'([^0-9]|$)');
  }
  return keyword(mod.template,data.filter(m=>m.domain===mod.domain).map(m=>m.template));
 }
 function build(config,data){
  const inc=[],exc=[],details=[];
  for(const row of config.rows){
   let pattern=patternFor(row,data);
   if(config.normalization==='NFD')pattern=pattern.normalize('NFD');
   (row.exclude?exc:inc).push(pattern);details.push({...row,pattern,label:data.find(m=>m.id===row.id).label});
  }
  for(const t of config.custom||[]){
   if(!t.text.trim())continue;
   if(/["\n\r]/.test(t.text))throw Error('직접 입력에는 큰따옴표와 줄바꿈을 넣을 수 없습니다.');
   let p=esc(t.text.trim());if(config.normalization==='NFD')p=p.normalize('NFD');
   (t.exclude?exc:inc).push(p);details.push({label:t.text,pattern:p,exclude:t.exclude,custom:true});
  }
  const uniq=a=>[...new Set(a)],yes=uniq(inc),no=uniq(exc);
  const terms=config.mode==='all'?yes.map(p=>'"'+p+'"'):yes.length?['"'+yes.join('|')+'"']:[];
  if(no.length)terms.push('"!'+no.join('|')+'"');
  const query=terms.join(' ');
  return {query,details,length:query.length,over:query.length>config.limit};
 }
 function evaluate(result,text,normalization,mode){
  let value=String(text).normalize(normalization==='NFD'?'NFD':'NFC');
  const checks=result.details.map(d=>({...d,matched:new RegExp(d.pattern,'im').test(value)}));
  const yes=checks.filter(d=>!d.exclude),no=checks.filter(d=>d.exclude);
  return {matched:(mode==='all'?yes.every(d=>d.matched):!yes.length||yes.some(d=>d.matched))&&!no.some(d=>d.matched),checks};
 }
 root.SearchEngine={esc,numRange,keyword,patternFor,build,evaluate};
 if(typeof module!=='undefined')module.exports=root.SearchEngine;
})(typeof window==='undefined'?globalThis:window);
