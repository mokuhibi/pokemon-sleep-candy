'use strict';
// 新しい獲得記録も既存の履歴配列に1件だけ追加します。表示合計は保存しません。
const CopySkills=(()=>{
 const drafts=new Map();
 const isCopy=p=>['メタモン','バリヤード'].includes(p?.species);
 function sources(p,kind,team=currentTeam()){
  const eligible=q=>kind==='candy'?(q.species==='デリバード'||SK.id(SK.forPokemon(q))==='metronome'):['dream_shard_s','super_luck','metronome'].includes(SK.id(SK.forPokemon(q)));
  if(isCopy(p))return team.filter(q=>q&&q.id!==p.id&&speciesEnabled(q.species)&&eligible(q));
  return p.species!=='ミュウ'&&SK.id(SK.forPokemon(p))==='metronome'?[p]:[];
 }
 const handlesShards=p=>sources(p,'shards').length>0;
 function build(kind,actorId,sourceId,amount,targetSlot,date){
  if(!Number.isSafeInteger(amount)||amount<0||amount>1000000000)throw Error('獲得数を入力してください。');
  if(!Number.isFinite(date.getTime()))throw Error('記録日時を入力してください。');
  const team=currentTeam(),actor=team.find(p=>p?.id===actorId),source=actor&&sources(actor,kind,team).find(p=>p.id===sourceId);
  if(!actor||!source)throw Error('現在の編成と参照元を確認してください。');
  const actorSlot=team.findIndex(p=>p?.id===actor.id)+1,skillId=SK.id(SK.forPokemon(source)),meta={id:uid(),datetime:date.toISOString(),mainSkillId:SK.id(SK.forPokemon(actor)),registeredMainSkill:SK.value(SK.forPokemon(actor)),sourcePokemonId:source.id,sourcePokemon:clone(source),sourceSkillId:skillId,amount};
  if(kind==='shards'){
   if(amount===0&&skillId!=='super_luck')throw Error('獲得数は1以上で入力してください。');
   return {...meta,method:skillId==='super_luck'?'lucky':'skill',skillType:'random',amountCorrected:true,skillId,skillName:SK.value(skillId),pokemonId:actor.id,pokemon:storedLabel(actor),species:actor.species,slot:actorSlot,pokemonSnapshot:clone(actor)};
  }
  const target=team[targetSlot-1];if(!target||amount<1)throw Error('アメの獲得先と1以上の個数を選んでください。');
  return {...meta,method:'skill',skillId,slot:targetSlot,pokemonId:target.id,pokemon:storedLabel(target),species:target.species,nickname:target.nickname,candy:candyMap[target.species],context:{rulesVersion:3,team:clone(team),actor:{...clone(actor),profile:clone(C.recordProfile(actor))},actorId:actor.id,actorSlot,event:{name:'通常',multiplier:1,boost:0},effectiveLevel:C.recordProfile(actor).skillLevel}};
 }
 function render(root,kind){
  for(const p of currentTeam().filter(Boolean)){
   if(!speciesEnabled(p.species))continue;const choices=sources(p,kind);if(!choices.length)continue;
   const slot=currentTeam().findIndex(x=>x?.id===p.id)+1,key=kind+'-'+p.id,card=el('div',undefined,'card copy-skill-card'+(slot===1?' leader-slot':''));
   card.append(el('h3',position(slot)+' · '+label(p)),el('p',mainSkillText(p)+(kind==='candy'?' · アメ':' · ゆめのかけら')));
   const form=el('form'),source=el('select'),target=el('select'),input=el('input');input.type='number';input.inputMode='numeric';input.min='0';input.max='1000000000';input.required=true;input.step='1';
   const draft=drafts.get(key)||{};input.value=draft.amount||'';input.oninput=()=>remember();
   optionList(source,choices.map(q=>({id:q.id,text:label(q)+' · '+mainSkillText(q)})),draft.source||choices[0].id);const sl=el('label','参照するポケモン');sl.append(source);if(isCopy(p))form.append(sl);
   if(kind==='candy'){optionList(target,currentTeam().map((q,i)=>q?{id:String(i+1),text:position(i+1)+' · '+label(q)}:null).filter(Boolean),draft.target||'1');const tl=el('label','アメの獲得先');tl.append(target);form.append(tl);}
   const l=el('label',kind==='candy'?'獲得したアメの個数':'獲得したゆめのかけら');l.append(input);form.append(l);const b=button('記録',()=>{});b.type='submit';form.append(b);
   function remember(){drafts.set(key,{amount:input.value,source:source.value,target:target.value});}
   function updateMin(){input.min=kind==='shards'&&SK.id(SK.forPokemon(choices.find(q=>q.id===source.value)))==='super_luck'?'0':'1';remember();}source.onchange=updateMin;target.onchange=remember;updateMin();
   form.onsubmit=e=>{e.preventDefault();try{if(!input.value.trim())throw Error('獲得数を入力してください。');const r=build(kind,p.id,source.value,Number(input.value),Number(target.value),recordDate());const field=kind==='candy'?'records':'shardRecords';drafts.delete(key);if(!commit({...state,[field]:[...state[field],r]},label(p)+'：'+r.amount+'個を記録しました。'))remember();}catch(e){notice(e.message);}};
   card.append(form);root.append(card);root.hidden=false;
  }
 }
 function edit(r){
  const dialog=el('dialog'),form=el('form');dialog.append(form);document.querySelector('main').append(dialog);
  form.append(el('h2','スキルによるアメの訂正'));const date=el('input'),amount=el('input'),target=el('select');date.type='datetime-local';date.value=C.localInput(r.datetime);amount.type='number';amount.min='1';amount.max='1000000000';amount.step='1';amount.inputMode='numeric';amount.value=r.amount;date.required=amount.required=true;
  optionList(target,(r.context?.team||[]).map((p,i)=>p?{id:String(i+1),text:position(i+1)+' · '+label(p)}:null).filter(Boolean),String(r.slot));
  for(const [name,input] of [['日時',date],['アメの獲得先',target],['アメの個数',amount]]){const l=el('label',name);l.append(input);form.append(l);}
  const error=el('p'),save=button('訂正を保存',()=>{}),cancel=button('閉じる',()=>dialog.close());save.type='submit';form.append(error,save,cancel);dialog.onclose=()=>dialog.remove();
  form.onsubmit=e=>{e.preventDefault();try{const slot=Number(target.value),p=r.context.team[slot-1],n=Number(amount.value),d=C.fromInput(date.value);if(!p||!Number.isSafeInteger(n)||n<1||n>1000000000||!Number.isFinite(d.getTime()))throw Error('入力値を確認してください。');const next={...r,slot,amount:n,datetime:d.toISOString(),pokemonId:p.id,pokemon:storedLabel(p),species:p.species,nickname:p.nickname,candy:candyMap[p.species]};if(commit({...state,records:state.records.map(x=>x.id===r.id?next:x)},'履歴を訂正しました。'))dialog.close();}catch(e){error.textContent=e.message;}};
  DateUI.update();dialog.showModal();
 }
 return {sources,handlesShards,build,render,edit};
})();
