/* 集計と描画を分離し、履歴は読み取り専用で扱います。 */
(function(root){
 'use strict';
 const slot=n=>Number.isInteger(n)&&n>=1&&n<=5;
 function aggregate(records){
  const rows=records.filter(r=>r.method==='mew');
  const counts=Array(5).fill(0),one=Array(5).fill(0),four=Array(5).fill(0),matrix=Array.from({length:5},()=>Array(5).fill(0));
  let selected=0,located=0,self=0;
  for(const r of rows){if(!slot(r.slot))continue;const j=r.slot-1;selected++;counts[j]++;if(r.amount===1)one[j]++;if(r.amount===4)four[j]++;
   const i=r.context?.actorSlot;if(slot(i)){matrix[i-1][j]++;located++;if(i===r.slot)self++;}
  }
  return {total:rows.length,selected,located,self,counts,one,four,matrix};
 }
 const percent=(n,d)=>d?(100*n/d).toFixed(1)+'%':'—';
 function png(data,period){
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1510;
  const c=canvas.getContext('2d');if(!c)throw Error('画像描画に対応していません。');
  const ink='#75364f',muted='#996b7e',line='#e8cbd7';
  c.fillStyle='#fff9fc';c.fillRect(0,0,1200,1510);
  function text(value,x,y,size=26,color=ink,align='left',bold=false){c.fillStyle=color;c.font=`${bold?'700':'400'} ${size}px -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", sans-serif`;c.textAlign=align;c.fillText(String(value),x,y);}
  function heading(value,y){text(value,60,y,32,ink,'left',true);}
  function cell(value,x,y,w,h,header=false){c.fillStyle=header?'#f6e3ec':'#ffffff';c.fillRect(x,y,w,h);c.strokeStyle=line;c.lineWidth=2;c.strokeRect(x,y,w,h);text(value,x+w/2,y+h/2+9,25,ink,'center',header);}
  // 上部は期間と記録回数のみ。
  text(period,60,65,29);text(`記録回数 ${data.total}回`,60,116,34,ink,'left',true);
  heading('1〜5枠の選択回数・割合',190);
  for(let i=0;i<5;i++){const x=60+i*216;c.fillStyle='#f6e3ec';c.fillRect(x,216,200,142);text(`${i+1}枠`,x+100,251,25,muted,'center');text(`${data.counts[i]}回`,x+100,300,38,ink,'center',true);text(percent(data.counts[i],data.selected),x+100,339,26,ink,'center');}
  heading('ミュウの配置枠 × 選ばれた枠',425);
  text('選ばれた枠 →',690,472,26,muted,'center');
  const widths=[180,180,180,180,180,180];const headers=['ミュウ ↓','1枠','2枠','3枠','4枠','5枠'];
  headers.forEach((v,j)=>cell(v,60+j*180,490,widths[j],64,true));
  for(let i=0;i<5;i++){cell(`${i+1}枠`,60,554+i*65,180,65,true);for(let j=0;j<5;j++)cell(`${data.matrix[i][j]}回`,240+j*180,554+i*65,180,65);}
  heading('ミュウ自身が選ばれた割合',950);
  text(percent(data.self,data.located),60,1014,50,ink,'left',true);text(`${data.self}回 / ${data.located}回`,410,1008,28,muted);
  heading('各枠の選択回数・+1・+4',1090);
  ['枠','選択回数','+1回数','+4回数','+4率'].forEach((v,j)=>cell(v,60+j*216,1118,216,55,true));
  for(let i=0;i<5;i++)[`${i+1}枠`,`${data.counts[i]}回`,`${data.one[i]}回`,`${data.four[i]}回`,percent(data.four[i],data.counts[i])].forEach((v,j)=>cell(v,60+j*216,1173+i*55,216,55));
  return canvas.toDataURL('image/png');
 }
 const api={aggregate,png};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MewImage=api;
})(typeof globalThis!=='undefined'?globalThis:this);
