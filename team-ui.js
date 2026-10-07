// 編成内の表示状態だけを管理。保存する個体・編成・履歴の形式は変えません。
const TeamUI=(()=>{
 let view='team',editing=false;
 function sync(){
  for(const name of ['team','roster','register'])$(name+'-panel').hidden=view!==name||editing;
  $('individual-editor').hidden=!editing;
  for(const b of document.querySelectorAll('[data-team-view]')){b.setAttribute('aria-selected',String(b.dataset.teamView===view));b.tabIndex=b.dataset.teamView===view?0:-1;}
 }
 function show(name){view=name;editing=false;sync();window.scrollTo({top:0});}
 function edit(){view='roster';editing=true;sync();window.scrollTo({top:0});$('profile-back').focus({preventScroll:true});}
 function registration(){$('registration-fields').hidden=!selected;}
 function renderRoster(){
  const root=$('registered-pokemon-list'),q=normalize($('roster-search').value);root.replaceChildren();
  const normal=state.pokemon.filter(p=>!special(p));
  const visible=orderedPokemon().filter(p=>speciesEnabled(p.species)&&(q||showOtherPokemon||relatedPokemon(p))&&(!q||normalize(p.species).includes(q)||normalize(C.speciesName(p.species)).includes(q)||normalize(p.nickname||'').includes(q)));
  for(const p of visible){
   const line=el('div',undefined,'registered-row'),info=el('div',undefined,'registered-info'),actions=el('div',undefined,'row-actions');
   info.append(el('strong','No.'+String(nationalDex[p.species]).padStart(3,'0')+' '+label(p)),el('small',mainSkillText(p)+(p.profile?'・Lv.'+p.profile.skillLevel:'')));
   if(sorting&&!special(p)){
    const i=normal.findIndex(x=>x.id===p.id),up=button('↑',()=>movePokemon(p.id,-1)),down=button('↓',()=>movePokemon(p.id,1));
    up.setAttribute('aria-label',label(p)+'を上へ');down.setAttribute('aria-label',label(p)+'を下へ');up.disabled=i===0;down.disabled=i===normal.length-1;actions.append(up,down);
   }
   actions.append(button('編集',()=>openIndividualEditor(p)));line.append(info,actions);root.append(line);
  }
  if(!visible.length)root.append(el('p',q?'一致する登録ポケモンがありません。':'表示できる登録ポケモンがありません。'));
 }
 function init(){
  const tabs=[...document.querySelectorAll('[data-team-view]')];
  tabs.forEach((b,i)=>{b.onclick=()=>show(b.dataset.teamView);b.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;else if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();show(tabs[next].dataset.teamView);tabs[next].focus({preventScroll:true});};});
  $('roster-search').oninput=renderRoster;
  $('profile-back').onclick=()=>show('roster');
  $('profile-remove').onclick=()=>{
   const p=state.pokemon.find(p=>p.id===$('profile-select').value);if(!p)return;
   if(confirm(label(p)+'を登録解除しますか？')&&commit({...state,pokemon:state.pokemon.filter(x=>x.id!==p.id),team:state.team.map(id=>id===p.id?null:id)},'登録解除しました。'))show('roster');
  };
  sync();registration();
 }
 return {init,show,edit,sync,registration,renderRoster};
})();
