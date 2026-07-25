import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Trash2, Eye, FileText } from 'lucide-react';
import type { Attachment } from '../domain/attachment';
import { StorageService } from '../services/storage';

interface AttachmentManagerProps {
  attachments: Attachment[];
  onAttachmentDeleted: () => void;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({ attachments, onAttachmentDeleted }) => {
  const [blobUrls, setBlobUrls] = useState<Record<number, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const urls: Record<number, string> = {};
    attachments.forEach((att) => {
      if (att.id) {
        urls[att.id] = URL.createObjectURL(att.data);
      }
    });
    setBlobUrls(urls);

    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments]);

  const handleDelete = async (id: number) => {
    if (confirm('この添付ファイルを削除してもよろしいですか？')) {
      await StorageService.deleteAttachment(id);
      onAttachmentDeleted();
    }
  };

  if (attachments.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <ImageIcon size={18} color="var(--accent-blue)" /> 本日の添付ファイル ({attachments.length})
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
        {attachments.map((att) => {
          const url = att.id ? blobUrls[att.id] : null;
          const isImage = att.mimeType.startsWith('image/');

          return (
            <div
              key={att.id}
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: '1'
              }}
            >
              {isImage && url ? (
                <img
                  src={url}
                  alt={att.filename}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onClick={() => setPreviewUrl(url)}
                />
              ) : (
                <div style={{ padding: '0.5rem', textAlign: 'center' }}>
                  <FileText size={32} color="var(--text-muted)" />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {att.filename}
                  </p>
                </div>
              )}

              {/* Actions Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  cursor: 'pointer'
                }}
                className="hover-overlay"
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                {url && (
                  <button
                    onClick={() => setPreviewUrl(url)}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                  >
                    <Eye size={18} />
                  </button>
                )}
                {att.id && (
                  <button
                    onClick={() => handleDelete(att.id!)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Lightbox Preview */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
        >
          <img src={previewUrl} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 'var(--radius-md)' }} />
        </div>
      )}
    </div>
  );
};
