// 表示用の集計は履歴から都度作り、localStorageには保存しません。
const SummaryExtras=(()=>{
 const candySources=[['help','アメ拾い'],['mew','ミュウ'],['delibird','デリバード'],['skill','その他']];
 const shardSources=[['research','睡眠リサーチ'],['skill','スキル'],['other','その他']];
 const settingKeys={skill:'showShardSkill',research:'showShardResearch',other:'showShardOther'};
 const shardKey=method=>method==='lucky'?'skill':method;
 const shardVisible=(method,settings=state.settings)=>settings[settingKeys[shardKey(method)]]!==false;
 // 表示行だけを絞り、合計計算にはすべての保存済み履歴を使用します。
 function sourceTotals(root,kind,records,sourceVisible=()=>true){
  root.replaceChildren();root.className='source-totals';
  for(const [key,name] of kind==='candy'?candySources:shardSources){
   const total=C.sum(records.filter(r=>(kind==='candy'?r.method:shardKey(r.method))===key));
   if(!total||!sourceVisible(key)||(kind==='candy'&&!enabled(key)))continue;
   const line=el('div',undefined,'source-total-row'),label=el('span',name);label.dataset.source=kind+'-'+key;
   line.append(label,qel('strong',total.toLocaleString('ja-JP')+'個'));root.append(line);
  }
  root.hidden=!root.children.length;
 }
 function recordSummary(){
  const date=recordDate();if(!Number.isFinite(date.getTime()))return;
  const day=C.gameDay(date),period=C.range('day',day),root=$('today-total');root.replaceChildren(el('small',C.displayDate(day)+' の記録'));
  const candy=el('div',undefined,'daily-resource'),shard=el('div',undefined,'daily-resource');
  totals(candy,state.records.filter(r=>C.inRange(r,period)),'アメ',true);
  const records=ShardUI.summaryRecords().filter(r=>C.inRange(r,period)),total=C.sum(records);root.append(candy);
  // 未記録の日だけ省略。0個のスキル記録がある日は回数・内訳も表示します。
  if(records.length||total!==0){
   shard.append(el('small','ゆめのかけら'),qel('div',total+'個','total'));
   const body=totalBreakdown(shard,'ゆめのかけら');ShardUI.appendBreakdown(body,records,true);root.append(shard);
  }
 }
 function candyGroups(records){
  const groups=new Map();for(const r of records){if(!r.candy||!r.amount)continue;if(!groups.has(r.candy))groups.set(r.candy,{name:r.candy,total:0,sources:{}});const g=groups.get(r.candy);g.total+=r.amount;g.sources[r.method]=(g.sources[r.method]||0)+r.amount;}
  return [...groups.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'ja'));
 }
 // 表示列だけを分割。集計済みの値・並び順は変更しません。
 function candyColumns(groups){
  const active=candySources.filter(([key])=>recordVisible(key)&&groups.some(g=>g.sources[key]));
  const panels=[];for(let i=0;i<active.length;i+=2)panels.push(active.slice(i,i+2));
  return panels.length?panels:[[]];
 }
 const candyName=name=>name.replace(/のアメ$/,'');
 const candyValue=value=>value?value.toLocaleString('ja-JP'):'−';
 function candyList(records){
  sourceTotals($('candy-source-totals'),'candy',records,recordVisible);
  const root=$('candy-list');root.replaceChildren();$('candy-image-preview').replaceChildren();
  const groups=candyGroups(records);
  if(!groups.length){root.append(el('p','まだアメの記録がありません。'));return;}
  root.append(el('small','単位：個','candy-table-unit'));
  for(const sources of candyColumns(groups)){
   const scroll=el('div',undefined,'candy-table-scroll'),table=el('table',undefined,'candy-totals-table');
   table.setAttribute('aria-label','アメ種類別合計：'+sources.map(([,name])=>name).join('・'));
   const head=el('thead'),header=el('tr');
   for(const label of ['アメ名','合計',...sources.map(([,name])=>name)])header.append(el('th',label));
   head.append(header);table.append(head);const body=el('tbody');
   for(const g of groups){const line=el('tr'),name=el('th',candyName(g.name));name.setAttribute('scope','row');line.append(name,el('td',g.total.toLocaleString('ja-JP'),'candy-table-total'));
    for(const [key] of sources)line.append(el('td',candyValue(g.sources[key])));body.append(line);
   }
   table.append(body);scroll.append(table);root.append(scroll);
  }
 }
 function monthly(kind,records,day){
  const candy=kind==='candy',month=day.slice(0,7),root=$(kind+'-calendar'),legend=$(kind+'-month-legend');
  $(kind+'-month').textContent=month.replace('-','年')+'月';root.classList.add('resource-calendar');legend.replaceChildren();
  const sources=(candy?candySources:shardSources).filter(([key])=>candy?enabled(key):true);
  for(const [key,name] of sources){const item=el('span',name,'month-legend-item');item.dataset.source=kind+'-'+key;legend.append(item);}
  const grouped=new Map();for(const r of records){const date=C.gameDay(r.datetime);if(!date.startsWith(month))continue;if(!grouped.has(date))grouped.set(date,{});const key=candy?r.method:shardKey(r.method),g=grouped.get(date);g[key]=(g[key]||0)+r.amount;}
  calendar(root,month,date=>{const amounts=grouped.get(date)||{},b=button('',()=>{RangePicker.set(candy?'period':'shard-period',date);DateUI.update();},'day');b.append(el('strong',Number(date.slice(-2)),'day-number'));const values=el('span',undefined,'candy-values');const description=[];
   for(const [key,name] of sources){const amount=amounts[key]||0,text=candy?amount.toLocaleString('ja-JP'):WeeklyChart.shortAmount(amount),value=el('span',text,'month-value');value.dataset.source=kind+'-'+key;value.title=name+'：'+amount.toLocaleString('ja-JP')+'個';value.style.fontSize=Math.max(8,Math.min(11,65/text.length))+'px';values.append(value);description.push(value.title);}
   b.append(values);b.setAttribute('aria-label',C.displayDate(date)+' '+description.join('、'));b.title=C.displayDate(date)+' '+description.join('、');if(date===day)b.classList.add('selected');return b;
  });
  const monthlyRecords=records.filter(r=>C.gameDay(r.datetime).startsWith(month));
  headingTotal(kind+'-calendar',C.sum(monthlyRecords));sourceTotals($(kind+'-month-totals'),kind,monthlyRecords);
 }
 function imagePages(groups,period){
  const pages=[],panels=candyColumns(groups);
  for(let offset=0;offset<Math.max(1,groups.length);offset+=20){
   const page=groups.slice(offset,offset+20),canvas=document.createElement('canvas');canvas.width=1200;canvas.height=190+panels.length*(70+page.length*80);
   const c=canvas.getContext('2d');if(!c)throw Error('画像描画に対応していません。');c.fillStyle='#fbf8ee';c.fillRect(0,0,canvas.width,canvas.height);
   const text=(value,x,y,size=32,bold=false,right=false,color='#5c6056',width=450)=>{c.fillStyle=color;c.font=`${bold?700:400} ${size}px -apple-system, sans-serif`;c.textAlign=right?'right':'left';c.fillText(String(value),x,y,width);};
   text('アメ種類別合計',60,60,42,true,false,'#695322');text(period+'・単位：個',60,108,28);
   if(!page.length)text('この期間の記録はありません。',60,170);
   let y=180;
   for(const sources of panels){
    const ends=sources.length===2?[720,930,1140]:sources.length===1?[850,1140]:[1140];
    text('アメ名',60,y,32);text('合計',ends[0],y,32,false,true);
    sources.forEach(([,name],i)=>text(name,ends[i+1],y,32,false,true));y+=24;
    for(const g of page){
     c.strokeStyle='#d4d1c4';c.beginPath();c.moveTo(60,y);c.lineTo(1140,y);c.stroke();
     y+=52;text(candyName(g.name),60,y,42,false,false,'#292b24',sources.length===2?450:600);
     text(g.total.toLocaleString('ja-JP'),ends[0],y,46,true,true,'#20221c',190);
     sources.forEach(([key],i)=>text(candyValue(g.sources[key]),ends[i+1],y,40,false,true,'#5c6056',190));y+=28;
    }
    y+=46;
   }
   pages.push(canvas.toDataURL('image/png'));
  }return pages;
 }
 function init(){
  for(const [key,id] of Object.entries(settingKeys))$('setting-'+id).onchange=()=>commit({...state,settings:{...state.settings,[id]:$('setting-'+id).checked}},'表示設定を保存しました。');
  $('create-candy-image').onclick=()=>{try{const root=$('candy-image-preview'),period=RangePicker.get('period');root.replaceChildren();for(const [i,url] of imagePages(candyGroups(filteredRecords()),summaryTitle(period)).entries()){const img=el('img');img.src=url;img.alt='アメ種類別合計 '+(i+1);root.append(img);}}catch(e){notice('画像を作成できませんでした：'+e.message);}};
 }
 function settings(){for(const [key,id] of Object.entries(settingKeys))$('setting-'+id).checked=shardVisible(key);}
 return {recordSummary,sourceTotals,candySources,shardSources,shardKey,shardVisible,candyGroups,candyList,monthly,imagePages,init,settings};
})();
