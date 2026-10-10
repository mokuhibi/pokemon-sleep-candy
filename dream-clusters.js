'use strict';
// 2026-10-10確認。Ver.3.6.0以降の交換量。旧Wikiの未更新表は使用しない。
// S: https://www.serebii.net/pokemonsleep/researchrank.shtml
// S/M/L照合・倍率: https://bulbapedia.bulbagarden.net/wiki/Dream_Shard
// M = S × 6 / L = S × 25（公開交換表の仕様）。未対応ランクは補間しない。
const DreamClusters=(()=>{
 const small=Object.freeze([578,594,611,629,648,668,689,711,734,758,782,807,832,858,884,912,940,970,1000,1032,1064,1098,1132,1168,1204,1242,1280,1320,1360,1402,1444,1488,1532,1578,1624,1671,1718,1766,1814,1863,1913,1963,2013,2063,2113,2169,2225,2281,2337,2393,2454,2515,2576,2637,2698,2763,2832,2905,2982,3062,3145,3231,3320,3412,3506,3602,3700,3801,3906,4018]);
 const factors=Object.freeze({S:1,M:6,L:25});
 const otherKinds=Object.freeze({mission:'ミッション',achievement:'アチーブメント',gift:'プレゼント',unclassified:'未分類'});
 const validRank=n=>Number.isInteger(n)&&n>=1&&n<=small.length;
 function amount(size,count,rank){
  if(!validRank(rank))throw Error('設定でリサーチランクを設定してください。');
  if(!Object.hasOwn(factors,size)||!Number.isSafeInteger(count)||count<1)throw Error('サイズと使用個数を確認してください。');
  const total=small[rank-1]*factors[size]*count;
  if(!Number.isSafeInteger(total)||total>1000000000)throw Error('獲得数は10億個以下で入力してください。');
  return total;
 }
 const otherKind=r=>Object.hasOwn(otherKinds,r.otherKind)?r.otherKind:'unclassified';
 const api={small,factors,otherKinds,validRank,amount,otherKind};return api;
})();
if(typeof module!=='undefined'&&module.exports)module.exports=DreamClusters;
