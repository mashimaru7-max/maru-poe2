/* Local search aliases. Matching never changes filter contents or item conditions. */
(function(root){'use strict';
const aliases=[
 {name:'Divine Orb',ko:'신성한 오브',terms:['신성한 오브','신성한오브','신성','디바인 오브','디바인오브','디바인','디바','딥']},
 {name:'Chaos Orb',ko:'카오스 오브',terms:['카오스 오브','카오스오브','카오스','카옵']},
 {name:'Exalted Orb',ko:'엑잘티드 오브',terms:['엑잘티드 오브','엑잘티드오브','엑잘티드','엑잘 오브','엑잘오브','엑잘']},
 {name:'Vaal Orb',ko:'바알 오브',terms:['바알 오브','바알오브','바알']}
];
const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[\s\u200b]+/gu,'').replace(/[’‘]/g,"'");
function find(block,query,source='',title=''){
 const q=normalize(query);if(!q)return{matched:true,names:[]};
 const entries=aliases.filter(entry=>entry.terms.some(term=>normalize(term).includes(q)));
 const names=[...new Set(block.commands.filter(c=>c.cmd==='BaseType').flatMap(c=>c.args.filter(v=>!['=','==','!','!='].includes(v))).filter(name=>entries.some(entry=>normalize(name).includes(normalize(entry.name))||normalize(name).includes(normalize(entry.ko)))))];
 return{matched:!!names.length||normalize(block.line+' '+title+' '+source).includes(q),names};
}
const api={find,normalize};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FilterSearch=api;
})(typeof window!=='undefined'?window:globalThis);
