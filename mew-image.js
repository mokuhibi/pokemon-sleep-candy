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
 function png(result,period){
  const count=result.groups[0].rows.length,width=780,block=370;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=220+Math.max(count,1)*block+80;
  const c=canvas.getContext('2d');if(!c)throw Error('画像描画に対応していません。');
  const ink='#20221c',brand='#695322',muted='#5c6056',line='#d4d1c4';
  c.fillStyle='#fbf8ee';c.fillRect(0,0,width,canvas.height);
  function text(value,x,y,size=24,color=ink,align='left',bold=false){c.fillStyle=color;c.font=`${bold?'700':'400'} ${size}px -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", sans-serif`;c.textAlign=align;c.fillText(String(value),x,y);}
  const number=n=>n.toLocaleString('ja-JP');
  function rule(y){c.strokeStyle=line;c.lineWidth=1;c.beginPath();c.moveTo(36,y);c.lineTo(744,y);c.stroke();}
  text('ミュウ',36,48,28,brand,'left',true);
  text('スキル位置と獲得先',36,94,36,brand,'left',true);
  text('分析対象 '+number(result.records.length)+'回',36,138,26,ink,'left',true);
  // 期間は正確さを保って小さく添える。長い期間文字列も枠内に収める。
  c.fillStyle=muted;c.font='18px -apple-system, sans-serif';c.textAlign='left';c.fillText(period,36,176,708);
  if(!count)text('この期間の分析データはありません',36,270,26,muted);
  for(let i=0;i<count;i++){
   const y=210+i*block,base=result.groups[0].rows[i],many=result.groups[1].rows[i];
   text('スキル位置 '+(base.position===1?'R':base.position),36,y+24,30,brand,'left',true);
   text(number(base.denominator)+'回',744,y+24,24,muted,'right');
   for(const [j,row] of [base,many].entries()){
    const x=36+j*360;text(j?'2〜4個':'1個',x,y+73,24);text(row.percent.toFixed(1)+'%',x+325,y+73,38,ink,'right',true);
    text(number(row.count)+'回',x,y+101,20,muted);
   }
   text('獲得先',36,y+141,22,muted);
   const centers=[180,306,432,558,684];centers.forEach((x,j)=>text(j===0?'R':j+1,x,y+141,22,muted,'center'));
   for(let j=0;j<3;j++){
    const row=result.destinationGroups[j].rows[i],ry=y+178+j*52;
    text(result.destinationGroups[j].name,36,ry,21,muted);
    row.cells.forEach((cell,k)=>{text(cell.percent===null?'―':cell.percent.toFixed(1)+'%',centers[k],ry,30,ink,'center',true);text(number(cell.count)+'回',centers[k],ry+22,18,muted,'center');});
   }
   const known=result.destinationGroups[0].rows[i].count,unknown=base.unknown+many.unknown;
   text('分析対象 '+number(known)+'回'+(unknown?'・獲得先不明 '+number(unknown)+'回を除外':''),36,y+335,19,muted);
   rule(y+354);
  }
  const footer=canvas.height-42;
  text('獲得個数：位置の全記録 ／ 獲得先：各分類の特定可能な記録',36,footer,17,muted);
  if(result.excluded)text('発動位置・個数不明 '+number(result.excluded)+'回を除外',36,footer+25,17,muted);
  return canvas.toDataURL('image/png');
 }
 const api={aggregate,png};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MewImage=api;
})(typeof globalThis!=='undefined'?globalThis:this);
