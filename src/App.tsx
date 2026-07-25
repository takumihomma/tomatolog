import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TimerCard } from './components/TimerCard';
import { VoiceRecorder } from './components/VoiceRecorder';
import { AttachmentManager } from './components/AttachmentManager';
import { LogList } from './components/LogList';
import { ExportModal } from './components/ExportModal';

import { StorageService } from './services/storage';
import { ExportService } from './services/export';
import type { DayLog } from './domain/log';
import type { Attachment } from './domain/attachment';

export const App: React.FC = () => {
  const [isPersisted, setIsPersisted] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [allLogs, setAllLogs] = useState<DayLog[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Export Modal State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportPercent, setExportPercent] = useState<number>(0);
  const [exportMessage, setExportMessage] = useState<string>('');

  // Check persistent storage status on mount
  useEffect(() => {
    StorageService.requestPersistentStorage().then((persisted) => {
      setIsPersisted(persisted);
    });
  }, []);

  // Fetch DayLogs and Attachments
  const refreshData = useCallback(async () => {
    const logs = await StorageService.getAllDayLogs();
    setAllLogs(logs);

    const atts = await StorageService.getAttachmentsForDate(selectedDate);
    setAttachments(atts);
  }, [selectedDate]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleRequestPersist = async () => {
    const res = await StorageService.requestPersistentStorage();
    setIsPersisted(res);
    if (res) {
      alert('データストレージの永続化が有効になりました！');
    } else {
      alert('ストレージ永続化のリクエストは許可されませんでした（ブラウザの設定をご確認ください）。');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportPercent(0);
    setExportMessage('準備中...');

    try {
      await ExportService.exportAllDataAsZip((percent, msg) => {
        setExportPercent(percent);
        setExportMessage(msg);
      });
    } catch (err: any) {
      alert(`エクスポートエラー: ${err.message || err}`);
      setIsExporting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Bar Header */}
      <Header
        isPersisted={isPersisted}
        onExport={handleExport}
        onRequestPersist={handleRequestPersist}
      />

      {/* Interval Alarm / Notification Timer */}
      <TimerCard />

      {/* Voice / Text Log Input Box */}
      <VoiceRecorder
        currentDate={selectedDate}
        onLogUpdated={refreshData}
      />

      {/* Attachments Preview Gallery */}
      <AttachmentManager
        attachments={attachments}
        onAttachmentDeleted={refreshData}
      />

      {/* Markdown Log List & Editor */}
      <LogList
        logs={allLogs}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onRefresh={refreshData}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExporting}
        percent={exportPercent}
        message={exportMessage}
        onClose={() => setIsExporting(false)}
      />
    </div>
  );
};

export default App;
