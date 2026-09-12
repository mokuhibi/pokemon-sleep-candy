'use strict';
// 個体・編成・履歴をひとまとめに保存し、保存途中の食い違いを防ぎます。
const STORAGE_KEY = 'pokesleep-candy-v1';
const $ = id => document.getElementById(id);
const names = Object.keys(candyMap);
const methods = {help:'お手伝い',mew:'ミュウ',delibird:'デリバード'};
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const fresh = () => ({version:1,pokemon:[],team:Array(5).fill(null),records:[]});
let state = fresh(), selectedPokemon = '', storageBlocked = false;
const notice = message => { $('notice').textContent = message; };
const el = (tag,text,cls) => { const node=document.createElement(tag); if(text!==undefined) node.textContent=text; if(cls) node.className=cls; return node; };
// 個体IDは保存用。画面にはニックネーム、未設定なら種族名だけを表示します。
const labelOf = p => p.nickname || p.species;
const individualLabel = labelOf;
const isSkillOnly = r => r.method === 'delibird' && r.slot === 6 && r.amount === 0;
function recordLabel(r) {
 if (isSkillOnly(r)) return 'スキル発動のみ';
 if (typeof r.nickname === 'string') return labelOf(r);
 // 旧版の履歴も、保存内容を変えずに表示だけ整えます。
 const name = r.pokemon.replace(/ · #[a-zA-Z0-9-]+$/, '');
 const suffix = `（${r.species}）`;
 return name.endsWith(suffix) ? name.slice(0, -suffix.length) || r.species : name;
}
const localTime = (date=new Date()) => {const p=n=>String(n).padStart(2,'0');return `${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;};
// 読み込み時は形式を確認。壊れた保存データを空のデータで上書きしません。
function valid(s){
 if(!s || s.version!==1 || !Array.isArray(s.pokemon) || !Array.isArray(s.team) || s.team.length!==5 || !Array.isArray(s.records))return false;
 const ids=new Set();
 for(const p of s.pokemon){if(!p || typeof p.id!=='string' || ids.has(p.id) || !names.includes(p.species) || typeof p.nickname!=='string')return false;ids.add(p.id);}
 const occupied=s.team.filter(x=>x!==null);
 if(occupied.some(x=>!ids.has(x)) || new Set(occupied).size!==occupied.length)return false;
 const recordIds=new Set();
 return s.records.every(r=>{
  if(!r || typeof r.id!=='string' || recordIds.has(r.id) || !Object.hasOwn(methods,r.method) || !Number.isFinite(Date.parse(r.datetime)))return false;
  recordIds.add(r.id);
  // アメなしの発動は、受取個体・アメ種類を持たない専用の記録です。
  if(isSkillOnly(r))return r.pokemonId===null && r.species===null && r.candy===null && r.pokemon==='スキル発動のみ';
  if(typeof r.pokemonId!=='string' || typeof r.pokemon!=='string' || !names.includes(r.species) || r.candy!==candyMap[r.species])return false;
  const hasSlot=Number.isInteger(r.slot)&&r.slot>=1&&r.slot<=5;
  return r.method==='help' ? r.amount===2&&hasSlot : (r.slot===null||hasSlot)&&(r.method==='mew'?[1,4].includes(r.amount):r.amount===4);
 });
}
function load(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const saved=JSON.parse(raw);if(!valid(saved))throw Error('形式');state=saved;}else{
 // 旧版で保存していた5枠は、別個体として引き継ぎます。
 for(let i=0;i<5;i++){const species=localStorage.getItem('pokemon-slot-'+i);if(names.includes(species)){const p={id:uid(),species,nickname:''};state.pokemon.push(p);state.team[i]=p.id;}}
 if(state.pokemon.length)localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
 }}catch(e){storageBlocked=true;notice('保存データを読み込めません。上書きを止めています。バックアップを確認してください。');}}
function commit(next,message){if(storageBlocked){notice('保存が停止しています。バックアップの復元が必要です。');return false;}try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));state=next;render();notice(message);return true;}catch(e){notice('保存できませんでした。ブラウザの保存設定・空き容量をご確認ください。変更は確定していません。');return false;}}
function options(select,selected,slotIndex){select.replaceChildren(new Option('ポケモンを選択',''));for(const p of state.pokemon){const o=new Option(individualLabel(p),p.id);o.disabled=slotIndex!==undefined && state.team.some((id,i)=>i!==slotIndex && id===p.id);select.add(o);}select.value=selected||'';}
function record(id,method,amount,slot=null){const skillOnly=method==='delibird'&&amount===0&&slot===6;const p=state.pokemon.find(x=>x.id===id);if(!p&&!skillOnly){notice('編成または受け取ったポケモンを選んでください。');return;}if($('auto-now').checked)$('datetime').value=localTime();const date=new Date($('datetime').value);if(!$('datetime').value || !Number.isFinite(date.getTime()) || !$('datetime').validity.valid){notice('記録日時を入力してください。');return;}
 // 当時の個体名・アメ種類・枠番号を履歴に残し、編成変更の影響を受けないようにします。
 const entry=skillOnly?{id:uid(),pokemonId:null,pokemon:'スキル発動のみ',species:null,candy:null,method,amount,slot,datetime:date.toISOString()}:{id:uid(),pokemonId:p.id,pokemon:individualLabel(p),nickname:p.nickname,species:p.species,candy:candyMap[p.species],method,amount,slot,datetime:date.toISOString()};
 commit({...state,records:[...state.records,entry]},skillOnly?'デリバード：スキル発動のみ（アメなし）を1回記録しました。':`${labelOf(p)}：${methods[method]}でアメ${amount}個を記録しました。`);
}
function render(){
 for(const method of Object.keys(methods))$(method+'-slots').replaceChildren();$('team-slots').replaceChildren();
 state.team.forEach((id,i)=>{const p=state.pokemon.find(x=>x.id===id),slotName=i===0?'1枠目 · リーダー':`${i+1}枠目`;// 3種類とも同じ編成を使い、押した時点の枠番号を履歴に残します。
 for(const method of Object.keys(methods)){
  const box=el(method==='mew'?'div':'button',undefined,'help-card');
  box.append(el('small',slotName),el('strong',p?individualLabel(p):'未設定'));
  if(method==='mew'){
   const actions=el('div',undefined,'mew-actions');
   for(const amount of [1,4]){const button=el('button',amount+'個');button.type='button';button.disabled=!p;button.onclick=()=>record(id,'mew',amount,i+1);actions.append(button);}
   box.append(actions);
  }else{box.type='button';box.disabled=!p;box.onclick=()=>record(id,method,method==='help'?2:4,i+1);}
  $(method+'-slots').append(box);
 }const label=el('label',slotName),select=el('select');select.setAttribute('aria-label',slotName);options(select,id,i);select.onchange=()=>{const team=[...state.team];team[i]=select.value||null;commit({...state,team},'編成を保存しました。');};label.append(select);$('team-slots').append(label);});
 const skillButton=el('button',undefined,'help-card');skillButton.type='button';skillButton.append(el('small','6枠目 · アメなし'),el('strong','スキル発動のみ'));skillButton.onclick=()=>record(null,'delibird',0,6);$('delibird-slots').append(skillButton);
 $('registered-count').textContent=`${state.pokemon.length}匹`;$('registered-pokemon-list').replaceChildren();
 for(const p of state.pokemon){const row=el('div',undefined,'slot'),info=el('div');info.append(el('strong',individualLabel(p)),el('small',candyMap[p.species]));const b=el('button','登録解除','danger');b.onclick=()=>{if(confirm(`${individualLabel(p)}の登録を解除しますか？ 編成から外れますが、過去の履歴は残ります。`))commit({...state,pokemon:state.pokemon.filter(x=>x.id!==p.id),team:state.team.map(id=>id===p.id?null:id)},'登録を解除しました。履歴は残しています。');};row.append(info,b);$('registered-pokemon-list').append(row);}
 if(!state.pokemon.length)$('registered-pokemon-list').append(el('p','検索して最初のポケモンを登録しましょう。','empty'));
 renderSummary();renderHistory();
}
function row(container,name,value){const r=el('div',undefined,'row');r.append(el('span',name),el('strong',value));container.append(r);}
function renderSummary(){
 const today=localTime().slice(0,10), records=state.records.filter(r=>$('period').value==='all'||localTime(new Date(r.datetime)).slice(0,10)===today);
 // 集計値は別保存せず、毎回履歴から計算。削除しても必ず一致します。
 $('total-count').replaceChildren(document.createTextNode(records.reduce((n,r)=>n+r.amount,0)),el('span','個'));$('record-count').textContent=`${records.length}件の記録`;
 $('method-counts').replaceChildren();for(const [key,name] of Object.entries(methods))row($('method-counts'),name,records.filter(r=>r.method===key).reduce((n,r)=>n+r.amount,0)+'個');
 const candies={};for(const r of records.filter(r=>r.amount>0))candies[r.candy]=(candies[r.candy]||0)+r.amount;$('candy-list').replaceChildren();for(const [c,n] of Object.entries(candies).sort((a,b)=>b[1]-a[1]))row($('candy-list'),c,n+'個');if(!Object.keys(candies).length)$('candy-list').append(el('p','まだ記録がありません。','muted'));
 $('slot-counts').replaceChildren();
 for(const [method,name] of Object.entries(methods)){
  const group=el('div',undefined,'slot-breakdown');group.append(el('h4',name));
  for(let i=1;i<=5;i++){const items=records.filter(r=>r.method===method&&r.slot===i);row(group,i===1?'1枠目 · リーダー':`${i}枠目`,`${items.length}回 · ${items.reduce((sum,r)=>sum+r.amount,0)}個`);}
  if(method==='delibird')row(group,'6枠目 · スキル発動のみ',records.filter(isSkillOnly).length+'回 · 0個');
  // 旧版で枠を保存していない記録は、現在の編成から推測せず別に表示します。
  const old=records.filter(r=>r.method===method&&r.slot===null);
  if(old.length)row(group,'枠未指定（以前の記録）',`${old.length}回 · ${old.reduce((sum,r)=>sum+r.amount,0)}個`);
  $('slot-counts').append(group);
 }
}
function renderHistory(){ $('history-list').replaceChildren();$('history-count').textContent=`${state.records.length}件`;for(const r of [...state.records].reverse().sort((a,b)=>Date.parse(b.datetime)-Date.parse(a.datetime))){const box=el('div',undefined,'card'),head=el('div',undefined,'row');head.append(el('strong',recordLabel(r)),el('strong',`+${r.amount}個`));box.append(head,el('p',`${new Date(r.datetime).toLocaleString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})} · ${methods[r.method]}${r.slot?' · '+r.slot+'枠目':' · 枠未指定'}\n${r.candy || 'アメなし'}`,'history-meta'));const b=el('button','この記録を削除','danger');b.onclick=()=>{if(confirm(`${recordLabel(r)}のアメ${r.amount}個の記録を削除しますか？`))commit({...state,records:state.records.filter(x=>x.id!==r.id)},'記録を削除し、集計を更新しました。');};box.append(b);$('history-list').append(box);}if(!state.records.length)$('history-list').append(el('p','まだ記録がありません。記録タブから追加できます。','empty'));}
// 既存のひらがな検索を残し、全角・半角の入力も揃えます。
function normalize(s){return s.normalize('NFKC').trim().replace(/[\u3041-\u3096]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));}
$('pokemon-search').oninput=()=>{selectedPokemon='';$('add-pokemon').disabled=true;$('pokemon-search-results').replaceChildren();const q=normalize($('pokemon-search').value);if(!q)return;const found=names.filter(n=>normalize(n).includes(q));for(const n of found){const b=el('button',n);b.onclick=()=>{selectedPokemon=n;$('pokemon-search').value=n;$('pokemon-search-results').replaceChildren();$('add-pokemon').disabled=false;};$('pokemon-search-results').append(b);}if(!found.length)$('pokemon-search-results').append(el('p','対応表に見つかりませんでした。','muted'));};
$('add-pokemon').onclick=()=>{if(!names.includes(selectedPokemon))return;const p={id:uid(),species:selectedPokemon,nickname:$('nickname').value.trim()};if(commit({...state,pokemon:[...state.pokemon,p]},`${labelOf(p)}を登録しました。続けて5枠に設定できます。`)){$('nickname').value='';}};
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{for(const button of document.querySelectorAll('[data-tab]'))button.removeAttribute('aria-current');b.setAttribute('aria-current','page');for(const id of ['record','summary','history','team'])$(id).hidden=id!==b.dataset.tab;renderSummary();};
$('period').onchange=renderSummary;$('datetime').oninput=()=>{$('auto-now').checked=false;};$('auto-now').onchange=()=>{if($('auto-now').checked)$('datetime').value=localTime();};
$('export').onclick=()=>{const contents=storageBlocked?localStorage.getItem(STORAGE_KEY):JSON.stringify(state,null,2);const blob=new Blob([contents||'null'],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=`pokesleep-candy-${localTime().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('バックアップを書き出しました。');};
$('import').onchange=async()=>{const file=$('import').files[0];if(!file)return;try{const next=JSON.parse(await file.text());if(!valid(next))throw Error();if(confirm(`登録${next.pokemon.length}匹・履歴${next.records.length}件で現在のデータを置き換えますか？`)){const blocked=storageBlocked;storageBlocked=false;if(!commit(next,'バックアップを復元しました。'))storageBlocked=blocked;}}catch(e){notice('対応するバックアップではありません。現在のデータは変更していません。');}$('import').value='';};
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){storageBlocked=false;state=fresh();load();render();if(!storageBlocked)notice('別タブでの変更を反映しました。');}});
$('datetime').value=localTime();load();render();
