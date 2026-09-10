import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { MAX_FILE_SIZE_MB, ACCEPTED_MIME_TYPES } from '../../types/landownerDocuments';

export interface PickedFile {
  file: File;
  previewUrl: string;
  error?: string;
}

interface Props {
  multiple?: boolean;
  label?: string;
  onFilesReady: (files: PickedFile[]) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const FileUploadPicker: React.FC<Props> = ({
  multiple = true,
  label = 'Select from Files',
  onFilesReady
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const processRaw = (rawFiles: File[]) => {
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    const result: PickedFile[] = rawFiles.map(file => {
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        return { file, previewUrl: '', error: `Unsupported format "${file.type}". Use PDF, JPG, or PNG.` };
      }
      if (file.size > maxBytes) {
        return { file, previewUrl: '', error: `File is ${formatBytes(file.size)} — exceeds ${MAX_FILE_SIZE_MB} MB limit.` };
      }
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';
      return { file, previewUrl };
    });
    setPicked(result);
    onFilesReady(result.filter(f => !f.error));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processRaw(Array.from(e.target.files));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) processRaw(Array.from(e.dataTransfer.files));
  };

  const removeFile = (idx: number) => {
    const next = picked.filter((_, i) => i !== idx);
    setPicked(next);
    if (inputRef.current) inputRef.current.value = '';
    onFilesReady(next.filter(f => !f.error));
  };

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Drop zone / click to browse */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? '#461300' : '#cbd5e1'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '36px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragOver ? '#fff7ed' : '#fafafa',
          transition: 'all 0.2s ease',
          marginBottom: picked.length > 0 ? '16px' : '0',
          outline: 'none'
        }}
      >
        <Upload size={30} color={isDragOver ? '#461300' : '#94a3b8'} style={{ marginBottom: '12px' }} />
        <div style={{ fontSize: '14px', fontWeight: 700, color: isDragOver ? '#461300' : 'var(--on-surface)', marginBottom: '4px' }}>
          📁 {label}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>
          PDF · JPG · JPEG · PNG — Max {MAX_FILE_SIZE_MB} MB per file
        </div>
        <div style={{ fontSize: '11px', color: 'var(--outline)' }}>
          Click to browse files, or drag & drop here
        </div>
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        aria-label="Upload document file"
      />

      {/* File list */}
      {picked.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {picked.map((pf, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: `1px solid ${pf.error ? '#fecaca' : '#e2e8f0'}`,
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                backgroundColor: pf.error ? '#fef2f2' : '#ffffff'
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#f1f5f9',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {pf.previewUrl ? (
                  <img
                    src={pf.previewUrl}
                    alt="preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : pf.error ? (
                  <AlertTriangle size={20} color="#ef4444" />
                ) : (
                  <FileText size={20} color="#461300" />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--on-surface)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {pf.file.name}
                </div>
                {pf.error ? (
                  <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '2px' }}>{pf.error}</div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                    {pf.file.type} · {formatBytes(pf.file.size)}
                  </div>
                )}
              </div>

              {/* Remove */}
              <button
                onClick={e => { e.stopPropagation(); removeFile(idx); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Remove"
                aria-label="Remove file"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
