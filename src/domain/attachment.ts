export interface Attachment {
  id?: number;
  date: string;          // YYYY-MM-DD
  filename: string;      // 例: img_172183749.jpg
  mimeType: string;      // image/jpeg, image/png等
  data: Blob;            // Blob実体
  createdAt: string;     // ISO String
}
