// 表示用の集計は履歴から都度作り、localStorageには保存しません。
const SummaryExtras=(()=>{
 const candySources=[['help','アメ拾い'],['mew','ミュウ'],['delibird','デリバード'],['skill','その他']];
 const shardSources=[['skill','スキル'],['research','睡眠リサーチ'],['other','その他']];
 const settingKeys={skill:'showShardSkill',research:'showShardResearch',other:'showShardOther'};
 const shardKey=method=>method==='lucky'?'skill':method;
 const shardVisible=(method,settings=state.settings)=>settings[settingKeys[shardKey(method)]]!==false;
 function candyGroups(records){
  const groups=new Map();for(const r of records){if(!r.candy||!r.amount)continue;if(!groups.has(r.candy))groups.set(r.candy,{name:r.candy,total:0,sources:{}});const g=groups.get(r.candy);g.total+=r.amount;g.sources[r.method]=(g.sources[r.method]||0)+r.amount;}
  return [...groups.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'ja'));
 }
 function candyList(records){
  const root=$('candy-list');root.replaceChildren();$('candy-image-preview').replaceChildren();
  for(const g of candyGroups(records)){const detail=el('details',undefined,'candy-breakdown'),summary=el('summary');summary.append(el('span',g.name),qel('strong',g.total+'個'));detail.append(summary);
   for(const [key,name] of candySources)if(g.sources[key])row(detail,name,g.sources[key]+'個','candy-source-row');root.append(detail);
  }
  if(!root.children.length)root.append(el('p','まだアメの記録がありません。'));
 }
 function monthly(kind,records,day){
  const candy=kind==='candy',month=day.slice(0,7),root=$(kind+'-calendar'),legend=$(kind+'-month-legend');
  $(kind+'-month').textContent=month.replace('-','年')+'月';root.classList.add('resource-calendar');legend.replaceChildren();
  const sources=(candy?candySources:shardSources).filter(([key])=>candy?enabled(key)&&(key!=='skill'||state.settings.showOtherCandy!==false):shardVisible(key));
  for(const [key,name] of sources){const item=el('span',name,'month-legend-item');item.dataset.source=kind+'-'+key;legend.append(item);}
  const grouped=new Map();for(const r of records){const date=C.gameDay(r.datetime);if(!date.startsWith(month))continue;if(!grouped.has(date))grouped.set(date,{});const key=candy?r.method:shardKey(r.method),g=grouped.get(date);g[key]=(g[key]||0)+r.amount;}
  calendar(root,month,date=>{const amounts=grouped.get(date)||{},b=button('',()=>{if(candy){$('summary-date').value=date;$('period').value='day';renderSummary();}else{$('shard-date').value=date;$('shard-period').value='day';ShardUI.renderSummary();}DateUI.update();},'day');b.append(el('strong',Number(date.slice(-2)),'day-number'));const values=el('span',undefined,'candy-values');const description=[];
   for(const [key,name] of sources){const amount=amounts[key]||0,text=amount.toLocaleString('ja-JP'),value=el('span',text,'month-value');value.dataset.source=kind+'-'+key;value.title=name+'：'+text+'個';value.style.fontSize=Math.max(8,Math.min(11,65/text.length))+'px';values.append(value);description.push(value.title);}
   b.append(values);b.setAttribute('aria-label',C.displayDate(date)+' '+description.join('、'));b.title=C.displayDate(date)+' '+description.join('、');if(date===day)b.classList.add('selected');return b;
  });
  headingTotal(kind+'-calendar',C.sum(records.filter(r=>C.gameDay(r.datetime).startsWith(month))));
 }
 function imagePages(groups,period){
  const pages=[];for(let offset=0;offset<Math.max(1,groups.length);offset+=20){const page=groups.slice(offset,offset+20),canvas=document.createElement('canvas');canvas.width=1200;canvas.height=180+page.reduce((n,g)=>n+100+candySources.filter(([key])=>g.sources[key]).length*42,0);const c=canvas.getContext('2d');if(!c)throw Error('画像描画に対応していません。');c.fillStyle='#fbf8ee';c.fillRect(0,0,canvas.width,canvas.height);
   const text=(value,x,y,size=26,bold=false,right=false)=>{c.fillStyle='#292a26';c.font=`${bold?600:400} ${size}px -apple-system, sans-serif`;c.textAlign=right?'right':'left';c.fillText(String(value),x,y,right?350:760);};
   text('アメ種類別合計',60,54,32,true);text(period,60,102,23);if(!page.length)text('この期間の記録はありません。',60,154);
   let y=160;for(const g of page){text(g.name,60,y,28,true);text(g.total.toLocaleString('ja-JP')+'個',1140,y,30,true,true);y+=46;for(const [key,name] of candySources)if(g.sources[key]){text(name,84,y);text(g.sources[key].toLocaleString('ja-JP')+'個',1140,y,26,false,true);y+=42;}c.strokeStyle='#e4e3da';c.beginPath();c.moveTo(60,y-16);c.lineTo(1140,y-16);c.stroke();y+=54;}
   pages.push(canvas.toDataURL('image/png'));
  }return pages;
 }
 function init(){
  for(const [key,id] of Object.entries(settingKeys))$('setting-'+id).onchange=()=>commit({...state,settings:{...state.settings,[id]:$('setting-'+id).checked}},'表示設定を保存しました。');
  $('create-candy-image').onclick=()=>{try{const root=$('candy-image-preview'),period=C.range($('period').value,$('summary-date').value||C.gameDay(new Date()));root.replaceChildren();for(const [i,url] of imagePages(candyGroups(filteredRecords()),summaryTitle(period)).entries()){const img=el('img');img.src=url;img.alt='アメ種類別合計 '+(i+1);root.append(img);}}catch(e){notice('画像を作成できませんでした：'+e.message);}};
 }
 function settings(){for(const [key,id] of Object.entries(settingKeys))$('setting-'+id).checked=shardVisible(key);}
 return {candySources,shardSources,shardKey,shardVisible,candyGroups,candyList,monthly,imagePages,init,settings};
})();
