import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, Play, Square } from 'lucide-react';
import { NotificationService } from '../services/notification';

interface TimerCardProps {
  onTriggerRecord?: () => void;
}

export const TimerCard: React.FC<TimerCardProps> = ({ onTriggerRecord }) => {
  const [intervalMinutes, setIntervalMinutes] = useState<number>(30);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(30 * 60);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (NotificationService.isSupported()) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestNotification = async () => {
    const perm = await NotificationService.requestPermission();
    setNotificationPermission(perm);
  };

  const startTimer = () => {
    setIsRunning(true);
    setTimeLeftSeconds(intervalMinutes * 60);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            // Notification trigger
            NotificationService.sendNotification(
              '🍅 Tomato Log ログ時間です！',
              `設定された${intervalMinutes}分が経過しました。タップして近況を録音しましょう。`
            );
            if (onTriggerRecord) {
              onTriggerRecord();
            }
            return intervalMinutes * 60; // reset
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, intervalMinutes, onTriggerRecord]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 56, 92, 0.15)', color: 'var(--primary)' }}>
            <Clock size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>定期タイマー & アラーム通知</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>一定時間ごとにリマインダー通知を送信</p>
          </div>
        </div>

        {notificationPermission !== 'granted' && (
          <button
            onClick={handleRequestNotification}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', gap: '0.4rem' }}
          >
            <Bell size={14} /> 通知を許可する
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>通知間隔:</label>
          {[1, 15, 30, 60].map((mins) => (
            <button
              key={mins}
              disabled={isRunning}
              onClick={() => {
                setIntervalMinutes(mins);
                setTimeLeftSeconds(mins * 60);
              }}
              style={{
                padding: '0.35rem 0.7rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: intervalMinutes === mins ? 'var(--primary)' : 'var(--border-color)',
                background: intervalMinutes === mins ? 'var(--primary-glow)' : 'transparent',
                color: intervalMinutes === mins ? '#fff' : 'var(--text-muted)',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'var(--transition-fast)'
              }}
            >
              {mins === 1 ? '1分(テスト)' : `${mins}分`}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {isRunning && (
            <div style={{ fontFamily: 'var(--font-code)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>
              {formatTime(timeLeftSeconds)}
            </div>
          )}

          {isRunning ? (
            <button onClick={stopTimer} className="btn btn-danger" style={{ gap: '0.4rem' }}>
              <Square size={16} /> タイマー停止
            </button>
          ) : (
            <button onClick={startTimer} className="btn btn-primary" style={{ gap: '0.4rem' }}>
              <Play size={16} /> タイマー開始
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
