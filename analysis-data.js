// 表示専用の集計。履歴や保存データを変更しません。
const AnalysisData=(()=>{
 // 現在の編成は参照しません。当時の5枠と同じアメを使う枠を調べます。
 function targetSlot(record,map){
  const team=record.context?.team,candy=record.candy;
  if(!Array.isArray(team)||team.length!==5||typeof candy!=='string'||!candy)return null;
  const matches=[];
  for(let i=0;i<5;i++){
   const p=team[i];if(p===null)continue;
   if(!p||!Object.hasOwn(map,p.species))return null;
   if(map[p.species]===candy)matches.push(i+1);
  }
  if(matches.length!==1)return null;
  // 保存された枠と当時の編成が矛盾する記録も、推測せず除外します。
  if(record.slot!=null&&record.slot!==matches[0])return null;
  return matches[0];
 }
 function prepare(source,method,actor='',amount='',map=typeof candyMap!=='undefined'?candyMap:{}){
  const selected=source.filter(r=>!actor||r.context?.actorId===actor);
  const destinations=Array.from({length:method==='mew'?5:6},(_,i)=>i+1);
  const valid=selected.filter(r=>Number.isInteger(r.context?.actorSlot)&&r.context.actorSlot>=1&&r.context.actorSlot<=5&&(method==='mew'?[1,2,3,4].includes(r.amount):!!r.context.actorId&&destinations.includes(r.slot)));
  const records=valid.filter(r=>method==='mew'||amount===''||r.amount===Number(amount));
  const targets=new Map(records.map(r=>[r,method==='mew'?targetSlot(r,map):r.slot]));
  const targetRecords=records.filter(r=>targets.get(r)!==null);
  const positions=[...new Set(records.map(r=>r.context.actorSlot))].sort((a,b)=>a-b);
  const definitions=method==='mew'?[['1個',r=>r.amount===1],['2〜4個',r=>[2,3,4].includes(r.amount)],['1個・4個 合計',r=>[1,4].includes(r.amount)]]:[['すべて',()=>true]];
  const groups=definitions.map(([name,matches])=>({name,rows:positions.map(position=>{
   // 各表とも同じ位置の全記録を分母にし、獲得数で分母を変えません。
   const all=records.filter(r=>r.context.actorSlot===position),xs=all.filter(matches);
   return {position,denominator:all.length,count:xs.length,percent:Math.round(1000*xs.length/all.length)/10,unknown:xs.filter(r=>targets.get(r)===null).length,cells:destinations.map(target=>{const count=xs.filter(r=>targets.get(r)===target).length;return {target,count,percent:100*count/all.length};})};
  })}));
  // 分類が網羅的な2群は、同じ小数1桁で合計100%になるよう表示値を揃えます。
  if(method==='mew')groups[1].rows.forEach((row,i)=>{row.percent=100-groups[0].rows[i].percent;});
  // 獲得先の条件付き割合。各分類自身の件数を分母にします。
  const destinationGroups=method==='mew'?[['全体',()=>true],...definitions.slice(0,2)].map(([name,matches])=>({name,rows:positions.map(position=>{
   const xs=targetRecords.filter(r=>r.context.actorSlot===position&&matches(r));
   return {position,count:xs.length,unknown:xs.filter(r=>targets.get(r)===null).length,cells:destinations.map(target=>{const events=xs.filter(r=>targets.get(r)===target),count=events.length;return {target,count,percent:xs.length?100*count/xs.length:null,candyAmount:events.reduce((sum,r)=>sum+r.amount,0)};})};
  })})):[];
  return {records,excluded:selected.length-valid.length,destinations,groups,destinationGroups,targetRecords,targetExcluded:records.length-targetRecords.length};
 }
 return {prepare,targetSlot};
})();
if(typeof module!=='undefined')module.exports=AnalysisData;
