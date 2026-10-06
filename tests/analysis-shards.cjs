const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const dataContext={};vm.createContext(dataContext);vm.runInContext(fs.readFileSync(require.resolve('../pokemon-data.js'),'utf8')+';this.map=candyMap',dataContext);const candyMap=dataContext.map;
const rawA=require('../analysis-data.js'),A={...rawA,prepare:(source,method,actor='',amount='')=>rawA.prepare(source,method,actor,amount,candyMap)},C=require('../core.js'),B=require('../backup.js');
const species=['ミュウ','ルカリオ','ピカチュウ','デリバード','ヤミカラス'];
const record=(amount,position=1,target=1,id='m')=>({method:'mew',amount,slot:target,candy:candyMap[species[target-1]||'ミュウ'],context:{actorId:id,actorSlot:position,...(target>=1&&target<=5?{team:species.map((species,i)=>({id:'snapshot-'+i,species,nickname:''}))}:{})},datetime:'2026-10-01T06:00:00+09:00'});
const source=[record(1),record(2,1,2),record(3,1,3),record(4,1,5),record(1,2,4),record(4,2,4),record(1,3,1,'other'),record(1,0),record(1,1,0),record(5)];
const initial=JSON.stringify(source),r=A.prepare(source,'mew','m');assert.equal(r.records.length,7);assert.equal(r.excluded,2);assert.equal(r.groups.length,3);assert.deepEqual(r.destinations,[1,2,3,4,5]);
assert.deepEqual(r.groups.map(g=>g.rows.map(x=>x.count)),[[2,1],[3,1],[3,2]]);
for(let i=0;i<2;i++){const rows=r.groups.slice(0,2).map(g=>g.rows[i]);assert.equal(rows[0].denominator,rows[1].denominator);assert.equal(rows.reduce((n,c)=>n+c.percent,0),100);}
assert.equal(r.groups[0].rows[0].cells[0].percent,20);assert.equal(r.groups[1].rows[0].cells[3].count,0);
assert.equal(A.prepare(source,'mew','m','1').records.length,7);assert.equal(A.prepare([],'mew').groups[0].rows.length,0);assert.equal(JSON.stringify(source),initial);
assert.equal(A.prepare([record(0,1,6)],'delibird').groups[0].rows[0].cells[5].percent,100);
const el=(tag,text,cls)=>({tag,text,cls,children:[],append(...x){this.children.push(...x)},replaceChildren(...x){this.children=x}}),nodes={},$=id=>nodes[id]??=el('div');
const a={id:'a',species:'ルカリオ',nickname:'A'},b={id:'b',species:'ルカリオ',nickname:'B'},crow={id:'c',species:'ヤミカラス'};
const state={pokemon:[a,b,crow],version:2,team:[null,null,null,null,null],events:[],records:[],shardRecords:[],settings:{}};
const add=(method,amount,p,day='2026-10-01')=>state.shardRecords.push({id:String(state.shardRecords.length),method,amount,datetime:day+'T06:00:00+09:00',...(p?{pokemonId:p.id,pokemonSnapshot:p}:{})});
add('skill',1260,a);add('skill',1260,a);add('skill',240,b);add('lucky',0,crow);add('research',8500);add('other',500);add('skill',100,a,'2026-09-30');
const before=JSON.stringify(state),label=p=>p.species+(p.nickname?'（'+p.nickname+'）':'');
const ctx={C,state,AnalysisData:rawA,candyMap,$,el,qel:el,label,historicalPokemon:r=>r.pokemonSnapshot,PeriodPicker:{sync(){}},summaryTitle:()=>'',RangePicker:{get:()=>C.range('day','2026-10-01')},WeeklyChart:{render(){}},SummaryExtras:{monthly(){},shardSources:[['research','睡眠リサーチ'],['skill','スキル'],['other','その他']],shardVisible:key=>state.settings[key]!==false},totalBreakdown:root=>{const body=el('tbody');root.append(body);return body;},totalBreakdownRow:(body,name,count,amount,cls)=>body.append({name,count,amount,cls})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../shards.js'),'utf8'),ctx);vm.runInContext('ShardUI.renderSummary()',ctx);
const rows=$('shard-total').children[2].children;assert.deepEqual(rows.map(x=>x.name),['睡眠リサーチ','スキル','ルカリオ（A）','ルカリオ（B）','ヤミカラス','その他']);assert.equal(rows[1].count,4);assert.equal(rows[1].amount,2760);assert.equal(rows[4].count,1);assert.equal(rows[4].amount,0);assert.equal($('shard-total').children[1].text,'11760個');
state.settings.skill=false;vm.runInContext('ShardUI.renderSummary()',ctx);assert.equal($('shard-total').children[1].text,'11760個');assert.equal($('shard-total').children[2].children.length,2);delete state.settings.skill;assert.equal(JSON.stringify(state),before);
assert.deepEqual(B.read(B.encode(state)),state);assert.deepEqual(B.read(JSON.stringify(state)),state);
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');assert(!html.includes('shard-pokemon-totals'));assert(!html.includes('analysis-level'));assert(!html.includes('analysis-multiplier'));assert(html.includes('src="analysis-data.js?v=20261005-unique"'));assert(html.indexOf('analysis-data.js')>=0&&html.indexOf('analysis-data.js')<html.indexOf('app.js'));
console.log('PASS: shared probability denominators, actual amounts, missing positions, zero cells, individual IDs, zero-shard skill count, period filtering, visibility preserves totals, source immutability, CSV/JSON roundtrip');
// 実際の描画関数で記録日・04:00境界・取得元の0件省略を確認。
const app=fs.readFileSync(require.resolve('../app.js'),'utf8');ctx.methods={help:'アメ拾い',mew:'ミュウ',delibird:'デリバード',skill:'スキル'};ctx.enabled=()=>true;
ctx.totals=(root,records,title,hideEmpty)=>{root.replaceChildren(el('small',title),el('div',C.sum(records)+'個','total'));const body=ctx.totalBreakdown(root);for(const [method,name] of Object.entries(ctx.methods)){const xs=records.filter(r=>r.method===method);if(hideEmpty&&!xs.length)continue;ctx.totalBreakdownRow(body,name,xs.length,C.sum(xs));}};
ctx.recordDate=()=>new Date('2026-10-01T06:00:00+09:00');ctx.SkillUI={candyCounts(group,records){group.append(el('p',records.length+'回のスキル情報'));}};
vm.runInContext(fs.readFileSync(require.resolve('../summary-extras.js'),'utf8'),ctx);
vm.runInContext('SummaryExtras.recordSummary()',ctx);const daily=$('today-total').children;assert.equal(daily[1].children[1].text,'0個');assert.equal(daily[1].children[2].children.length,0);assert.equal(daily[2].children[1].text,'11760個');assert(daily[2].children[2].children.some(x=>x.name==='ヤミカラス'&&x.count===1&&x.amount===0));
ctx.recordDate=()=>new Date('2026-10-01T03:59:00+09:00');vm.runInContext('SummaryExtras.recordSummary()',ctx);assert.equal($('today-total').children[2].children[1].text,'100個');assert.equal(JSON.stringify(state),before);
// 空の日は項目全体を省略し、0個のスキルがある日は残す。
ctx.recordDate=()=>new Date('2026-10-02T06:00:00+09:00');vm.runInContext('SummaryExtras.recordSummary()',ctx);assert.equal($('today-total').children.length,2);assert.equal($('today-total').children[1].children[0].text,'アメ');
add('lucky',0,crow,'2026-10-02');vm.runInContext('SummaryExtras.recordSummary()',ctx);assert.equal($('today-total').children.length,3);assert.equal($('today-total').children[2].children[1].text,'0個');assert($('today-total').children[2].children[2].children.some(x=>x.name==='ヤミカラス'&&x.count===1));state.shardRecords.pop();
ctx.recordDate=()=>new Date('2026-10-01T06:00:00+09:00');vm.runInContext('SummaryExtras.recordSummary()',ctx);assert.equal($('today-total').children[2].children[1].text,'11760個');assert.equal(JSON.stringify(state),before);
assert(html.includes('<label>リサーチ日<input id="shard-research-date"'));
console.log('PASS: empty-day shard section hidden, zero-amount skill retained, date switching restores breakdown, original history unchanged');
vm.runInContext(app.slice(app.indexOf('function renderSlotCounts('),app.indexOf('function renderAnalysis(){')),ctx);
ctx.slotFixture=[record(1,1,1),record(4,1,2),record(4,1,null),{method:'delibird',amount:0,slot:6}];vm.runInContext('renderSlotCounts(slotFixture)',ctx);
const groups=$('slot-counts').children.filter(x=>x.cls?.startsWith('slot-group'));assert.equal(groups.length,2);const mewRows=groups[0].children.at(-1).children[1].children;assert.equal(mewRows.length,5);assert.equal(mewRows[0].children[2].text,'50.0%');assert.equal(mewRows[1].children[2].text,'50.0%');assert(groups[0].children.some(x=>x.text?.includes('特定できない記録 1回')));const deliRows=groups[1].children.at(-1).children[1].children;assert.equal(deliRows[0].children[2].text,'―');assert.equal(deliRows[5].children[1].text,'1回');
assert(html.indexOf('setting-showShardSkill')<html.indexOf('setting-showShardResearch'));
console.log('PASS: daily individual breakdown, zero-source omission, game-day boundary, compact slot counts/amounts/percentages, unknown/skill-only preservation, settings order');

const twenty=[...Array.from({length:12},()=>record(1)),...Array.from({length:8},()=>record(4,1,2))],twentyResult=A.prepare(twenty,'mew');assert.equal(twentyResult.groups[0].rows[0].percent,60);assert.equal(twentyResult.groups[1].rows[0].percent,40);assert.equal(twentyResult.groups[0].rows[0].count,12);assert.equal(twentyResult.groups[1].rows[0].count,8);
const unknownTarget=A.prepare([record(1,1,null),record(4,1,2)],'mew');assert.equal(unknownTarget.records.length,2);assert.equal(unknownTarget.groups[0].rows[0].percent,50);assert.equal(unknownTarget.groups[0].rows[0].unknown,1);
const thirds=A.prepare([record(1),record(2),record(4)],'mew');assert.equal(thirds.groups[0].rows[0].percent+thirds.groups[1].rows[0].percent,100);
console.log('PASS: 12/20=60%, 8/20=40%, unknown destination remains in denominator, display rounding sums to100%');

vm.runInContext(app.slice(app.indexOf('function renderMewPositions('),app.indexOf('function historicalPokemon(')),ctx);
ctx.analysisResult=twentyResult;vm.runInContext('renderMewPositions($("test-analysis"),analysisResult)',ctx);
const position=$('test-analysis').children[0];assert.equal(position.children[0].children[1].text,'20回');assert.deepEqual(position.children[2].children.map(r=>r.children[2].text),['60.0%','40.0%']);assert.equal(position.children[3].children[2].children[0].children[1].children[0].text,'60.0%');assert.equal(position.children[5].children[0].text,'1個・4個 合計 · 20回 · 100.0%');
const noID=record(1);delete noID.context.actorId;assert.equal(A.prepare([noID],'mew').records.length,1);assert.equal(A.prepare([noID],'mew','m').records.length,0);
console.log('PASS: rendered group probabilities and destination counts, supplemental comparison, unknown individual does not remove valid position data');

// ユーザー例: 全176件、1個123件、2〜4個53件の条件付き獲得先割合。
const counts1=[26,32,20,26,19],countsMany=[9,14,12,8,10];
const destinationsFixture=[];for(const [amount,counts] of [[1,counts1],[4,countsMany]])counts.forEach((n,j)=>{for(let k=0;k<n;k++)destinationsFixture.push(record(amount,1,j+1));});
const destinationBefore=JSON.stringify(destinationsFixture),distribution=A.prepare(destinationsFixture,'mew');
assert.deepEqual(distribution.destinationGroups.map(g=>g.rows[0].count),[176,123,53]);
assert.deepEqual(distribution.destinationGroups.map(g=>g.rows[0].cells.map(c=>c.percent.toFixed(1))),[['19.9','26.1','18.2','19.3','16.5'],['21.1','26.0','16.3','21.1','15.4'],['17.0','26.4','22.6','15.1','18.9']]);
for(const group of distribution.destinationGroups){const row=group.rows[0];assert.equal(row.cells.reduce((n,c)=>n+c.count,0),row.count);assert(Math.abs(row.cells.reduce((n,c)=>n+c.percent,0)-100)<1e-10);}
assert.equal(JSON.stringify(destinationsFixture),destinationBefore);
const zeroGroup=A.prepare([record(1)],'mew').destinationGroups[2].rows[0];assert.equal(zeroGroup.count,0);assert(zeroGroup.cells.every(c=>c.percent===null&&c.count===0));
assert.equal(unknownTarget.destinationGroups[1].rows[0].count,0);assert(unknownTarget.destinationGroups[1].rows[0].cells.every(c=>c.percent===null));assert.equal(unknownTarget.targetExcluded,1);
ctx.analysisResult=distribution;vm.runInContext('renderMewPositions($("distribution"),analysisResult)',ctx);const distributionTable=$('distribution').children[0].children[3];assert.equal(distributionTable.className,'mew-target-table mew-distribution');assert.equal(distributionTable.children[2].children.length,3);assert.equal(distributionTable.children[2].children[1].children[1].children[0].text,'21.1%');assert.equal(distributionTable.children[2].children[1].children[1].children[1].text,'26回');
console.log('PASS: separate destination denominators 176/123/53, per-row unrounded total100%, zero denominator, unknown destination, immutable history, rendered percentages and counts');

// 同種・進化系の重複は枠分析だけ除外。現在編成や保存された選択枠を信用して補完しない。
const unique=record(1,1,2),sameSpecies=record(4,1,2),evolution=record(1,1,2),legacy=record(4,1,3),conflict=record(1,1,3);
sameSpecies.context.team[4]={id:'duplicate',species:'ルカリオ'};evolution.context.team[4]={id:'evolution',species:'リオル'};delete legacy.context.team;conflict.slot=4;
const ambiguityFixture=[unique,sameSpecies,evolution,legacy,conflict],ambiguityBefore=JSON.stringify(ambiguityFixture),amb=A.prepare(ambiguityFixture,'mew');
assert.equal(amb.records.length,5);assert.equal(amb.targetRecords.length,1);assert.equal(amb.targetExcluded,4);assert.equal(amb.groups[0].rows[0].count,3);assert.equal(amb.groups[1].rows[0].count,2);assert.equal(amb.groups[0].rows[0].percent,60);assert.equal(amb.groups[1].rows[0].percent,40);assert.equal(amb.destinationGroups[0].rows[0].count,1);assert.equal(amb.destinationGroups[0].rows[0].cells[1].percent,100);assert.equal(amb.destinationGroups[2].rows[0].count,0);
assert.equal(rawA.targetSlot(evolution,candyMap),null);assert.equal(rawA.targetSlot(unique,candyMap),2);const nullSlot=record(1,1,2);nullSlot.slot=null;assert.equal(rawA.targetSlot(nullSlot,candyMap),2);
const unknownMember=record(1);unknownMember.context.team[4]={species:'未知のポケモン'};assert.equal(rawA.targetSlot(unknownMember,candyMap),null);
const emptySlots=record(1);emptySlots.context.team[4]=null;assert.equal(rawA.targetSlot(emptySlots,candyMap),1);
assert.equal(JSON.stringify(ambiguityFixture),ambiguityBefore);assert.deepEqual(B.read(B.encode({...state,records:ambiguityFixture})).records,ambiguityFixture);
const image=require('../mew-image.js').aggregate(ambiguityFixture,candyMap);assert.equal(image.total,5);assert.equal(image.selected,1);assert.equal(image.excluded,4);assert.deepEqual(image.counts,[0,1,0,0,0]);assert.equal(image.matrix[0][1],1);assert.equal(image.one[1],1);assert.equal(image.four.reduce((n,x)=>n+x,0),0);
ctx.analysisResult=amb;vm.runInContext('renderMewPositions($("ambiguous"),analysisResult)',ctx);assert($('ambiguous').children[0].children[4].text.includes('獲得先不明 4回を除外'));
console.log('PASS: same species/evolution ambiguity, missing historical team, conflicting target, unknown member, empty slot, snapshot-only resolution, occurrence ratios unchanged, destination denominators exclude ambiguity, image parity, CSV and source immutability');

// シェア画像も同じAnalysisDataの割合・条件付き分布を使い、元履歴を保持。
const drawn=[],canvas={getContext:()=>({fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(value){drawn.push(String(value))}}),toDataURL:()=> 'data:image/png;base64,test'};
const imageCtx={document:{createElement:()=>canvas}};vm.createContext(imageCtx);vm.runInContext(fs.readFileSync(require.resolve('../mew-image.js'),'utf8'),imageCtx);
assert.equal(imageCtx.MewImage.png(distribution,'全期間'),'data:image/png;base64,test');
for(const value of ['ミュウ','スキル位置と獲得先','分析対象 176回','69.9%','30.1%','21.1%','17.0%'])assert(drawn.includes(value),value);
assert.equal(canvas.width,780);assert.equal(JSON.stringify(destinationsFixture),destinationBefore);
const rangeSource=fs.readFileSync(require.resolve('../range-picker.js'),'utf8');let selectedArgs;
const todayCtx={items:new Map(),C,select:(...args)=>selectedArgs=args};vm.createContext(todayCtx);vm.runInContext(rangeSource.slice(rangeSource.indexOf(' function today('),rangeSource.indexOf(' function move(')),todayCtx);
for(const kind of ['day','week','month','all','custom']){todayCtx.items.set('period',{kind});vm.runInContext('today("period")',todayCtx);assert.equal(selectedArgs[1],'day');assert.equal(selectedArgs[2],C.gameDay(new Date()));}
console.log('PASS: PNG parity, unchanged fixture, today resets day/week/month/all/custom to day');
