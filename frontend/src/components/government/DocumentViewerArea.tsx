import React, { useState } from 'react';
import { 
  ZoomIn, ZoomOut, Maximize2, Minimize2, ChevronLeft, ChevronRight, 
  Plus, FileText, Download, RotateCcw, Check, Sparkles, Layers
} from 'lucide-react';
import type { VerificationDocument, DocumentPage } from '../../types/governmentVerification';

interface DocumentViewerAreaProps {
  document: VerificationDocument;
  documentIndex: number;
  totalDocuments: number;
  onAddPage: (docId: string, newPage: DocumentPage) => void;
  onPrevDoc?: () => void;
  onNextDoc?: () => void;
}

export const DocumentViewerArea: React.FC<DocumentViewerAreaProps> = ({
  document,
  documentIndex,
  totalDocuments,
  onAddPage,
  onPrevDoc,
  onNextDoc
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const pages = document.pages || [];
  const totalPages = pages.length;
  const currentPage = pages[currentPageIndex] || {
    pageNumber: 1,
    title: 'Page Content',
    contentHeading: 'Official Government Document Page'
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 20, 60));
  const handleResetZoom = () => setZoomLevel(100);

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleAddNewPage = () => {
    const nextNum = totalPages + 1;
    const newPage: DocumentPage = {
      pageNumber: nextNum,
      title: `Supplementary Verification Annexure - Page ${nextNum}`,
      contentHeading: `Official Statutory Annexure ${nextNum} under RFCTLARR Act Section 11`,
      khasraNumbers: [`${100 + nextNum}/A`, `${100 + nextNum}/B`],
      areaHa: Number((Math.random() * 5 + 1).toFixed(2)),
      officialRef: `ANNEX-GOV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: `Supplementary page added during official Government verification review by Authority officer on ${new Date().toLocaleDateString()}.`,
      addedAt: new Date().toLocaleString()
    };
    onAddPage(document.id, newPage);
    setCurrentPageIndex(nextNum - 1); // Jump to new page
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--surface-container-lowest)',
      border: '1px solid var(--outline-variant)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      {/* ---------------- DOCUMENT TOP TOOLBAR ---------------- */}
      <div style={{
        backgroundColor: '#0a2540',
        color: '#ffffff',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#9ef6b6" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              {document.title}
            </h3>
            <span style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600
            }}>
              Doc {documentIndex + 1} of {totalDocuments}
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#b0c8eb', margin: '2px 0 0 0' }}>
            Type: {document.type} | Uploaded: {document.uploadedDate}
          </p>
        </div>

        {/* Center Page Navigator & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handlePrevPage}
            disabled={currentPageIndex === 0}
            style={{
              backgroundColor: currentPageIndex === 0 ? 'rgba(255,255,255,0.1)' : '#ffffff',
              color: currentPageIndex === 0 ? '#94a3b8' : '#0a2540',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: currentPageIndex === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ChevronLeft size={14} /> Previous
          </button>

          <span style={{ fontSize: '13px', fontWeight: 700, padding: '0 6px', color: '#ffffff' }}>
            Page {currentPageIndex + 1} of {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPageIndex === totalPages - 1}
            style={{
              backgroundColor: currentPageIndex === totalPages - 1 ? 'rgba(255,255,255,0.1)' : '#ffffff',
              color: currentPageIndex === totalPages - 1 ? '#94a3b8' : '#0a2540',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              cursor: currentPageIndex === totalPages - 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>

        {/* Right Tools (Zoom, Add Page, Download) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderRadius: '4px',
            padding: '2px'
          }}>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
            >
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '0 6px', minWidth: '40px', textAlign: 'center' }}>
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom"
              style={{ background: 'transparent', border: 'none', color: '#b0c8eb', cursor: 'pointer', padding: '4px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <button
            onClick={handleAddNewPage}
            title="Add Page to Document"
            style={{
              backgroundColor: '#0a6d3a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} /> + Add Page
          </button>
        </div>
      </div>

      {/* ---------------- MAIN VIEWER CONTENT AREA (THUMBNAILS + CANVAS) ---------------- */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#e2e8f0',
        position: 'relative'
      }}>
        {/* Left Page Thumbnail Navigation Panel */}
        <div style={{
          width: '150px',
          backgroundColor: '#f8fafc',
          borderRight: '1px solid #cbd5e1',
          padding: '12px 8px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
            Pages ({totalPages})
          </div>

          {pages.map((p, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentPageIndex(idx)}
              style={{
                border: idx === currentPageIndex ? '2px solid #0a2540' : '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '8px',
                backgroundColor: idx === currentPageIndex ? '#ffffff' : '#f1f5f9',
                cursor: 'pointer',
                boxShadow: idx === currentPageIndex ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: idx === currentPageIndex ? '#0a2540' : '#475569' }}>
                  Page {p.pageNumber}
                </span>
                {idx === currentPageIndex && <Check size={12} color="#0a2540" />}
              </div>
              <div style={{
                height: '50px',
                backgroundColor: '#ffffff',
                border: '1px dashed #94a3b8',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                fontSize: '9px',
                color: '#64748b',
                textAlign: 'center',
                overflow: 'hidden'
              }}>
                {p.title.slice(0, 20)}...
              </div>
            </div>
          ))}

          <button
            onClick={handleAddNewPage}
            style={{
              marginTop: '8px',
              padding: '6px',
              backgroundColor: '#e2e8f0',
              border: '1px dashed #94a3b8',
              borderRadius: '4px',
              color: '#334155',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Plus size={12} /> Add Page
          </button>
        </div>

        {/* Center Document Canvas Viewer */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
          <div style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
            backgroundColor: '#ffffff',
            width: '100%',
            maxWidth: '750px',
            minHeight: '920px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            borderRadius: '2px',
            padding: '40px 48px',
            position: 'relative',
            border: '1px solid #cbd5e1'
          }}>
            {/* Watermark */}
            <div style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-30deg)',
              fontSize: '48px',
              fontWeight: 900,
              color: 'rgba(10, 37, 64, 0.04)',
              pointerEvents: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
              textAlign: 'center'
            }}>
              GOVT OF MAHARASHTRA<br />OFFICIAL STATUTORY RECORD
            </div>

            {/* Official Header Header Stamp */}
            <div style={{
              textAlign: 'center',
              borderBottom: '2px solid #0a2540',
              paddingBottom: '16px',
              marginBottom: '24px'
            }}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                alt="Emblem of India"
                style={{ height: '56px', marginBottom: '8px' }}
              />
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0a2540', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                GOVERNMENT OF MAHARASHTRA — REVENUE & LAND RECORDS DEPARTMENT
              </div>
              <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 600, marginTop: '2px' }}>
                NATIONAL LAND ACQUISITION & MANAGEMENT SYSTEM (RFCTLARR ACT 2013)
              </div>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700, marginTop: '4px' }}>
                STATUTORY VERIFICATION COPY | DOCUMENT REF: {currentPage.officialRef || document.id}
              </div>
            </div>

            {/* Document Content Details */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0a2540', backgroundColor: '#e0f2fe', padding: '4px 10px', borderRadius: '4px' }}>
                  {document.title} — PAGE {currentPage.pageNumber} OF {totalPages}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                  Date: {document.uploadedDate}
                </span>
              </div>

              <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#0a2540', margin: '0 0 8px 0', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                {currentPage.title}
              </h4>
              <p style={{ fontSize: '13px', color: '#334155', fontWeight: 600, margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                {currentPage.contentHeading}
              </p>
            </div>

            {/* Structured Table Preview */}
            <div style={{ marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0a2540', color: '#ffffff' }}>
                    <th style={{ padding: '8px 12px', border: '1px solid #0a2540' }}>Parameter</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #0a2540' }}>Statutory Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 700, backgroundColor: '#f8fafc' }}>Document Name</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{document.title}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 700, backgroundColor: '#f8fafc' }}>Affected Khasra / Survey Nos.</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                      {currentPage.khasraNumbers ? currentPage.khasraNumbers.join(', ') : 'Khasra 101/1, 101/2, 102/A, 103, 104'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 700, backgroundColor: '#f8fafc' }}>Land Area Assessed</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                      {currentPage.areaHa || 14.5} Hectares
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 700, backgroundColor: '#f8fafc' }}>Official Reference ID</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}>
                      {currentPage.officialRef || 'REF-MH-PUNE-2026-001'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mock Narrative Body */}
            <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#334155', marginBottom: '32px' }}>
              <p>
                <strong>CERTIFICATE OF REVENUE VERIFICATION:</strong> It is hereby certified that the land parcels specified in this sheet under 
                Mouza Hinjawadi and Mouza Maan have been duly surveyed, verified, and mapped according to the cadastral records of the Revenue Department.
              </p>
              {currentPage.notes && (
                <div style={{ backgroundColor: '#fffbebfb', border: '1px solid #fef3c7', padding: '10px 14px', borderRadius: '4px', fontSize: '12px', color: '#92400e', marginBottom: '12px' }}>
                  <strong>Officer Verification Notes:</strong> {currentPage.notes}
                </div>
              )}
              <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                * This electronic document is cryptographically hashed and indexed in the BhoomiSetu Sovereign Audit Ledger.
              </p>
            </div>

            {/* Official Signature Footer */}
            <div style={{
              marginTop: '40px',
              paddingTop: '20px',
              borderTop: '2px dashed #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              fontSize: '11px'
            }}>
              <div>
                <div style={{ border: '1px solid #0a2540', padding: '6px 12px', borderRadius: '4px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                  <span style={{ fontWeight: 700, color: '#0a2540' }}>VERIFICATION QR SEAL</span><br />
                  <span style={{ fontSize: '9px', color: '#64748b' }}>BHOOMI-SETU-GOV-2026</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '16px', fontWeight: 'bold', color: '#0a2540', marginBottom: '4px' }}>
                  Dr. Rajesh Sharma, IAS
                </div>
                <div style={{ fontWeight: 700, color: '#0a2540' }}>Competent Authority Land Acquisition (CALA)</div>
                <div style={{ color: '#475569' }}>District Collector & District Magistrate, Pune</div>
              </div>
            </div>

            {/* Page Footer */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '48px',
              right: '48px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#94a3b8',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '6px'
            }}>
              <span>Page {currentPage.pageNumber} of {totalPages}</span>
              <span>BhoomiSetu Government Verification Portal</span>
              <span>Confidential / Official Use Only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
