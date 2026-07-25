import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  percent: number;
  message: string;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, percent, message, onClose }) => {
  if (!isOpen) return null;

  const isDone = percent >= 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem'
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: 'var(--radius-full)',
            background: isDone ? 'rgba(0, 230, 118, 0.15)' : 'var(--primary-glow)',
            color: isDone ? 'var(--accent-green)' : 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isDone ? <CheckCircle size={32} /> : <Loader2 size={32} className="spin-animation" style={{ animation: 'spin 1.2s linear infinite' }} />}
        </div>

        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            {isDone ? 'バックアップ完了' : 'データエクスポート中...'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{message}</p>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${percent}%`,
              height: '100%',
              background: isDone ? 'var(--accent-green)' : 'linear-gradient(90deg, var(--primary) 0%, var(--accent-orange) 100%)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>

        {isDone && (
          <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            閉じる
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
