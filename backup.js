/* CSVの表示列と、完全復元用のJSON列を併記します。
   編成・個体情報・当時のスナップショット・未知の追加項目もそのまま残します。 */
(function(root){
 'use strict';
 const header=['種別','番号','日時','入手方法','アメ個数','アメ種類','復元データJSON'];
 const arrays=['pokemon','records','events'];
 const cell=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
 const safe=value=>/^[=+\-@\t\r]/.test(String(value??''))?"'"+value:value;
 function encode(state){
  if(!state||!arrays.every(k=>Array.isArray(state[k])))throw Error('保存データの形式を確認してください。');
  const metadata={...state};for(const k of arrays)delete metadata[k];
  const manifest={format:'candy-journal-csv',version:1,metadata,counts:Object.fromEntries(arrays.map(k=>[k,state[k].length]))};
  const rows=[header,['backup',0,'','','','',JSON.stringify(manifest)]];
  for(const kind of arrays)state[kind].forEach((item,i)=>rows.push([kind,i,safe(item.datetime||''),safe(item.method||''),item.amount??'',safe(item.candy||''),JSON.stringify(item)]));
  return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
 }
 // 引用符内のカンマ・改行と、二重引用符のエスケープを解釈します。
 function parse(text){
  text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],field='',quoted=false,closed=false;
  for(let i=0;i<text.length;i++){
   const ch=text[i];
   if(quoted){if(ch==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=ch;continue;}
   if(ch==='"'){if(field||closed)throw Error('CSVの引用符が不正です。');quoted=true;}
   else if(ch===','||ch==='\n'||ch==='\r'){row.push(field);field='';closed=false;if(ch!==','){if(ch==='\r'&&text[i+1]==='\n')i++;if(row.some(x=>x!==''))rows.push(row);row=[];}}
   else{if(closed)throw Error('CSVの区切りが不正です。');field+=ch;}
  }
  if(quoted)throw Error('CSVが途中で切れています。');
  if(field||closed||row.length){row.push(field);rows.push(row);}return rows;
 }
 function decode(text){
  const rows=parse(text);if(JSON.stringify(rows.shift())!==JSON.stringify(header))throw Error('このアプリのCSVバックアップを選んでください。');
  const first=rows.shift();if(!first||first.length!==7||first[0]!=='backup')throw Error('復元情報がありません。');
  const info=JSON.parse(first[6]);if(info.format!=='candy-journal-csv'||info.version!==1||!info.metadata||!info.counts)throw Error('対応していないCSV形式です。');
  const state={...info.metadata};for(const k of arrays)state[k]=[];
  for(const row of rows){const [kind,index]=row;if(row.length!==7||!arrays.includes(kind)||index!==String(state[kind].length))throw Error('CSVの行が欠けているか、順序が変更されています。');state[kind].push(JSON.parse(row[6]));}
  for(const k of arrays)if(state[k].length!==info.counts[k])throw Error('CSVの件数が一致しません。');
  return state;
 }
 // 拡張子ではなく内容で判定し、旧JSONも同じ復元処理へ渡します。
 function read(text){text=text.replace(/^\uFEFF/,'').trim();return text.startsWith('{')?JSON.parse(text):decode(text);}
 const api={encode,decode,read};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CandyBackup=api;
})(typeof globalThis!=='undefined'?globalThis:this);
