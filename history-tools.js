'use strict';
// ミュウはアメ履歴の1件に実際の発動内容を保存し、かけら集計へ投影します。
const MewUI=(()=>{
 let result='',draft='',draftKey='';
 const shardSkill='ゆめのかけらゲットS';
 function skillOptions(select,unknown=false){select.replaceChildren();if(unknown)select.add(new Option('未記録',''));for(const skill of C.mewSkills.slice(1))select.add(new Option(skill,skill));}
 function init(){const s=$('profile-main-skill');for(const skill of C.mewSkills)s.add(new Option(skill,skill));skillOptions($('edit-fired-skill'),true);$('edit-fired-skill').onchange=refreshEditor;}
 function editProfile(p){$('profile-main-skill-label').hidden=p.species!=='ミュウ';$('profile-main-skill').value=p.mainSkill||'ゆびをふる';}
 function renderMewRecord(section,context){
  const p=actorOf(context),main=p.mainSkill||'ゆびをふる';section.append(el('p',label(p)+' · '+main));
  if(main==='ゆびをふる'){const l=el('label','発動スキル'),s=el('select');s.id='mew-fired-skill';skillOptions(s,true);s.options[0].text='選択してください';s.value=result;s.onchange=()=>{result=s.value;renderRecordArea();};l.append(s);section.append(l);}else result=main;
  const amount=C.shardAmounts('fixed',context.effectiveLevel)[0],key=p.id+':'+context.effectiveLevel+':'+main;
  if(key!==draftKey){draftKey=key;draft=String(amount);}
  const l=el('label','ゆめのかけら'),input=el('input');input.id='mew-shard-amount';Object.assign(input,{type:'number',inputMode:'numeric',min:'1',max:'1000000000',value:draft});input.oninput=()=>{draft=input.value;};l.hidden=result!==shardSkill;l.append(input);section.append(l);
  const b=button('アメなしでスキルを記録',()=>record('mew',null,0));b.id='mew-skill-only';section.append(b);
 }
 function renderRecordArea(){renderRecord();DateUI.update();}
 function recordFields(context){const main=actorOf(context).mainSkill||'ゆびをふる',firedSkill=main==='ゆびをふる'?result:main;if(!C.mewSkills.slice(1).includes(firedSkill))throw Error('発動スキルを選択してください。');const shardAmount=firedSkill===shardSkill?Number($('mew-shard-amount').value):0;if(firedSkill===shardSkill&&(!Number.isSafeInteger(shardAmount)||shardAmount<1||shardAmount>1000000000))throw Error('ゆめのかけらの数を入力してください。');return {firedSkill,shardAmount,registeredMainSkill:main};}
 function appendHistory(card,r){const actor=actorOf(r.context);if(actor)card.append(el('p',label(actor)));card.append(el('p','発動：'+(r.firedSkill||'未記録')));if(r.firedSkill===shardSkill)card.append(qel('p','ゆめのかけら：'+r.shardAmount+'個'));}
 function openEditor(r){$('edit-fired-skill').value=r.firedSkill||'';$('edit-mew-shards').value=r.shardAmount||C.shardAmounts('fixed',r.context?.effectiveLevel||1)[0];}
 function refreshEditor(){const mew=$('edit-method').value==='mew',shards=mew&&$('edit-fired-skill').value===shardSkill;$('edit-mew-fields').hidden=!mew;$('edit-mew-shards-label').hidden=!shards;$('edit-mew-shards').required=shards;}
 function applyEdit(r){if(r.method!=='mew'){delete r.firedSkill;delete r.shardAmount;delete r.registeredMainSkill;return;}const skill=$('edit-fired-skill').value;if(!skill){if(r.amount===0)throw Error('アメなしの記録では発動スキルを選択してください。');delete r.firedSkill;delete r.shardAmount;return;}r.firedSkill=skill;r.shardAmount=skill===shardSkill?Number($('edit-mew-shards').value):0;}
 return {init,editProfile,renderRecord:renderMewRecord,recordFields,appendHistory,openEditor,refreshEditor,applyEdit};
})();

const DateUI=(()=>{
 const datetime=value=>{const s=C.localInput(value);return C.displayDate(s.slice(0,10))+' '+s.slice(11);};
 function update(){for(const input of document.querySelectorAll('input[type=date],input[type=datetime-local]')){let wrapper=input.parentElement;if(!wrapper.classList.contains('date-field')){wrapper=document.createElement('span');wrapper.className='date-field';input.before(wrapper);wrapper.append(input);const day=document.createElement('small');day.className='date-weekday';wrapper.append(day);}wrapper.querySelector('.date-weekday').textContent=C.weekday(input.value.slice(0,10));}}
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
