'use strict';
// ミュウはアメ履歴の1件に実際の発動内容を保存し、かけら集計へ投影します。
const MewUI=(()=>{
 const shardSkill=MainSkillMaster.value('dream_shard_s');
 function skillOptions(select,unknown=false){select.replaceChildren();if(unknown)select.add(new Option('未記録',''));for(const skill of C.mewSkills.slice(1))select.add(new Option(SK.name(skill),skill));}
 function init(){for(const skill of C.mewSkills)$('edit-registered-skill').add(new Option(SK.name(skill),skill));skillOptions($('edit-fired-skill'),true);$('edit-fired-skill').onchange=refreshEditor;}
 function editProfile(p){SkillUI.editProfile(p);}
 function renderMewRecord(section,context){
  const p=actorOf(context);section.append(el('p',label(p)),el('p',mainSkillText(p)));
 }
 // アメ欄では、選んでいない「ゆびをふる」の結果やかけら数を推測しません。
 function recordFields(context){const main=SK.value(SK.forPokemon(actorOf(context)));return {recordedSkillLevel:actorOf(context).profile.skillLevel,registeredMainSkill:main,mainSkillId:SK.id(main)};}
 function saveShard(p,amount){
  const date=recordDate(),context=skillContext('mew');if(!Number.isFinite(date.getTime())||!context||context.actorId!==p.id||!context.actorSlot){notice('ミュウの編成と個体情報を確認してください。');return false;}
  const main=SK.value(SK.forPokemon(p));if(!['dream_shard_s','metronome'].includes(SK.id(main))){notice('登録スキルを確認してください。');return false;}
  const r={id:uid(),datetime:date.toISOString(),method:'mew',amount:0,slot:null,pokemonId:null,pokemon:'スキルのみ',species:null,nickname:'',candy:null,context,recordedSkillLevel:context.actor.profile.skillLevel,registeredMainSkill:main,mainSkillId:SK.id(main),firedSkill:shardSkill,shardAmount:amount};
  if($('auto-now').checked)$('datetime').value=C.localInput(date);
  return commit({...state,records:[...state.records,r]},'ミュウ：ゆめのかけら'+amount+'個を記録しました。');
 }
 function appendHistory(card,r){const actor=actorOf(r.context);const level=r.recordedSkillLevel??actor?.profile?.skillLevel;if(level)card.append(el('p','記録時のスキルLv：'+level));if(actor)card.append(el('p',label(actor)));card.append(el('p','セット中のメインスキル：'+SK.name(r.mainSkillId||r.registeredMainSkill||SK.forPokemon(actor))));if(SK.id(r.firedSkill)==='dream_shard_s')card.append(qel('p','ゆめのかけら：'+r.shardAmount+'個'));}
 function openEditor(r){$('edit-mew-level').value=r.recordedSkillLevel??actorOf(r.context)?.profile?.skillLevel??'';const main=SK.value(r.mainSkillId||r.registeredMainSkill||SK.forPokemon(actorOf(r.context)));const select=$('edit-registered-skill');if(![...select.options].some(o=>o.value===main))select.add(new Option(SK.name(main),main));select.value=main;optionList($('edit-mew-target'),editPool.map(p=>({id:p.id,text:label(p)})),r.pokemonId);$('edit-fired-skill').value=r.firedSkill||'';$('edit-mew-shards').value=r.shardAmount||C.shardAmounts('fixed',r.context?.effectiveLevel||1)[0];}
 function refreshEditor(){const mew=$('edit-method').value==='mew',shards=mew&&$('edit-fired-skill').value===shardSkill;$('edit-mew-fields').hidden=!mew;$('edit-mew-level').required=mew;$('edit-mew-target-label').hidden=!mew||$('edit-slot').value==='none';$('edit-mew-shards-label').hidden=!shards;$('edit-mew-shards').required=shards;}
 function applyEdit(r){if(r.method!=='mew'){delete r.firedSkill;delete r.shardAmount;if(r.method==='delibird'){const p=actorOf(r.context);if(p){r.mainSkillId=SK.id(SK.forPokemon(p));r.registeredMainSkill=SK.value(SK.forPokemon(p));}}else{delete r.registeredMainSkill;delete r.mainSkillId;}return;}const level=Number($('edit-mew-level').value);if(!Number.isInteger(level)||level<1||level>8)throw Error('記録時のスキルLvは1〜8で入力してください。');r.recordedSkillLevel=level;
 // 訂正するのは履歴内のコピーだけ。現在の登録個体には触れません。
 if(r.context){const actor=actorOf(r.context);if(actor?.profile){actor.profile.skillLevel=level;const same=r.context.team.find(p=>p?.id===actor.id);if(same?.profile)same.profile.skillLevel=level;r.context.effectiveLevel=Math.min(8,level+r.context.event.boost);}}
 r.registeredMainSkill=$('edit-registered-skill').value;r.mainSkillId=SK.id(r.registeredMainSkill);const skill=$('edit-fired-skill').value;if(!skill){if(r.amount===0&&!C.mewSkills.includes(r.registeredMainSkill))throw Error('アメなしの記録では発動スキルを選択してください。');delete r.firedSkill;delete r.shardAmount;return;}r.firedSkill=skill;r.shardAmount=skill===shardSkill?Number($('edit-mew-shards').value):0;}
 return {init,editProfile,renderRecord:renderMewRecord,recordFields,saveShard,appendHistory,openEditor,refreshEditor,applyEdit};
})();

const DateUI=(()=>{
 const datetime=value=>{const s=C.localInput(value);return C.displayDate(s.slice(0,10))+' '+s.slice(11);};
 function update(){for(const input of document.querySelectorAll('input[type=date],input[type=datetime-local]')){let wrapper=input.parentElement;if(!wrapper.classList.contains('date-field')){wrapper=document.createElement('span');wrapper.className='date-field';input.before(wrapper);wrapper.append(input);const day=document.createElement('small');day.className='date-weekday';wrapper.append(day);}const day=wrapper.querySelector('.date-weekday');
   {
    // 保存値は変更せず、日付選択欄も共通の書式で表示します。
    wrapper.classList.add('formatted-date-field');if(input.id==='datetime')wrapper.classList.add('record-datetime-field');day.setAttribute('aria-hidden','true');
    const date=input.value.slice(0,10),time=input.value.slice(11,16);
    day.textContent=date?C.displayDate(date)+(time?' '+time:''):(input.type==='date'?'日付を選択':'日時を選択');
    if(!input.dataset.pickerBound){input.addEventListener('click',()=>{try{input.showPicker?.();}catch{ /* 非対応環境では標準入力を使用 */ }});input.dataset.pickerBound='true';}
   }}}
 function init(){document.addEventListener('input',update);document.addEventListener('change',update);document.addEventListener('click',()=>queueMicrotask(update));}
 return {datetime,update,init};
})();

const ShardEditor=(()=>{
 let editing=null;
 function open(r){editing=r;let dialog=$('shard-editor');if(!dialog){dialog=el('dialog');dialog.id='shard-editor';document.querySelector('main').append(dialog);}dialog.replaceChildren();const form=el('form'),head=el('div',undefined,'section-head');head.append(el('h2','ゆめのかけらの訂正'),button('閉じる',()=>dialog.close()));form.append(head);
  const add=(name,id,type,value,min,max)=>{const l=el('label',name),i=el('input');Object.assign(i,{id,type,value,required:true});if(type==='number'){i.inputMode='numeric';i.min=min;i.max=max;i.step='1';}l.append(i);form.append(l);return i;};
  if(r.method==='research'){add('対象日','shard-edit-date','date',r.targetDate||C.gameDay(r.datetime));add('リサーチレベル','shard-edit-level','number',r.researchLevel,1,70);add('リサーチEXP','shard-edit-exp','number',r.researchExp,0,1000000000);add('ゆめのかけら','shard-edit-base','number',r.baseAmount,0,1000000000);}
  else{add('日時','shard-edit-datetime','datetime-local',C.localInput(r.datetime));add('ゆめのかけら','shard-edit-amount','number',r.amount,r.method==='skill'?1:0,1000000000);if(r.method==='other'){const i=add('取得内容メモ','shard-edit-memo','text',r.memo||'');i.required=false;i.maxLength=1000;}}
  const error=el('p','','error');error.id='shard-edit-error';error.setAttribute('role','alert');const save=el('button','訂正を保存');save.type='submit';form.append(error,save);dialog.append(form);
  form.onsubmit=e=>{e.preventDefault();try{const next={...editing,updatedAt:new Date().toISOString()};if(next.method==='research'){next.targetDate=$('shard-edit-date').value;next.datetime=C.fromInput(next.targetDate+'T04:00').toISOString();next.researchLevel=Number($('shard-edit-level').value);next.researchExp=Number($('shard-edit-exp').value);next.baseAmount=Number($('shard-edit-base').value);next.amount=C.shardTotal(next);}else{next.datetime=C.fromInput($('shard-edit-datetime').value).toISOString();next.amount=Number($('shard-edit-amount').value);if(['skill','lucky'].includes(next.method))next.amountCorrected=true;if(next.method==='other')next.memo=$('shard-edit-memo').value;}
    C.validateShards([next]);if(commit({...state,shardRecords:state.shardRecords.map(r=>r.id===next.id?next:r)},'ゆめのかけら履歴を訂正しました。'))dialog.close();else error.textContent='保存できませんでした。';}catch(e){error.textContent='入力内容を確認してください：'+e.message;}};
  DateUI.update();dialog.showModal();
 }
 return {open};
})();

// 全画面の選択肢はマスターから生成し、画面側には一覧を持ちません。
const SkillUI=(()=>{
 function options(select,species,selected){
  const list=species==='ミュウ'?SK.mewEntries():SK.entries;select.replaceChildren();
  if(!species){select.add(new Option('ポケモンを選んでください',''));select.disabled=true;return;}
  select.disabled=false;for(const s of list)select.add(new Option(s.name,s.id));
  const key=SK.id(selected||SK.defaultId(species));
  // マスター外の旧データも失わず表示・再保存できるようにします。
  if(key&&![...select.options].some(o=>o.value===key))select.add(new Option(SK.name(key)+'（保存済み）',key));
  select.value=key;
 }
 function registration(species){options($('register-main-skill'),species,SK.defaultId(species));}
 function editProfile(p){$('profile-main-skill-label').hidden=false;options($('profile-main-skill'),p.species,SK.forPokemon(p));refreshDetails(p);$('profile-main-skill').onchange=()=>refreshDetails(p);}
 function refreshDetails(p){const selected={...p,...SK.fields($('profile-main-skill').value)},show=!!p.profile||special(p)||!!SK.shardMode(selected);$('profile-details').hidden=!show;for(const input of $('profile-details').querySelectorAll('input,select'))input.disabled=!show;$('profile-nature').disabled=!show||p.species==='ミュウ';$('profile-skill').max=SK.shardMode(selected)==='lucky'?7:C.skillCap(p.species);}
 function savedFields(p,key){if(p.mainSkill&&SK.id(SK.forPokemon(p))===SK.id(key))return {mainSkill:p.mainSkill,mainSkillId:SK.id(key)};return SK.fields(key);}
 function recordSkill(r){const actor=actorOf(r.context);return SK.id(r.firedSkill||r.skillId||r.skillName||r.mainSkillId||r.registeredMainSkill||SK.forPokemon(actor));}
 function candyCounts(parent,records){const groups=new Map();for(const r of records){const key=recordSkill(r);if(key)groups.set(key,(groups.get(key)||0)+1);}for(const [key,count] of groups)row(parent,SK.name(key),count+'回');}
 return {registration,editProfile,refreshDetails,savedFields,recordSkill,candyCounts};
})();
