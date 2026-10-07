const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const roots={},canvases=[],settings={};
const el=(tag,text,cls)=>({tag,text,cls,children:[],append(...xs){this.children.push(...xs)},replaceChildren(...xs){this.children=xs},setAttribute(k,v){this[k]=v},dataset:{}});
const ctx={el,qel:el,$:id=>roots[id]||(roots[id]=el('div')),C:{sum:xs=>xs.reduce((n,x)=>n+x.amount,0)},enabled:()=>true,recordVisible:method=>settings[method]!==false,document:{createElement(){
 const calls=[],canvas={calls,getContext(){return {fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(value,x,y){calls.push({value,x,y})}}},toDataURL(){return 'data:image/png;page='+canvases.length}};canvases.push(canvas);return canvas;
}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../summary-extras.js'),'utf8')+';this.api=SummaryExtras',ctx);
const records=[{candy:'ミュウのアメ',method:'help',amount:50},{candy:'ミュウのアメ',method:'mew',amount:77},{candy:'ムンナのアメ',method:'help',amount:12},{candy:'ムンナのアメ',method:'mew',amount:77}];
const before=JSON.stringify(records);ctx.api.candyList(records);
let tables=roots['candy-list'].children.filter(x=>x.cls==='candy-table-scroll').map(x=>x.children[0]);
assert.equal(tables.length,1);assert.deepEqual(tables[0].children[0].children[0].children.map(x=>x.text),['アメ名','合計','アメ拾い','ミュウ']);
assert.deepEqual(tables[0].children[1].children[0].children.map(x=>x.text),['ミュウ','127','50','77']);
records.push({candy:'ムンナのアメ',method:'delibird',amount:4},{candy:'プリンのアメ',method:'skill',amount:1000});
ctx.api.candyList(records);tables=roots['candy-list'].children.filter(x=>x.cls==='candy-table-scroll').map(x=>x.children[0]);
assert.equal(tables.length,2);for(const t of tables)assert.equal(t.children[0].children[0].children.length,4);
assert.deepEqual(tables[1].children[0].children[0].children.map(x=>x.text),['アメ名','合計','デリバード','その他']);
assert.deepEqual(tables[0].children[1].children[0].children.map(x=>x.text),['プリン','1,000','−','−']);
const groups=ctx.api.candyGroups(records);ctx.api.imagePages(groups,'全期間');
assert.equal(canvases[0].calls.filter(x=>x.value==='アメ拾い').length,1);assert.equal(canvases[0].calls.filter(x=>x.value==='ミュウ').length,3); // header + candy names in two panels
assert(canvases[0].calls.some(x=>x.value==='1,000'));assert(canvases[0].calls.some(x=>x.value==='−'));
assert.equal(canvases[0].height,190+2*(70+3*80));
const many=Array.from({length:21},(_,i)=>({name:'アメ'+i,total:1,sources:{help:1}}));assert.equal(ctx.api.imagePages(many,'週').length,2);
ctx.api.candyList([]);assert.equal(roots['candy-list'].children[0].tag,'p');
assert.equal(JSON.stringify(records.slice(0,4)),before);
console.log('PASS: shared four-column layout, source-pair fallback, exact totals, zeros, headers once, empty state, 20-type PNG pagination, immutable events');

const snapshot=JSON.stringify(records);
for(const method of ['help','mew','delibird','skill']){
 settings[method]=false;ctx.api.candyList(records);
 const headers=roots['candy-list'].children.filter(x=>x.cls==='candy-table-scroll').flatMap(x=>x.children[0].children[0].children[0].children.map(x=>x.text));
 const names={help:'アメ拾い',mew:'ミュウ',delibird:'デリバード',skill:'その他'};assert(!headers.includes(names[method]));
 const rows=roots['candy-list'].children.filter(x=>x.cls==='candy-table-scroll').flatMap(x=>x.children[0].children[1].children);assert(rows.some(x=>x.children[0].text==='プリン'&&x.children[1].text==='1,000'));
}
assert(roots['candy-source-totals'].hidden);
ctx.api.imagePages(groups,'全期間');assert(!canvases.at(-1).calls.some(x=>['アメ拾い','デリバード','その他'].includes(x.value)));
for(const method of ['help','mew','delibird','skill'])settings[method]=true;
ctx.api.candyList(records);assert.equal(roots['candy-source-totals'].children.length,4);assert.equal(JSON.stringify(records),snapshot);
// 上部合計の実装も同じ履歴を使い、表示行のみ切り替える。
const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
Object.assign(ctx,{methods:{help:'アメ拾い',mew:'ミュウ',delibird:'デリバード',skill:'その他'},totalBreakdown:parent=>{const body=el('tbody');parent.append(body);return body},totalBreakdownRow:(body,name,count,amount)=>body.append({name,count,amount})});
vm.runInContext(app.slice(app.indexOf('function totals('),app.indexOf('function renderRecord(')),ctx);
const top=el('div');settings.delibird=false;ctx.totals(top,records,'合計',false,ctx.recordVisible);assert.equal(top.children[1].text,'1220個');assert(!top.children[2].children.some(x=>x.name==='デリバード'));
settings.delibird=true;ctx.totals(top,records,'合計',false,ctx.recordVisible);assert.equal(top.children[1].text,'1220個');assert(top.children[2].children.some(x=>x.name==='デリバード'&&x.amount===4));
settings.delibird=false;ctx.totals(top,records.filter(x=>x.method!=='delibird'),'合計',false,ctx.recordVisible);assert(!top.children[2].children.some(x=>x.name==='デリバード'));
settings.delibird=true;ctx.totals(top,records.filter(x=>x.method!=='delibird'),'合計',false,ctx.recordVisible);assert(top.children[2].children.some(x=>x.name==='デリバード'&&x.count===0));
assert.equal(JSON.stringify(records),snapshot);console.log('PASS: source switches hide rows/columns/PNG, preserve exact totals and events, restore ON including zero rows');
