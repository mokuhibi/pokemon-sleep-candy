'use strict';
// ゆめのかけら専用の履歴を追加し、アメ履歴には手を加えません。
const ShardUI=(()=>{
 const methodNames={skill:'スキル',research:'リサーチ',other:'その他'};
 const drafts=new Map();
 const records=()=>state.shardRecords||[];
 const individual=p=>`${label(p)} · 個体${(p.registrationOrder??0)+1}`;
 const amountInput=(id,min=0)=>{const input=el('input');Object.assign(input,{id,type:'number',inputMode:'numeric',min:String(min),max:'1000000000',step:'1',required:true});return input;};
 function number(id,min=0,max=1000000000){const raw=$(id).value.trim(),n=Number(raw);if(raw===''||!Number.isSafeInteger(n)||n<min||n>max)throw Error('入力値を確認してください。');return n;}
 function save(data){const date=recordDate();if(!Number.isFinite(date.getTime())){notice('記録日時を入力してください。');return false;}
  const r={id:uid(),datetime:date.toISOString(),...data};if($('auto-now').checked)$('datetime').value=C.localInput(date);
  return commit({...state,shardRecords:[...records(),r]},`ゆめのかけら：${r.amount}個（${methodNames[r.method]}）を記録しました。`);
 }
 function renderInputs(){
  const root=$('shard-skill-inputs');for(const input of root.querySelectorAll('input'))drafts.set(input.dataset.pokemon,input.value);
  root.replaceChildren();const team=currentTeam();const members=team.map((p,i)=>p?.shardSkill?{p,slot:i+1}:null).filter(Boolean);root.hidden=!members.length;
  if(!members.length)return;root.append(el('h2','ゆめのかけらゲット'));
  for(const {p,slot} of members){const card=el('div',undefined,'card'),form=el('form',undefined,'shard-skill-form');card.append(el('h3',`${position(slot)} · ${individual(p)}`));
   const l=el('label','獲得したゆめのかけら'),input=amountInput('shard-amount-'+slot,1);input.dataset.pokemon=p.id;input.value=drafts.get(p.id)||'';l.append(input);const b=el('button','記録');b.type='submit';form.append(l,b);
   form.onsubmit=e=>{e.preventDefault();try{const amount=number(input.id,1);const snapshot=clone(p);if(save({method:'skill',amount,pokemonId:p.id,pokemon:label(p),species:p.species,slot,pokemonSnapshot:snapshot})){drafts.delete(p.id);const fresh=$('shard-amount-'+slot);if(fresh)fresh.value='';}}catch(err){notice(err.message);}};
   card.append(form);root.append(card);
  }
 }
 function addSkillSetting(card,p){
  const l=el('label',undefined,'check shard-setting'),input=el('input');input.type='checkbox';input.checked=!!p.shardSkill;input.setAttribute('aria-label',individual(p)+'のスキル：ゆめのかけらゲット');
  input.onchange=()=>commit({...state,pokemon:state.pokemon.map(x=>x.id===p.id?{...x,shardSkill:input.checked}:x)},'ゆめのかけらゲットの設定を保存しました。');l.append(input,document.createTextNode('スキル：ゆめのかけらゲット'));card.append(l);
 }
 function renderSummary(){
  const day=$('shard-date').value||C.gameDay(new Date()),period=C.range($('shard-period').value,day),rs=records().filter(r=>C.inRange(r,period));
  $('shard-range').textContent=period?`${period[0]} 朝4時 〜 ${period[1]} 朝4時`:'全期間';
  const title=summaryTitle(period).replace(/のアメ$/,'のゆめのかけら'),root=$('shard-total');root.replaceChildren(el('small',title),qel('div',C.sum(rs)+'個','total'));
  for(const [key,name] of Object.entries(methodNames)){const xs=rs.filter(r=>r.method===key);if(xs.length)row(root,name,C.sum(xs)+'個');}
  const list=$('shard-pokemon-totals');list.replaceChildren();const groups=new Map();
  for(const r of rs.filter(r=>r.method==='skill')){if(!groups.has(r.pokemonId))groups.set(r.pokemonId,[]);groups.get(r.pokemonId).push(r);}
  for(const [id,xs] of groups){const latest=[...xs].sort((a,b)=>Date.parse(b.datetime)-Date.parse(a.datetime))[0],current=state.pokemon.find(p=>p.id===id),p=current||latest.pokemonSnapshot;const card=el('div',undefined,'shard-individual');const name=p?individual(p):latest.pokemon+' · '+id.slice(-6);card.append(el('h4',name+(current?'':'（登録解除済み）')));row(card,'スキル',xs.length+'回');row(card,'ゆめのかけら',C.sum(xs)+'個');list.append(card);}
  if(!groups.size)list.append(el('p','この期間のスキル記録はありません。'));
 }
 function appendHistory(root,today,all){
  for(const r of records().filter(r=>all||C.gameDay(r.datetime)===today)){
   const card=el('div',undefined,'card shards'),head=el('div',undefined,'history-head'),actions=el('div',undefined,'history-actions');card.dataset.datetime=r.datetime;
   actions.append(button('削除',()=>{if(confirm('このゆめのかけら記録を削除しますか？'))commit({...state,shardRecords:records().filter(x=>x.id!==r.id)},'ゆめのかけら記録を削除しました。');},'danger'));
   head.append(qel('strong',`ゆめのかけら · ${r.amount}個`),actions);card.append(head,el('p',C.localInput(r.datetime).replace('T',' ')+' · '+methodNames[r.method]));
   if(r.method==='skill')card.append(el('p',`${position(r.slot)} · ${r.pokemonSnapshot?individual(r.pokemonSnapshot):r.pokemon}`));
   if(r.method==='research'){card.append(qel('p',`リサーチ ${r.baseAmount}個`),el('p',`リサーチEXP ${r.researchExp}\nリサーチレベル ${r.researchLevel}`));}
   if(r.method==='other'&&r.memo)card.append(el('p',r.memo));root.append(card);
  }
  // アメ・ゆめのかけらを日時順に混在させ、既存の訂正・削除ボタンは保持。
  [...root.children].sort((a,b)=>Date.parse(b.dataset.datetime)-Date.parse(a.dataset.datetime)).forEach(card=>root.append(card));
 }
 function init(){
  $('shard-date').value=C.gameDay(new Date());for(const id of ['shard-period','shard-date'])$(id).onchange=renderSummary;
  $('shard-today').onclick=()=>{$('shard-date').value=C.gameDay(new Date());renderSummary();};
  $('shard-research-form').onsubmit=e=>{e.preventDefault();try{const r={method:'research',baseAmount:number('shard-research-base'),researchExp:number('shard-research-exp'),researchLevel:number('shard-research-level',1,70)};r.amount=C.shardTotal(r);if(save(r)){$('shard-research-base').value='';$('shard-research-exp').value='';}}catch(err){notice(err.message);}};
  $('shard-other-form').onsubmit=e=>{e.preventDefault();try{if(save({method:'other',amount:number('shard-other-amount'),memo:$('shard-other-memo').value.trim()}))$('shard-other-form').reset();}catch(err){notice(err.message);}};
 }
 return {init,renderInputs,addSkillSetting,renderSummary,appendHistory};
})();
