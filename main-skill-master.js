'use strict';
// メインスキルマスター。表示名の変更は entries の name だけを変更します。
// id と legacyName は保存データとの対応に使うため変更しません。
// 基本スキル出典: https://wikiwiki.jp/poke_sleep/ポケモンの一覧 （2026-09-15確認）
// ミュウの選択肢、かけら対象の名前・種類は既存アプリのユーザー指定を優先。
const MainSkillMaster=(()=>{
 const entries=[
  {
    "id": "metronome",
    "name": "ゆびをふる",
    "legacyName": "ゆびをふる",
    "mew": true
  },
  {
    "id": "energy_s",
    "name": "エナジーチャージS",
    "legacyName": "エナジーチャージS",
    "mew": true
  },
  {
    "id": "energy_m",
    "name": "エナジーチャージM",
    "legacyName": "エナジーチャージM",
    "mew": true
  },
  {
    "id": "dream_shard_s",
    "name": "ゆめのかけらゲットS",
    "legacyName": "ゆめのかけらゲットS",
    "mew": true,
    "aliases": [
      "ゆめのかけらゲット",
      "ゆめのかけらゲットS(ランダム)"
    ]
  },
  {
    "id": "ingredient_s",
    "name": "食材ゲットS",
    "legacyName": "食材ゲットS",
    "mew": true
  },
  {
    "id": "energizing_cheer_s",
    "name": "げんきエールS",
    "legacyName": "げんきエールS",
    "mew": true
  },
  {
    "id": "charge_strength_s",
    "name": "げんきチャージS",
    "legacyName": "げんきチャージS",
    "mew": true
  },
  {
    "id": "energy_all_s",
    "name": "げんきオールS",
    "legacyName": "げんきオールS",
    "mew": true
  },
  {
    "id": "cooking_chance_s",
    "name": "料理チャンスS",
    "legacyName": "料理チャンスS",
    "mew": true
  },
  {
    "id": "cooking_power_s",
    "name": "料理パワーアップS",
    "legacyName": "料理パワーアップS",
    "mew": true
  },
  {
    "id": "helper_support_s",
    "name": "おてつだいサポートS",
    "legacyName": "おてつだいサポートS",
    "mew": true
  },
  {
    "id": "berry_burst",
    "name": "きのみバースト",
    "legacyName": "きのみバースト",
    "mew": true
  },
  {
    "id": "skill_01",
    "name": "いやしのはどう(げんきエールS)",
    "legacyName": "いやしのはどう(げんきエールS)",
    "mew": false
  },
  {
    "id": "skill_02",
    "name": "おてつだいブースト(でんき)",
    "legacyName": "おてつだいブースト(でんき)",
    "mew": false
  },
  {
    "id": "skill_03",
    "name": "おてつだいブースト(ほのお)",
    "legacyName": "おてつだいブースト(ほのお)",
    "mew": false
  },
  {
    "id": "skill_04",
    "name": "おてつだいブースト(みず)",
    "legacyName": "おてつだいブースト(みず)",
    "mew": false
  },
  {
    "id": "skill_05",
    "name": "かいりきバサミ(食材セレクトS)",
    "legacyName": "かいりきバサミ(食材セレクトS)",
    "mew": false
  },
  {
    "id": "skill_06",
    "name": "きのみジュース(げんきオールS)",
    "legacyName": "きのみジュース(げんきオールS)",
    "mew": false
  },
  {
    "id": "super_luck",
    "name": "きょううん(食材セレクトS)",
    "legacyName": "きょううん(食材セレクトS)",
    "mew": false
  },
  {
    "id": "skill_08",
    "name": "たくわえる(エナジーチャージS)",
    "legacyName": "たくわえる(エナジーチャージS)",
    "mew": false
  },
  {
    "id": "skill_09",
    "name": "つきのひかり(げんきチャージS)",
    "legacyName": "つきのひかり(げんきチャージS)",
    "mew": false
  },
  {
    "id": "skill_10",
    "name": "ばけのかわ(きのみバースト)",
    "legacyName": "ばけのかわ(きのみバースト)",
    "mew": false
  },
  {
    "id": "skill_11",
    "name": "へんしん(スキルコピー)",
    "legacyName": "へんしん(スキルコピー)",
    "mew": false
  },
  {
    "id": "skill_12",
    "name": "ほっぺすりすり(げんきエールS)",
    "legacyName": "ほっぺすりすり(げんきエールS)",
    "mew": false
  },
  {
    "id": "skill_13",
    "name": "みかづきのいのり(げんきオールS)",
    "legacyName": "みかづきのいのり(げんきオールS)",
    "mew": false
  },
  {
    "id": "skill_14",
    "name": "ものまね(スキルコピー)",
    "legacyName": "ものまね(スキルコピー)",
    "mew": false
  },
  {
    "id": "skill_15",
    "name": "りゅうせいぐん(きのみバースト)",
    "legacyName": "りゅうせいぐん(きのみバースト)",
    "mew": false
  },
  {
    "id": "skill_16",
    "name": "エナジーチャージS(ランダム)",
    "legacyName": "エナジーチャージS(ランダム)",
    "mew": false
  },
  {
    "id": "skill_17",
    "name": "ナイトメア(エナジーチャージM)",
    "legacyName": "ナイトメア(エナジーチャージM)",
    "mew": false
  },
  {
    "id": "skill_18",
    "name": "ビルドアップ(料理アシストS)",
    "legacyName": "ビルドアップ(料理アシストS)",
    "mew": false
  },
  {
    "id": "skill_19",
    "name": "プラス(食材ゲットS)",
    "legacyName": "プラス(食材ゲットS)",
    "mew": false
  },
  {
    "id": "skill_20",
    "name": "プレゼント(食材ゲットS)",
    "legacyName": "プレゼント(食材ゲットS)",
    "mew": false
  },
  {
    "id": "skill_21",
    "name": "マイナス(料理パワーアップS)",
    "legacyName": "マイナス(料理パワーアップS)",
    "mew": false
  },
  {
    "id": "skill_22",
    "name": "食材セレクトS",
    "legacyName": "食材セレクトS",
    "mew": false
  }
];
 const species={
  "フシギダネ": {
    "skillId": "ingredient_s"
  },
  "フシギソウ": {
    "skillId": "ingredient_s"
  },
  "フシギバナ": {
    "skillId": "ingredient_s"
  },
  "ヒトカゲ": {
    "skillId": "ingredient_s"
  },
  "リザード": {
    "skillId": "ingredient_s"
  },
  "リザードン": {
    "skillId": "ingredient_s"
  },
  "ゼニガメ": {
    "skillId": "ingredient_s"
  },
  "カメール": {
    "skillId": "ingredient_s"
  },
  "カメックス": {
    "skillId": "ingredient_s"
  },
  "キャタピー": {
    "skillId": "ingredient_s"
  },
  "トランセル": {
    "skillId": "ingredient_s"
  },
  "バタフリー": {
    "skillId": "ingredient_s"
  },
  "コラッタ": {
    "skillId": "charge_strength_s"
  },
  "ラッタ": {
    "skillId": "charge_strength_s"
  },
  "アーボ": {
    "skillId": "charge_strength_s"
  },
  "アーボック": {
    "skillId": "charge_strength_s"
  },
  "ピカチュウ": {
    "skillId": "energy_s"
  },
  "ピカチュウ(ハロウィン)": {
    "skillId": "skill_16"
  },
  "ピカチュウ(ホリデー)": {
    "skillId": "dream_shard_s",
    "shardMode": "fixed"
  },
  "ピカチュウ(キャプテン)": {
    "skillId": "ingredient_s"
  },
  "ライチュウ": {
    "skillId": "energy_s"
  },
  "サンド": {
    "skillId": "skill_22"
  },
  "サンドパン": {
    "skillId": "skill_22"
  },
  "ピッピ": {
    "skillId": "metronome"
  },
  "ピクシー": {
    "skillId": "metronome"
  },
  "ロコン": {
    "skillId": "energizing_cheer_s"
  },
  "ロコン(アローラ)": {
    "skillId": "helper_support_s"
  },
  "キュウコン": {
    "skillId": "energizing_cheer_s"
  },
  "キュウコン(アローラ)": {
    "skillId": "helper_support_s"
  },
  "プリン": {
    "skillId": "energy_all_s"
  },
  "プクリン": {
    "skillId": "energy_all_s"
  },
  "ディグダ": {
    "skillId": "energy_s"
  },
  "ダグトリオ": {
    "skillId": "energy_s"
  },
  "ニャース": {
    "skillId": "dream_shard_s",
    "shardMode": "fixed"
  },
  "ペルシアン": {
    "skillId": "dream_shard_s",
    "shardMode": "fixed"
  },
  "コダック": {
    "skillId": "skill_16"
  },
  "ゴルダック": {
    "skillId": "skill_16"
  },
  "マンキー": {
    "skillId": "skill_16"
  },
  "オコリザル": {
    "skillId": "skill_16"
  },
  "ガーディ": {
    "skillId": "helper_support_s"
  },
  "ウインディ": {
    "skillId": "helper_support_s"
  },
  "マダツボミ": {
    "skillId": "charge_strength_s"
  },
  "ウツドン": {
    "skillId": "charge_strength_s"
  },
  "ウツボット": {
    "skillId": "charge_strength_s"
  },
  "イシツブテ": {
    "skillId": "skill_16"
  },
  "ゴローン": {
    "skillId": "skill_16"
  },
  "ゴローニャ": {
    "skillId": "skill_16"
  },
  "ヤドン": {
    "skillId": "energizing_cheer_s"
  },
  "ヤドラン": {
    "skillId": "energizing_cheer_s"
  },
  "コイル": {
    "skillId": "cooking_power_s"
  },
  "レアコイル": {
    "skillId": "cooking_power_s"
  },
  "カモネギ": {
    "skillId": "energy_s"
  },
  "ドードー": {
    "skillId": "charge_strength_s"
  },
  "ドードリオ": {
    "skillId": "charge_strength_s"
  },
  "ゴース": {
    "skillId": "skill_16"
  },
  "ゴースト": {
    "skillId": "skill_16"
  },
  "ゲンガー": {
    "skillId": "skill_16"
  },
  "イワーク": {
    "skillId": "ingredient_s"
  },
  "カラカラ": {
    "skillId": "charge_strength_s"
  },
  "ガラガラ": {
    "skillId": "charge_strength_s"
  },
  "ラッキー": {
    "skillId": "energy_all_s"
  },
  "ガルーラ": {
    "skillId": "ingredient_s"
  },
  "バリヤード": {
    "skillId": "skill_14"
  },
  "カイロス": {
    "skillId": "energy_m"
  },
  "メタモン": {
    "skillId": "skill_11"
  },
  "イーブイ": {
    "skillId": "ingredient_s"
  },
  "イーブイ(ハロウィン)": {
    "skillId": "ingredient_s"
  },
  "イーブイ(ホリデー)": {
    "skillId": "dream_shard_s",
    "shardMode": "fixed"
  },
  "シャワーズ": {
    "skillId": "ingredient_s"
  },
  "サンダース": {
    "skillId": "helper_support_s"
  },
  "ブースター": {
    "skillId": "cooking_power_s"
  },
  "ミニリュウ": {
    "skillId": "charge_strength_s"
  },
  "ハクリュー": {
    "skillId": "charge_strength_s"
  },
  "カイリュー": {
    "skillId": "charge_strength_s"
  },
  "ミュウ": {
    "skillId": "metronome"
  },
  "チコリータ": {
    "skillId": "skill_16"
  },
  "ベイリーフ": {
    "skillId": "skill_16"
  },
  "メガニウム": {
    "skillId": "skill_16"
  },
  "ヒノアラシ": {
    "skillId": "skill_16"
  },
  "マグマラシ": {
    "skillId": "skill_16"
  },
  "バクフーン": {
    "skillId": "skill_16"
  },
  "ワニノコ": {
    "skillId": "skill_16"
  },
  "アリゲイツ": {
    "skillId": "skill_16"
  },
  "オーダイル": {
    "skillId": "skill_16"
  },
  "ピチュー": {
    "skillId": "energy_s"
  },
  "ピィ": {
    "skillId": "metronome"
  },
  "ププリン": {
    "skillId": "energy_all_s"
  },
  "トゲピー": {
    "skillId": "metronome"
  },
  "トゲチック": {
    "skillId": "metronome"
  },
  "ネイティ": {
    "skillId": "ingredient_s"
  },
  "ネイティオ": {
    "skillId": "ingredient_s"
  },
  "メリープ": {
    "skillId": "energy_m"
  },
  "モココ": {
    "skillId": "energy_m"
  },
  "デンリュウ": {
    "skillId": "energy_m"
  },
  "ウソッキー": {
    "skillId": "energy_m"
  },
  "ウパー": {
    "skillId": "charge_strength_s"
  },
  "ウパー(パルデア)": {
    "skillId": "charge_strength_s"
  },
  "ヌオー": {
    "skillId": "charge_strength_s"
  },
  "エーフィ": {
    "skillId": "energy_m"
  },
  "ブラッキー": {
    "skillId": "skill_09"
  },
  "ヤミカラス": {
    "skillId": "super_luck",
    "shardMode": "lucky"
  },
  "ヤドキング": {
    "skillId": "energizing_cheer_s"
  },
  "ソーナンス": {
    "skillId": "energizing_cheer_s"
  },
  "ハガネール": {
    "skillId": "ingredient_s"
  },
  "ツボツボ": {
    "skillId": "skill_06"
  },
  "ヘラクロス": {
    "skillId": "skill_18"
  },
  "ニューラ": {
    "skillId": "cooking_chance_s"
  },
  "デリバード": {
    "skillId": "skill_20"
  },
  "デルビル": {
    "skillId": "energy_m"
  },
  "ヘルガー": {
    "skillId": "energy_m"
  },
  "ハピナス": {
    "skillId": "energy_all_s"
  },
  "ライコウ": {
    "skillId": "skill_02"
  },
  "エンテイ": {
    "skillId": "skill_03"
  },
  "スイクン": {
    "skillId": "skill_04"
  },
  "ヨーギラス": {
    "skillId": "charge_strength_s"
  },
  "サナギラス": {
    "skillId": "charge_strength_s"
  },
  "バンギラス": {
    "skillId": "charge_strength_s"
  },
  "キモリ": {
    "skillId": "berry_burst"
  },
  "ジュプトル": {
    "skillId": "berry_burst"
  },
  "ジュカイン": {
    "skillId": "berry_burst"
  },
  "アチャモ": {
    "skillId": "charge_strength_s"
  },
  "ワカシャモ": {
    "skillId": "charge_strength_s"
  },
  "バシャーモ": {
    "skillId": "charge_strength_s"
  },
  "ミズゴロウ": {
    "skillId": "cooking_chance_s"
  },
  "ヌマクロー": {
    "skillId": "cooking_chance_s"
  },
  "ラグラージ": {
    "skillId": "cooking_chance_s"
  },
  "ラルトス": {
    "skillId": "energy_all_s"
  },
  "キルリア": {
    "skillId": "energy_all_s"
  },
  "サーナイト": {
    "skillId": "energy_all_s"
  },
  "ナマケロ": {
    "skillId": "ingredient_s"
  },
  "ヤルキモノ": {
    "skillId": "ingredient_s"
  },
  "ケッキング": {
    "skillId": "ingredient_s"
  },
  "ヤミラミ": {
    "skillId": "dream_shard_s",
    "shardMode": "random"
  },
  "クチート": {
    "skillId": "skill_05"
  },
  "ココドラ": {
    "skillId": "charge_strength_s"
  },
  "コドラ": {
    "skillId": "charge_strength_s"
  },
  "ボスゴドラ": {
    "skillId": "charge_strength_s"
  },
  "プラスル": {
    "skillId": "skill_19"
  },
  "マイナン": {
    "skillId": "skill_21"
  },
  "ゴクリン": {
    "skillId": "dream_shard_s",
    "shardMode": "random"
  },
  "マルノーム": {
    "skillId": "dream_shard_s",
    "shardMode": "random"
  },
  "ナックラー": {
    "skillId": "energy_s"
  },
  "ビブラーバ": {
    "skillId": "energy_s"
  },
  "フライゴン": {
    "skillId": "energy_s"
  },
  "チルット": {
    "skillId": "charge_strength_s"
  },
  "チルタリス": {
    "skillId": "charge_strength_s"
  },
  "カゲボウズ": {
    "skillId": "skill_16"
  },
  "ジュペッタ": {
    "skillId": "skill_16"
  },
  "アブソル": {
    "skillId": "energy_m"
  },
  "ソーナノ": {
    "skillId": "energizing_cheer_s"
  },
  "タマザラシ": {
    "skillId": "ingredient_s"
  },
  "タマザラシ(ホリデー)": {
    "skillId": "cooking_chance_s"
  },
  "トドグラー": {
    "skillId": "ingredient_s"
  },
  "トドゼルガ": {
    "skillId": "ingredient_s"
  },
  "タツベイ": {
    "skillId": "cooking_power_s"
  },
  "コモルー": {
    "skillId": "cooking_power_s"
  },
  "ボーマンダ": {
    "skillId": "cooking_power_s"
  },
  "ラティアス": {
    "skillId": "skill_01"
  },
  "ラティオス": {
    "skillId": "skill_15"
  },
  "ナエトル": {
    "skillId": "energy_all_s"
  },
  "ハヤシガメ": {
    "skillId": "energy_all_s"
  },
  "ドダイトス": {
    "skillId": "energy_all_s"
  },
  "ヒコザル": {
    "skillId": "berry_burst"
  },
  "モウカザル": {
    "skillId": "berry_burst"
  },
  "ゴウカザル": {
    "skillId": "berry_burst"
  },
  "ポッチャマ": {
    "skillId": "helper_support_s"
  },
  "ポッタイシ": {
    "skillId": "helper_support_s"
  },
  "エンペルト": {
    "skillId": "helper_support_s"
  },
  "コリンク": {
    "skillId": "cooking_power_s"
  },
  "ルクシオ": {
    "skillId": "cooking_power_s"
  },
  "レントラー": {
    "skillId": "cooking_power_s"
  },
  "フワンテ": {
    "skillId": "skill_08"
  },
  "フワライド": {
    "skillId": "skill_08"
  },
  "ドンカラス": {
    "skillId": "super_luck",
    "shardMode": "lucky"
  },
  "ウソハチ": {
    "skillId": "energy_m"
  },
  "マネネ": {
    "skillId": "skill_14"
  },
  "ピンプク": {
    "skillId": "energy_all_s"
  },
  "ミカルゲ": {
    "skillId": "helper_support_s"
  },
  "リオル": {
    "skillId": "dream_shard_s",
    "shardMode": "fixed"
  },
  "ルカリオ": {
    "skillId": "dream_shard_s",
    "shardMode": "fixed"
  },
  "グレッグル": {
    "skillId": "energy_s"
  },
  "ドクロッグ": {
    "skillId": "energy_s"
  },
  "ユキカブリ": {
    "skillId": "skill_16"
  },
  "ユキノオー": {
    "skillId": "skill_16"
  },
  "マニューラ": {
    "skillId": "cooking_chance_s"
  },
  "ジバコイル": {
    "skillId": "cooking_power_s"
  },
  "トゲキッス": {
    "skillId": "metronome"
  },
  "リーフィア": {
    "skillId": "energizing_cheer_s"
  },
  "グレイシア": {
    "skillId": "cooking_power_s"
  },
  "エルレイド": {
    "skillId": "helper_support_s"
  },
  "クレセリア": {
    "skillId": "skill_13"
  },
  "ダークライ": {
    "skillId": "skill_17"
  },
  "ムンナ": {
    "skillId": "dream_shard_s",
    "shardMode": "random"
  },
  "ムシャーナ": {
    "skillId": "dream_shard_s",
    "shardMode": "random"
  },
  "イシズマイ": {
    "skillId": "skill_22"
  },
  "イワパレス": {
    "skillId": "skill_22"
  },
  "ワシボン": {
    "skillId": "berry_burst"
  },
  "ウォーグル": {
    "skillId": "berry_burst"
  },
  "チゴラス": {
    "skillId": "cooking_power_s"
  },
  "ガチゴラス": {
    "skillId": "cooking_power_s"
  },
  "ニンフィア": {
    "skillId": "energy_all_s"
  },
  "ルチャブル": {
    "skillId": "skill_22"
  },
  "デデンネ": {
    "skillId": "cooking_chance_s"
  },
  "バケッチャ(ちゅうだま)": {
    "skillId": "energy_s"
  },
  "バケッチャ(こだま)": {
    "skillId": "energy_s"
  },
  "バケッチャ(おおだま)": {
    "skillId": "energy_s"
  },
  "バケッチャ(ギガだま)": {
    "skillId": "energy_s"
  },
  "パンプジン(ちゅうだま)": {
    "skillId": "energy_s"
  },
  "パンプジン(こだま)": {
    "skillId": "energy_s"
  },
  "パンプジン(おおだま)": {
    "skillId": "energy_s"
  },
  "パンプジン(ギガだま)": {
    "skillId": "energy_s"
  },
  "オンバット": {
    "skillId": "energy_m"
  },
  "オンバーン": {
    "skillId": "energy_m"
  },
  "アゴジムシ": {
    "skillId": "energy_s"
  },
  "デンヂムシ": {
    "skillId": "energy_s"
  },
  "クワガノン": {
    "skillId": "energy_s"
  },
  "アブリー": {
    "skillId": "skill_22"
  },
  "アブリボン": {
    "skillId": "skill_22"
  },
  "ヌイコグマ": {
    "skillId": "skill_16"
  },
  "キテルグマ": {
    "skillId": "skill_16"
  },
  "キュワワー": {
    "skillId": "energizing_cheer_s"
  },
  "トゲデマル": {
    "skillId": "skill_12"
  },
  "ミミッキュ": {
    "skillId": "skill_10"
  },
  "ジジーロン": {
    "skillId": "cooking_chance_s"
  },
  "ウッウ": {
    "skillId": "cooking_chance_s"
  },
  "エレズン": {
    "skillId": "ingredient_s"
  },
  "ストリンダー(ハイ)": {
    "skillId": "skill_19"
  },
  "ストリンダー(ロー)": {
    "skillId": "skill_21"
  },
  "ニャオハ": {
    "skillId": "cooking_power_s"
  },
  "ニャローテ": {
    "skillId": "cooking_power_s"
  },
  "マスカーニャ": {
    "skillId": "cooking_power_s"
  },
  "ホゲータ": {
    "skillId": "charge_strength_s"
  },
  "アチゲータ": {
    "skillId": "charge_strength_s"
  },
  "ラウドボーン": {
    "skillId": "charge_strength_s"
  },
  "クワッス": {
    "skillId": "energy_m"
  },
  "ウェルカモ": {
    "skillId": "energy_m"
  },
  "ウェーニバル": {
    "skillId": "energy_m"
  },
  "パモ": {
    "skillId": "energy_all_s"
  },
  "パモット": {
    "skillId": "energy_all_s"
  },
  "パーモット": {
    "skillId": "energy_all_s"
  },
  "カヌチャン": {
    "skillId": "energy_m"
  },
  "ナカヌチャン": {
    "skillId": "energy_m"
  },
  "デカヌチャン": {
    "skillId": "energy_m"
  },
  "アルクジラ": {
    "skillId": "charge_strength_s"
  },
  "ハルクジラ": {
    "skillId": "charge_strength_s"
  },
  "ドオー": {
    "skillId": "charge_strength_s"
  },
  "ホリデーピカチュウ": {
    "skillId": "dream_shard_s",
    "shardMode": "fixed"
  },
  "ホリデーイーブイ": {
    "skillId": "dream_shard_s",
    "shardMode": "fixed"
  }
};

 const find=value=>entries.find(s=>s.id===value||s.legacyName===value||s.name===value||s.aliases?.includes(value));
 const id=value=>find(value)?.id||value||'';
 const name=value=>find(value)?.name||value||'未設定';
 const value=key=>find(key)?.legacyName||key||'';
 const defaultId=kind=>species[kind]?.skillId||'';
 // 保存済みの選択を優先。未保存の旧個体は表示時だけ基本スキルを補います。
 const forPokemon=p=>p?((p.mainSkillId&&find(p.mainSkillId)?p.mainSkillId:p.mainSkill||p.mainSkillId||defaultId(p.species))):'';
 const fields=key=>({mainSkillId:id(key),mainSkill:value(key)});
 const mewEntries=()=>entries.filter(s=>s.mew);
 const shardMode=p=>{const key=id(forPokemon(p));if(key==='super_luck')return 'lucky';if(p?.species==='ミュウ'&&key==='metronome')return 'fixed';if(key!=='dream_shard_s')return null;return species[p.species]?.shardMode==='random'?'random':'fixed';};
 return {entries,species,find,id,name,value,defaultId,forPokemon,fields,mewEntries,shardMode};
})();
if(typeof module!=='undefined')module.exports=MainSkillMaster;
