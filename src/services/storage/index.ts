import { db } from './database';
import type { DayLog, LogEntry } from '../../domain/log';
import type { Attachment } from '../../domain/attachment';

export class StorageService {
  /**
   * OS等による自動データ消去を防ぐための永続化ストレージ要求
   */
  static async requestPersistentStorage(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return isPersisted;
    }
    return false;
  }

  /**
   * 指定日付の DayLog を取得
   */
  static async getDayLog(date: string): Promise<DayLog | undefined> {
    return await db.logs.get(date);
  }

  /**
   * すべての DayLog を取得（最新順）
   */
  static async getAllDayLogs(): Promise<DayLog[]> {
    return await db.logs.orderBy('date').reverse().toArray();
  }

  /**
   * DayLog を直接更新保存
   */
  static async saveDayLog(date: string, markdown: string): Promise<DayLog> {
    const updatedAt = new Date().toISOString();
    const dayLog: DayLog = { date, markdown, updatedAt };
    await db.logs.put(dayLog);
    return dayLog;
  }

  /**
   * 当日ログに新規エントリを追記
   */
  static async appendLogEntry(date: string, entry: LogEntry): Promise<DayLog> {
    const existingLog = await this.getDayLog(date);
    let currentMarkdown = existingLog ? existingLog.markdown.trim() : `# ${date} ライフログ\n`;

    const entryMd = this.formatEntryToMarkdown(entry);
    
    if (currentMarkdown.length > 0) {
      currentMarkdown += '\n\n' + entryMd;
    } else {
      currentMarkdown = `# ${date} ライフログ\n\n` + entryMd;
    }

    return await this.saveDayLog(date, currentMarkdown);
  }


  static formatEntryToMarkdown(entry: LogEntry): string {
    const lines: string[] = [];
    lines.push(`## ${entry.timestamp} ログ記録`);
    lines.push(`- **内容:** ${entry.content || '(音声・テキスト入力なし)'}`);

    if (entry.locationUrl) {
      lines.push(`- **位置情報:** [Google Mapsで確認](${entry.locationUrl})`);
    } else if (entry.locationName) {
      lines.push(`- **位置情報:** ${entry.locationName}`);
    }

    if (entry.attachments && entry.attachments.length > 0) {
      lines.push(`- **添付ファイル:**`);
      entry.attachments.forEach(filename => {
        lines.push(`  - ![${filename}](attachment:${filename})`);
      });
    }

    lines.push(`\n---`);
    return lines.join('\n');
  }

  /**
   * 添付ファイルの保存
   */
  static async saveAttachment(attachment: Omit<Attachment, 'id'>): Promise<number> {
    return await db.attachments.add(attachment as Attachment);
  }

  /**
   * 指定日付の添付ファイル一覧の取得
   */
  static async getAttachmentsForDate(date: string): Promise<Attachment[]> {
    return await db.attachments.where('date').equals(date).toArray();
  }

  /**
   * 全添付ファイルの取得
   */
  static async getAllAttachments(): Promise<Attachment[]> {
    return await db.attachments.toArray();
  }

  /**
   * 添付ファイルの削除
   */
  static async deleteAttachment(id: number): Promise<void> {
    await db.attachments.delete(id);
  }

  /**
   * ログ削除
   */
  static async deleteDayLog(date: string): Promise<void> {
    await db.transaction('rw', db.logs, db.attachments, async () => {
      await db.logs.delete(date);
      await db.attachments.where('date').equals(date).delete();
    });
  }
}
