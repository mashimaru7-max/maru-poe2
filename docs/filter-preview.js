/* Rule appearance is independent of whole-filter matching. Never used for export checks. */
(function(root){'use strict';
const E=typeof module!=='undefined'&&module.exports?require('./filter-engine.js'):root.FilterEngine;
const styleKeys=['SetFontSize','SetTextColor','SetBorderColor','SetBackgroundColor','PlayAlertSound','PlayAlertSoundPositional','PlayEffect','MinimapIcon'];
function appearance(block){
 const style={},warnings=[];
 for(const c of block.commands){if(!styleKeys.includes(c.cmd))continue;const error=E.validate(c.cmd,c.args);if(error){warnings.push(c.cmd+': '+error);continue;}style[c.cmd]=c.args.join(' ');}
 const base=block.commands.find(c=>c.cmd==='BaseType'),cls=block.commands.find(c=>c.cmd==='Class');
 const exactNames=base&&base.args[0]==='==';
 const names=base?base.args.filter(v=>!['=','==','!','!='].includes(v)):cls?cls.args.filter(v=>!['=','==','!','!='].includes(v)).map(v=>v+' · 예시'):['아이템 이름 · 예시'];
 const rarity=block.commands.find(c=>c.cmd==='Rarity');
 const r=rarity?.args.find(v=>['Normal','Magic','Rare','Unique'].includes(v));
 const defaultText={Normal:'200 200 200',Magic:'136 136 255',Rare:'255 255 119',Unique:'175 96 37'}[r]||'200 200 200';
 return {style,names:[...new Set(names.length?names:['아이템 이름 · 예시'])],hidden:block.mode==='Hide',defaultText,exactNames:!!exactNames,warnings,continues:block.commands.some(c=>c.cmd==='Continue')};
}
const api={appearance};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FilterPreview=api;
})(typeof window!=='undefined'?window:globalThis);
