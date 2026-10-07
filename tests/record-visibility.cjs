const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../core.js'),B=require('../backup.js');
const app=fs.readFileSync(require.resolve('../app.js'),'utf8');
const state={version:2,pokemon:[{id:'m',species:'ミュウ',nickname:'保存済み',profile:null}],team:['m',null,null,null,null],records:[{id:'r',method:'mew',amount:4,datetime:'2026-10-01T06:00:00+09:00'}],shardRecords:[{id:'s',method:'skill',amount:0,datetime:'2026-10-01T06:00:00+09:00'}],events:[],settings:{mew:true,delibird:false}};
const nodes={},make=(tag,text,cls)=>({tag,text,cls,children:[],append(...x){this.children.push(...x)},replaceChildren(...x){this.children=x}}),$=id=>nodes[id]??=make('div');
const ctx={state,$,methods:{help:'アメ拾い',mew:'ミュウ',delibird:'デリバード',skill:'スキル'},el:make,currentTeam:()=>[null,null,null,null,null],ShardUI:{renderInputs(){}},SummaryExtras:{recordSummary(){}},CopySkills:{render:root=>root.append(make('copy'))},actors:{},label:p=>p.species,optionList(){},skillContext:()=>null,position:n=>String(n),button:make,quantityText:(node,text)=>{node.text=text;}};
vm.createContext(ctx);vm.runInContext(app.slice(app.indexOf('const enabled='),app.indexOf('const actorOf=')),ctx);vm.runInContext(app.slice(app.indexOf('function renderRecord()'),app.indexOf('function headingTotal(')),ctx);
assert(vm.runInContext("recordVisible('help')",ctx),'old unset help is ON');
assert(!vm.runInContext("recordVisible('delibird')",ctx),'old OFF retained');
vm.runInContext('renderRecord()',ctx);assert.deepEqual($('record-methods').children.map(n=>n.tag==='copy'?'copy':n.id),['help-section','mew-section','copy']);
const saved=JSON.stringify({...state,settings:null});
const candyKeys={help:'showCandyHelp',mew:'mew',delibird:'delibird',skill:'showOtherCandy'};
for(const k of [...Object.values(candyKeys),'showShardSkill','showShardResearch','showShardOther'])state.settings[k]=false;
vm.runInContext('renderRecord()',ctx);assert.equal($('record-methods').children.length,0);
for(const m of Object.keys(candyKeys))assert(vm.runInContext(`enabled('${m}')`,ctx));
assert(vm.runInContext("visibleRecord(state.records[0])&&speciesEnabled('ミュウ')&&speciesEnabled('デリバード')",ctx));
for(const m of Object.keys(candyKeys)){state.settings[candyKeys[m]]=true;vm.runInContext('renderRecord()',ctx);assert.equal($('record-methods').children.length,1);state.settings[candyKeys[m]]=false;}
ctx.commit=(next)=>{Object.assign(state,next);return true;};vm.runInContext(app.slice(app.indexOf("for(const method of ['help','mew','delibird'])$('enable-"),app.indexOf("optionList($('profile-nature')")),ctx);
$('enable-help').checked=true;$('enable-help').onchange();assert.equal(state.settings.showCandyHelp,true);assert.equal(state.settings.mew,false);
assert.equal(JSON.stringify({...state,settings:null}),saved,'settings-only mutations preserve all data');
assert.deepEqual(B.read(B.encode(state)),JSON.parse(JSON.stringify(state)),'optional setting roundtrips in existing CSV');
const legacy={...state,records:[],shardRecords:[],settings:{mew:true,delibird:false}};const restored=C.migrate(B.read(B.encode(legacy)),{'ミュウ':'ミュウのアメ'});ctx.state=restored;assert(vm.runInContext("recordVisible('help')",ctx));assert(!vm.runInContext("recordVisible('delibird')",ctx));
// 履歴内のミュウのかけら数も設定OFFで変わらない。
ctx.actorOf=()=>({species:'ミュウ',profile:{skillLevel:8}});ctx.label=p=>p.species;ctx.mainSkillText=()=> 'オールマイティー（ゆびをふる）';ctx.SK={id:v=>v,forPokemon:()=> 'metronome'};ctx.qel=make;ctx.SummaryExtras.shardVisible=()=>false;
const history=fs.readFileSync(require.resolve('../history-tools.js'),'utf8');vm.runInContext(history.slice(history.indexOf(' function appendHistory('),history.indexOf(' function refreshEditor(')),ctx);
const card=make('div');ctx.card=card;vm.runInContext("appendHistory(card,{recordedSkillLevel:8,context:{},firedSkill:'dream_shard_s',shardAmount:2500})",ctx);assert(card.children.some(x=>x.text==='ゆめのかけら：2500個'));
console.log('PASS: old ON defaults/OFF preservation, independent input switches, unchanged saved data/history, optional CSV settings and old CSV compatibility');
