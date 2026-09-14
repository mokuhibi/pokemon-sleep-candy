'use strict';
const WeeklyChart={
 render(root,records,day){
  const days=C.weeklyTotals(records,day),max=Math.max(1,...days.map(d=>d.amount));root.replaceChildren();
  root.append(el('p',`${days[0].date} 〜 ${days[6].date}`,'weekly-range'));
  const chart=el('div',undefined,'weekly-bars');chart.setAttribute('role','img');chart.setAttribute('aria-label',days.map((d,i)=>`${['月','火','水','木','金','土','日'][i]} ${d.date} ${d.amount}個`).join('、'));
  days.forEach((d,i)=>{const col=el('div',undefined,'weekly-column'),value=el('span',d.amount.toLocaleString('ja-JP'),'weekly-value'),track=el('div',undefined,'weekly-track'),bar=el('div',undefined,'weekly-bar');bar.style.height=(d.amount/max*100)+'%';track.append(bar);col.append(value,track,el('strong',['月','火','水','木','金','土','日'][i],'weekly-weekday'),el('span',Number(d.date.slice(5,7))+'/'+Number(d.date.slice(8,10)),'weekly-date'));col.title=d.date+'：'+d.amount.toLocaleString('ja-JP')+'個';chart.append(col);});root.append(chart);
 }
};
