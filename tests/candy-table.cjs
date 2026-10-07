const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const roots={},canvases=[];
const el=(tag,text,cls)=>({tag,text,cls,children:[],append(...xs){this.children.push(...xs)},replaceChildren(...xs){this.children=xs},setAttribute(k,v){this[k]=v},dataset:{}});
const ctx={el,qel:el,$:id=>roots[id]||(roots[id]=el('div')),C:{sum:xs=>xs.reduce((n,x)=>n+x.amount,0)},enabled:()=>true,document:{createElement(){
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
