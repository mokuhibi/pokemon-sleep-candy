'use strict';
// 日付は端末の時差に左右されないよう、日本時間の朝4時で統一します。
const CandyCore = (() => {
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
 const profileDefault=species=>({level:1,nature:species==='ミュウ'?'きまぐれ':'',skillLevel:1,subskills:['','','','','']});
 const skillCap=species=>species==='デリバード'?7:8;
 const profileValid=(p,species,legacy=false)=>p&&Number.isInteger(p.level)&&p.level>=1&&p.level<=100&&typeof p.nature==='string'&&p.nature.length>0&&(species!=='ミュウ'||p.nature==='きまぐれ')&&Number.isInteger(p.skillLevel)&&p.skillLevel>=1&&p.skillLevel<=(legacy?8:skillCap(species))&&Array.isArray(p.subskills)&&p.subskills.length===5&&p.subskills.every(x=>typeof x==='string')&&new Set(p.subskills.filter(Boolean)).size===p.subskills.filter(Boolean).length;
 function eventFor(events,day,method){const e=events.find(e=>e.start<=day&&day<=e.end&&(e.target==='both'||e.target===method));return e?{id:e.id,name:e.name,multiplier:e.multiplier,boost:e.boost}:{id:null,name:'通常',multiplier:1,boost:0};}
 function migrate(raw,map){
  if(!raw||![1,2].includes(raw.version)||!Array.isArray(raw.pokemon)||!Array.isArray(raw.records)||!Array.isArray(raw.team)||raw.team.length!==5)throw Error('保存形式');
  const ids=new Set();
  for(const p of raw.pokemon){if(!p||typeof p.id!=='string'||ids.has(p.id)||!Object.hasOwn(map,p.species)||typeof p.nickname!=='string'||(p.profile!=null&&!profileValid(p.profile,p.species,true)))throw Error('個体情報');ids.add(p.id);}
  const occupied=raw.team.filter(x=>x!==null);if(occupied.some(id=>!ids.has(id))||new Set(occupied).size!==occupied.length)throw Error('編成');
  const rids=new Set();for(const r of raw.records){
   if(!r||typeof r.id!=='string'||rids.has(r.id)||!['help','mew','delibird'].includes(r.method)||typeof r.datetime!=='string'||!Number.isFinite(Date.parse(r.datetime)))throw Error('履歴');rids.add(r.id);
   const noCandy=r.method==='delibird'&&r.amount===0&&r.slot===6;
   if(noCandy){if(r.candy!==null||r.pokemonId!==null)throw Error('アメなし');}
   else if(!Object.hasOwn(map,r.species)||r.candy!==map[r.species]||typeof r.pokemonId!=='string'||typeof r.pokemon!=='string'||!(Number.isInteger(r.slot)&&r.slot>=1&&r.slot<=5||r.method!=='help'&&r.slot===null)||!(r.method==='help'?r.amount===2:r.method==='mew'?[1,2,3,4].includes(r.amount):r.amount===4))throw Error('アメ履歴');
   if(r.context!=null){const c=r.context;if(!Array.isArray(c.team)||c.team.length!==5)throw Error('記録時編成');
    for(const p of c.team)if(p!==null&&(!p||typeof p.id!=='string'||typeof p.nickname!=='string'||!Object.hasOwn(map,p.species)||(p.profile!=null&&!profileValid(p.profile,p.species,true))))throw Error('記録時個体');
    if(r.method!=='help'){
     const actor=c.actor || c.team[c.actorSlot-1];
     const outside=r.method==='mew'&&c.actorSlot===null&&c.rulesVersion===3;
     if(!actor||actor.id!==c.actorId||actor.species!==(r.method==='mew'?'ミュウ':'デリバード')||!profileValid(actor.profile,actor.species,c.rulesVersion!==3)||(!outside&&(!Number.isInteger(c.actorSlot)||c.actorSlot<1||c.actorSlot>5||c.team[c.actorSlot-1]?.id!==actor.id))||!c.event||![1,1.25,1.5].includes(c.event.multiplier)||!Number.isInteger(c.event.boost)||c.event.boost<0||c.event.boost>7||c.effectiveLevel!==Math.min(c.rulesVersion===3?skillCap(actor.species):8,actor.profile.skillLevel+c.event.boost))throw Error('スキル個体');
     if(r.method==='mew'&&!mewAmounts(c.effectiveLevel).includes(r.amount))throw Error('スキル個数');
    }
   }
  }
  const events=raw.version===2?raw.events:(raw.events??[]);if(!Array.isArray(events))throw Error('イベント');const eids=new Set();
  for(const e of events){if(!e||typeof e.id!=='string'||eids.has(e.id)||typeof e.name!=='string'||!dateOnly(e.start)||!dateOnly(e.end)||e.start>e.end||!['both','mew','delibird'].includes(e.target)||![1,1.25,1.5].includes(e.multiplier)||!Number.isInteger(e.boost)||e.boost<0||e.boost>7)throw Error('イベント設定');eids.add(e.id);}
  for(let i=0;i<events.length;i++)for(let j=i+1;j<events.length;j++){const a=events[i],b=events[j];if(a.start<=b.end&&b.start<=a.end&&(a.target==='both'||b.target==='both'||a.target===b.target))throw Error('イベント期間が重複しています');}
  if(raw.version===2&&(!raw.settings||typeof raw.settings.mew!=='boolean'||typeof raw.settings.delibird!=='boolean'))throw Error('表示設定');
  return {...raw,version:2,pokemon:raw.pokemon.map((p,i)=>({...p,registrationOrder:Number.isFinite(p.registrationOrder)?p.registrationOrder:i,profile:p.profile?{...p.profile,skillLevel:Math.min(skillCap(p.species),p.profile.skillLevel)}:null})),team:raw.team,records:raw.records.map(r=>({...r,context:r.context||null})),events,settings:raw.settings||{mew:true,delibird:true}};
 }
 const sum=rs=>rs.reduce((n,r)=>n+r.amount,0);
 return {gameDay,localInput,fromInput,dateOnly,addDays,range,inRange,mewAmounts,profileDefault,profileValid,skillCap,eventFor,migrate,sum};
})();
if(typeof module!=='undefined')module.exports=CandyCore;
