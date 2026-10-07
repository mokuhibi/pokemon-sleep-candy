'use strict';
// 選択画面の状態だけを保持し、編成は既存のcommitで保存する。
const TeamPicker=(()=>{
 let slot=null,scrollY=0,bodyStyle=null;
 const slotName=i=>i===0?'1R':String(i+1);
 function close(){ $('team-picker').close(); }
 function refresh(){
  if(slot===null)return;
  const current=state.pokemon.find(p=>p.id===state.team[slot]);
  $('team-picker-context').textContent='編成枠 '+slotName(slot)+' · 現在：'+(current?label(current):'未設定');
  const query=normalize($('team-picker-search').value),root=$('team-picker-list');root.replaceChildren();
  const add=(p)=>{
   const id=p?.id||null,selected=state.team[slot]===id,used=id!==null&&state.team.some((pid,i)=>i!==slot&&pid===id);
   const b=button('',()=>choose(id),'team-picker-row');b.disabled=used;b.setAttribute('aria-pressed',String(selected));
   b.append(el('span',p?label(p):'未設定','team-picker-name'),el('span',selected?'✓':used?'編成中':'','team-picker-status'));
   if(selected)b.setAttribute('aria-label',(p?label(p):'未設定')+'（選択中）');
   root.append(b);
  };
  if(!query)add(null);
  const candidates=orderedPokemon().filter(p=>!query||[p.species,C.speciesName(p.species),p.nickname||''].some(s=>normalize(s).includes(query)));
  candidates.forEach(add);
  if(query&&!candidates.length)root.append(el('p','一致する登録ポケモンがありません。','muted'));
 }
 function choose(id){
  if(slot===null||id!==null&&(!state.pokemon.some(p=>p.id===id)||state.team.some((pid,i)=>i!==slot&&pid===id)))return;
  if(state.team[slot]===id){close();return;}
  const team=[...state.team];team[slot]=id;
  if(commit({...state,team},'編成を保存しました。'))close();
  else $('team-picker-error').textContent='編成を保存できませんでした。選択は変更されていません。';
 }
 function open(index){
  slot=index;$('team-picker-search').value='';$('team-picker-error').textContent='';refresh();
  scrollY=window.scrollY;bodyStyle={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,overflow:document.body.style.overflow};
  Object.assign(document.body.style,{position:'fixed',top:-scrollY+'px',width:'100%',overflow:'hidden'});
  $('team-picker').showModal();$('team-picker-close').focus();
 }
 function init(){
  $('team-picker-search').oninput=refresh;$('team-picker-close').onclick=close;
  $('team-picker').addEventListener('close',()=>{const previous=slot;slot=null;if(bodyStyle){Object.assign(document.body.style,bodyStyle);bodyStyle=null;window.scrollTo({top:scrollY});}$('team-slot-'+previous)?.focus({preventScroll:true});});
 }
 return {open,refresh,init};
})();
