// 選択期間は画面内だけで保持し、履歴・localStorageには追加保存しません。
const RangePicker=(()=>{
 const items=new Map();
 const dateId=id=>id==='period'?'summary-date':'shard-date';
 function bounds(start,end){if(!C.dateOnly(start)||!C.dateOnly(end)||end<start)throw Error('終了日は開始日以降の日付を選んでください。');return [start,C.addDays(end,1)];}
 function text(start,end){return C.displayDate(start)+(start===end?'':'〜'+(start.slice(0,4)===end.slice(0,4)?C.displayDate(end).slice(5):C.displayDate(end)));}
 function get(id){const item=items.get(id),day=$(dateId(id)).value||C.gameDay(new Date());return item?bounds(item.start,item.end):bounds(day,day);}
 function set(id,start,end=start){bounds(start,end);const item=items.get(id);if(!item)return;item.start=start;item.end=end;$(dateId(id)).value=start;item.sync();item.render();DateUI.update();}
 function move(id,direction){const item=items.get(id),days=Math.round((Date.parse(item.end)-Date.parse(item.start))/86400000)+1;set(id,C.addDays(item.start,days*direction),C.addDays(item.end,days*direction));}
 function sync(){for(const item of items.values())item.sync();}
 function mount(config){
  const date=$(config.date),period=$(config.period),old=period.closest('.card'),root=el('div',undefined,'card period-picker custom-range'),top=el('div',undefined,'period-picker-top');
  const center=button('',()=>{start.value=item.start;end.value=item.end;error.textContent='';DateUI.update();dialog.showModal();},'period-picker-date');
  center.setAttribute('aria-haspopup','dialog');
  top.append(button('＜',()=>move(config.period,-1)),center,button('＞',()=>move(config.period,1)));top.firstElementChild.setAttribute('aria-label','前の期間');top.lastElementChild.setAttribute('aria-label','次の期間');
  const today=()=>set(config.period,C.gameDay(new Date()));const quick=el('div',undefined,'range-today');quick.append(button('今日',today));root.append(top,quick);
  const dialog=el('dialog',undefined,'range-dialog'),form=el('form'),title=el('h2','期間を選択');title.id=config.period+'-range-title';dialog.setAttribute('aria-labelledby',title.id);center.setAttribute('aria-controls',config.period+'-range-dialog');dialog.id=config.period+'-range-dialog';
  const makeInput=(name)=>{const label=el('label',name),input=el('input');input.type='date';input.required=true;label.append(input);form.append(label);return input;};
  form.append(title);const start=makeInput('開始日'),end=makeInput('終了日'),error=el('p');error.setAttribute('role','alert');
  const actions=el('div',undefined,'range-actions'),apply=el('button','この期間を表示');apply.type='submit';actions.append(button('今日',()=>{today();dialog.close();}),apply);form.append(error,actions,button('キャンセル',()=>dialog.close()));dialog.append(form);document.body.append(dialog);
  form.onsubmit=e=>{e.preventDefault();try{set(config.period,start.value,end.value);dialog.close();}catch(err){error.textContent=err.message;}};
  // 元の基準日inputは固定の週間・月間表示の参照先として残します。
  const storage=el('div');storage.hidden=true;storage.append(date,period);root.append(storage);old.before(root);old.remove();
  const day=date.value||C.gameDay(new Date()),item={start:day,end:day,render:config.render,sync(){center.textContent=text(this.start,this.end);}};items.set(config.period,item);item.sync();
 }
 return {get,set,move,sync,mount,bounds,text};
})();
