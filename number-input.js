// 表示用inputと既存の数値inputを分離し、保存処理には従来の数値を渡します。
const NumberInput=(()=>{
 const bound=new WeakSet(),valueProperty=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
 const format=value=>String(value).replace(/\B(?=(\d{3})+(?!\d))/g,',');
 function attach(input){
  if(bound.has(input)||Number(input.max)<1000||!input.max)return;bound.add(input);
  const display=document.createElement('input');display.type='text';display.inputMode='numeric';display.autocomplete='off';display.className='comma-input';
  for(const name of ['aria-label','aria-labelledby','placeholder'])if(input.hasAttribute(name))display.setAttribute(name,input.getAttribute(name));
  let typing=false;
  function sync(){if(!typing)display.value=format(input.value);display.required=input.required;display.disabled=input.disabled;display.hidden=input.hidden;display.setCustomValidity(input.validationMessage);}
  // プログラムによる既存記録の読み込みや入力のクリアにも追従します。
  const originallyHidden=input.hidden;input.after(display);input.hidden=true;
  function refresh(){const hidden=input.hidden;input.hidden=originallyHidden;sync();input.hidden=hidden;}
  Object.defineProperty(input,'value',{configurable:true,get(){return valueProperty.get.call(this);},set(v){this.setCustomValidity('');valueProperty.set.call(this,v);if(!typing)refresh();}});
  display.addEventListener('input',()=>{
   const normalized=display.value.normalize('NFKC'),caret=display.selectionStart||0;
   if(!/^[\d,]*$/.test(normalized)){input.setCustomValidity('整数を入力してください。');display.setCustomValidity('整数を入力してください。');return;}
   const digitsBefore=normalized.slice(0,caret).replace(/,/g,'').length,raw=normalized.replace(/,/g,'');
   input.setCustomValidity('');typing=true;input.value=raw;typing=false;display.value=format(raw);display.setCustomValidity(input.validationMessage);
   let pos=0,count=0;while(pos<display.value.length&&count<digitsBefore){if(/\d/.test(display.value[pos]))count++;pos++;}display.setSelectionRange(pos,pos);
   input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  display.addEventListener('change',()=>input.dispatchEvent(new Event('change',{bubbles:true})));
  input.addEventListener('invalid',e=>{e.preventDefault();display.setCustomValidity(input.validationMessage);display.reportValidity();});
  input.addEventListener('input',refresh);input.addEventListener('change',refresh);
  input.form?.addEventListener('reset',()=>setTimeout(refresh,0));
  new MutationObserver(refresh).observe(input,{attributes:true,attributeFilter:['required','disabled','min','max','step']});refresh();
 }
 function init(){const scan=()=>document.querySelectorAll('input[type=number]').forEach(attach);scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});}
 return {init,format};
})();
