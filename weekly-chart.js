'use strict';
const WeeklyChart={
 fitLabels(root){
  this.observers??=new WeakMap();this.observers.get(root)?.disconnect();
  const fit=()=>{for(const label of root.querySelectorAll('.stack-label')){const segment=label.parentElement;label.style.visibility=segment.clientHeight>=16&&segment.clientWidth>=label.scrollWidth+2?'visible':'hidden';}};
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(fit);observer.observe(root);this.observers.set(root,observer);}fit();
 },
 segmentLabel(segment,amount,shards){if(amount){const label=el('span',shards?this.shortAmount(amount):amount.toLocaleString('ja-JP'),'stack-label');segment.append(label);}},
 shortAmount(n){return n>=10000?(n/10000).toFixed(1)+'万':n.toLocaleString('ja-JP');},
 renderShards(root,records,day){
  const sources=[['research','睡眠リサーチ'],['skill','スキル'],['other','その他']];
  const days=C.weeklyTotals(records,day),max=Math.max(1,...days.map(d=>d.amount));
  const parts=sources.map(([key])=>C.weeklyTotals(records.filter(r=>key==='skill'?['skill','lucky'].includes(r.method):r.method===key),day));
  root.replaceChildren();headingTotal(root.id,days.reduce((n,d)=>n+d.amount,0));
  root.append(el('p',`${C.displayDate(days[0].date)} 〜 ${C.displayDate(days[6].date)}`,'weekly-range'));
  const legend=el('div',undefined,'shard-chart-legend');
  for(const [key,name] of sources){if(!SummaryExtras.shardVisible(key))continue;const item=el('span'),swatch=el('i',undefined,'shard-source-'+key);swatch.setAttribute('aria-hidden','true');item.append(swatch,el('span',name));legend.append(item);}root.append(legend);
  const chart=el('div',undefined,'weekly-bars shard-stacked-chart');
  days.forEach((d,i)=>{
   const col=el('div',undefined,'weekly-column'),value=el('span',this.shortAmount(d.amount),'weekly-value'),track=el('div',undefined,'weekly-track'),bar=el('div',undefined,'weekly-bar');
   const detail=C.displayDate(d.date)+'：合計 '+d.amount.toLocaleString('ja-JP')+'個。'+sources.map(([key,name],j)=>SummaryExtras.shardVisible(key)?name+' '+parts[j][i].amount.toLocaleString('ja-JP')+'個':'').filter(Boolean).join('、');
   col.setAttribute('role','img');col.setAttribute('aria-label',detail);col.title=detail;bar.style.height=(d.amount/max*100)+'%';
   for(const [j,[key]] of sources.entries()){const segment=el('span',undefined,'shard-source-'+key);segment.style.height=(d.amount?parts[j][i].amount/d.amount*100:0)+'%';this.segmentLabel(segment,parts[j][i].amount,true);if(!SummaryExtras.shardVisible(key)){segment.style.visibility='hidden';segment.replaceChildren();}bar.append(segment);}
   track.append(bar);col.append(value,track,el('span',['月','火','水','木','金','土','日'][i],'weekly-weekday'));chart.append(col);
  });root.append(chart);this.fitLabels(root);
 },
 renderCandy(root,records,day){
  const sources=[['help','アメ拾い'],['mew','ミュウ'],['delibird','デリバード']].filter(([key])=>enabled(key));if(records.some(r=>r.method==='skill'&&r.amount))sources.push(['skill','その他']);
  const days=C.weeklyTotals(records,day),max=Math.max(1,...days.map(d=>d.amount));
  const parts=sources.map(([key])=>C.weeklyTotals(records.filter(r=>r.method===key),day));
  root.replaceChildren();headingTotal(root.id,days.reduce((n,d)=>n+d.amount,0));
  root.append(el('p',`${C.displayDate(days[0].date)} 〜 ${C.displayDate(days[6].date)}`,'weekly-range'));
  const legend=el('div',undefined,'candy-chart-legend');
  for(const [key,name] of sources){const item=el('span'),swatch=el('i',undefined,'candy-source-'+key);swatch.setAttribute('aria-hidden','true');item.append(swatch,el('span',name));legend.append(item);}root.append(legend);
  const chart=el('div',undefined,'weekly-bars candy-stacked-chart');
  days.forEach((d,i)=>{
   const col=el('div',undefined,'weekly-column'),value=el('span',d.amount.toLocaleString('ja-JP'),'weekly-value'),track=el('div',undefined,'weekly-track'),bar=el('div',undefined,'weekly-bar');
   const detail=C.displayDate(d.date)+'：合計 '+d.amount.toLocaleString('ja-JP')+'個。'+sources.map(([,name],j)=>name+' '+parts[j][i].amount.toLocaleString('ja-JP')+'個').join('、');
   col.setAttribute('role','img');col.setAttribute('aria-label',detail);col.title=detail;bar.style.height=(d.amount/max*100)+'%';
   for(const [j,[key]] of sources.entries()){const segment=el('span',undefined,'candy-source-'+key);segment.style.height=(d.amount?parts[j][i].amount/d.amount*100:0)+'%';this.segmentLabel(segment,parts[j][i].amount,false);bar.append(segment);}
   track.append(bar);col.append(value,track,el('span',['月','火','水','木','金','土','日'][i],'weekly-weekday'));chart.append(col);
  });root.append(chart);this.fitLabels(root);
 },
 render(root,records,day){
  if(root.id==='candy-weekly-chart')return this.renderCandy(root,records,day);
  if(root.id==='shard-weekly-chart')return this.renderShards(root,records,day);
  const days=C.weeklyTotals(records,day),max=Math.max(1,...days.map(d=>d.amount));root.replaceChildren();headingTotal(root.id,days.reduce((n,d)=>n+d.amount,0));
  root.append(el('p',`${C.displayDate(days[0].date)} 〜 ${C.displayDate(days[6].date)}`,'weekly-range'));
  const chart=el('div',undefined,'weekly-bars');chart.setAttribute('role','img');chart.setAttribute('aria-label',days.map((d,i)=>`${['月','火','水','木','金','土','日'][i]} ${d.date} ${d.amount}個`).join('、'));
  days.forEach((d,i)=>{const col=el('div',undefined,'weekly-column'),value=el('span',d.amount.toLocaleString('ja-JP'),'weekly-value'),track=el('div',undefined,'weekly-track'),bar=el('div',undefined,'weekly-bar');bar.style.height=(d.amount/max*100)+'%';track.append(bar);col.append(value,track,el('span',C.displayDate(d.date),'weekly-date'));col.title=C.displayDate(d.date)+'：'+d.amount.toLocaleString('ja-JP')+'個';chart.append(col);});root.append(chart);this.fitLabels(root);
 }
};
