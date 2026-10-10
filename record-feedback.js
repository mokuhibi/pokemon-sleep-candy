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
  const date=document.querySelector('#record .record-datetime-field'),box=date?.getBoundingClientRect();
  const safe=parseFloat(getComputedStyle(rail).getPropertyValue('--toast-safe-top'))||0;
  // 固定表示のため記録画面の配置は動かさない。日付が見える間だけ、その直下へ追従。
  const visible=box&&box.bottom>safe&&box.top<innerHeight;
  const preferred=visible?Math.max(safe+8,box.bottom+6):safe+8;
  const height=rail.getBoundingClientRect().height;
  const controls=[...document.querySelectorAll('#record button,#record input,#record select,#record summary')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect());
  const nav=document.querySelector('.tabs')?.getBoundingClientRect().top??innerHeight;
  const free=y=>!controls.some(r=>r.top<y+height&&r.bottom>y);
  // スクロール位置や2行文面によって直下にボタンがある場合だけ、次の空き領域へ逃がす。
  let top=preferred;
  if(!free(top))for(let y=preferred+4;y+height<nav-6;y+=4){if(free(y)){top=y;break;}}
  rail.style.top=top+'px';
 }
 function content(saved,previous){
  // 保存済みの差分を読むだけ。クリック表示や現在の編成から内容を推測しない。
  for(const field of ['records','shardRecords']){
   const old=new Map((previous[field]||[]).map(r=>[r.id,r]));
   const records=saved[field]||[];
   for(let i=records.length-1;i>=0;i--){const r=records[i];
    if(old.has(r.id)&&JSON.stringify(old.get(r.id))===JSON.stringify(r))continue;
    const shards=field==='shardRecords'||r.shardAmount!==undefined;
    const amount=shards?(r.shardAmount??r.amount):r.amount;
    const category=shards?'shards':'candy';
    if(!amount&&!['research','other'].includes(r.method))return {category,message:'スキル発動を記録しました'};
    const name=shards?'ゆめのかけら':r.candy;
    if(name)return {category,message:name+amount.toLocaleString('ja-JP')+'個を記録しました'};
   }
  }
  return null;
 }
 function success(saved,previous){
  const token=pending;if(!token)return false;pending=null;
  const result=content(saved,previous);if(!result)return false;
  clearTimeout(pulses.get(token.key));
  pulses.set(token.key,setTimeout(()=>{pulses.delete(token.key);for(const b of document.querySelectorAll('[data-record-feedback]'))if(b.dataset.recordFeedback===token.key)b.classList.remove('record-saved');},700));
  decorate();
  if(!rail){rail=document.createElement('div');rail.id='record-save-notices';rail.setAttribute('role','status');rail.setAttribute('aria-live','polite');rail.setAttribute('aria-relevant','additions');document.body.append(rail);}
  const toast=document.createElement('div');toast.className='record-save-toast';toast.dataset.category=result.category;
  const check=document.createElement('span');check.className='record-toast-check';check.textContent='✓';check.setAttribute('aria-hidden','true');
  const text=document.createElement('span');text.className='record-toast-message';text.textContent=result.message;toast.append(check);toast.append(text);rail.append(toast);
  while(rail.children.length>2)rail.firstElementChild.remove();
  place();setTimeout(()=>toast.classList.add('record-toast-leaving'),1340);setTimeout(()=>{toast.remove();place();},1500);
  return true;
 }
 document.addEventListener('click',e=>capture(e.target.closest('button')),true);
 document.addEventListener('submit',e=>capture(e.submitter),true);
 window.addEventListener('scroll',place,{passive:true});window.addEventListener('resize',place);
 return {decorate,success};
})();
