'use strict';
// 履歴のスナップショットを読む表示専用パネル。記録・保存処理は行わない。
const HistoryDetails=(()=>{
 let panel,trigger,scrollY,bodyStyle,closing=false;
 function content(info){
  const {r,method,primary,target}=info,root=el('div',undefined,'history-detail-content');root.tabIndex=0;
  const group=title=>{const s=el('section');s.append(el('h3',title));root.append(s);return s;};
  const item=(s,name,value)=>{if(value===undefined||value===null||value==='')return;const row=el('div',undefined,'history-detail-row');row.append(el('span',name),el('strong',String(value)));s.append(row);};
  const record=group('記録内容');item(record,'日時',DateUI.datetime(r.datetime));item(record,'獲得方法',method);item(record,info.shards?'種類':'アメの種類',primary);item(record,'獲得個数',r.amount.toLocaleString('ja-JP')+'個');if(!r.targetDate)item(record,'対象・編成位置',target);
  if(r.shardAmount!==undefined)item(record,'ゆめのかけら',r.shardAmount.toLocaleString('ja-JP')+'個');
  if(r.targetDate)item(record,'リサーチ日',C.displayDate(r.targetDate));
  if(r.recordedAt)item(record,'入力日時',DateUI.datetime(r.recordedAt));
  if(r.baseAmount!==undefined)item(record,'リサーチの獲得数',r.baseAmount.toLocaleString('ja-JP')+'個');
  if(r.researchExp!==undefined)item(record,'リサーチEXP',r.researchExp.toLocaleString('ja-JP'));
  if(r.researchLevel!==undefined)item(record,'リサーチレベル',r.researchLevel);
  if(r.memo)item(record,'メモ',r.memo);
  const c=r.context,actor=actorOf(c)||r.pokemonSnapshot||(info.shards&&['skill','lucky'].includes(r.method)&&r.species?historicalPokemon(r):null);
  if(!['help','research','other'].includes(r.method)){
   const skill=group('スキル情報');if(actor)item(skill,'発動したポケモン',label(actor));
   const main=r.mainSkillId||r.registeredMainSkill||actor?.mainSkillId||actor?.mainSkill||r.skillId||r.skillName;
   if(main||actor)item(skill,'メインスキル',mainSkillText(actor||{species:r.species},main));
   const level=r.recordedSkillLevel??r.skillLevel??actor?.profile?.skillLevel;item(skill,'スキルLv',level);
   if(c?.effectiveLevel!==undefined&&c.effectiveLevel!==level)item(skill,'補正後のスキルLv',c.effectiveLevel);
   if(c?.actorSlot)item(skill,'発動した場所',c.actorSlot===1?'1リーダー':c.actorSlot+'番');
   if(r.firedSkill)item(skill,'発動したスキル',SK.name(r.firedSkill));
   if(r.sourcePokemon){item(skill,'参照するポケモン',label(r.sourcePokemon));item(skill,'参照するスキル',mainSkillText(r.sourcePokemon,r.sourceSkillId));}
   else if(r.sourceSkillId)item(skill,'参照するスキル',SK.name(r.sourceSkillId));
   if(c?.event){item(skill,'イベント',c.event.name);item(skill,'確率倍率',c.event.multiplier===undefined?undefined:c.event.multiplier+'倍');item(skill,'レベル補正',c.event.boost===undefined?undefined:'+'+c.event.boost);}
   if(skill.children.length===1)skill.remove();
  }
  if(c?.team?.some(Boolean)){
   const team=group('記録時の編成');c.team.forEach((p,i)=>{if(!p)return;const row=el('div',undefined,'history-detail-pokemon');row.append(el('strong',(i===0?'1リーダー':i+1+'番')+'　'+label(p)),el('small',mainSkillText(p)));if(p.profile)row.append(el('small',profileText(p)));team.append(row);});
  }
  return root;
 }
 function finish(){
  if(!trigger)return;panel.close();trigger.textContent='詳細 ▼';trigger.setAttribute('aria-expanded','false');
  Object.assign(document.body.style,bodyStyle);window.scrollTo({top:scrollY});if(trigger.isConnected)trigger.focus({preventScroll:true});trigger=null;closing=false;panel.classList.remove('closing');
 }
 function close(){if(!trigger||closing)return;closing=true;panel.classList.add('closing');if(matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else setTimeout(finish,160);}
 function open(info,b){
  if(!panel){panel=el('dialog');panel.id='history-details-panel';panel.setAttribute('aria-labelledby','history-details-title');document.body.append(panel);panel.addEventListener('cancel',e=>{e.preventDefault();close();});}
  const head=el('div',undefined,'history-detail-heading'),title=el('h2','記録の詳細');title.id='history-details-title';const exit=button('閉じる',close);head.append(title,exit);panel.replaceChildren(head,content(info));
  panel.dataset.category=info.shards?'shards':'candy';panel.style.setProperty('--history-nav-height',Math.ceil(document.querySelector('.tabs').getBoundingClientRect().height)+'px');
  trigger=b;trigger.textContent='詳細 ▲';trigger.setAttribute('aria-expanded','true');scrollY=window.scrollY;bodyStyle={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,overflow:document.body.style.overflow};Object.assign(document.body.style,{position:'fixed',top:-scrollY+'px',width:'100%',overflow:'hidden'});panel.showModal();exit.focus();
 }
 function detailButton(info){const b=button('詳細 ▼',()=>open(info,b),'history-detail-button');b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','history-details-panel');return b;}
 return {button:detailButton};
})();
