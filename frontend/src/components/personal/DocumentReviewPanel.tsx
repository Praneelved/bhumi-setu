import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, CheckCircle2, FileText } from 'lucide-react';
import type { DocumentPage } from '../../types/landownerDocuments';

interface Props {
  documentTypeLabel: string;
  pages: DocumentPage[];
  onBack: () => void;
  onSubmit: () => void;
}

export const DocumentReviewPanel: React.FC<Props> = ({
  documentTypeLabel,
  pages,
  onBack,
  onSubmit
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const page = pages[selectedIdx] ?? pages[0];
  const isImage = page &&
    (page.source === 'CAMERA' ||
      (page.fileType?.startsWith('image/') && !!page.previewUrl));

  const zoomIn = () => setZoom(z => Math.min(z + 25, 250));
  const zoomOut = () => setZoom(z => Math.max(z - 25, 50));
  const rotate = () => setRotation(r => (r + 90) % 360);

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Step header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#461300', margin: '0 0 6px 0' }}>
          Step 3: Review Document
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', margin: 0 }}>
          Review all pages before submitting for government verification.
        </p>
      </div>

      {/* Summary card */}
      <div style={{
        backgroundColor: '#fff7ed',
        border: '1px solid #ffedd5',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#9a3412', fontWeight: 700, textTransform: 'uppercase' }}>Document Type</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#461300' }}>{documentTypeLabel}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#9a3412', fontWeight: 700, textTransform: 'uppercase' }}>Total Pages</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#461300' }}>{pages.length}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#9a3412', fontWeight: 700, textTransform: 'uppercase' }}>Status</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={16} /> Ready to Submit
          </div>
        </div>
      </div>

      {/* Viewer layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(100px, 130px) 1fr',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Page thumbnails sidebar */}
        <div>
          <div style={{
            fontSize: '11px', fontWeight: 700, color: 'var(--outline)',
            textTransform: 'uppercase', marginBottom: '8px'
          }}>
            Pages
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pages.map((p, idx) => {
              const isSelected = idx === selectedIdx;
              const thumb = p.source === 'CAMERA' || (p.fileType?.startsWith('image/') && p.previewUrl);
              return (
                <div
                  key={p.id}
                  onClick={() => { setSelectedIdx(idx); setZoom(100); setRotation(0); }}
                  style={{
                    border: `2px solid ${isSelected ? '#461300' : 'var(--outline-variant)'}`,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: '#f1f5f9',
                    position: 'relative',
                    height: '72px'
                  }}
                >
                  {thumb ? (
                    <img
                      src={p.previewUrl}
                      alt={`Page ${p.pageNumber}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <FileText size={20} color="#461300" />
                      <span style={{ fontSize: '9px', color: '#461300', fontWeight: 700 }}>PDF</span>
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    backgroundColor: isSelected ? 'rgba(70,19,0,0.9)' : 'rgba(0,0,0,0.5)',
                    color: '#ffffff', fontSize: '10px', fontWeight: 700,
                    padding: '2px 6px', textAlign: 'center'
                  }}>
                    Pg {p.pageNumber} ✓
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main viewer */}
        <div>
          {/* Controls */}
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '10px',
            backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)',
            padding: '8px 12px', flexWrap: 'wrap', alignItems: 'center'
          }}>
            <button onClick={zoomIn} style={ctrlBtn} title="Zoom in"><ZoomIn size={16} /></button>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#461300', minWidth: '40px', textAlign: 'center' }}>{zoom}%</span>
            <button onClick={zoomOut} style={ctrlBtn} title="Zoom out"><ZoomOut size={16} /></button>
            <button onClick={rotate} style={ctrlBtn} title="Rotate 90°"><RotateCw size={16} /></button>
            <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginLeft: '8px' }}>
              Page {selectedIdx + 1} of {pages.length}
            </span>
          </div>

          {/* Image / PDF display */}
          <div style={{
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#1a1a1a',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '280px',
            maxHeight: '420px'
          }}>
            {page && isImage ? (
              <img
                src={page.previewUrl}
                alt={`Page ${page.pageNumber}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '420px',
                  objectFit: 'contain',
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease'
                }}
              />
            ) : page ? (
              <div style={{ textAlign: 'center', color: '#ffffff', padding: '40px 24px' }}>
                <FileText size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{page.fileName}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                  PDF file — preview not available inline
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={backBtn}>← Back to Upload</button>
        <button onClick={onSubmit} style={submitBtn}>
          Submit for Verification ✓
        </button>
      </div>
    </div>
  );
};

const ctrlBtn: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid var(--outline-variant)',
  borderRadius: '4px',
  padding: '5px 8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--on-surface)'
};

const backBtn: React.CSSProperties = {
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

const submitBtn: React.CSSProperties = {
  backgroundColor: '#461300',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '12px 28px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'Arial, Helvetica, sans-serif',
  boxShadow: '0 4px 12px rgba(70,19,0,0.25)'
};
