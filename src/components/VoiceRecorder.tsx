import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, MapPin, Paperclip, Send, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { SpeechService } from '../services/speech';
import { GeoService, type LocationData } from '../services/geo';
import { StorageService } from '../services/storage';

interface VoiceRecorderProps {
  currentDate: string; // YYYY-MM-DD
  onLogUpdated: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ currentDate, onLogUpdated }) => {
  const [inputText, setInputText] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Position Location
  const [enableGeo, setEnableGeo] = useState<boolean>(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Attachments
  const [attachedFiles, setAttachedFiles] = useState<{ file: File; name: string; type: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const speechServiceRef = useRef<SpeechService | null>(null);

  useEffect(() => {
    speechServiceRef.current = new SpeechService();
  }, []);

  // Handle Geolocation fetch
  const handleToggleGeo = async (enabled: boolean) => {
    setEnableGeo(enabled);
    setGeoError(null);

    if (enabled) {
      setGeoLoading(true);
      try {
        const loc = await GeoService.getCurrentLocation();
        setLocationData(loc);
      } catch (err: any) {
        setGeoError(err.message || '位置情報の取得に失敗しました。');
        setEnableGeo(false);
      } finally {
        setGeoLoading(false);
      }
    } else {
      setLocationData(null);
    }
  };

  // Toggle Speech Recognition
  const toggleListening = () => {
    setSpeechError(null);
    if (!speechServiceRef.current) return;

    if (isListening) {
      speechServiceRef.current.stop();
      setIsListening(false);
    } else {
      const success = speechServiceRef.current.start({
        onStart: () => setIsListening(true),
        onResult: (text) => setInputText(text),
        onError: (err) => {
          setSpeechError(err);
          setIsListening(false);
        },
        onEnd: () => setIsListening(false)
      });
      if (!success) {
        setIsListening(false);
      }
    }
  };

  // File Upload Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files);
      const newItems = filesArr.map((f) => ({
        file: f,
        name: `img_${Date.now()}_${f.name}`,
        type: f.type
      }));
      setAttachedFiles((prev) => [...prev, ...newItems]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Log Entry
  const handleSaveEntry = async () => {
    if (!inputText.trim() && attachedFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      const savedAttachmentNames: string[] = [];

      // Save attachments into IndexedDB Blob
      for (const item of attachedFiles) {
        await StorageService.saveAttachment({
          date: currentDate,
          filename: item.name,
          mimeType: item.type,
          data: item.file,
          createdAt: new Date().toISOString()
        });
        savedAttachmentNames.push(item.name);
      }

      const now = new Date();
      const timestamp = now.toLocaleTimeString('ja-JP', { hour12: false });

      await StorageService.appendLogEntry(currentDate, {
        timestamp,
        content: inputText.trim(),
        locationUrl: locationData?.mapsUrl,
        locationName: locationData ? `緯度:${locationData.latitude.toFixed(4)}, 経度:${locationData.longitude.toFixed(4)}` : undefined,
        attachments: savedAttachmentNames
      });

      // Clear state
      setInputText('');
      setAttachedFiles([]);
      setEnableGeo(false);
      setLocationData(null);
      if (isListening && speechServiceRef.current) {
        speechServiceRef.current.stop();
      }

      onLogUpdated();
    } catch (err: any) {
      alert(`保存エラー: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🎙️ ログ新規記録</span>
        </h2>

        {/* Location Toggle */}
        <button
          onClick={() => handleToggleGeo(!enableGeo)}
          className={`badge ${enableGeo ? 'badge-active' : ''}`}
          style={{ cursor: 'pointer', padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
        >
          <MapPin size={14} />
          {geoLoading ? '位置情報取得中...' : enableGeo ? '現在地添付 ON' : '位置情報 OFF'}
        </button>
      </div>

      {geoError && (
        <div style={{ fontSize: '0.8rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertCircle size={14} /> {geoError}
        </div>
      )}

      {speechError && (
        <div style={{ fontSize: '0.8rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertCircle size={14} /> {speechError}
        </div>
      )}

      {/* Text Area & Voice Input */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="ここをタップしてテキスト入力、または下部のマイクボタンを押して発声してください..."
          rows={4}
          style={{
            width: '100%',
            padding: '1rem 1rem 3.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: `1px solid ${isListening ? 'var(--primary)' : 'var(--border-color)'}`,
            color: 'var(--text-main)',
            fontSize: '0.98rem',
            fontFamily: 'var(--font-body)',
            resize: 'vertical',
            outline: 'none',
            transition: 'var(--transition-normal)'
          }}
        />

        {/* Mic / File Attach Buttons Toolbar inside Textarea bottom */}
        <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', right: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label
              htmlFor="file-upload"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem', gap: '0.35rem', cursor: 'pointer' }}
              title="画像やファイルを添付"
            >
              <Paperclip size={15} /> 添付
            </label>
            <input id="file-upload" type="file" accept="image/*,.pdf" multiple onChange={handleFileChange} style={{ display: 'none' }} />

            {attachedFiles.length > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {attachedFiles.length}個のファイル
              </span>
            )}
          </div>

          <button
            onClick={toggleListening}
            className={`btn ${isListening ? 'pulse-recording' : 'btn-primary'}`}
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              gap: '0.4rem',
              background: isListening ? 'var(--primary)' : undefined
            }}
          >
            {isListening ? (
              <>
                <MicOff size={16} /> 録音中... (停止)
              </>
            ) : (
              <>
                <Mic size={16} /> 音声認識スタート
              </>
            )}
          </button>
        </div>
      </div>

      {/* Attachment Previews */}
      {attachedFiles.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {attachedFiles.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.6rem',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem'
              }}
            >
              <ImageIcon size={14} color="var(--accent-blue)" />
              <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.file.name}</span>
              <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => removeAttachment(idx)} />
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSaveEntry}
          disabled={isSubmitting || (!inputText.trim() && attachedFiles.length === 0)}
          className="btn btn-primary"
          style={{
            padding: '0.7rem 1.75rem',
            fontSize: '0.95rem',
            opacity: !inputText.trim() && attachedFiles.length === 0 ? 0.5 : 1
          }}
        >
          <Send size={18} /> {isSubmitting ? '保存中...' : 'Markdown にログ追加'}
        </button>
      </div>
    </div>
  );
};
