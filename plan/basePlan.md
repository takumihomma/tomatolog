# ライフログ PWA アプリ 基本実装計画書

## 1. プロジェクト概要

* **目的:** スマホから定期的に通知・録音を促し、話した内容を音声認識でテキスト化して日付ごとのMarkdown（MD）ファイルとしてローカル（端末内）に記録するライフログアプリ。
* **プラットフォーム:** PWA（Progressive Web App）
* **基本方針:** **完全ローカルファースト（完全オフライン対応）**
  * WebサーバーはHTML/CSS/JSなどの静的アセット配信用としてのみ利用。
  * ユーザーのログデータ、位置情報、画像などは一切サーバーへ送信せず、端末内の **IndexedDB** に保存する。

---

## 2. 機能要件

| No. | 機能 | 概要 | 使用技術 / API |
| :--- | :--- | :--- | :--- |
| 1 | **定期通知・タイマー** | 設定した時間間隔（例: 30分/1時間）でアラーム・通知を発行。 | Service Worker / Web Notifications API |
| 2 | **音声入力・録音** | 通知タップまたはボタン押下で一定時間録音・音声入力。 | MediaRecorder API |
| 3 | **音声テキスト変換** | 話した内容をリアルタイムでテキストに変換。 | Web Speech API (`webkitSpeechRecognition`) |
| 4 | **位置情報取得** | ログ記録時の現在地（緯度・経度）を取得（ON/OFF設定可能）。 | Geolocation API |
| 5 | **画像・ファイル添付** | ログに写真やファイルを添付し、IndexedDBへバイナリ保存。 | HTML File API / IndexedDB (Blob) |
| 6 | **Markdown自動追記** | 当日の日付（`YYYY-MM-DD`）のデータ末尾にタイムスタンプと共にログを追記。 | JavaScript (IndexedDBデータ更新) |
| 7 | **データ出力（エクスポート）** | 保存したMarkdownや添付画像をローカルに一括ダウンロード。 | JSZip / Blob API |

---

## 3. システムアーキテクチャ & 技術スタック

### 3.1 技術スタック
* **フロントエンド:** HTML5, CSS3, JavaScript (TypeScript推奨)
* **PWA化機能:** Web App Manifest, Service Worker
* **データベース:** IndexedDB
* **DBライブラリ:** Dexie.js（IndexedDB操作のラッパー）
* **データ圧縮/エクスポート:** JSZip

### 3.2 データフロー図

```text
[ ユーザー ]
   │  ① 通知タップ / 録音ボタン押下
   ▼
[ フロントエンド (PWA UI) ]
   ├─② 音声認識 (Web Speech API) ────┐
   ├─③ 位置情報取得 (Geolocation API) ├─► ④ JSON生成 & MD形式整形
   └─④ 画像取得 (File API) ──────────┘          │
                                                ▼
                                    [ IndexedDB (Dexie.js) ]
                                    ※スマホ内部のストレージに保存
```

---

## 4. データ構造設計

### 4.1 IndexedDB スキーマ（Dexie.js想定）

#### ① `logs` テーブル (日付単位のMarkdownデータ)

```typescript
interface DayLog {
  date: string;          // 主キー (例: "2026-07-25")
  markdown: string;      // Markdown形式のテキストデータ全体
  updatedAt: string;     // 最終更新日時
}

```

#### ② `attachments` テーブル (画像・ファイルのバイナリデータ)

```typescript
interface Attachment {
  id?: number;           // 自動インクリメントID
  date: string;          // 紐づく日付 (例: "2026-07-25")
  filename: string;      // ファイル名 (例: "img_170045.jpg")
  mimeType: string;      // 例: "image/jpeg"
  data: Blob;            // ファイルの実体データ (Blob)
}

```

### 4.2 生成されるMarkdown（MD）フォーマット例

```markdown
# 2026-07-25 ライフログ

## ログ記録
- **内容:** リビングで部屋の片付けとプロジェクトの計画書作成。
- **位置情報:** [Google Mapsで確認](https://maps.google.com/?q=35.68123,139.76712)
- **添付画像:** 
  ![img_170045.jpg](attachment:img_170045.jpg)

---

## ログ記録
- **内容:** 夕食の買い物に出かける準備。
- **位置情報:** 設定OFF

---

```

---

## 5. 主要機能の実装アプローチ

### 5.1 定期タイマー & 通知

* OS側のバックグラウンド処理の制限に対応するため、**「タイマー時間到来 ➔ 通知発行 ➔ ユーザーが通知をタップ ➔ アプリ起動・録音開始」** のフローを採用。
* `Notification.requestPermission()` で事前に通知を許可。

### 5.2 音声認識（Speech-to-Text）

* ブラウザ標準の `webkitSpeechRecognition` を利用。
* 認識言語を `ja-JP`（日本語）に設定し、発話完了（`onresult`）イベント発生時にテキストを取得してフォームに仮セットする。

### 5.3 位置情報の付与

* 設定画面で `locationEnabled: true` の場合のみ `navigator.geolocation.getCurrentPosition()` を実行。
* 緯度・経度を取得し、`https://maps.google.com/?q={latitude},{longitude}` のURLを生成してMDの末尾に追記。

### 5.4 画像・ファイル保存

* `input type="file"` から画像を取得後、IndexedDBに `Blob` として保存。
* アプリ表示時は `URL.createObjectURL(blob)` で一時URLを生成して表示。
* エクスポート時は `JSZip` を使い、`YYYY-MM-DD.md` と `attachments/` フォルダをまとめてZIP化してダウンロード。

---

## 6. PWA / OS制約事項と解決策

| 課題・制限 | 対策・設計 |
| --- | --- |
| **自動録音の禁止** | ブラウザのセキュリティ仕様上、バックグラウンドでのマイク自動起動は不可。**必ずユーザーのタップ操作をトリガー**としてマイクを起動する設計とする。 |
| **OSによるIndexedDBデータ削除** | ストレージ容量圧迫時にOSからデータを消去されないよう、`navigator.storage.persist()` を呼び出して「永続ストレージ（Persistent Storage）」権限を要求する。 |
| **バックグラウンドタイマーの停止** | ブラウザのタブが非アクティブ時に `setInterval` が遅延するため、Service Worker経由で管理するか、アプリ再開時に現在時刻と前回記録時間の差分を判定してアラートを出す。 |

---

## 7. 開発ロードマップ

* [ ] **Phase 1: プロトタイプ構築**
* PWA基本ファイル作成 (`manifest.json`, `sw.js`)
* Dexie.js を用いた IndexedDB の読み書き基本処理実装


* [ ] **Phase 2: コア機能実装**
* Web Speech API による音声入力の実装
* 日付別 Markdown 自動生成・追記ロジックの実装


* [ ] **Phase 3: 付加機能実装**
* Geolocation API による位置情報取得＆リンク化
* 画像ファイルの添付・IndexedDB Blob保存・プレビュー実装


* [ ] **Phase 4: PWA機能強化・UI調整**
* Web Notification によるタイマー通知の実装
* ZIP形式でのデータエクスポート（バックアップ）機能の実装



```

```
