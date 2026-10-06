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
  const count=result.groups[0].rows.length,width=780,block=460;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=170+Math.max(count,1)*block+48;
  const c=canvas.getContext('2d');if(!c)throw Error('画像描画に対応していません。');
  const ink='#20221c',brand='#695322',muted='#5c6056',line='#d4d1c4';
  c.fillStyle='#fbf8ee';c.fillRect(0,0,width,canvas.height);
  function text(value,x,y,size=24,color=ink,align='left',bold=false){c.fillStyle=color;c.font=`${bold?'700':'400'} ${size}px -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", sans-serif`;c.textAlign=align;c.fillText(String(value),x,y);}
  const number=n=>n.toLocaleString('ja-JP');
  function rule(y){c.strokeStyle=line;c.lineWidth=1;c.beginPath();c.moveTo(36,y);c.lineTo(744,y);c.stroke();}
  text('ミュウ',36,48,28,brand,'left',true);
  text('スキル位置と獲得先',36,94,36,brand,'left',true);
  // 期間は正確さを保って小さく添える。長い期間文字列も枠内に収める。
  c.fillStyle=muted;c.font='18px -apple-system, sans-serif';c.textAlign='left';c.fillText(period,36,134,708);
  if(!count)text('この期間の分析データはありません',36,270,26,muted);
  for(let i=0;i<count;i++){
   const y=170+i*block,base=result.groups[0].rows[i],many=result.groups[1].rows[i];
   text('獲得個数',36,y+24,26,brand,'left',true);
   text('スキル位置 '+(base.position===1?'R':base.position),36,y+60,24,ink,'left',true);
   text(number(base.denominator)+'回',744,y+60,24,muted,'right');
   for(const [j,row] of [base,many].entries()){
    const ry=y+108+j*48;
    text(j?'2〜4個':'1個',36,ry,24);
    text(number(row.count)+'回',510,ry,24,muted,'right');
    text(row.percent.toFixed(1)+'%',744,ry,42,ink,'right',true);
   }
   rule(y+186);
   text('獲得先の割合',36,y+226,26,brand,'left',true);
   const known=result.destinationGroups[0].rows[i].count,unknown=base.unknown+many.unknown;
   text('分析対象 '+number(known)+'回'+(unknown?'・獲得先不明'+number(unknown)+'回を除外':''),36,y+256,19,muted);
   const centers=[242,354,466,578,690];
   centers.forEach((x,j)=>text(j===0?'R':j+1,x,y+290,22,muted,'center'));
   const labels=['すべて','1個の時','2〜4個の時'];
   for(let j=0;j<3;j++){
    const row=result.destinationGroups[j].rows[i],ry=y+324+j*48;
    text(labels[j],36,ry,20,muted);
    row.cells.forEach((cell,k)=>{
     text(cell.percent===null?'―':cell.percent.toFixed(1)+'%',centers[k],ry,28,ink,'center',true);
     text(number(cell.count)+'回',centers[k],ry+20,18,muted,'center');
    });
   }
  }
  if(result.excluded)text('発動位置・個数不明 '+number(result.excluded)+'回を除外',36,canvas.height-20,17,muted);
  return canvas.toDataURL('image/png');
 }
 const api={aggregate,png};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MewImage=api;
})(typeof globalThis!=='undefined'?globalThis:this);
