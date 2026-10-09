'use strict';
// 記録操作の表示だけを担当。保存・ID生成・連続タップの制御は行わない。
const RecordFeedback=(()=>{
 const selector='#record-methods .record-slots button, #record .copy-skill-card button[type="submit"], #record .shard-skill-form button[type="submit"], #record .shard-amount-buttons button, #research-save, #shard-other-form button[type="submit"]';
 const pulses=new Map();let pending=null,rail;
 function decorate(){
  for(const b of document.querySelectorAll(selector)){
   const root=b.closest('[id]'),key=root.id+':'+[...root.querySelectorAll('button')].indexOf(b);
   b.dataset.recordFeedback=key;b.classList.add('record-save-button');
   b.dataset.recordCategory=b.closest('#shard-records')?'shards':'candy';
   if(pulses.has(key))b.classList.add('record-saved');
  }
 }
 function capture(b){
  if(!b?.matches(selector)||b.disabled)return;
  const token={key:b.dataset.recordFeedback};pending=token;
  // 同期保存の操作が終わったら破棄。別の画面操作へ成功表示を持ち越さない。
  setTimeout(()=>{if(pending===token)pending=null;},0);
 }
 function place(){
  if(!rail?.children.length)return;
  const height=rail.getBoundingClientRect().height,width=rail.getBoundingClientRect().width;
  const nav=document.querySelector('.tabs').getBoundingClientRect();
  const controls=[...document.querySelectorAll('#record button,#record input,#record select,#record summary')].filter(b=>b.getClientRects().length).map(b=>b.getBoundingClientRect());
  const right=innerWidth-12,left=right-width;
  // 操作部品と重ならない右側の空き領域を使う。通知自体はタップを捕捉しない。
  let top=nav.top;
  for(let y=12;y+height<=nav.top-6;y+=4){if(!controls.some(r=>r.left<right&&r.right>left&&r.top<y+height&&r.bottom>y)){top=y;break;}}
  rail.style.top=top+'px';
 }
 function success(){
  const token=pending;if(!token)return false;pending=null;
  clearTimeout(pulses.get(token.key));
  pulses.set(token.key,setTimeout(()=>{pulses.delete(token.key);for(const b of document.querySelectorAll('[data-record-feedback]'))if(b.dataset.recordFeedback===token.key)b.classList.remove('record-saved');},700));
  decorate();
  if(!rail){rail=document.createElement('div');rail.id='record-save-notices';rail.setAttribute('role','status');rail.setAttribute('aria-live','polite');rail.setAttribute('aria-relevant','additions');document.body.append(rail);}
  const toast=document.createElement('div');toast.className='record-save-toast';toast.textContent='✓ 保存しました';rail.append(toast);
  while(rail.children.length>3)rail.firstElementChild.remove();
  place();setTimeout(()=>{toast.remove();place();},1000);
  return true;
 }
 document.addEventListener('click',e=>capture(e.target.closest('button')),true);
 document.addEventListener('submit',e=>capture(e.submitter),true);
 window.addEventListener('scroll',place,{passive:true});window.addEventListener('resize',place);
 return {decorate,success};
})();
