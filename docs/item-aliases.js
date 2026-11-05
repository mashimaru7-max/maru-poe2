/* Item aliases: observed usage and explicitly labelled search helpers stay separate. */
(function(root){'use strict';
const sources={mageGuide:{title:'한국어 POE2 마법사의 피 빌드 가이드',type:'POE2 작성자 가이드',url:'https://mobalytics.gg/poe-2/profile/kingpinuwu/builds/0beoteun-gureugi-bildeu-jonghab-tib-mic-mapi-beojeon-pob'},mageUsage:{title:'인벤 POE2 · 마피 관련 질문',type:'한국 POE2 사용례',url:'https://www.inven.co.kr/board/poe/6317/39339'},uniqueUsage:{title:'한국 POE2 플레이 후기 · 마피·헤헌·레스피스 표기',type:'한국 POE2 사용례',url:'https://enter.dcinside.com/mgallery/board/view/?id=poe2&no=435934&page=1'},itemHelpers:{title:'공방의 고유 아이템 검색 보조 규칙',type:'검색 보조 규칙',url:'https://github.com/mashimaru7-max/maru-poe2/blob/main/docs/item-aliases.js'}};
const helper=text=>({text,kind:'검색 보조',sources:['itemHelpers']}),observed=(text,refs)=>({text,kind:'사용례 확인',sources:refs});
const entries=[
 {name:'Mageblood',aliases:[observed('마피',['mageGuide','mageUsage']),...['메이지블러드','매지블러드','MB'].map(helper)]},
 {name:'Headhunter',aliases:[observed('헤헌',['uniqueUsage'])]},
 {name:'Hand of Wisdom and Action',aliases:['지행','지행손','호와','HOWA'].map(helper)},
 {name:'Dream Fragments',aliases:['꿈조'].map(helper)},
 {name:'Queen of the Forest',aliases:['숲퀸'].map(helper)},
 {name:'Morior Invictus',aliases:['모리오스'].map(helper)},
 {name:'Rathpith Globe',aliases:[observed('레스피스',['uniqueUsage'])]},
 {name:'Astramentis',aliases:['아스트라멘티스','아스트라'].map(helper)},
 {name:'The Adorned',aliases:['치장'].map(helper)},
 {name:'Temporalis',aliases:['템포'].map(helper)}
];
function wordInitials(name){const words=String(name).normalize('NFKC').trim().split(/\s+/u);if(words.length<2||words.length>6||!words.every(x=>/^[가-힣]/u.test(x)))return null;return words.map(x=>[...x][0]).join('');}
const api={checkedAt:'2026-11-05',sources,entries,wordInitials};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ItemNameAliases=api;
})(typeof window!=='undefined'?window:globalThis);
