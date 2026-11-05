/* POE2 league IDs from the bounded catalog; active event/challenge corroborated
   2026-11-05 with GGG's Forbidden Rites FAQ. Listing statuses follow POE2 Oracle's
   live-verified mapping. These are browser-link settings, not API calls. */
(function(root){function extend(data){data.leagues=[
{id:'Forbidden Rites',name:'금단의 의식 · 이벤트'},
{id:'HC Forbidden Rites',name:'금단의 의식 · 하드코어'},
{id:'Runes of Aldur',name:'알두르의 룬 · 챌린지'},
{id:'HC Runes of Aldur',name:'알두르의 룬 · 하드코어'},
{id:'Standard',name:'스탠다드'},
{id:'Hardcore',name:'하드코어'}];
data.defaultLeague='Forbidden Rites';data.market={checkedAt:'2026-11-05',statuses:[
{id:'available',name:'즉시 구매 + 대면 거래'},
{id:'securable',name:'즉시 구매만'},
{id:'onlineleague',name:'대면 · 해당 리그에서 온라인'},
{id:'online',name:'대면 · 온라인'},
{id:'any',name:'전체 · 오프라인 포함'}],currencies:[{id:'divine',name:'신성한 오브 (딥)'},{id:'exalted',name:'엑잘티드 오브 (엑)'},{id:'chaos',name:'카오스 오브'}],leagueSource:'https://poe.kakaogames.com/forum/view-thread/4000434',statusSource:'https://github.com/mttzzz/poe2-oracle/blob/25b75b5e5c5e456e1557eacbfc0beaf0f1f472b4/crates/trade-client/src/lib.rs'};return data;}if(typeof module!=='undefined'&&module.exports)module.exports=extend;else extend(root.TradeData);})(typeof window!=='undefined'?window:globalThis);
