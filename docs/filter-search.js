/* Local bilingual names and researched aliases; never changes source filter text. */
(function(root){'use strict';
const data=typeof module!=='undefined'&&module.exports?require('./currency-aliases.js'):root.CurrencyAliasData;
const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[\s\u200b]+/gu,'').replace(/[’‘]/g,"'").replace(/쥬/g,'주');
const compiled=data.entries.map(entry=>({entry,identities:[normalize(entry.name),normalize(entry.ko)],terms:[...new Set([entry.name,entry.ko,entry.ko.replace(/의 /g,' '),...entry.aliases.map(a=>a.text)].map(normalize))]}));
const cache=new Map(),blocks=new WeakMap();
function resolve(query){const q=normalize(query);if(!q)return compiled;if(cache.has(q))return cache.get(q);const exact=compiled.filter(e=>e.terms.includes(q)),result=exact.length?exact:compiled.filter(e=>e.terms.some(t=>t.includes(q)));if(cache.size>60)cache.delete(cache.keys().next().value);cache.set(q,result);return result;}
function bases(block){if(blocks.has(block))return blocks.get(block);const result=block.commands.filter(c=>c.cmd==='BaseType').flatMap(c=>{const exact=c.args[0]==='==';return c.args.filter(v=>!['=','==','!','!='].includes(v)).map(name=>({name,key:normalize(name),partial:!exact}));});blocks.set(block,result);return result;}
function find(block,query,source='',title=''){
 const q=normalize(query);if(!q)return{matched:true,names:[]};const entries=resolve(q);
 const names=[...new Set(bases(block).filter(base=>entries.some(e=>e.identities.some(id=>base.key.includes(id)||(base.partial&&id.includes(base.key))))).map(b=>b.name))];
 return{matched:!!names.length||normalize(block.line+' '+title+' '+source).includes(q),names};
}
function lookup(query){return resolve(query).map(e=>e.entry);}
const api={find,normalize,lookup,data};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FilterSearch=api;
})(typeof window!=='undefined'?window:globalThis);
