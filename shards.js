'use strict';
// ゆめのかけら専用の履歴を追加し、アメ履歴には手を加えません。
const ShardUI=(()=>{
 const methodNames={skill:'スキル',lucky:'きょううん',research:'リサーチ',other:'その他'};
 const drafts=new Map();let researchDateTouched=false,researchSourceKey=null;
 const isTarget=p=>!!SK.shardMode(p);
 const typeOf=p=>SK.shardMode(p);
 const skillName=type=>SK.name(type==='lucky'?'super_luck':'dream_shard_s');
 const records=()=>state.shardRecords||[];
 const summaryRecords=()=>[...records(),...C.mewShardRecords(state.records).filter(()=>enabled('mew'))];
 const individual=p=>label(p);
 const amountInput=(id,min=0)=>{const input=el('input');Object.assign(input,{id,type:'number',inputMode:'numeric',min:String(min),max:'1000000000',step:'1',required:true});return input;};
 function number(id,min=0,max=1000000000){const raw=$(id).value.trim(),n=Number(raw);if(raw===''||!Number.isSafeInteger(n)||n<min||n>max)throw Error('入力値を確認してください。');return n;}
 function save(data){const date=data.targetDate?C.fromInput(data.targetDate+'T04:00'):recordDate();if(!Number.isFinite(date.getTime())){notice('記録日時を入力してください。');return false;}
  const r={id:uid(),datetime:date.toISOString(),...data};if(data.targetDate)r.recordedAt=new Date().toISOString();if(!data.targetDate&&$('auto-now').checked)$('datetime').value=C.localInput(date);
  return commit({...state,shardRecords:[...records(),r]},`ゆめのかけら：${r.amount}個（${methodNames[r.method]}）を記録しました。`);
 }
 // 同日の複数記録は最後に保存されたものを表示。合計ではなく入力値を使います。
 function loadResearch(force=false){
  const day=$('shard-research-date').value;
  const matches=records().filter(r=>r.method==='research'&&(r.targetDate||C.gameDay(r.datetime))===day);
  const r=[...matches].sort((a,b)=>Date.parse(a.updatedAt||a.recordedAt||a.datetime)-Date.parse(b.updatedAt||b.recordedAt||b.datetime)).at(-1),key=JSON.stringify([day,r||null]);
  if(!force&&key===researchSourceKey)return;researchSourceKey=key;
  $('shard-research-level').value=r?.researchLevel??'';
  $('shard-research-exp').value=r?.researchExp??'';
  $('shard-research-base').value=r?.baseAmount??'';
 }
 function renderInputs(){
  if(!researchDateTouched)$('shard-research-date').value=C.addDays(C.gameDay(new Date()),-1);
  loadResearch();
  const root=$('shard-skill-inputs');for(const input of root.querySelectorAll('input'))drafts.set(input.dataset.pokemon,input.value);
  root.replaceChildren();const members=currentTeam().map((p,i)=>p&&speciesEnabled(p.species)&&isTarget(p)?{p,slot:i+1}:null).filter(Boolean);root.hidden=!members.length;
  if(!members.length)return;root.append(el('h2','ゆめのかけら'));
  for(const {p,slot} of members){
   const type=typeOf(p),level=p.profile?.skillLevel,card=el('div',undefined,'card');card.append(el('h3',`${position(slot)} · ${individual(p)}`),el('p',skillName(type)+(level?` · スキルLv.${level}`:'')));
   if(p.species==='ミュウ')card.append(el('p','登録スキル：'+SK.name(SK.forPokemon(p))));
   const saveSkill=amount=>p.species==='ミュウ'?MewUI.saveShard(p,amount):save({method:type==='lucky'?'lucky':'skill',skillType:type,skillId:SK.id(SK.forPokemon(p)),skillName:SK.value(SK.forPokemon(p)),...(level?{skillLevel:level}:{}),amount,pokemonId:p.id,pokemon:storedLabel(p),species:p.species,slot,pokemonSnapshot:clone(p)});
   if(type==='random'){
    const form=el('form',undefined,'shard-skill-form'),l=el('label','獲得したゆめのかけら'),input=amountInput('shard-amount-'+slot,1);input.dataset.pokemon=p.id;input.value=drafts.get(p.id)||'';l.append(input);const b=el('button','記録');b.type='submit';form.append(l,b);
    form.onsubmit=e=>{e.preventDefault();try{if(saveSkill(number(input.id,1))){drafts.delete(p.id);const fresh=$('shard-amount-'+slot);if(fresh)fresh.value='';}}catch(err){notice(err.message);}};card.append(form);
   }else if(!level){card.append(button('スキルレベルを設定',()=>{showTab('settings');$('profile-select').value=p.id;editProfile();}));}
   else{const actions=el('div',undefined,'shard-amount-buttons');for(const amount of C.shardAmounts(type,level)){const b=button('',()=>saveSkill(amount));if(amount===0)b.textContent='スキルのみ';else quantityText(b,amount+'個');actions.append(b);}card.append(actions);}
   root.append(card);
  }
 }
 function addSkillSetting(card,p){card.append(el('small',SK.name(SK.forPokemon(p))+(p.profile?` · Lv.${p.profile.skillLevel}`:''),'shard-setting'));}
 function renderSummary(){
  const day=$('shard-date').value||C.gameDay(new Date()),period=C.range($('shard-period').value,day),rs=summaryRecords().filter(r=>C.inRange(r,period));
  $('shard-range').textContent=period?`${C.displayDate(period[0])} 朝4時 〜 ${C.displayDate(period[1])} 朝4時`:'全期間';
  const title=summaryTitle(period).replace(/のアメ$/,'のゆめのかけら'),root=$('shard-total');root.replaceChildren(el('small',title),qel('div',C.sum(rs)+'個','total'));
  for(const [key,name] of [['skill','スキル'],['research','リサーチ'],['other','その他']]){const xs=rs.filter(r=>key==='skill'?['skill','lucky'].includes(r.method):r.method===key);if(xs.length)row(root,name,C.sum(xs)+'個');}
  WeeklyChart.render($('shard-weekly-chart'),summaryRecords(),day);
  const list=$('shard-pokemon-totals');list.replaceChildren();const groups=new Map();
  for(const r of rs.filter(r=>['skill','lucky'].includes(r.method))){if(!groups.has(r.pokemonId))groups.set(r.pokemonId,[]);groups.get(r.pokemonId).push(r);}
  for(const [id,xs] of groups){const latest=[...xs].sort((a,b)=>Date.parse(b.datetime)-Date.parse(a.datetime))[0],current=state.pokemon.find(p=>p.id===id),p=current||latest.pokemonSnapshot;const card=el('div',undefined,'shard-individual');const name=p?individual(p):label(historicalPokemon(latest));card.append(el('h4',name+(current?'':'（登録解除済み）')));row(card,'スキル',xs.length+'回');const skillGroups=new Map();for(const record of xs){const key=SK.id(record.skillId||record.skillName||(record.method==='lucky'?'super_luck':'dream_shard_s'));skillGroups.set(key,(skillGroups.get(key)||0)+1);}for(const [key,count] of skillGroups)row(card,SK.name(key),count+'回');row(card,'ゆめのかけら',C.sum(xs)+'個');list.append(card);}
  if(!groups.size)list.append(el('p','この期間のスキル記録はありません。'));
 }
 function appendHistory(root,period){
  for(const r of records().filter(r=>C.inRange(r,period))){
   const card=el('div',undefined,'card shards'),head=el('div',undefined,'history-head'),actions=el('div',undefined,'history-actions');card.dataset.datetime=r.datetime;
   actions.append(button('訂正',()=>ShardEditor.open(r)),button('削除',()=>{if(confirm('このゆめのかけら記録を削除しますか？'))commit({...state,shardRecords:records().filter(x=>x.id!==r.id)},'ゆめのかけら記録を削除しました。');},'danger'));
   head.append(qel('strong',`ゆめのかけら · ${r.amount}個`),actions);card.append(head,el('p',(r.targetDate?'対象日 '+C.displayDate(r.targetDate):DateUI.datetime(r.datetime))+' · '+methodNames[r.method]));
   if(['skill','lucky'].includes(r.method))card.append(el('p',`${position(r.slot)} · ${r.pokemonSnapshot?individual(r.pokemonSnapshot):label(historicalPokemon(r))}${r.skillLevel?'\nスキルLv.'+r.skillLevel:''}${r.method==='lucky'?'\n'+SK.name(r.skillId||r.skillName||'super_luck')+(r.amount===0?' · スキルのみ':''):'\n'+SK.name(r.skillId||r.skillName||'dream_shard_s')}`));
   if(r.method==='research'){card.append(qel('p',`リサーチ ${r.baseAmount}個`),el('p',`リサーチEXP ${r.researchExp}\nリサーチレベル ${r.researchLevel}`));}
   if(r.method==='other'&&r.memo)card.append(el('p',r.memo));root.append(card);
  }
  // アメ・ゆめのかけらを日時順に混在させ、既存の訂正・削除ボタンは保持。
  [...root.children].sort((a,b)=>Date.parse(b.dataset.datetime)-Date.parse(a.dataset.datetime)).forEach(card=>root.append(card));
 }
 function init(){
  $('shard-research-date').value=C.addDays(C.gameDay(new Date()),-1);$('shard-research-date').oninput=()=>{researchDateTouched=true;loadResearch(true);};
  $('shard-date').value=C.gameDay(new Date());for(const id of ['shard-period','shard-date'])$(id).onchange=renderSummary;
  $('shard-today').onclick=()=>{$('shard-date').value=C.gameDay(new Date());renderSummary();};
  $('shard-research-form').onsubmit=e=>{e.preventDefault();try{const targetDate=$('shard-research-date').value;if(!C.dateOnly(targetDate))throw Error('対象日を入力してください。');const r={method:'research',targetDate,baseAmount:number('shard-research-base'),researchExp:number('shard-research-exp'),researchLevel:number('shard-research-level',1,70)};r.amount=C.shardTotal(r);if(save(r))loadResearch(true);}catch(err){notice(err.message);}};
  $('shard-other-form').onsubmit=e=>{e.preventDefault();try{if(save({method:'other',amount:number('shard-other-amount'),memo:$('shard-other-memo').value.trim()}))$('shard-other-form').reset();}catch(err){notice(err.message);}};
 }
 return {isTarget,init,renderInputs,addSkillSetting,renderSummary,appendHistory};
})();
