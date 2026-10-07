/* 集計と描画を分離し、履歴は読み取り専用で扱います。 */
(function(root){
 'use strict';
 const slot=n=>Number.isInteger(n)&&n>=1&&n<=5;
 function aggregate(records,map=typeof candyMap!=='undefined'?candyMap:{}){
  const analysis=typeof AnalysisData!=='undefined'?AnalysisData:require('./analysis-data.js');
  const rows=records.filter(r=>r.method==='mew');
  const counts=Array(5).fill(0),one=Array(5).fill(0),four=Array(5).fill(0),matrix=Array.from({length:5},()=>Array(5).fill(0));
  let selected=0,located=0,self=0;
  for(const r of rows){const target=analysis.targetSlot(r,map);if(!slot(target))continue;const j=target-1;selected++;counts[j]++;if(r.amount===1)one[j]++;if(r.amount===4)four[j]++;
   const i=r.context?.actorSlot;if(slot(i)){matrix[i-1][j]++;located++;if(i===target)self++;}
  }
  return {total:rows.length,selected,located,self,counts,one,four,matrix,excluded:rows.length-selected};
 }
 const percent=(n,d)=>d?(100*n/d).toFixed(1)+'%':'—';
 // 画面と同じAnalysisDataの結果を描画。分母・除外判定はここで再定義しない。
 function png(result,period,methodName='ミュウ'){
  const count=result.blocks.length,width=780;
  const heights=result.blocks.map(b=>310+Math.ceil(b.rates.length/2)*30+b.distributions.slice(1).reduce((n,r)=>n+(r.amount!==1?70:48),0));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=170+(count?heights.reduce((n,h)=>n+h,0):220)+48;
  const c=canvas.getContext('2d');if(!c)throw Error('画像描画に対応していません。');
  const ink='#20221c',brand='#695322',muted='#5c6056',line='#d4d1c4';
  c.fillStyle='#fbf8ee';c.fillRect(0,0,width,canvas.height);
  function text(value,x,y,size=24,color=ink,align='left',bold=false){c.fillStyle=color;c.font=`${bold?'700':'400'} ${size}px -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", sans-serif`;c.textAlign=align;c.fillText(String(value),x,y);}
  const number=n=>n.toLocaleString('ja-JP');
  function rule(y){c.strokeStyle=line;c.lineWidth=1;c.beginPath();c.moveTo(36,y);c.lineTo(744,y);c.stroke();}
  text(methodName,36,48,28,brand,'left',true);
  text('アメゲット記録',36,94,36,brand,'left',true);
  // 期間は正確さを保って小さく添える。長い期間文字列も枠内に収める。
  c.fillStyle=muted;c.font='18px -apple-system, sans-serif';c.textAlign='left';c.fillText(period,36,134,708);
  if(!count)text('この期間の記録はありません',36,270,26,muted);
  let y=170;
  for(const block of result.blocks){
   text('発動した場所 '+(block.position===1?'1R':block.position),36,y+24,28,brand,'left',true);
   text(number(block.denominator)+'回',744,y+24,24,muted,'right');
   text('アメゲット場所',36,y+60,24,brand,'left',true);
   const centers=result.destinations.map((_,k)=>160+(k+.5)*584/result.destinations.length),all=block.distributions[0];
   centers.forEach((x,j)=>text(j===0?'1R':j===5?'アメなし':j+1,x,y+96,j===5?18:22,muted,'center'));
   text('すべて',36,y+140,22,brand,'left',true);
   all.cells.forEach((cell,k)=>{
    text(cell.percent===null?'―':cell.percent.toFixed(1)+'%',centers[k],y+140,result.destinations.length>5?25:32,ink,'center',true);
    text(number(cell.count)+'回',centers[k],y+164,18,muted,'center');
   });
   text('アメ合計',36,y+198,20,brand,'left',true);
   all.cells.forEach((cell,k)=>text(number(cell.candyAmount)+'個',centers[k],y+198,26,ink,'center',true));rule(y+214);
   let ry=y+250;
   for(const row of block.distributions.slice(1)){
    const showAmount=row.amount!==1;text(row.name,36,ry,20,muted);
    row.cells.forEach((cell,k)=>{
     text(cell.percent===null?'―':cell.percent.toFixed(1)+'%',centers[k],ry,result.destinations.length>5?22:26,muted,'center',true);
     text(number(cell.count)+'回',centers[k],ry+20,18,muted,'center');
     if(showAmount)text(number(cell.candyAmount)+'個',centers[k],ry+42,18,muted,'center');
    });
    ry+=showAmount?70:48;
   }
   text('場所がわかる記録 '+number(all.count)+'回'+(block.unknown?'・場所不明 '+number(block.unknown)+'回':''),36,ry,18,muted);
   text('ゲットした個数',36,ry+32,20,muted);
   for(const [j,row] of block.rates.entries()){
    const x=36+(j%2)*360,baseline=ry+62+Math.floor(j/2)*30;
    text(row.name,x,baseline,20,muted);text(row.percent.toFixed(1)+'%',x+62,baseline,20,muted);text('（'+number(row.count)+'回）',x+152,baseline,18,muted);
   }
   y=ry+60+Math.ceil(block.rates.length/2)*30;
  }
  if(result.excluded)text('発動した場所・個数不明 '+number(result.excluded)+'回',36,canvas.height-20,17,muted);
  return canvas.toDataURL('image/png');
 }
 const api={aggregate,png};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MewImage=api;
})(typeof globalThis!=='undefined'?globalThis:this);
