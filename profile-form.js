// 新規登録・個体編集は同じprofile形式と検証を使用します。
const ProfileForm=(()=>{
 function read(prefix,species,optional=false){
  const level=$(prefix+'level').value,nature=$(prefix+'nature').value,skill=$(prefix+'skill').value;
  const subs=Array.from({length:5},(_,i)=>$(prefix==='profile-'?'subskill-'+i:'register-subskill-'+i).value);
  if(optional&&!level&&!skill&&(!nature||species==='ミュウ')&&!subs.some(Boolean))return null;
  const profile={level:level===''?1:Number(level),nature:species==='ミュウ'?'きまぐれ':nature||'未設定',skillLevel:skill===''?1:Number(skill),subskills:subs};
  if(!C.profileValid(profile,species)||profile.skillLevel>Number($(prefix+'skill').max))throw Error('個体情報の値と、サブスキルの重複を確認してください。');
  return profile;
 }
 function refresh(species){const p={species,...SK.fields($('register-main-skill').value)},show=!!species&&(special(p)||!!SK.shardMode(p));const root=$('register-details');root.hidden=!show;for(const input of root.querySelectorAll('input,select'))input.disabled=!show;$('register-nature').disabled=!show||species==='ミュウ';$('register-skill').max=SK.shardMode(p)==='lucky'?7:C.skillCap(species);}
 function reset(species){for(const input of $('register-details').querySelectorAll('input,select'))input.value='';$('register-nature').value=species==='ミュウ'?'きまぐれ':'';refresh(species);}
 function init(){const source=$('profile-details'),root=source.cloneNode(true);root.id='register-details';for(const input of root.querySelectorAll('[id]'))input.id=input.id.startsWith('subskill-')?'register-'+input.id:input.id.replace('profile-','register-');$('add-pokemon').before(root);$('register-main-skill').addEventListener('change',()=>refresh(selected));reset('');}
 return {read,refresh,reset,init};
})();
