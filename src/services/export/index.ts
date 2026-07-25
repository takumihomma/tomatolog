import JSZip from 'jszip';
import { StorageService } from '../storage';

export class ExportService {
  /**
   * 保存されているすべてのログと添付ファイルをまとめて ZIP ダウンロード
   */
  static async exportAllDataAsZip(onProgress?: (percent: number, message: string) => void): Promise<void> {
    onProgress?.(10, 'データを読み込み中...');
    const zip = new JSZip();

    const logs = await StorageService.getAllDayLogs();
    const attachments = await StorageService.getAllAttachments();

    onProgress?.(30, 'Markdown ログを追加中...');
    // Create 'logs' directory or put directly at root
    const logsFolder = zip.folder('logs');
    if (logs.length === 0) {
      zip.file('README.txt', '保存されたライフログはありません。');
    } else {
      logs.forEach((log) => {
        // 例: logs/2026-07-25.md
        if (logsFolder) {
          logsFolder.file(`${log.date}.md`, log.markdown);
        } else {
          zip.file(`${log.date}.md`, log.markdown);
        }
      });
    }

    onProgress?.(60, '添付ファイルを追加中...');
    if (attachments.length > 0) {
      const attachFolder = zip.folder('attachments');
      attachments.forEach((att) => {
        if (attachFolder) {
          attachFolder.file(att.filename, att.data);
        }
      });
    }

    onProgress?.(80, 'ZIP アーカイブを生成中...');
    const blob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
      onProgress?.(80 + Math.round(metadata.percent * 0.2), `圧縮中: ${Math.round(metadata.percent)}%`);
    });

    onProgress?.(100, 'ダウンロード準備完了');

    // Trigger download
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `tomato_log_backup_${dateStr}.zip`;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
