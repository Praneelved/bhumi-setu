import React, { useState } from 'react';
import { Camera, FileUp, X } from 'lucide-react';
import type { DocumentPage } from '../../types/landownerDocuments';
import { CameraCapture } from './CameraCapture';
import { FileUploadPicker } from './FileUploadPicker';

interface Props {
  documentTypeLabel: string;
  pages: DocumentPage[];
  onPagesChange: (pages: DocumentPage[]) => void;
  onNext: () => void;
  onBack: () => void;
}

type UploadMode = 'none' | 'camera' | 'file';

export const DocumentPageManager: React.FC<Props> = ({
  documentTypeLabel,
  pages,
  onPagesChange,
  onNext,
  onBack
}) => {
  const [mode, setMode] = useState<UploadMode>('none');

  const addPage = (previewUrl: string, source: 'CAMERA' | 'FILE', file?: File) => {
    const newPage: DocumentPage = {
      id: `PAGE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pageNumber: pages.length + 1,
      source,
      previewUrl,
      fileName: file?.name || `page_${pages.length + 1}.jpg`,
      fileSize: file?.size,
      fileType: file?.type || 'image/jpeg'
    };
    onPagesChange([...pages, newPage]);
    setMode('none');
  };

  const removePage = (id: string) => {
    const updated = pages
      .filter(p => p.id !== id)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    onPagesChange(updated);
  };

  const isImage = (page: DocumentPage) =>
    page.source === 'CAMERA' ||
    (page.fileType?.startsWith('image/') && !!page.previewUrl);

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Step header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#461300', margin: '0 0 6px 0' }}>
          Step 2: Capture / Upload Pages
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', margin: 0 }}>
          Document: <strong style={{ color: '#461300' }}>{documentTypeLabel}</strong> — Add one or more pages.
        </p>
      </div>

      {/* Assembled pages list */}
      {pages.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '12px', fontWeight: 700, color: 'var(--outline)',
            textTransform: 'uppercase', marginBottom: '10px'
          }}>
            Added Pages ({pages.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pages.map(page => (
              <div key={page.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid var(--outline-variant)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                backgroundColor: '#ffffff'
              }}>
                {/* Thumbnail */}
                <div style={{
                  width: '48px', height: '48px',
                  borderRadius: '4px', overflow: 'hidden',
                  backgroundColor: '#f1f5f9', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isImage(page) ? (
                    <img
                      src={page.previewUrl}
                      alt={`Page ${page.pageNumber}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#461300' }}>PDF</span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Page {page.pageNumber}
                    <span style={{
                      fontSize: '10px', fontWeight: 700,
                      backgroundColor: page.source === 'CAMERA' ? '#e0f2fe' : '#f0fdf4',
                      color: page.source === 'CAMERA' ? '#0369a1' : '#166534',
                      border: `1px solid ${page.source === 'CAMERA' ? '#7dd3fc' : '#86efac'}`,
                      padding: '1px 6px', borderRadius: '4px'
                    }}>
                      {page.source === 'CAMERA' ? '📷 Camera' : '📁 File'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                    {page.fileName}
                    {page.fileSize ? ` · ${(page.fileSize / 1024).toFixed(0)} KB` : ''}
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removePage(page.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', display: 'flex' }}
                  title="Remove page"
                  aria-label={`Remove page ${page.pageNumber}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload source selector */}
      {mode === 'none' && (
        <div style={{
          border: '2px dashed var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          textAlign: 'center',
          marginBottom: '24px',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '6px' }}>
            {pages.length === 0 ? 'Add First Page' : '+ Add Another Page'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '18px' }}>
            Use your camera to photograph the document, or select an existing file
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setMode('camera')}
              style={uploadChoiceBtnStyle('#0a2540')}
            >
              <Camera size={18} /> 📷 Capture Using Camera
            </button>
            <button
              onClick={() => setMode('file')}
              style={uploadChoiceBtnStyle('#461300')}
            >
              <FileUp size={18} /> 📁 Select from Files
            </button>
          </div>
        </div>
      )}

      {/* Camera mode */}
      {mode === 'camera' && (
        <div style={{ marginBottom: '24px' }}>
          <CameraCapture
            onCapture={dataUrl => addPage(dataUrl, 'CAMERA')}
            onClose={() => setMode('none')}
          />
        </div>
      )}

      {/* File mode */}
      {mode === 'file' && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#461300' }}>
              Select File(s)
            </span>
            <button
              onClick={() => setMode('none')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
              aria-label="Close file picker"
            >
              <X size={18} />
            </button>
          </div>
          <FileUploadPicker
            multiple
            label="Select Document File(s)"
            onFilesReady={files => {
              if (files.length > 0) {
                // Add each selected file as a separate page
                const newPages = files.map((sf, i) => ({
                  id: `PAGE-${Date.now()}-${i}`,
                  pageNumber: pages.length + i + 1,
                  source: 'FILE' as const,
                  previewUrl: sf.previewUrl,
                  fileName: sf.file.name,
                  fileSize: sf.file.size,
                  fileType: sf.file.type
                }));
                onPagesChange([...pages, ...newPages]);
                setMode('none');
              }
            }}
          />
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={backBtnStyle}>← Back</button>
        <button
          onClick={onNext}
          disabled={pages.length === 0}
          style={{
            backgroundColor: pages.length > 0 ? '#461300' : '#e2e8f0',
            color: pages.length > 0 ? '#ffffff' : '#94a3b8',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '11px 24px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: pages.length > 0 ? 'pointer' : 'not-allowed',
            fontFamily: 'Arial, Helvetica, sans-serif'
          }}
        >
          Review ({pages.length} {pages.length === 1 ? 'page' : 'pages'}) →
        </button>
      </div>
    </div>
  );
};

const uploadChoiceBtnStyle = (bg: string): React.CSSProperties => ({
  backgroundColor: bg,
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '12px 22px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  minWidth: '200px',
  justifyContent: 'center'
});

const backBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#461300',
  border: '1px solid #461300',
  borderRadius: 'var(--radius-md)',
  padding: '11px 20px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'Arial, Helvetica, sans-serif'
};
