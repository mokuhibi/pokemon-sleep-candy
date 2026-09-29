// 期間と基準日は画面内だけで保持。履歴・保存データには追加しません。
const RangePicker=(()=>{
 const items=new Map(),dateId=id=>id==='period'?'summary-date':'shard-date';
 function bounds(start,end){if(!C.dateOnly(start)||!C.dateOnly(end)||end<start)throw Error('終了日は開始日以降の日付を選んでください。');return [start,C.addDays(end,1)];}
 function text(start,end){const year=C.gameDay(new Date()).slice(0,4),cross=start.slice(0,4)!==end.slice(0,4);const format=d=>!cross&&d.slice(0,4)===year?Number(d.slice(5,7))+'/'+Number(d.slice(8))+C.displayDate(d).slice(10):C.displayDate(d);return format(start)+(start===end?'':'〜'+format(end));}
 function get(id){const item=items.get(id),day=$(dateId(id)).value||C.gameDay(new Date());return item?(item.kind==='all'?null:bounds(item.start,item.end)):bounds(day,day);}
 function refresh(id){const item=items.get(id);$(dateId(id)).value=item.anchor;item.sync();item.render();DateUI.update();}
 function select(id,kind,anchor){const item=items.get(id);if(!item)return;item.kind=kind;item.anchor=anchor||item.anchor;const range=C.range(kind,item.anchor);item.start=range?range[0]:item.anchor;item.end=range?C.addDays(range[1],-1):item.anchor;refresh(id);}
 function set(id,start,end=start){bounds(start,end);const item=items.get(id);if(!item)return;Object.assign(item,{kind:'custom',start,end,anchor:start});refresh(id);}
 function today(id){const item=items.get(id);select(id,item.kind==='custom'?'day':item.kind,C.gameDay(new Date()));}
 function move(id,direction){const item=items.get(id);if(item.kind==='all')return;if(item.kind!=='custom'){select(id,item.kind,PeriodPicker.shift(item.anchor,item.kind,direction));return;}const days=Math.round((Date.parse(item.end)-Date.parse(item.start))/86400000)+1;set(id,C.addDays(item.start,days*direction),C.addDays(item.end,days*direction));}
 function sync(){for(const item of items.values())item.sync();}
 function mount(config){
  const date=$(config.date),period=$(config.period),old=period.closest('.card'),root=el('div',undefined,'card period-picker custom-range'),top=el('div',undefined,'period-picker-top');
  const center=button('',e=>{e?.preventDefault();e?.stopPropagation();start.value=item.start;end.value=item.end;error.textContent='';dialog.showModal();title.focus();},'period-picker-date');
  center.setAttribute('aria-haspopup','dialog');
  const prev=button('＜',()=>move(config.period,-1)),next=button('＞',()=>move(config.period,1));top.append(prev,center,next);prev.setAttribute('aria-label','前の期間');next.setAttribute('aria-label','次の期間');
  const quick=el('div',undefined,'period-quick-buttons');for(const [key,name] of [['day','日'],['week','週'],['month','月'],['all','全期間']]){const b=button(name,()=>select(config.period,key));b.dataset.period=key;quick.append(b);}quick.append(button('今日',()=>today(config.period)));root.append(top,quick);
  const dialog=el('dialog',undefined,'range-dialog'),form=el('form'),title=el('h2','期間を選択');title.id=config.period+'-range-title';title.tabIndex=-1;title.autofocus=true;dialog.setAttribute('aria-labelledby',title.id);center.setAttribute('aria-controls',config.period+'-range-dialog');dialog.id=config.period+'-range-dialog';
  const makeInput=name=>{const label=el('label',name),input=el('input');input.type='date';input.required=true;input.dataset.nativeRange='true';label.append(input);form.append(label);return input;};
  form.append(title);const start=makeInput('開始日'),end=makeInput('終了日'),error=el('p');error.setAttribute('role','alert');
  const actions=el('div',undefined,'range-actions'),apply=el('button','この期間を表示');apply.type='submit';actions.append(button('キャンセル',()=>dialog.close()),apply);form.append(error,actions);dialog.append(form);document.body.append(dialog);
  form.onsubmit=e=>{e.preventDefault();try{set(config.period,start.value,end.value);dialog.close();}catch(err){error.textContent=err.message;}};
  // 表示ボタンと基準日データを分離。透明な日付inputがボタンに重ならないようにする。
  const storage=el('div');storage.hidden=true;date.type='hidden';storage.append(date,period);root.append(storage);old.before(root);old.remove();
  // 表示レイアウトのみ：合計と期間操作を同じ情報面にまとめます。
  const hero=$(config.period==='period'?'summary-total':'shard-total');if(hero){const overview=el('div',undefined,'overview-header');hero.before(overview);overview.append(hero,root);}
  const day=date.value||C.gameDay(new Date()),item={kind:'day',anchor:day,start:day,end:day,render:config.render,sync(){center.textContent=this.kind==='all'?'全期間':text(this.start,this.end);prev.hidden=next.hidden=this.kind==='all';for(const b of quick.children)if(b.dataset.period)b.setAttribute('aria-pressed',String(b.dataset.period===this.kind));}};items.set(config.period,item);item.sync();
 }
 return {get,set,select,today,move,sync,mount,bounds,text};
})();
