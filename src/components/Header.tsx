import React from 'react';
import { Download, HardDrive, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  isPersisted: boolean;
  onExport: () => void;
  onRequestPersist: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPersisted,
  onExport,
  onRequestPersist
}) => {
  const todayStr = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  return (
    <header className="glass-panel header">
      <div className="logo-group">
        <img src="/favicon.svg" alt="Tomato Log Logo" className="logo-icon" />
        <div>
          <h1 className="app-title">Tomato Log</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{todayStr}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        {isPersisted ? (
          <span className="badge badge-active" title="ブラウザのストレージ永続化が有効です">
            <ShieldCheck size={14} /> 永続ストレージ
          </span>
        ) : (
          <button
            onClick={onRequestPersist}
            className="badge"
            style={{ cursor: 'pointer', background: 'rgba(255, 112, 67, 0.15)', color: 'var(--accent-orange)' }}
            title="クリックしてデータ保護の永続化を有効にする"
          >
            <HardDrive size={14} /> 保護を有効化
          </button>
        )}

        <button
          onClick={onExport}
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          title="すべてのログと添付画像をZIP形式でバックアップ"
        >
          <Download size={16} /> バックアップ
        </button>
      </div>
    </header>
  );
};
