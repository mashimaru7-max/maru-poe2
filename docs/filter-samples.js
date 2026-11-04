/* Hypothetical item inputs derived from a rule. They are never live game data. */
(function(root){'use strict';const E=typeof module!=='undefined'&&module.exports?require('./filter-engine.js'):root.FilterEngine;
function makeSamples(block,defaults,limit=80){
 const base=block.commands.find(c=>c.cmd==='BaseType'&&!['!','!='].includes(c.args[0])),classes=block.commands.find(c=>c.cmd==='Class'&&!['!','!='].includes(c.args[0])),values=c=>c?c.args.filter(v=>!['=','==','!','!='].includes(v)):[];
 const names=values(base).slice(0,limit);if(!names.length)names.push(defaults.BaseType||'아이템 예시');
 const classNames=values(classes),cls=classNames.includes('Stackable Currency')?'Stackable Currency':classNames[0];
 return names.map(name=>{const item={...defaults,BaseType:name},assumptions=['지역·레벨·수량 등은 가정값입니다.'];if(cls)item.Class=cls;else if(name==='Gold'||/Orb|Scroll|Shard|Essence/.test(name))item.Class='Stackable Currency';else if(name==='Waystone')item.Class='Waystones';
 if(item.Class==='Stackable Currency')item.Rarity='Normal';
 const fields=[...new Set(block.commands.filter(c=>!E.validate(c.cmd,c.args)&&!['BaseType','Class','HasExplicitMod'].includes(c.cmd)).map(c=>c.cmd))];
 for(const field of fields){const conditions=block.commands.filter(c=>c.cmd===field);if(conditions.every(c=>E.condition(c,item)===true))continue;
 const args=conditions.flatMap(c=>c.args),probes=field==='Rarity'?['Normal','Magic','Rare','Unique']:args.some(v=>['True','False'].includes(v))?[true,false]:[item[field],0,...args.filter(v=>/^\d+$/.test(v)).flatMap(v=>[+v,Math.max(0,+v-1),+v+1])];
 const value=probes.find(v=>v!==undefined&&conditions.every(c=>E.condition(c,{...item,[field]:v})===true));if(value!==undefined)item[field]=value;
 }
 const mods=block.commands.find(c=>c.cmd==='HasExplicitMod');if(mods){delete item.HasExplicitMod;assumptions.push('옵션 조건은 실제 옵션 이름 배열(HasExplicitMod)을 입력해야 확정할 수 있습니다.');}
 const matches=block.commands.filter(c=>!['Continue'].includes(c.cmd)).every(c=>E.condition(c,item)===true);
 return{name:name.slice(0,90)+' · 규칙 '+(block.id+1)+' 가정 예시',protected:false,item,assumptions,matches};
 });
}
const api={makeSamples};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FilterSamples=api;
})(typeof window!=='undefined'?window:globalThis);
