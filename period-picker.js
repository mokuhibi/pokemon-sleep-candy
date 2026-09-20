'use strict';
// 3タブ共通の操作部。集計には従来の期間・日付入力値をそのまま渡します。
const PeriodPicker=(()=>{
 const instances=[];
 function shift(day,kind,amount){
  if(kind==='all')return day;
  if(kind!=='month')return C.addDays(day,amount*(kind==='week'?7:1));
  const d=new Date(day.slice(0,7)+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+amount);
  const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
  d.setUTCDate(Math.min(Number(day.slice(8)),last));return d.toISOString().slice(0,10);
 }
 function rangeText(kind,day){
  const range=C.range(kind,day);if(!range)return '全期間';
  const [start,exclusive]=range,end=C.addDays(exclusive,-1);
  const short=s=>Number(s.slice(5,7))+'/'+Number(s.slice(8))+C.displayDate(s).slice(10);
  if(kind==='day')return short(start);
  if(kind==='month')return C.displayDate(start)+'〜'+C.displayDate(end).slice(5);
  return start.slice(0,4)===end.slice(0,4)?short(start)+'〜'+short(end):C.displayDate(start)+'〜'+C.displayDate(end);
 }
 function sync(){for(const item of instances)item.sync();}
 function mount(config){
  const period=document.getElementById(config.period),date=document.getElementById(config.date),old=period.closest('.card');
  const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
  const root=make('div','','card period-picker'),top=make('div','','period-picker-top'),bottom=make('div','','period-picker-bottom');
  const prev=make('button','＜'),center=make('button','','period-picker-date'),next=make('button','＞'),range=make('span','','period-picker-range'),today=make('button','今日に戻る');
  const dialog=make('dialog','','period-picker-dialog'),title=make('h2','日付・期間を選択'),choices=make('div','','period-picker-choices'),label=make('label','日付'),close=make('button','閉じる');
  title.id=config.period+'-dialog-title';dialog.id=config.period+'-dialog';dialog.setAttribute('aria-labelledby',title.id);center.setAttribute('aria-haspopup','dialog');center.setAttribute('aria-controls',dialog.id);
  for(const b of [prev,center,next,today,close])b.type='button';
  top.append(prev,center,next);bottom.append(range,today);root.append(top,bottom);old.before(root);
  // 日付表示用ラッパーごと移動。値・ID・日付選択機能は維持します。
  label.append(date.parentElement.classList.contains('date-field')?date.parentElement:date);
  period.hidden=true;dialog.append(title,choices,label,close);root.append(period,dialog);old.remove();
  let validDay=date.value||C.gameDay(new Date());date.value=validDay;
  const item={sync(){if(C.dateOnly(date.value))validDay=date.value;center.textContent=C.displayDate(validDay);range.textContent=rangeText(period.value,validDay);prev.hidden=next.hidden=period.value==='all';const unit={day:'日',week:'週',month:'月'}[period.value]||'';prev.setAttribute('aria-label','前の'+unit);next.setAttribute('aria-label','次の'+unit);for(const b of choices.children)b.setAttribute('aria-pressed',String(b.dataset.period===period.value));}};
  const refresh=()=>{if(!C.dateOnly(date.value))date.value=validDay;config.render();item.sync();DateUI.update();};
  for(const [key,text] of [['day','日'],['week','週'],['month','月'],['all','全期間']]){const b=make('button',text);b.type='button';b.dataset.period=key;b.onclick=()=>{period.value=key;refresh();};choices.append(b);}
  period.onchange=refresh;date.onchange=refresh;
  prev.onclick=()=>{date.value=shift(validDay,period.value,-1);refresh();};next.onclick=()=>{date.value=shift(validDay,period.value,1);refresh();};
  today.onclick=()=>{date.value=C.gameDay(new Date());refresh();};center.onclick=()=>{date.value=validDay;DateUI.update();dialog.showModal();};close.onclick=()=>dialog.close();
  instances.push(item);item.sync();
 }
 function init(){
  mount({period:'period',date:'summary-date',render:renderSummary});
  mount({period:'shard-period',date:'shard-date',render:()=>ShardUI.renderSummary()});
  mount({period:'history-period',date:'history-date',render:renderHistory});
  DateUI.update();
 }
 return {init,sync,shift,rangeText};
})();
