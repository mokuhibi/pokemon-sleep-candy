'use strict';
// 日付は端末の時差に左右されないよう、日本時間の朝4時で統一します。
const CandyCore = (() => {
 const SK=typeof MainSkillMaster!=='undefined'?MainSkillMaster:require('./main-skill-master.js');
 const DAY=86400000, pad=n=>String(n).padStart(2,'0');
 const isoDay=d=>d.toISOString().slice(0,10);
 const gameDay=value=>isoDay(new Date(new Date(value).getTime()+5*3600000));
 const localInput=(value=new Date())=>new Date(new Date(value).getTime()+9*3600000).toISOString().slice(0,16);
 const fromInput=value=>new Date(value+':00+09:00');
 const dateOnly=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&isoDay(new Date(s))===s;
 const addDays=(s,n)=>isoDay(new Date(Date.parse(s)+n*DAY));
 function range(kind,day){
  if(kind==='all')return null;
  if(kind==='week'){const dow=(new Date(day).getUTCDay()+6)%7;const start=addDays(day,-dow);return [start,addDays(start,7)];}
  if(kind==='month'){const start=day.slice(0,7)+'-01',d=new Date(start);d.setUTCMonth(d.getUTCMonth()+1);return [start,isoDay(d)];}
  return [day,addDays(day,1)];
 }
 const inRange=(r,period)=>!period||(gameDay(r.datetime)>=period[0]&&gameDay(r.datetime)<period[1]);
 const mewAmounts=level=>level<=5?[1]:[1,level-4];
 // 保存用の種名は変更せず、旧サイズ名を表示時に読み替えます。
 const speciesName=name=>typeof name==='string'?name.replace(/((?:バケッチャ|パンプジン)\()(こだま|ちゅうだま|おおだま|ギガだま)(\))/g,'$1$2しゅ$3'):name;
 const shardType=species=>SK.species[species]?.shardMode||null;
 const shardAmounts=(type,level)=>{if(!Number.isInteger(level)||level<1||level>(type==='lucky'?7:8))return [];return type==='fixed'?[[240,340,480,670,920,1260,1800,2500][level-1]]:type==='lucky'?[0,[500,720,1030,1440,2000,2800,4000][level-1],[2500,3600,5150,7200,10000,14000,20000][level-1]]:[];};
 function weeklyTotals(records,day){const start=range('week',day)[0];const days=Array.from({length:7},(_,i)=>({date:addDays(start,i),amount:0}));for(const r of records){const d=gameDay(r.datetime),item=days.find(x=>x.date===d);if(item)item.amount+=r.amount;}return days;}
 const mewSkills=SK.mewEntries().map(s=>s.legacyName);
 const weekday=day=>dateOnly(day)?'（'+['日','月','火','水','木','金','土'][new Date(day).getUTCDay()]+'）':'';
 const displayDate=day=>day+weekday(day);
 // ミュウの同一発動から、集計専用のかけら行を作ります。保存・履歴表示は元の1件だけです。
 const mewShardRecords=records=>records.filter(r=>r.method==='mew'&&SK.id(r.firedSkill)==='dream_shard_s').map(r=>{const p=r.context?.actor||r.context?.team?.[r.context?.actorSlot-1];return {id:r.id,datetime:r.datetime,method:'skill',amount:r.shardAmount,pokemonId:p?.id||r.context?.actorId||'unknown-mew',pokemon:p?.nickname||'ミュウ',species:'ミュウ',slot:r.context?.actorSlot??null,pokemonSnapshot:p,skillName:r.firedSkill,skillLevel:r.context?.effectiveLevel,source:'mew'};});
 const profileDefault=species=>({level:1,nature:species==='ミュウ'?'きまぐれ':'',skillLevel:1,subskills:['','','','','']});
 const skillCap=species=>species==='デリバード'||shardType(species)==='lucky'?7:8;
 const profileValid=(p,species,legacy=false)=>p&&Number.isInteger(p.level)&&p.level>=1&&p.level<=100&&typeof p.nature==='string'&&p.nature.length>0&&(species!=='ミュウ'||p.nature==='きまぐれ')&&Number.isInteger(p.skillLevel)&&p.skillLevel>=1&&p.skillLevel<=(legacy?8:skillCap(species))&&Array.isArray(p.subskills)&&p.subskills.length===5&&p.subskills.every(x=>typeof x==='string')&&new Set(p.subskills.filter(Boolean)).size===p.subskills.filter(Boolean).length;
 function eventFor(events,day,method){const e=events.find(e=>e.start<=day&&day<=e.end&&(e.target==='both'||e.target===method));return e?{id:e.id,name:e.name,multiplier:e.multiplier,boost:e.boost}:{id:null,name:'通常',multiplier:1,boost:0};}
 // リサーチEXPの加算条件は記録時のレベルで決まります。
 const shardTotal=r=>r.method==='research'?r.baseAmount+(r.researchLevel===70?r.researchExp:0):r.amount;
 function validateShards(records){
  if(!Array.isArray(records))throw Error('ゆめのかけら履歴');const ids=new Set();
  const count=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000;
  for(const r of records){
   if(!r||typeof r.id!=='string'||ids.has(r.id)||typeof r.datetime!=='string'||!Number.isFinite(Date.parse(r.datetime))||!['skill','lucky','research','other'].includes(r.method)||!Number.isSafeInteger(r.amount)||r.amount<0)throw Error('ゆめのかけら履歴');ids.add(r.id);
   if(['skill','lucky'].includes(r.method)&&(!count(r.amount)||(r.method==='skill'&&r.amount===0)||typeof r.pokemonId!=='string'||typeof r.pokemon!=='string'||typeof r.species!=='string'||!Number.isInteger(r.slot)||r.slot<1||r.slot>5))throw Error('ゆめのかけらスキル履歴');
   if(r.method==='lucky'&&((shardType(r.species)!=='lucky'&&SK.id(r.skillId||r.skillName)!=='super_luck')||(!r.amountCorrected&&!shardAmounts('lucky',r.skillLevel).includes(r.amount))))throw Error('きょううん履歴');
   if(r.skillLevel!==undefined&&(!Number.isInteger(r.skillLevel)||r.skillLevel<1||r.skillLevel>8))throw Error('記録時スキルレベル');
   if(r.skillType==='fixed'&&((shardType(r.species)!=='fixed'&&SK.id(r.skillId||r.skillName)!=='dream_shard_s')||(!r.amountCorrected&&!shardAmounts('fixed',r.skillLevel).includes(r.amount))))throw Error('固定値スキル履歴');
   if(r.targetDate!==undefined&&(!dateOnly(r.targetDate)||r.targetDate!==gameDay(r.datetime)))throw Error('リサーチ対象日');
   if(r.method==='research'&&(!count(r.baseAmount)||!count(r.researchExp)||!Number.isInteger(r.researchLevel)||r.researchLevel<1||r.researchLevel>70||r.amount!==shardTotal(r)))throw Error('リサーチ履歴');
   if(r.method==='other'&&(!count(r.amount)||typeof r.memo!=='string'))throw Error('その他のゆめのかけら履歴');
  }
 }
 function migrate(raw,map){
  if(!raw||![1,2].includes(raw.version)||!Array.isArray(raw.pokemon)||!Array.isArray(raw.records)||!Array.isArray(raw.team)||raw.team.length!==5)throw Error('保存形式');
  const shardRecords=raw.shardRecords??[];validateShards(shardRecords);
  const ids=new Set();
  for(const p of raw.pokemon){if(!p||(p.shardSkill!==undefined&&typeof p.shardSkill!=='boolean')||(p.mainSkill!==undefined&&(typeof p.mainSkill!=='string'||!p.mainSkill.trim()))||(p.mainSkillId!==undefined&&(typeof p.mainSkillId!=='string'||!p.mainSkillId.trim()))||typeof p.id!=='string'||ids.has(p.id)||!Object.hasOwn(map,p.species)||typeof p.nickname!=='string'||(p.profile!=null&&!profileValid(p.profile,p.species,true)))throw Error('個体情報');ids.add(p.id);}
  const occupied=raw.team.filter(x=>x!==null);if(occupied.some(id=>!ids.has(id))||new Set(occupied).size!==occupied.length)throw Error('編成');
  const rids=new Set();for(const r of raw.records){
   if(!r||typeof r.id!=='string'||rids.has(r.id)||!['help','mew','delibird'].includes(r.method)||typeof r.datetime!=='string'||!Number.isFinite(Date.parse(r.datetime)))throw Error('履歴');rids.add(r.id);
   const noCandy=(r.method==='delibird'&&r.amount===0&&r.slot===6)||(r.method==='mew'&&r.amount===0&&r.slot===null&&(r.firedSkill!==undefined||r.registeredMainSkill!==undefined));
   if(r.recordedSkillLevel!==undefined&&(!Number.isInteger(r.recordedSkillLevel)||r.recordedSkillLevel<1||r.recordedSkillLevel>8))throw Error('記録時スキルLv');
   if(r.registeredMainSkill!==undefined&&(typeof r.registeredMainSkill!=='string'||!r.registeredMainSkill.trim()))throw Error('記録時メインスキル');
   if(r.firedSkill!==undefined&&(r.method!=='mew'||!mewSkills.slice(1).includes(r.firedSkill)||!r.context||!Number.isSafeInteger(r.shardAmount)||r.shardAmount<0||r.shardAmount>1000000000||(SK.id(r.firedSkill)==='dream_shard_s'?r.shardAmount===0:r.shardAmount!==0)))throw Error('ミュウ発動スキル');
   if(noCandy){if((r.method==='mew'&&!r.context)||r.candy!==null||r.pokemonId!==null)throw Error('アメなし');}
   else if(!Object.hasOwn(map,r.species)||r.candy!==map[r.species]||typeof r.pokemonId!=='string'||typeof r.pokemon!=='string'||!(Number.isInteger(r.slot)&&r.slot>=1&&r.slot<=5||r.method!=='help'&&r.slot===null)||!(r.method==='help'?r.amount===2:r.method==='mew'?[1,2,3,4].includes(r.amount):r.amount===4))throw Error('アメ履歴');
   if(r.context!=null){const c=r.context;if(!Array.isArray(c.team)||c.team.length!==5)throw Error('記録時編成');
    for(const p of c.team)if(p!==null&&(!p||typeof p.id!=='string'||typeof p.nickname!=='string'||!Object.hasOwn(map,p.species)||(p.profile!=null&&!profileValid(p.profile,p.species,true))))throw Error('記録時個体');
    if(r.method!=='help'){
     const actor=c.actor || c.team[c.actorSlot-1];
     const outside=r.method==='mew'&&c.actorSlot===null&&c.rulesVersion===3;
     if(!actor||actor.id!==c.actorId||actor.species!==(r.method==='mew'?'ミュウ':'デリバード')||!profileValid(actor.profile,actor.species,c.rulesVersion!==3)||(!outside&&(!Number.isInteger(c.actorSlot)||c.actorSlot<1||c.actorSlot>5||c.team[c.actorSlot-1]?.id!==actor.id))||!c.event||![1,1.25,1.5].includes(c.event.multiplier)||!Number.isInteger(c.event.boost)||c.event.boost<0||c.event.boost>7||c.effectiveLevel!==Math.min(c.rulesVersion===3?skillCap(actor.species):8,actor.profile.skillLevel+c.event.boost))throw Error('スキル個体');
     // ミュウのアメ数は手動選択。旧記録の2・3個も上の検証で受け入れます。
    }
   }
  }
  const events=raw.version===2?raw.events:(raw.events??[]);if(!Array.isArray(events))throw Error('イベント');const eids=new Set();
  for(const e of events){if(!e||typeof e.id!=='string'||eids.has(e.id)||typeof e.name!=='string'||!dateOnly(e.start)||!dateOnly(e.end)||e.start>e.end||!['both','mew','delibird'].includes(e.target)||![1,1.25,1.5].includes(e.multiplier)||!Number.isInteger(e.boost)||e.boost<0||e.boost>7)throw Error('イベント設定');eids.add(e.id);}
  for(let i=0;i<events.length;i++)for(let j=i+1;j<events.length;j++){const a=events[i],b=events[j];if(a.start<=b.end&&b.start<=a.end&&(a.target==='both'||b.target==='both'||a.target===b.target))throw Error('イベント期間が重複しています');}
  if(raw.version===2&&(!raw.settings||typeof raw.settings.mew!=='boolean'||typeof raw.settings.delibird!=='boolean'))throw Error('表示設定');
  return {...raw,version:2,shardRecords,pokemon:raw.pokemon.map((p,i)=>({...p,registrationOrder:Number.isFinite(p.registrationOrder)?p.registrationOrder:i,profile:p.profile?{...p.profile,skillLevel:Math.min(skillCap(p.species),p.profile.skillLevel)}:null})),team:raw.team,records:raw.records.map(r=>({...r,context:r.context||null})),events,settings:raw.settings||{mew:true,delibird:true}};
 }
 const sum=rs=>rs.reduce((n,r)=>n+r.amount,0);
 return {gameDay,localInput,fromInput,dateOnly,addDays,range,inRange,mewAmounts,profileDefault,profileValid,skillCap,eventFor,migrate,sum,shardTotal,validateShards,speciesName,shardType,shardAmounts,weeklyTotals,mewSkills,weekday,displayDate,mewShardRecords};
})();
if(typeof module!=='undefined')module.exports=CandyCore;
