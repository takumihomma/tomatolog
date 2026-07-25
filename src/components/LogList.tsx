import React, { useState } from 'react';
import { FileText, Calendar, Edit3, Save, Trash2 } from 'lucide-react';
import type { DayLog } from '../domain/log';
import { StorageService } from '../services/storage';

interface LogListProps {
  logs: DayLog[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onRefresh: () => void;
}

export const LogList: React.FC<LogListProps> = ({
  logs,
  selectedDate,
  onSelectDate,
  onRefresh
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>('');

  const currentLog = logs.find((l) => l.date === selectedDate);

  const startEdit = () => {
    setEditContent(currentLog ? currentLog.markdown : `# ${selectedDate} ライフログ\n\n`);
    setIsEditing(true);
  };

  const saveEdit = async () => {
    await StorageService.saveDayLog(selectedDate, editContent);
    setIsEditing(false);
    onRefresh();
  };

  const handleDeleteLog = async (date: string) => {
    if (confirm(`${date} のログと関連添付ファイルをすべて削除しますか？`)) {
      await StorageService.deleteDayLog(date);
      onRefresh();
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>ログ履歴 & 編集</h2>
        </div>

        {/* Date Selector Dropdown or Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.88rem'
            }}
          />
        </div>
      </div>

      {/* Date Tabs (Recent dates) */}
      {logs.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
          {logs.slice(0, 7).map((log) => (
            <button
              key={log.date}
              onClick={() => onSelectDate(log.date)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: selectedDate === log.date ? 'var(--primary)' : 'var(--border-color)',
                background: selectedDate === log.date ? 'var(--primary-glow)' : 'var(--bg-glass)',
                color: selectedDate === log.date ? '#fff' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {log.date}
            </button>
          ))}
        </div>
      )}

      {/* Main Markdown View / Editor Container */}
      <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
            <FileText size={16} color="var(--primary)" /> {selectedDate}.md
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isEditing ? (
              <button onClick={saveEdit} className="btn btn-primary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem', gap: '0.35rem' }}>
                <Save size={14} /> 保存
              </button>
            ) : (
              <button onClick={startEdit} className="btn btn-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem', gap: '0.35rem' }}>
                <Edit3 size={14} /> Markdown 編集
              </button>
            )}

            {currentLog && (
              <button
                onClick={() => handleDeleteLog(selectedDate)}
                className="btn btn-danger"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
                title="この日付のログを削除"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={14}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-code)',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          ) : currentLog ? (
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'var(--font-code)',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                color: '#e2e8f0'
              }}
            >
              {currentLog.markdown}
            </pre>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.95rem' }}>{selectedDate} のログはまだ記録されていません。</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>上のフォームから音声またはテキストで記録を開始してください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
