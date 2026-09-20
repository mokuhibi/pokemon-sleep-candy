'use strict';
const WeeklyChart={
 render(root,records,day){
  const days=C.weeklyTotals(records,day),max=Math.max(1,...days.map(d=>d.amount));root.replaceChildren();headingTotal(root.id,days.reduce((n,d)=>n+d.amount,0));
  root.append(el('p',`${C.displayDate(days[0].date)} 〜 ${C.displayDate(days[6].date)}`,'weekly-range'));
  const chart=el('div',undefined,'weekly-bars');chart.setAttribute('role','img');chart.setAttribute('aria-label',days.map((d,i)=>`${['月','火','水','木','金','土','日'][i]} ${d.date} ${d.amount}個`).join('、'));
  days.forEach((d,i)=>{const col=el('div',undefined,'weekly-column'),value=el('span',d.amount.toLocaleString('ja-JP'),'weekly-value'),track=el('div',undefined,'weekly-track'),bar=el('div',undefined,'weekly-bar');bar.style.height=(d.amount/max*100)+'%';track.append(bar);col.append(value,track,el('span',C.displayDate(d.date),'weekly-date'));col.title=C.displayDate(d.date)+'：'+d.amount.toLocaleString('ja-JP')+'個';chart.append(col);});root.append(chart);
 }
};
