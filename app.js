'use strict';
const C=CandyCore, SK=MainSkillMaster, KEY='pokesleep-candy-v1', $=id=>document.getElementById(id);
const methods={help:'おてつだい',mew:'ミュウ',delibird:'デリバード'},names=Object.keys(candyMap);
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
const clone=x=>JSON.parse(JSON.stringify(x)), el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)nameText(n,text);if(cls)n.className=cls;return n;};
// 表示名だけを変更し、保存用の名前・内部IDは従来どおり保持します。
const displayNames=new Map();
const storedLabel=p=>p.nickname||C.speciesName(p.species);
const label=p=>{const species=C.speciesName(p.species),text=species+(p.nickname?'（'+p.nickname+'）':'');if(p.nickname)displayNames.set(text,{species,nickname:p.nickname});return text;};
function nameText(node,text){
 text=typeof text==='number'?text.toLocaleString('ja-JP'):String(text);node.replaceChildren();let rest=text;
 while(rest){let hit=null,at=rest.length;for(const [name,p] of displayNames){const i=rest.indexOf(name);if(i>=0&&(i<at||(i===at&&name.length>(hit?.name.length||0)))){at=i;hit={name,...p};}}
  if(!hit){node.append(document.createTextNode(rest));break;}
  node.append(document.createTextNode(rest.slice(0,at)+hit.species));const small=document.createElement('span');small.className='pokemon-nickname';small.textContent='（'+hit.nickname+'）';node.append(small);rest=rest.slice(at+hit.name.length);
 }return node;
}
// 表示専用。保存するスキル名やIDは変えません。
const mainSkillText=(p,skill=SK.forPokemon(p))=>p?.species==='ミュウ'?'オールマイティー('+SK.name(skill)+')':SK.name(skill);
function openIndividualEditor(p){showTab('team');$('profile-select').value=p.id;editProfile();$('individual-editor').scrollIntoView({block:'start'});}
const position=n=>n===1?'1 R':String(n);
const fresh=()=>({version:2,pokemon:[],team:[null,null,null,null,null],records:[],shardRecords:[],events:[],settings:{mew:true,delibird:true}});
let state=fresh(),blocked=false,selected='',eventId=null,activeTab='record',actors={mew:'',delibird:''};
let noticeTimer;
function positionNotice(){const n=$('notice'),card=document.querySelector('.record-date-card');let top=12;if(activeTab==='record'&&card){const box=card.getBoundingClientRect(),stickyTop=parseFloat(getComputedStyle(card).top)||0;if(box.top<=stickyTop+1&&box.bottom>0)top=box.bottom+6;}n.style.top=top+'px';}
window.addEventListener('scroll',positionNotice,{passive:true});window.addEventListener('resize',positionNotice);

function notice(s){const n=$('notice');quantityText(n,s);positionNotice();n.classList.remove('shown');void n.offsetWidth;n.classList.add('shown');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>n.classList.remove('shown'),5000);}
const enabled=method=>method==='help'||state.settings[method];
const speciesEnabled=species=>species!=='ミュウ'&&species!=='デリバード'||state.settings[species==='ミュウ'?'mew':'delibird'];
const special=p=>p.species==='ミュウ'||p.species==='デリバード';
const visibleRecord=r=>enabled(r.method)&&speciesEnabled(r.species);
const actorOf=c=>c?.actor||c?.team[c.actorSlot-1];
const actorPosition=c=>c.actorSlot?position(c.actorSlot):'編成外';
const groupRank=p=>p.species==='ミュウ'?0:p.species==='デリバード'?1:2;
const orderedPokemon=()=>state.pokemon.map((p,i)=>({p,i})).sort((a,b)=>groupRank(a.p)-groupRank(b.p)||(groupRank(a.p)<2?a.p.registrationOrder-b.p.registrationOrder:a.i-b.i)).map(x=>x.p);
let showOtherPokemon=false;
const relatedPokemon=p=>special(p)||ShardUI.isTarget(p);
let sorting=false,editingId=null,editPool=[];

function load(){try{const raw=localStorage.getItem(KEY);if(raw){const old=JSON.parse(raw);state=C.migrate(old,candyMap);const cleaned=C.cleanMewActivations(state);if(cleaned.records.length!==state.records.length){localStorage.setItem(KEY+'-before-mew-activation-cleanup',raw);state=cleaned;localStorage.setItem(KEY,JSON.stringify(state));}if(old.version===1){localStorage.setItem(KEY+'-before-v2',raw);localStorage.setItem(KEY,JSON.stringify(state));}}else{for(let i=0;i<5;i++){const species=localStorage.getItem('pokemon-slot-'+i);if(names.includes(species)){const p={id:uid(),species,nickname:'',profile:null};state.pokemon.push(p);state.team[i]=p.id;}}localStorage.setItem(KEY,JSON.stringify(state));}}catch(e){blocked=true;notice('保存データを読み込めません。上書きを停止しました。設定からバックアップを書き出してください。');}}
// 履歴と編成をまとめて保存。保存できた時だけ画面の状態を確定します。
function commit(next,message){if(blocked){notice('保存を停止しています。設定からバックアップの復元が必要です。');return false;}try{const checked=C.cleanMewActivations(C.migrate(next,candyMap));localStorage.setItem(KEY,JSON.stringify(checked));state=checked;render();notice(message);return true;}catch(e){notice('保存できませんでした：'+e.message);return false;}}
function button(text,action,cls){const b=el('button',text,cls);b.type='button';b.onclick=action;return b;}
function row(parent,name,value,cls){const r=el('div',undefined,'row '+(cls||''));r.append(el('span',name),qel('strong',value));parent.append(r);}
function quantityText(node,text){
 node.replaceChildren();const re=/(\d[\d,]*(?:\.\d+)?)(個|回)/g;let end=0;
 for(const m of String(text).matchAll(re)){node.append(document.createTextNode(String(text).slice(end,m.index)));const q=el('span',undefined,'quantity');q.append(el('span',Number(m[1].replace(/,/g,'')).toLocaleString('ja-JP'),'quantity-number'),el('span',m[2],'quantity-unit'));node.append(q);end=m.index+m[0].length;}
 node.append(document.createTextNode(String(text).slice(end)));return node;
}
const qel=(tag,text,cls)=>quantityText(el(tag,undefined,cls),text);
function optionList(select,items,value,empty='選択してください'){select.replaceChildren(new Option(empty,''));for(const item of items)select.add(new Option(item.text,item.id));select.value=value||'';}
function currentTeam(){return state.team.map(id=>state.pokemon.find(p=>p.id===id)||null);}
function recordDate(){return $('auto-now').checked?new Date():C.fromInput($('datetime').value);}
function skillContext(method){const team=currentTeam(),actorIndex=team.findIndex(p=>p&&p.id===actors[method]);const p=method==='mew'?state.pokemon.find(p=>p.species==='ミュウ'):team[actorIndex];const date=recordDate();if(!p||!Number.isFinite(date.getTime()))return null;const actor={...clone(p),profile:clone(C.recordProfile(p))};const event=C.eventFor(state.events,C.gameDay(date),method);return {rulesVersion:3,team:clone(team),actor,actorId:p.id,actorSlot:actorIndex>=0?actorIndex+1:null,event,effectiveLevel:Math.min(C.skillCap(p.species),actor.profile.skillLevel+event.boost)};}

function record(method,slot,amount){const date=recordDate();if(!Number.isFinite(date.getTime())){notice('記録日時を入力してください。');return;}const team=currentTeam(),p=team[slot-1],skillOnly=(method==='delibird'&&slot===6)||(method==='mew'&&slot===null);const context=method==='help'?{team:clone(team),actorId:null,actorSlot:null,event:null,effectiveLevel:null}:skillContext(method);
 if((!p&&!skillOnly)||!context){notice('編成とスキル個体の個体情報を設定してください。');return;}
 if(method==='mew'&&!skillOnly&&!C.mewAmounts(actorOf(context).profile.skillLevel).includes(amount)){renderRecord();notice('登録スキルLvに合わせてボタンを更新しました。もう一度選んでください。');return;}
 if($('auto-now').checked)$('datetime').value=C.localInput(date);
 const r={id:uid(),datetime:date.toISOString(),method,amount,slot,pokemonId:skillOnly?null:p.id,pokemon:skillOnly?'スキルのみ':storedLabel(p),species:skillOnly?null:p.species,nickname:skillOnly?'':p.nickname,candy:skillOnly?null:candyMap[p.species],context};
 if(method==='delibird')Object.assign(r,{registeredMainSkill:SK.value(SK.forPokemon(actorOf(context))),mainSkillId:SK.id(SK.forPokemon(actorOf(context)))});
 if(method==='mew'){try{Object.assign(r,MewUI.recordFields(context));}catch(e){notice(e.message);return;}}
 commit({...state,records:[...state.records,r]},`${methods[method]}：${skillOnly?'スキルのみ（アメなし）':position(slot)+'・'+r.candy+' '+amount+'個'}を記録しました。`);
}
function totals(parent,records,title){records=records.filter(visibleRecord);parent.replaceChildren(el('small',title),qel('div',`${C.sum(records)}個`,'total'));for(const [method,name] of Object.entries(methods)){if(!enabled(method))continue;const rs=records.filter(r=>r.method===method);row(parent,name,method==='help'?`${parent.id==='today-total'?'回数':'おてつだい回数'}${rs.length}回 · アメ${C.sum(rs)}個`:`スキル${rs.length}回 · アメ${C.sum(rs)}個`,method);}}

function renderRecord(){

 ShardUI.renderInputs();
 totals($('today-total'),state.records.filter(r=>C.gameDay(r.datetime)===C.gameDay(new Date())),`今日 ${C.displayDate(C.gameDay(new Date()))}`);
 const root=$('record-methods');root.replaceChildren();const team=currentTeam();
 for(const [method,name] of Object.entries(methods)){
  if(method!=='help'&&!state.settings[method])continue;
  const section=el('div',undefined,method);section.id=method+'-section';section.append(el('h2',name));let context=null;
  if(method!=='help'){
   const candidates=method==='mew'?state.pokemon.filter(p=>p.species==='ミュウ').slice(0,1).map(p=>({id:p.id,text:label(p)})):team.map((p,i)=>p&&p.species===name?{id:p.id,text:`${position(i+1)} · ${label(p)}`} : null).filter(Boolean);
   if(!candidates.some(p=>p.id===actors[method]))actors[method]=candidates.length===1?candidates[0].id:'';
   const l=el('label','スキル個体'),s=el('select');s.id=method+'-actor';optionList(s,candidates,actors[method]);s.onchange=()=>{actors[method]=s.value;renderRecord();};l.append(s);if(method!=='mew')section.append(l);
   context=skillContext(method);
   if(!context){section.append(el('p',candidates.length?(method==='delibird'&&!actors[method]?'スキル個体未選択':'個体情報未設定'):name+'未設定','muted'));}
   else{if(method==='delibird')section.append(el('p',mainSkillText(actorOf(context))));section.append(el('p',`スキルLv.${method==='mew'?actorOf(context).profile.skillLevel:context.effectiveLevel} · 確率${context.event.multiplier}倍 · ${context.event.name}`,'muted'));}
  }
  if(method==='mew'&&context)MewUI.renderRecord(section,context);
  const grid=el('div',undefined,'record-slots');grid.id=method+'-slots';
  team.forEach((p,i)=>{
   if(p&&!speciesEnabled(p.species))return;
   const box=el(method==='mew'?'div':'button',undefined,'help-card');box.append(el('small',position(i+1)),el('strong',p?(method==='help'?label(p):candyMap[p.species]):'未設定'));
   if(method==='mew'){const actions=el('div',undefined,'mew-actions');for(const amount of context?C.mewAmounts(actorOf(context).profile.skillLevel):[1]){const b=button('',()=>record(method,i+1,amount));quantityText(b,'+'+amount+'個');b.disabled=!p||!context;actions.append(b);}box.append(actions);}
   else{box.type='button';box.disabled=!p||(method!=='help'&&!context);box.onclick=()=>record(method,i+1,method==='help'?2:4);}
   grid.append(box);
  });
  if(method==='delibird'){const b=button('',()=>record('delibird',6,0),'help-card');b.append(el('small','6 · アメなし'),el('strong','スキルのみ'));b.disabled=!context;grid.append(b);}
  section.append(grid);root.append(section);
 }
}
function historicalActors(method){const species=methods[method],map=new Map();for(const p of state.pokemon)if(p.species===species)map.set(p.id,label(p));for(const r of state.records)if(r.method===method&&r.context?.actorId){const p=actorOf(r.context);if(!map.has(p.id))map.set(p.id,label(p)+'（登録解除済み）');}return [...map].map(([id,text],i)=>({id,text}));}
function renderActorFilters(){
 const m=$('analysis-method'),old=m.value;m.replaceChildren();for(const method of ['mew','delibird'])if(enabled(method))m.add(new Option(methods[method],method));if([...m.options].some(o=>o.value===old))m.value=old;
 const a=$('analysis-actor');optionList(a,historicalActors(m.value),a.value,'全個体');a.closest('label').hidden=m.value==='mew';
 const lv=$('analysis-level'),value=lv.value;lv.replaceChildren(new Option('すべて',''));for(let i=1;i<=(m.value==='delibird'?7:8);i++)lv.add(new Option(String(i),String(i)));lv.value=value; 
 $('analysis-card').hidden=!enabled('mew')&&!enabled('delibird');
}
function filteredRecords(){const period=C.range($('period').value,$('summary-date').value||C.gameDay(new Date()));return state.records.filter(r=>visibleRecord(r)&&C.inRange(r,period));}

function calendar(parent,month,cell){parent.replaceChildren();if(!/^\d{4}-\d{2}$/.test(month))return;for(const d of ['月','火','水','木','金','土','日'])parent.append(el('span','（'+d+'）','weekday'));const first=month+'-01',offset=(new Date(first).getUTCDay()+6)%7;for(let i=0;i<offset;i++)parent.append(el('span'));for(let day=first;day.startsWith(month);day=C.addDays(day,1)){const date=day;parent.append(cell(date));}}
// 終了日は翌朝4時のため、見出しではその前日を表示します。
function summaryTitle(period){if(!period)return '全期間のアメ';const short=C.displayDate;const end=C.addDays(period[1],-1);return (period[0]===end?short(period[0]):short(period[0])+'〜'+short(end))+'のアメ';}
function renderSummary(){
 PeriodPicker.sync();
 $('mew-image-card').hidden=!enabled('mew');$('mew-image-preview').hidden=true;
 const rs=filteredRecords(),period=C.range($('period').value,$('summary-date').value||C.gameDay(new Date()));$('range-label').textContent=period?`${C.displayDate(period[0])} 04:00 〜 ${C.displayDate(period[1])} 04:00`:'全期間';totals($('summary-total'),rs,summaryTitle(period));
 const calendarRs=state.records.filter(visibleRecord);
 const month=($('summary-date').value||C.gameDay(new Date())).slice(0,7);$('candy-month').textContent=month.replace('-','年')+'月';
 WeeklyChart.render($('candy-weekly-chart'),calendarRs,$('summary-date').value||C.gameDay(new Date()));
 calendar($('candy-calendar'),month,date=>{const b=button('',()=>{$('summary-date').value=date;$('period').value='day';renderSummary();},'day');b.append(el('strong',Number(date.slice(-2)),'day-number'));const values=el('span',undefined,'candy-values');for(const method of Object.keys(methods)){if(!enabled(method))continue;const total=C.sum(calendarRs.filter(r=>r.method===method&&C.gameDay(r.datetime)===date));values.append(el('span',total.toLocaleString('ja-JP'),method));}b.append(values);b.setAttribute('aria-label',C.displayDate(date)+'のアメ');if(date===$('summary-date').value)b.classList.add('selected');return b;});
 document.querySelectorAll('.legend .mew,.legend .delibird').forEach(n=>n.hidden=!enabled(n.className));

 $('slot-counts').replaceChildren();for(const [method,name] of Object.entries(methods)){if(!enabled(method))continue;const group=el('div',undefined,method);const source=rs.filter(r=>r.method===method);group.append(qel('h4',`${name}${method==='help'?'':` · スキル${source.length}回`}`));if(method!=='help')SkillUI.candyCounts(group,source);for(let i=1;i<=5;i++){const xs=source.filter(r=>r.slot===i);row(group,position(i),`${xs.length}回 · ${C.sum(xs)}個`);}if(method==='delibird')row(group,'6 · スキルのみ',source.filter(r=>r.slot===6).length+'回');if(method==='mew'&&source.some(r=>r.amount===0))row(group,'アメなし · スキルのみ',source.filter(r=>r.amount===0).length+'回');const unknown=source.filter(r=>r.slot===null&&r.amount!==0);if(unknown.length)row(group,'獲得位置不明',unknown.length+'回 · '+C.sum(unknown)+'個');$('slot-counts').append(group);}
 $('candy-list').replaceChildren();const candies={};for(const r of rs)if(r.candy&&r.amount)candies[r.candy]=(candies[r.candy]||0)+r.amount;for(const [c,n] of Object.entries(candies).sort((a,b)=>b[1]-a[1]))row($('candy-list'),c,n+'個');if(!Object.keys(candies).length)$('candy-list').append(el('p','まだアメの記録がありません。'));
 renderAnalysis();
}
function renderAnalysis(){
 const records=filteredRecords();
 const method=$('analysis-method').value,actor=$('analysis-actor').value,level=$('analysis-level').value,multi=$('analysis-multiplier').value,amount=$('analysis-amount').value;
 const source=records.filter(r=>r.method===method&&(method!=='mew'||r.amount>0)),unknown=source.filter(r=>!r.context?.actorId||!r.context.actorSlot||!r.slot).length;
 const rs=source.filter(r=>r.context?.actorId&&r.context.actorSlot&&r.slot&&(!actor||r.context.actorId===actor)&&(!level||(r.method==='mew'?(r.recordedSkillLevel??actorOf(r.context)?.profile?.skillLevel??r.context.effectiveLevel):r.context.effectiveLevel)===Number(level))&&(!multi||r.context.event.multiplier===Number(multi))&&(amount===''||r.amount===Number(amount)));
 const root=$('analysis');root.className=method;root.replaceChildren(qel('p',`分析対象 ${rs.length}回 · 位置などが不明な記録 ${unknown}回は除外`));
 const wrap=el('div',undefined,'table-scroll'),table=el('table'),head=el('tr');table.className='position-table'+(method==='mew'?' mew-position-table':'');const caption=el('caption','獲得先 →');table.append(caption);head.append(el('th','位置 ↓'));for(let i=1;i<=(method==='mew'?5:6);i++)head.append(el('th',i===6?'アメなし':String(i)));head.append(el('th','スキル回数'));table.append(head);
 for(let i=1;i<=5;i++){const tr=el('tr'),xs=rs.filter(r=>r.context.actorSlot===i);tr.append(el('th',i===1?'1\nR':String(i)));for(let j=1;j<=(method==='mew'?5:6);j++){const count=xs.filter(r=>r.slot===j).length;tr.append(qel('td',`${count}回\n${xs.length?(count/xs.length*100).toFixed(1)+'%':'—'}`));}tr.append(qel('td',xs.length+'回'));table.append(tr);}wrap.append(table);root.append(wrap);
 for(const count of method==='mew'?[1,2,3,4]:[0,4]){row(root,`${count}個の記録`,rs.filter(r=>r.amount===count).length+'回');const n=root.lastElementChild.firstElementChild;quantityText(n,n.textContent);}

}
function historicalPokemon(r){
 const snapshot=r.pokemonSnapshot||r.context?.team?.find(p=>p?.id===r.pokemonId);
 if(snapshot)return snapshot;
 const species=r.species||r.pokemon||'',raw=String(r.pokemon||'').replace(/ · #[a-zA-Z0-9-]+$/,'').replace('（'+species+'）','');
 return {species,nickname:typeof r.nickname==='string'?r.nickname:(raw&&raw!==species&&raw!==C.speciesName(species)?raw:'')};
}
function oldLabel(r){return r.amount===0?'スキルのみ':label(historicalPokemon(r));}
function profileText(p){if(!p.profile)return '個体情報不明';const v=p.profile;return `Lv.${v.level} · ${v.nature} · スキルLv.${v.skillLevel}\n`+v.subskills.map((s,i)=>`${[10,25,50,70,80][i]}: ${s||'未入力'}${v.level<[10,25,50,70,80][i]?'（未解放）':''}`).join(' / ');}
function renderHistory(){PeriodPicker.sync();const period=historyRange();$('history-day').textContent=period?C.displayDate(period[0])+' 〜 '+C.displayDate(C.addDays(period[1],-1)):'全期間';const root=$('history-list');root.replaceChildren();for(const r of [...state.records].filter(r=>visibleRecord(r)&&C.inRange(r,period)).reverse().sort((a,b)=>Date.parse(b.datetime)-Date.parse(a.datetime))){
 const card=el('div',undefined,'card '+r.method);card.dataset.datetime=r.datetime;const head=el('div',undefined,'history-head'),actions=el('div',undefined,'history-actions');
 actions.append(button('訂正',()=>openHistoryEditor(r)),button('削除',()=>{if(confirm('この記録を削除しますか？'))commit({...state,records:state.records.filter(x=>x.id!==r.id)},'削除しました。');},'danger'));
 head.append(qel('strong',`${methods[r.method]} · ${r.amount}個`),actions);card.append(head,el('p',`${DateUI.datetime(r.datetime)}\n${r.slot===6?'アメなし':r.slot?position(r.slot):'獲得位置不明'} · ${r.candy||'スキルのみ'}\n${oldLabel(r)}`));const details=el('details');details.append(el('summary',r.method==='help'?'編成':'編成・スキル'));
 if(!r.context)details.append(el('p',r.method==='help'?'編成不明':'編成・スキル個体不明'));
 else{const c=r.context;if(r.method!=='help'){const p=actorOf(c);details.append(el('p',`スキル：${actorPosition(c)} · ${label(p)}\nLv.${c.effectiveLevel} · ${c.event.multiplier}倍 · レベル+${c.event.boost} · ${c.event.name}`));}c.team.forEach((p,i)=>{if(p&&!speciesEnabled(p.species))return;details.append(el('p',`${position(i+1)} · ${p?label(p):'未設定'}${p?'\n'+mainSkillText(p):''}${p&&special(p)?'\n'+profileText(p):''}`));});}if(r.method==='mew')MewUI.appendHistory(card,r);else if(r.method==='delibird'){const actor=actorOf(r.context);card.append(el('p','登録スキル：'+SK.name(r.mainSkillId||r.registeredMainSkill||SK.forPokemon(actor))));}card.append(details);root.append(card);
 }ShardUI.appendHistory(root,period);if(!root.children.length)root.append(el('p','履歴なし'));}
function movePokemon(id,delta){const xs=state.pokemon.filter(p=>!special(p)),i=xs.findIndex(p=>p.id===id);if(i<0||i+delta<0||i+delta>=xs.length)return;[xs[i],xs[i+delta]]=[xs[i+delta],xs[i]];commit({...state,pokemon:[...state.pokemon.filter(special),...xs]},'並べ替えました。');}
function renderTeam(){const root=$('team-slots');root.replaceChildren();state.team.forEach((id,i)=>{const l=el('label',position(i+1)),s=el('select');s.setAttribute('aria-label',position(i+1));const current=state.pokemon.find(p=>p.id===id);if(current&&!speciesEnabled(current.species)){s.add(new Option('非表示',id));s.disabled=true;}else{optionList(s,orderedPokemon().filter(p=>speciesEnabled(p.species)).map((p,n)=>({id:p.id,text:label(p)})),id,'未設定');for(const o of s.options)if(o.value&&state.team.some((pid,j)=>j!==i&&pid===o.value))o.disabled=true;s.onchange=()=>{const team=[...state.team];team[i]=s.value||null;commit({...state,team},'編成を保存しました。');};}l.append(s);if(current&&speciesEnabled(current.species))l.append(el('small',mainSkillText(current),'main-skill-label'));root.append(l);});
 $('roster-other-toggle').textContent=showOtherPokemon?'その他のポケモンを閉じる':'その他のポケモンを表示';
 $('sort-toggle').textContent=sorting?'並べ替え完了':'並べ替え';$('sort-reset').hidden=!sorting;
 const list=$('registered-pokemon-list');list.replaceChildren();const normal=state.pokemon.filter(p=>!special(p));for(const p of orderedPokemon().filter(p=>speciesEnabled(p.species)&&(showOtherPokemon||relatedPokemon(p)))){const card=el('div',undefined,'registered-row '+(p.species==='ミュウ'?'mew':p.species==='デリバード'?'delibird':'')),actions=el('div',undefined,'row-actions');card.append(el('strong','No.'+String(nationalDex[p.species]).padStart(3,'0')+' '+label(p)));if(sorting&&!special(p)){const i=normal.findIndex(x=>x.id===p.id),up=button('↑',()=>movePokemon(p.id,-1)),down=button('↓',()=>movePokemon(p.id,1));up.setAttribute('aria-label',label(p)+'を上へ');down.setAttribute('aria-label',label(p)+'を下へ');up.disabled=i===0;down.disabled=i===normal.length-1;actions.append(up,down);}actions.append(button('編集',()=>{openIndividualEditor(p);}));actions.append(button('登録解除',()=>{if(confirm(label(p)+'を登録解除しますか？'))commit({...state,pokemon:state.pokemon.filter(x=>x.id!==p.id),team:state.team.map(id=>id===p.id?null:id)},'登録解除しました。');},'danger'));card.append(actions);list.append(card);ShardUI.addSkillSetting(card,p);}}

function normalize(s){return s.normalize('NFKC').trim().replace(/[\u3041-\u3096]/g,c=>String.fromCharCode(c.charCodeAt(0)+96));}
function renderCatalog(){const q=normalize($('pokemon-search').value),root=$('pokemon-search-results');root.replaceChildren();root.hidden=!!selected;if(selected)return;for(const name of names.filter(n=>speciesEnabled(n)&&(normalize(n).includes(q)||normalize(C.speciesName(n)).includes(q)))){const b=button('No.'+String(nationalDex[name]).padStart(3,'0')+' '+C.speciesName(name),()=>{selected=name;$('pokemon-search').value=C.speciesName(name);$('selected-name').textContent=C.speciesName(name);$('add-pokemon').disabled=false;SkillUI.registration(name);root.hidden=true;});b.disabled=name==='ミュウ'&&state.pokemon.some(p=>p.species==='ミュウ');root.append(b);}if(!root.children.length)root.append(el('p','該当するポケモンがありません。'));}
const natures='がんばりや さみしがり ゆうかん いじっぱり やんちゃ ずぶとい すなお のんき わんぱく のうてんき おくびょう せっかち まじめ ようき むじゃき ひかえめ おっとり れいせい てれや うっかりや おだやか おとなしい なまいき しんちょう きまぐれ'.split(' ');
const subskills='きのみの数S おてつだいボーナス スキルレベルアップS スキルレベルアップM スキル確率アップS スキル確率アップM おてつだいスピードS おてつだいスピードM 食材確率アップS 食材確率アップM 最大所持数アップS 最大所持数アップM 最大所持数アップL げんき回復ボーナス 睡眠EXPボーナス リサーチEXPボーナス ゆめのかけらボーナス'.split(' ');
function editProfile(){const p=state.pokemon.find(p=>p.id===$('profile-select').value);$('profile-form').hidden=!p;if(!p)return;const v=p.profile||C.profileDefault(p.species);nameText($('profile-species'),label(p));SkillUI.editProfile(p);$('profile-form').className=p.species==='ミュウ'?'mew':p.species==='デリバード'?'delibird':'';$('profile-nickname').value=p.nickname;$('profile-level').value=v.level;$('profile-nature').value=p.species==='ミュウ'?'きまぐれ':v.nature;$('profile-nature').disabled=p.species==='ミュウ';$('profile-skill').max=C.skillCap(p.species);$('profile-skill').value=Math.min(v.skillLevel,C.skillCap(p.species));v.subskills.forEach((s,i)=>$('subskill-'+i).value=s);SkillUI.refreshDetails(p);}
function renderSettings(){ $('enable-mew').checked=state.settings.mew;$('enable-delibird').checked=state.settings.delibird;const p=$('profile-select'),old=p.value;optionList(p,orderedPokemon().filter(p=>speciesEnabled(p.species)).map((p,i)=>({id:p.id,text:label(p)})),old);editProfile();$('profile-select').closest('.card').hidden=!state.pokemon.some(p=>speciesEnabled(p.species));$('event-month').closest('.card').hidden=!enabled('mew')&&!enabled('delibird');renderEvents();}
function selectEvent(e){eventId=e?.id||null;$('event-name').value=e?.name||'';$('event-start').value=e?.start||C.range('week',C.gameDay(new Date()))[0];$('event-end').value=e?.end||C.addDays(C.range('week',C.gameDay(new Date()))[1],-1);$('event-target').value=e?.target||'both';$('event-multiplier').value=e?.multiplier||1;$('event-boost').value=e?.boost||0;$('cancel-event').hidden=!e;}
function renderEvents(){const target=$('event-target'),previous=target.value;target.replaceChildren(new Option(['mew','delibird'].filter(enabled).map(m=>methods[m]).join('・'),'both'));for(const method of ['mew','delibird'].filter(enabled))target.add(new Option(methods[method],method));target.value=[...target.options].some(o=>o.value===previous)?previous:'both';calendar($('event-calendar'),$('event-month').value,date=>{const es=state.events.filter(e=>e.start<=date&&e.end>=date&&(e.target==='both'?enabled('mew')||enabled('delibird'):enabled(e.target)));const b=button('',()=>{selectEvent(null);const range=C.range('week',date);$('event-start').value=range[0];$('event-end').value=C.addDays(range[1],-1);},'day');b.append(el('small',Number(date.slice(-2))));for(const e of es)b.append(el('span',e.multiplier+'× / +'+e.boost,e.target==='both'?'':e.target));if(es.length)b.classList.add('event-day');b.setAttribute('aria-label',C.displayDate(date)+'のイベント設定');return b;});const root=$('event-list');root.replaceChildren();for(const e of [...state.events].filter(e=>e.target==='both'?enabled('mew')||enabled('delibird'):enabled(e.target)).sort((a,b)=>a.start.localeCompare(b.start))){const box=el('div',undefined,e.target==='both'?'':e.target);box.append(el('p',`${e.name} · ${C.displayDate(e.start)}〜${C.displayDate(e.end)}\n${e.target==='both'?['mew','delibird'].filter(enabled).map(m=>methods[m]).join('・'):methods[e.target]} · 確率${e.multiplier}倍 · スキルレベル+${e.boost}`),button('編集',()=>selectEvent(e)),button('削除',()=>{if(confirm('このイベント設定を削除しますか？ 記録済みの履歴は変更されません。')){if(commit({...state,events:state.events.filter(x=>x.id!==e.id)},'イベント設定を削除しました。'))selectEvent(null);}},'danger'));root.append(box);}}
function showTab(id){activeTab=id;for(const name of ['record','summary','shards','history','team','settings'])$(name).hidden=name!==id;for(const b of document.querySelectorAll('[data-tab]')){if(b.dataset.tab===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}if(id==='record')renderRecord();if(id==='summary')renderSummary();if(id==='history')renderHistory();if(id==='shards')ShardUI.renderSummary();window.scrollTo({top:0});positionNotice();}
function render(){ShardUI.renderSummary();renderRecord();renderActorFilters();renderSummary();renderHistory();renderTeam();renderSettings();renderCatalog();for(const o of $('event-target').options){if(o.value!=='both')o.hidden=!enabled(o.value);}if($('event-target').value!=='both'&&!enabled($('event-target').value))$('event-target').value='both';$('event-target').options[0].textContent=['mew','delibird'].filter(enabled).map(m=>methods[m]).join('・');DateUI.update();}
// 訂正は履歴のコピーを編集し、保存時だけ置き換えます。
function openHistoryEditor(r){
 editingId=r.id;const pool=new Map();for(const p of [...(r.context?.team||[]),actorOf(r.context),...state.pokemon])if(p&&!pool.has(p.id))pool.set(p.id,clone(p));if(r.method==='mew'&&r.species&&!pool.has(r.pokemonId))pool.set(r.pokemonId,{id:r.pokemonId,species:r.species,nickname:r.nickname||''});editPool=[...pool.values()];
 $('edit-error').textContent='';$('edit-datetime').value=C.localInput(r.datetime);
 const method=$('edit-method');method.replaceChildren();for(const [key,name] of Object.entries(methods))if(enabled(key))method.add(new Option(name,key));method.value=r.method;
 const species=$('edit-species');species.replaceChildren();for(const name of names.filter(speciesEnabled))species.add(new Option(C.speciesName(name),name));species.value=r.species||names[0];
 $('edit-context').checked=!!r.context;const root=$('edit-team');root.replaceChildren();
 for(let i=0;i<5;i++){const l=el('label',position(i+1)),s=el('select');s.id='edit-team-'+i;optionList(s,editPool.map((p,n)=>({id:p.id,text:speciesEnabled(p.species)?label(p):'非表示'})),r.context?.team[i]?.id||'','未設定');s.onchange=()=>refreshHistoryEditor();l.append(s);root.append(l);}
 $('edit-multiplier').value=r.context?.event?.multiplier||1;$('edit-boost').value=r.context?.event?.boost||0;
 MewUI.openEditor(r);refreshHistoryEditor(r.slot,r.amount,r.context?.actorId||'');$('history-editor').showModal();
}
function editTeam(){return Array.from({length:5},(_,i)=>clone(editPool.find(p=>p.id===$('edit-team-'+i).value)||null));}
function refreshHistoryEditor(slot,amount,actorId){
 const method=$('edit-method').value,s=$('edit-slot'),oldSlot=slot===undefined?s.value:(method==='mew'&&amount===0?'none':String(slot??''));s.replaceChildren(new Option('不明',''));if(method==='mew')s.add(new Option('アメなし','none'));for(let i=1;i<=(method==='delibird'?6:5);i++)s.add(new Option(i===6?'6 · アメなし':position(i),String(i)));s.value=oldSlot;
 const team=editTeam(),actor=$('edit-actor'),oldActor=actorId===undefined?actor.value:actorId;
 optionList(actor,editPool.filter(p=>p.species===methods[method]&&(method==='mew'||team.some(x=>x?.id===p.id))).map(p=>({id:p.id,text:label(p)})),oldActor,'不明');
 if(!actor.value&&actor.options.length===2)actor.selectedIndex=1;
 const profile=editPool.find(p=>p.id===actor.value)?.profile,lv=profile?Math.min(method==='delibird'?7:8,profile.skillLevel+Number($('edit-boost').value)):null;
 const values=method==='help'?[2]:method==='delibird'?s.value==='6'?[0]:[4]:s.value==='none'?[0]:C.mewAmounts(Number($('edit-mew-level').value)||1);
 const a=$('edit-amount'),oldAmount=amount===undefined?Number(a.value):amount;if(method==='mew'&&[1,2,3,4].includes(oldAmount)&&!values.includes(oldAmount)&&s.value!=='none')values.push(oldAmount);a.replaceChildren();for(const n of values)a.add(new Option(n+'個',String(n)));a.value=values.includes(oldAmount)?String(oldAmount):String(values[0]);
 const p=team[Number(s.value)-1];if($('edit-context').checked&&p)$('edit-species').value=p.species;
 $('edit-species-label').hidden=method==='mew'||s.value==='6'||s.value==='none';$('edit-species').disabled=$('edit-context').checked;
 $('edit-actor').closest('label').hidden=method==='help';$('edit-multiplier').closest('.filters').hidden=method==='help';$('edit-event-date').hidden=method==='help';
 for(let i=0;i<5;i++)$('edit-team-'+i).disabled=!$('edit-context').checked;
 actor.disabled=!$('edit-context').checked;MewUI.refreshEditor();
}
$('edit-mew-level').onchange=()=>refreshHistoryEditor(undefined,1);
$('edit-cancel').onclick=()=>$('history-editor').close();
for(const id of ['edit-method','edit-slot','edit-actor','edit-boost','edit-context'])$(id).onchange=()=>{refreshHistoryEditor();if(id==='edit-slot'&&$('edit-method').value==='mew'){const p=editTeam()[Number($('edit-slot').value)-1];if(p)$('edit-mew-target').value=p.id;}};
$('edit-event-date').onclick=()=>{const date=C.fromInput($('edit-datetime').value);if(!Number.isFinite(date.getTime()))return;const e=C.eventFor(state.events,C.gameDay(date),$('edit-method').value);$('edit-multiplier').value=e.multiplier;$('edit-boost').value=e.boost;refreshHistoryEditor();$('edit-error').textContent=e.name+'の補正を適用しました。';};
$('history-edit-form').onsubmit=e=>{
 e.preventDefault();const original=state.records.find(r=>r.id===editingId);if(!original)return;
 try{
  const datetime=C.fromInput($('edit-datetime').value);if(!Number.isFinite(datetime.getTime()))throw Error('日時を入力してください。');
  const method=$('edit-method').value,slot=$('edit-slot').value&&$('edit-slot').value!=='none'?Number($('edit-slot').value):null,amount=Number($('edit-amount').value),noCandy=(method==='delibird'&&slot===6)||(method==='mew'&&slot===null&&amount===0);
  let context=null,p=null,species=$('edit-species').value;
  if($('edit-context').checked){
   const team=editTeam(),ids=team.filter(Boolean).map(p=>p.id);if(new Set(ids).size!==ids.length)throw Error('同じ個体を複数の位置に設定できません。');
   p=team[slot-1];if(method!=='mew'&&!noCandy&&!p)throw Error('獲得先の編成を選んでください。');
   context={rulesVersion:3,team,actor:null,actorId:null,actorSlot:null,event:null,effectiveLevel:null};
   if(method!=='help'){
    const rawActor=editPool.find(p=>p.id===$('edit-actor').value);if(!rawActor)throw Error('スキル個体を選んでください。');const actor={...clone(rawActor),profile:clone(C.recordProfile(rawActor))};actor.profile.skillLevel=Math.min(C.skillCap(actor.species),actor.profile.skillLevel);
    const index=team.findIndex(p=>p?.id===actor.id);if(index<0&&method!=='mew')throw Error('デリバードを編成に入れてください。');if(index>=0)context.team[index]=clone(actor);
    const event={...(original.context?.event||{id:null,name:'訂正'}),multiplier:Number($('edit-multiplier').value),boost:Number($('edit-boost').value)};
    if(original.context?.event&&(event.multiplier!==original.context.event.multiplier||event.boost!==original.context.event.boost))event.name='訂正';
    Object.assign(context,{actor,actorId:actor.id,actorSlot:index<0?null:index+1,event,effectiveLevel:Math.min(C.skillCap(actor.species),actor.profile.skillLevel+event.boost)});
   }
   if(p)species=p.species;
  }
  if(method==='mew'&&!noCandy){p=clone(editPool.find(x=>x.id===$('edit-mew-target').value)||null);if(!p)throw Error('アメの対象ポケモンを選んでください。');species=p.species;}
  const next={...original,datetime:datetime.toISOString(),method,slot,amount,context,species:noCandy?null:species,candy:noCandy?null:candyMap[species],pokemonId:noCandy?null:p?.id||(original.species===species?original.pokemonId:'unknown-'+uid()),pokemon:noCandy?'スキルのみ':p?storedLabel(p):species,nickname:noCandy?'':p?p.nickname:(original.species===species?original.nickname||'':''),updatedAt:new Date().toISOString()};
  MewUI.applyEdit(next);
  const data={...state,records:state.records.map(r=>r.id===original.id?next:r)};C.migrate(data,candyMap);
  if(commit(data,'履歴を訂正しました。'))$('history-editor').close();else $('edit-error').textContent='保存できませんでした。';
 }catch(error){$('edit-error').textContent=error.message;}
};

for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>showTab(b.dataset.tab);
$('datetime').oninput=()=>{$('auto-now').checked=false;renderRecord();};$('auto-now').onchange=()=>{if($('auto-now').checked)$('datetime').value=C.localInput();renderRecord();};
$('pokemon-search').oninput=()=>{selected='';SkillUI.registration('');$('add-pokemon').disabled=true;$('selected-name').textContent='一覧から選んでください。';renderCatalog();};
$('add-pokemon').onclick=()=>{if(!names.includes(selected)||!speciesEnabled(selected))return;if(selected==='ミュウ'&&state.pokemon.some(p=>p.species==='ミュウ')){notice('ミュウは登録済みです。');return;}const p={id:uid(),species:selected,nickname:$('nickname').value.trim(),profile:null,...SK.fields($('register-main-skill').value),registrationOrder:Math.max(-1,...state.pokemon.map(p=>p.registrationOrder))+1};if(commit({...state,pokemon:[...state.pokemon,p]},label(p)+'を登録しました。')){$('nickname').value='';}};
for(const id of ['period','summary-date','analysis-level','analysis-multiplier','analysis-amount','analysis-actor'])$(id).onchange=renderSummary;
function historyRange(){return C.range($('history-period').value,$('history-date').value||C.gameDay(new Date()));}
for(const id of ['history-period','history-date'])$(id).onchange=()=>{renderHistory();DateUI.update();};
$('roster-other-toggle').onclick=()=>{showOtherPokemon=!showOtherPokemon;renderTeam();};
$('sort-toggle').onclick=()=>{sorting=!sorting;renderTeam();};$('sort-reset').onclick=()=>commit({...state,pokemon:[...state.pokemon].sort((a,b)=>a.registrationOrder-b.registrationOrder)},'登録順に戻しました。');
$('analysis-method').onchange=()=>{$('analysis-actor').value='';renderActorFilters();renderSummary();};
for(const method of ['mew','delibird'])$('enable-'+method).onchange=()=>{selected='';$('selected-name').textContent='';$('add-pokemon').disabled=true;commit({...state,settings:{...state.settings,[method]:$('enable-'+method).checked}},'表示設定を保存しました。');};
optionList($('profile-nature'),natures.map(n=>({id:n,text:n})),'');for(let i=0;i<5;i++){const l=el('label',`サブスキル · Lv.${[10,25,50,70,80][i]}`),s=el('select');s.id='subskill-'+i;optionList(s,subskills.map(n=>({id:n,text:n})),'','未入力');l.append(s);$('subskill-fields').append(l);}
$('profile-select').onchange=editProfile;
$('profile-form').onsubmit=e=>{e.preventDefault();const p=state.pokemon.find(p=>p.id===$('profile-select').value);if(!p)return;const profile={level:Number($('profile-level').value)||1,nature:p.species==='ミュウ'?'きまぐれ':$('profile-nature').value||'未設定',skillLevel:Number($('profile-skill').value)||1,subskills:Array.from({length:5},(_,i)=>$('subskill-'+i).value)};if(!$('profile-details').hidden&&!C.profileValid(profile,p.species)){notice('個体情報の値と、サブスキルの重複を確認してください。');return;}commit({...state,pokemon:state.pokemon.map(x=>x.id===p.id?{...p,nickname:$('profile-nickname').value.trim(),profile:$('profile-details').hidden?p.profile:profile,...SkillUI.savedFields(p,$('profile-main-skill').value)}:x)},'個体情報を保存しました。過去の履歴は変更していません。');};
$('event-month').onchange=renderEvents;$('cancel-event').onclick=()=>selectEvent(null);
$('event-form').onsubmit=e=>{e.preventDefault();const event={id:eventId||uid(),name:$('event-name').value.trim(),start:$('event-start').value,end:$('event-end').value,target:$('event-target').value,multiplier:Number($('event-multiplier').value),boost:Number($('event-boost').value)};if(commit({...state,events:[...state.events.filter(e=>e.id!==event.id),event]},'イベント補正を保存しました。過去の履歴は変更していません。'))selectEvent(null);};
$('export').onclick=()=>{try{const data=blocked?JSON.parse(localStorage.getItem(KEY)):state;const url=URL.createObjectURL(new Blob([CandyBackup.encode(data)],{type:'text/csv;charset=utf-8'}));const a=el('a');a.href=url;a.download='pokesleep-candy-'+C.gameDay(new Date())+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('CSVバックアップを書き出しました。');}catch(e){notice('バックアップを書き出せませんでした：'+e.message);}};
$('import').onchange=async()=>{const file=$('import').files[0];if(!file)return;try{const data=CandyBackup.read(await file.text());const next=C.migrate(data,candyMap);if(confirm(`登録${next.pokemon.length}匹・アメ履歴${next.records.length}件・ゆめのかけら履歴${next.shardRecords.length}件で現在のデータを置き換えますか？`)){localStorage.setItem(KEY+'-before-import',localStorage.getItem(KEY)||'null');const wasBlocked=blocked;blocked=false;if(!commit(next,'バックアップを復元しました。'))blocked=wasBlocked;}}catch(e){notice('復元できませんでした：'+e.message);}$('import').value='';};
window.addEventListener('storage',e=>{if(e.key===KEY){blocked=false;state=fresh();load();render();notice(blocked?'他の画面の保存データを読み込めませんでした。':'他の画面での変更を反映しました。');}});
// 朝4時やイベント期間が切り替わった場合も、開いたままの記録画面を更新します。
let lastDay=C.gameDay(new Date());setInterval(()=>{const day=C.gameDay(new Date());if(day!==lastDay){lastDay=day;renderRecord();renderSummary();renderHistory();ShardUI.renderSummary();}},30000);
MewUI.init();SkillUI.registration('');DateUI.init();$('history-date').value=C.gameDay(new Date());ShardUI.init();$('datetime').value=C.localInput();$('summary-date').value=C.gameDay(new Date());$('event-month').value=C.gameDay(new Date()).slice(0,7);load();selectEvent(null);renderCatalog();render();DateUI.update();

// 画像用の集計は履歴を読むだけで、保存データを変更しません。
$('create-mew-image').onclick=()=>{
 try{
  const period=C.range($('period').value,$('summary-date').value||C.gameDay(new Date()));
  const records=state.records.filter(r=>r.method==='mew'&&C.inRange(r,period));
  const title=period?`${C.displayDate(period[0])} 04:00 〜 ${C.displayDate(period[1])} 04:00`:'全期間';
  const preview=$('mew-image-preview');preview.src=MewImage.png(MewImage.aggregate(records),title);preview.hidden=false;
 }catch(e){notice('画像を作成できませんでした：'+e.message);}
};

// 期間の種類は維持し、カレンダー・位置分析を含む集計全体を再描画します。
$('summary-today').onclick=()=>{$('summary-date').value=C.gameDay(new Date());renderSummary();};


// 既存の初期化が済んだ後、共通の期間選択UIに置き換えます。
PeriodPicker.init();
