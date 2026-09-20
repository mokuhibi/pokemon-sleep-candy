// 記録日時の入力UIだけを置き換えます。確定までは元の日時に触れません。
const RecordPicker=(()=>{
 function init(){
  const input=document.getElementById('datetime'),wrapper=input.parentElement;
  const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const btn=(text,fn)=>{const b=make('button',text);b.type='button';b.onclick=fn;return b;};
  const dialog=make('dialog',undefined,'record-picker'),title=make('h2','日時を選択');title.id='record-picker-title';dialog.setAttribute('aria-labelledby',title.id);
  const form=make('form'),head=make('div',undefined,'record-picker-head'),month=make('strong'),grid=make('div',undefined,'record-picker-grid'),selected=make('p',undefined,'record-picker-selected');
  let day='',view='';
  const pad=n=>String(n).padStart(2,'0');
  function paint(){
   month.textContent=Number(view.slice(0,4))+'年'+Number(view.slice(5,7))+'月';grid.replaceChildren();
   for(const w of '日月火水木金土')grid.append(make('span',w));
   const start=new Date(view+'-01T12:00:00'),count=new Date(start.getFullYear(),start.getMonth()+1,0).getDate();
   for(let n=0;n<start.getDay();n++)grid.append(make('span',''));
   for(let n=1;n<=count;n++){const value=view+'-'+pad(n),b=btn(String(n),()=>{day=value;paint();});b.setAttribute('aria-label',C.displayDate(value));b.setAttribute('aria-pressed',String(value===day));grid.append(b);}
   selected.textContent=C.displayDate(day);
  }
  function move(delta){const d=new Date(view+'-01T12:00:00');d.setMonth(d.getMonth()+delta);view=d.getFullYear()+'-'+pad(d.getMonth()+1);paint();}
  const prev=btn('＜',()=>move(-1)),next=btn('＞',()=>move(1));prev.setAttribute('aria-label','前月');next.setAttribute('aria-label','次月');head.append(prev,month,next);
  const time=make('div',undefined,'record-picker-time');
  function timeSelect(label,max){const l=make('label',label),s=make('select');s.setAttribute('aria-label',label);for(let i=0;i<=max;i++){const o=make('option',pad(i));o.value=pad(i);s.append(o);}l.append(s);return [l,s];}
  const [hl,hour]=timeSelect('時間',23),[ml,minute]=timeSelect('分',59);time.append(hl,make('span',':'),ml);
  const error=make('p');error.setAttribute('role','alert');const actions=make('div',undefined,'record-picker-actions');
  const cancel=btn('キャンセル',()=>dialog.close()),ok=make('button','決定');ok.type='submit';actions.append(cancel,ok);
  form.append(title,head,grid,selected,time,error,actions);dialog.append(form);document.body.append(dialog);
  const trigger=btn('',()=>{const value=input.value||C.localInput();day=value.slice(0,10);view=day.slice(0,7);hour.value=value.slice(11,13);minute.value=value.slice(14,16);error.textContent='';paint();dialog.showModal();});
  trigger.className='record-picker-trigger';trigger.setAttribute('aria-label','記録日時を選択');trigger.setAttribute('aria-haspopup','dialog');
  // 元のinputとイベントは維持し、標準ピッカーを開く操作だけを置き換えます。
  input.hidden=true;wrapper.append(trigger);
  function sync(){trigger.textContent=wrapper.querySelector('.date-weekday').textContent;}
  new MutationObserver(sync).observe(wrapper.querySelector('.date-weekday'),{childList:true,characterData:true,subtree:true});sync();
  form.onsubmit=e=>{e.preventDefault();const value=day+'T'+hour.value+':'+minute.value;
   // 元のinputに設定されている制約をそのまま検証します。
   const probe=input.cloneNode();probe.value=value;if(!probe.checkValidity()){error.textContent=probe.validationMessage;return;}
   input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));dialog.close();
  };
 }
 return {init};
})();
