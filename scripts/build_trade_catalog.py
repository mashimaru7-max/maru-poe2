"""Offline, reproducible POE2 trade snapshot. Never calls an internal trade API.
Usage: python scripts/build_trade_catalog.py --filters-source PATH --exchange-source PATH
Sources must be the pinned upstream Git checkouts listed in docs/TRADE_COVERAGE.md.
"""
import argparse,json,re,subprocess,gzip,base64
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def dump(o):return json.dumps(o,ensure_ascii=False,separators=(',',':'))
def build(filters_root,exchange_root):
 for directory,expected in [(filters_root,'ae8f72832392000ed6259d0d758bc8d8a3739c88'),(exchange_root,'cca30662bf31eaf38bd711e2ec1a6b899a06c40e')]:
  actual=subprocess.check_output(['git','-C',str(directory),'rev-parse','HEAD'],text=True).strip()
  if actual!=expected:raise ValueError('Upstream commit differs from documented snapshot; update provenance and review mappings first: '+str(directory))
 f=json.loads((filters_root/'packages/web/src/data/filters.json').read_text())
 src=exchange_root/'renderer/public/data/ko'
 raw=[json.loads(l) for l in (src/'items.ndjson').read_text().splitlines()]
 stats=[json.loads(l) for l in (src/'stats.ndjson').read_text().splitlines()]
 groups=[('all','전체'),('weapon','무기'),('armour','방어구·보조'),('accessory','장신구'),('jewel','주얼'),('flask','플라스크·호신부'),('gem','젬'),('map','엔드게임·시험'),('currency','화폐·재료'),('other','기타')]
 names={'weapon.oneaxe':'한손 도끼','weapon.onemace':'한손 철퇴','weapon.spear':'창','weapon.onemelee':'한손 근접 무기 전체','weapon.twoaxe':'양손 도끼','weapon.twomace':'양손 철퇴','weapon.warstaff':'육척봉','weapon.twomelee':'양손 근접 무기 전체','weapon.talisman':'부적','weapon.bow':'활','weapon.crossbow':'쇠뇌','weapon.ranged':'원거리 무기 전체','weapon.wand':'마법봉','weapon.sceptre':'셉터','weapon.staff':'지팡이','weapon.caster':'주문 무기 전체','weapon':'무기 전체','armour.helmet':'투구','armour.chest':'갑옷','armour.gloves':'장갑','armour.boots':'장화','armour.quiver':'화살통','armour.shield':'방패','armour.focus':'집중구','armour.buckler':'버클러','armour':'방어구 전체','accessory.amulet':'목걸이','accessory.belt':'허리띠','accessory.ring':'반지','accessory':'장신구 전체','jewel':'주얼','flask.life':'생명력 플라스크','flask.mana':'마나 플라스크','flask.charm':'호신부','flask':'플라스크 전체','map.waystone':'경로석','map.tablet':'서판','gem.activegem':'스킬 젬','gem.supportgem':'보조 젬','gem.metagem':'메타 젬','sanctum.relic':'유물','map.fragment':'조각','map.barya':'진 바리야','map.ultimatum':'새겨진 결전','map.logbook':'탐험 일지','map.breachstone':'균열석','map.bosskey':'최종 보스 열쇠','currency':'화폐·제작 재료','currency.socketable':'장착 재료','currency.omen':'징조','weapon.claw':'클로','weapon.dagger':'단검','weapon.onesword':'한손 검','weapon.twosword':'양손 검','weapon.flail':'도리깨','weapon.rod':'낚싯대','card':'점술 카드'}
 aliases={'weapon':['무기'],'armour':['방어구'],'accessory':['장신구'],'flask':['플라스크'],'armour.boots':['신발','부츠'],'weapon.onemace':['한손철퇴','한손망치'],'weapon.twomace':['양손철퇴','양손망치'],'weapon.warstaff':['쿼터스태프'],'weapon.crossbow':['크로스보우'],'weapon.spear':['스피어'],'weapon.wand':['완드'],'weapon.sceptre':['홀'],'accessory.belt':['벨트'],'accessory.amulet':['아뮬렛'],'jewel':['쥬얼'],'gem.activegem':['스킬젬','액티브젬'],'gem.supportgem':['보조젬','서폿젬'],'map.ultimatum':['결전'],'currency.socketable':['룬','영혼핵']}
 uncertain={'weapon.claw','weapon.dagger','weapon.onesword','weapon.twosword','weapon.flail','weapon.rod','card'}
 categories=[{'id':'__all__','name':'전체 아이템','group':'all','aliases':['전체아이템'],'queryId':None}]
 for cid,name in names.items():
  group='map' if cid.startswith(('map.','sanctum.')) else 'other' if cid=='card' else cid.split('.')[0]
  categories.append({'id':cid,'name':name,'group':group,'aliases':list(dict.fromkeys([name]+aliases.get(cid,[]))), 'source':'filters' if cid in {c['id'] for c in f['categories']} else 'oracle+exchange','availability':'거래 분류 확인 · 출시·매물 미확인' if cid in uncertain else '자료 스냅샷 기준'})
 # Class -> verified trade category. No reuse of legacy POE1 classes without POE2 provenance.
 classes={'Body Armour':'armour.chest','Helmet':'armour.helmet','Gloves':'armour.gloves','Boots':'armour.boots','Shield':'armour.shield','Buckler':'armour.buckler','Focus':'armour.focus','Quiver':'armour.quiver','One Hand Mace':'weapon.onemace','Two Hand Mace':'weapon.twomace','Warstaff':'weapon.warstaff','Spear':'weapon.spear','Bow':'weapon.bow','Crossbow':'weapon.crossbow','Wand':'weapon.wand','Sceptre':'weapon.sceptre','Staff':'weapon.staff','Talisman':'weapon.talisman','One Hand Axe':'weapon.oneaxe','Two Hand Axe':'weapon.twoaxe','One Hand Sword':'weapon.onesword','Two Hand Sword':'weapon.twosword','Dagger':'weapon.dagger','Flail':'weapon.flail','Ring':'accessory.ring','Amulet':'accessory.amulet','Belt':'accessory.belt','Jewel':'jewel','Flask':'flask','Charm':'flask.charm','Active Skill Gem':'gem.activegem','Support Skill Gem':'gem.supportgem','MetaSkillGem':'gem.metagem','Map':'map.waystone','TowerAugment':'map.tablet','Relic':'sanctum.relic','MapFragment':'map.fragment','Breachstone':'map.breachstone','ExpeditionLogbook':'map.logbook','PinnacleKey':'map.bosskey','Currency':'currency','UncutSkillGem':'currency','VaultKey':'currency','SoulCore':'currency.socketable','Omen':'currency.omen','MiscMapItem':'__all__','BrequelFruit':'__all__'}
 byname={x.get('refName'):x for x in raw if x.get('namespace')!='UNIQUE' and x.get('name')}
 items=[];excluded=[];seen=set()
 for x in raw:
  if not x.get('name') or not x.get('refName'):continue
  cls=x.get('craftable',{}).get('category');base=x.get('unique',{}).get('base');unique=x.get('namespace')=='UNIQUE'
  if unique:cls=byname.get(base,{}).get('craftable',{}).get('category')
  if cls not in classes:excluded.append({'name':x['name'],'class':cls,'reason':'퀘스트·레거시·분류 미확인'});continue
  cid=classes[cls]
  if x['refName']=='Djinn Barya':cid='map.barya'
  if x['refName']=='Inscribed Ultimatum':cid='map.ultimatum'
  if cls=='Flask':cid='flask.life' if 'Life' in x['refName'] else 'flask.mana' if 'Mana' in x['refName'] else 'flask'
  if unique and not base:continue
  key=x['refName']+'|'+(base or '')
  if key in seen:continue
  seen.add(key)
  row={'key':key,'name':x['name'],'nameEn':x['refName'],'category':cid,'type':base or x['refName'],'unique':unique,'itemClass':cls,'aliases':[]}
  if cls=='UncutSkillGem':
   level=re.fullmatch(r'(Uncut (?:Skill|Spirit|Support) Gem) \(Level (\d+)\)',x['refName'])
   if level:row['type']=level[1];row['intrinsic']={'gem_level':int(level[2])}
  if unique:row['baseKo']=byname.get(base,{}).get('name',base)
  if x.get('tradeTag'):row['exchangeId']=x['tradeTag']
  items.append(row)
 # Reuse the site's documented alias inventory, joined only by exact English name.
 # Read it as data via Node to avoid duplicating or mutating the dictionary implementation.
 alias_data=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./docs/currency-aliases.js').entries))"],cwd=ROOT,text=True))
 alias_byname={x['name']:x for x in alias_data}
 for x in items:
  a=alias_byname.get(x['nameEn'],{})
  x['aliases']=[v['text'] for v in a.get('aliases',[]) if len(v.get('text',''))>1]
  if x['nameEn']=='Headhunter':x['aliases'].append('헤헌')
 # Every label is joined to exact IDs from the Korean upstream dataset.
 statmap={};unsupported_stats=[];types={'explicit':'명시','implicit':'고정','fractured':'분열','desecrated':'훼손','rune':'룬','crafted':'제작','sanctum':'유물','skill':'스킬','enchant':'인챈트','pseudo':'합산'}
 for x in stats:
  if x.get('trade',{}).get('option') is not None:
   unsupported_stats.extend(sid for ids in (x['trade'].get('ids') or {}).values() for sid in ids);continue
  matcher=next((m for m in x.get('matchers',[]) if m.get('string') and not m.get('negate') and 'value' not in m),None)
  if not matcher:continue
  ko=matcher['string'];local=x.get('id','').startswith('local_')
  for typ,ids in (x.get('trade',{}).get('ids') or {}).items():
   if typ not in types:continue
   for sid in ids:
    statmap.setdefault(sid,{'id':sid,'nameKo':ko,'nameEn':x['ref']+(' (Local)' if local else ''),'name':x['ref'],'type':typ,'local':local,'numericUnsupported':bool(x.get('trade',{}).get('inverted') or x.get('trade',{}).get('count')),'rangeStat':bool(re.match(r'^Adds # to # .+ Damage',x['ref']))})
 # Keep upstream eligibility as positive evidence, not an exhaustive prohibition list.
 eligibility=f['eligibility'];unique_elig=f['uniqueEligibility'];properties={k:list(v) for k,v in f['equipmentFilterIdsByCategory'].items()}
 for cid in names:
  eligibility.setdefault(cid,[]);unique_elig.setdefault(cid,[]);properties.setdefault(cid,[])
 # Repair omitted common added-damage entries by exact stat semantic, not a category-specific parser hack.
 for cid in names:
  if cid.startswith('weapon.') and cid not in {'weapon.wand','weapon.sceptre','weapon.staff','weapon.caster'}:
   for sid in ['explicit.stat_1940865751','explicit.stat_1509134228']:
    if sid in statmap and sid not in eligibility[cid]:eligibility[cid].append(sid)
 fields=[]
 field_names={'damage':('무기 평균 피해',['무기피해평균']),'aps':('초당 공격 횟수',['초당공격횟수','초당공격','aps']),'crit':('무기 치명타 확률',['무기치명타확률','무기치확']),'dps':('무기 DPS',['무기dps','dps','디피에스']),'pdps':('물리 DPS',['물리dps','pdps','물리디피']),'edps':('원소 DPS',['원소dps','edps','원소디피']),'reload_time':('재장전 시간',['재장전시간']),'ward':('룬 수호',['룬수호']),'spirit':('최종 정신력',['최종정신력','장비정신력']),'ilvl':('아이템 레벨',['아이템레벨','아이템렙','템렙','ilvl']),'quality':('품질',['품질','퀄리티','퀄','스킬젬품질','보조젬품질']),'gem_level':('젬 레벨',['젬레벨','젬렙','스킬젬레벨','보조젬레벨','레벨','렙']),'gem_sockets':('젬 보조 소켓',['젬소켓','보조소켓']),'map_tier':('경로석 티어',['경로석티어','티어','tier']),'area_level':('지역 레벨',['지역레벨','지역렙'])}
 all_ids=list(names)
 for fid,(name,als) in field_names.items():
  if fid in {'gem_level','gem_sockets'}:group='misc_filters';cats=[c for c in all_ids if c.startswith('gem.')]
  elif fid=='map_tier':group='map_filters';cats=['map.waystone']
  elif fid=='area_level':group='misc_filters';cats=[c for c in all_ids if c.startswith(('map.','sanctum.'))]
  elif fid in {'ilvl','quality'}:group='type_filters';cats=[c for c in all_ids if not c.startswith('currency') and c!='card']
  else:group='equipment_filters';cats=[c for c in all_ids if fid in properties[c]]
  if not cats:cats=['__all__']
  key='field_'+fid
  fields.append({'key':key,'id':fid,'group':group,'kind':'property','name':name,'aliases':als,'unit':'%' if fid in {'crit','quality'} else '', 'families':['UncutSkillGem'] if fid=='gem_level' else [],'detail':('아이템 고유 수치 · DPS는 직접 지정하며 환산하지 않아요' if group=='equipment_filters' else '종류별 검색 수치'),'categories':cats})
  for cid in cats:
   properties.setdefault(cid,[])
   if fid not in properties[cid]:properties[cid].append(fid)
 # Remaining verified numeric map filters available through the same data-driven controls.
 for fd in f['mapFilters']:
  if fd['id']=='map_tier':continue
  labels={'map_packsize':'몬스터 무리 규모','map_magic_monsters':'몬스터 효과','map_iir':'아이템 희귀도','map_rare_monsters':'몬스터 희귀도','map_revives':'부활 횟수','map_bonus':'경로석 드롭 확률','map_gold':'금 획득','map_experience':'경험치 획득'}
  if fd['id'] not in labels:continue
  fields.append({'key':'field_'+fd['id'],'id':fd['id'],'group':'map_filters','kind':'property','name':labels[fd['id']],'aliases':['경로석'+labels[fd['id']]],'unit':'','detail':'경로석 검색 수치','categories':['map.waystone']})
  properties['map.waystone'].append(fd['id'])
 snapshot={'checkedAt':'2026-11-05','generatedAt':f['generatedAt'],'groups':[{'id':i,'name':n} for i,n in groups],'categories':categories,'items':items,'stats':list(statmap.values()),'eligibility':eligibility,'uniqueEligibility':unique_elig,'properties':properties,'fields':fields,'excludedItems':excluded,'unsupportedStatIds':sorted(set(unsupported_stats))}
 return snapshot
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--filters-source',type=Path,required=True);p.add_argument('--exchange-source',type=Path,required=True);a=p.parse_args();d=build(a.filters_source,a.exchange_source)
 target=ROOT/'docs/trade-catalog.js'
 payload=base64.b64encode(gzip.compress(dump(d).encode('utf-8'),mtime=0)).decode('ascii')
 extension='function extend(data){data.extended=true;data.catalog=snapshot;const oldCategories=data.categories;data.categories=snapshot.categories.map(c=>({...c,aliases:[...new Set([...c.aliases,...(oldCategories.find(o=>o.id===c.id)?.aliases||[])])]}));data.uniqueEligibility=snapshot.uniqueEligibility;data.properties={...data.properties,...snapshot.properties};for(const [cat,ids] of Object.entries(snapshot.eligibility))data.eligibility[cat]=[...new Set([...(data.eligibility[cat]||[]),...ids])];const byId=new Map(data.stats.map(s=>[s.id,s]));for(const s of snapshot.stats)byId.set(s.id,{...byId.get(s.id),...s});data.stats=[...byId.values()].filter(s=>!snapshot.unsupportedStatIds.includes(s.id));for(const d of snapshot.fields)if(!data.curated.some(x=>x.key===d.key))data.curated.push(d);return data;}'
 code="/* Gzip-compressed pinned offline POE2 metadata; see TRADE_COVERAGE.md. */\n(function(root){const encoded="+json.dumps(payload)+";function install(snapshot){"+extension+"return{snapshot,extend};}if(typeof module!=='undefined'&&module.exports){module.exports=install(JSON.parse(require('node:zlib').gunzipSync(Buffer.from(encoded,'base64')).toString('utf8')));}else{root.TradeCatalogReady=(async()=>{if(typeof DecompressionStream==='undefined')throw Error('아이템 자료를 열려면 최신 브라우저가 필요해요.');const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));const text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();install(JSON.parse(text)).extend(root.TradeData);})();}})(typeof window!=='undefined'?window:globalThis);\n"
 target.write_text(code)
 (ROOT/'docs/data/trade-coverage.json').write_text(dump({'checkedAt':d['checkedAt'],'upstreamSnapshotAt':d['generatedAt'],'categories':[dict(c,items=sum(x['category']==c['id'] for x in d['items']),fields=[x['id'] for x in d['fields'] if c['id'] in x['categories']]) for c in d['categories']],'itemCount':len(d['items']),'statCount':len(d['stats']),'excludedItems':d['excludedItems'],'liveVerified':False}))
 print(f"Built {len(d['categories'])} categories, {len(d['items'])} names, {len(d['stats'])} translated stat IDs, {len(d['fields'])} fields")
