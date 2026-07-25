export interface DayLog {
  date: string;          // 主キー (例: "2026-07-25")
  markdown: string;      // Markdown形式のテキストデータ全体
  updatedAt: string;     // ISO String 最終更新日時
}

export interface LogEntry {
  timestamp: string;      // HH:mm:ss
  content: string;        // 音声認識/入力テキスト
  locationUrl?: string;   // Google Maps等へのリンク
  locationName?: string;  // 緯度経度文字列
  attachments?: string[]; // 添付ファイル名一覧
}
