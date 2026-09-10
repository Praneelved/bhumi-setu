import React from 'react';
import { 
  CheckCircle2, AlertTriangle, ShieldCheck, MapPin, 
  FileText, Compass, ExternalLink, Calendar, Hash, User
} from 'lucide-react';
import type { VerificationDocument } from '../../types/governmentVerification';

interface SyntheticDocumentCanvasProps {
  document: VerificationDocument;
  selectedPageNumber?: number;
  onPageChange?: (page: number) => void;
}

export const SyntheticDocumentCanvas: React.FC<SyntheticDocumentCanvasProps> = ({
  document,
  selectedPageNumber = 1,
  onPageChange
}) => {
  const currentPage = document.pages?.find(p => p.pageNumber === selectedPageNumber) || document.pages?.[0];
  const isGisDoc = document.type === 'CADASTRAL_SURVEY_MAP' || document.id === 'DOC-004';

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      position: 'relative',
      fontFamily: 'Georgia, serif',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '600px'
    }}>
      {/* Top Controls Bar */}
      <div style={{
        backgroundColor: '#0a2540',
        color: '#ffffff',
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} color="#7dd3fc" />
          <span style={{ fontSize: '13px', fontWeight: 700 }}>
            {document.title} (Doc #{document.docNumber || '01'})
          </span>
          <span style={{
            fontSize: '10px',
            backgroundColor: '#1e3a8a',
            padding: '2px 6px',
            borderRadius: '4px',
            color: '#93c5fd',
            fontWeight: 600
          }}>
            v{document.version || 1}
          </span>
        </div>

        {/* Page Switcher */}
        {document.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Page:</span>
            {document.pages.map(p => (
              <button
                key={p.pageNumber}
                type="button"
                onClick={() => onPageChange && onPageChange(p.pageNumber)}
                style={{
                  padding: '2px 8px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid #3b82f6',
                  backgroundColor: p.pageNumber === selectedPageNumber ? '#38bdf8' : '#1e293b',
                  color: p.pageNumber === selectedPageNumber ? '#0f172a' : '#f8fafc'
                }}
              >
                {p.pageNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Watermark Banner */}
      <div style={{
        backgroundColor: isGisDoc ? '#eff6ff' : '#fef3c7',
        color: isGisDoc ? '#1e40af' : '#92400e',
        borderBottom: `1px dashed ${isGisDoc ? '#93c5fd' : '#fcd34d'}`,
        padding: '6px 16px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textAlign: 'center',
        textTransform: 'uppercase',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
      }}>
        <span>★ {isGisDoc ? 'DEMO GIS DOCUMENT — FOR SIH PROTOTYPE' : 'DEMO DOCUMENT — FOR SIH PROTOTYPE'} ★</span>
      </div>

      {/* Main Document Content Canvas */}
      <div style={{
        padding: '28px 36px',
        overflowY: 'auto',
        flex: 1,
        position: 'relative',
        backgroundColor: '#fafaf9'
      }}>
        {/* Subtle Diagonal Watermark Background */}
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-30deg)',
          fontSize: '42px',
          fontWeight: 900,
          color: 'rgba(0, 0, 0, 0.04)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          fontFamily: 'Arial, sans-serif'
        }}>
          {isGisDoc ? 'DEMO GIS DOCUMENT' : 'DEMO DOCUMENT — SIH PROTOTYPE'}
        </div>

        {/* ── DOCUMENT 1: Land Ownership Record ── */}
        {(document.type === 'LAND_OWNERSHIP' || document.id === 'DOC-001') && (
          <div style={{ border: '2px solid #334155', padding: '24px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0a2540', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', letterSpacing: '0.1em', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Government of Demo State • Department of Land Revenue
              </div>
              <h2 style={{ fontSize: '20px', color: '#0a2540', margin: '6px 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Certificate of Absolute Land Ownership &amp; Possession Sanad
              </h2>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Under Section 103 of Land Revenue Code • Sanad Ref: SANAD-DEMO-2026-124
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px', fontFamily: 'Arial, sans-serif' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569', width: '35%' }}>Primary Registered Owner:</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0a2540' }}>Demo Landowner</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Survey / Khasra Number:</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0a2540' }}>124/2</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Total Certified Area:</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#166534' }}>2.40 Hectares (24,000 sq. meters)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Revenue Village:</td>
                  <td style={{ padding: '8px 12px' }}>Demo Village</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Taluka / Sub-Division:</td>
                  <td style={{ padding: '8px 12px' }}>Demo Taluka</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>District &amp; State:</td>
                  <td style={{ padding: '8px 12px' }}>Demo District, Demo State</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Land Classification:</td>
                  <td style={{ padding: '8px 12px' }}>Dry Agricultural (Jirayat / Class I)</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Statutory Encumbrance Status:</td>
                  <td style={{ padding: '8px 12px', color: '#166534', fontWeight: 700 }}>Nil • Clean Title (EC-DEMO-2026-88319)</td>
                </tr>
              </tbody>
            </table>

            {/* Seals & Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ border: '2px solid #0a2540', padding: '8px 14px', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#0a2540' }}>
                GOVERNMENT<br />OFFICIAL<br />SEAL
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0a2540' }}>Dr. Rajesh Sharma, IAS</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Competent Authority Land Acquisition (CALA)</div>
                <div style={{ fontSize: '10px', color: '#166534', marginTop: '4px', fontWeight: 600 }}>Digitally Certified Record ✓</div>
              </div>
            </div>
          </div>
        )}

        {/* ── DOCUMENT 2: 7/12 Extract / Land Record ── */}
        {(document.type === 'SEVEN_TWELVE_EXTRACT' || document.id === 'DOC-002') && (
          <div style={{ border: '2px solid #334155', padding: '24px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase' }}>
                गाव नमुना सात-बारा (Form VII-XII) • Record of Rights
              </div>
              <h2 style={{ fontSize: '18px', color: '#0f172a', margin: '4px 0 2px 0' }}>
                Village Record of Rights &amp; Crop Inspection Extract
              </h2>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Maharashtra Land Revenue Record of Rights (Preparation and Maintenance) Rules, 1971
              </div>
            </div>

            {/* Deliberate Discrepancy Notice for Demo */}
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'Arial, sans-serif'
            }}>
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: '#92400e' }}>
                <strong>Demonstration Discrepancy Note:</strong> Extract sheet specifies Survey <strong>124/3</strong> while the registered parcel in acquisition case is <strong>124/2</strong>.
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px', fontFamily: 'Arial, sans-serif' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569', width: '35%' }}>Owner Name (खातेदार):</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0a2540' }}>Demo Landowner</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Survey Number (सर्व्हे क्र.):</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#b91c1c' }}>
                    124/3 <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>[Mismatch with registered 124/2]</span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Total Cultivable Area:</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>2.40 Hectares</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Village (गाव):</td>
                  <td style={{ padding: '8px 12px' }}>Demo Village</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Taluka (तालुका):</td>
                  <td style={{ padding: '8px 12px' }}>Demo Taluka</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>District (जिल्हा):</td>
                  <td style={{ padding: '8px 12px' }}>Demo District</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Land Type (जमिनीचे स्वरूप):</td>
                  <td style={{ padding: '8px 12px' }}>Dry Agricultural (Jirayat)</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Barcode: *712-DEMO-2026-99128* • Talathi Digital Sign Verified
              </div>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>
                E-Mahabhumi Digital Portal Stamp ✓
              </div>
            </div>
          </div>
        )}

        {/* ── DOCUMENT 3: Sale Deed ── */}
        {(document.type === 'SALE_DEED' || document.id === 'DOC-003') && (
          <div style={{ border: '2px solid #334155', padding: '24px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0a2540', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Office of Sub-Registrar of Assurances
              </div>
              <h2 style={{ fontSize: '20px', color: '#0a2540', margin: '4px 0 2px 0', textTransform: 'uppercase' }}>
                Registered Deed of Absolute Sale &amp; Conveyance
              </h2>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Document No: 2021/99882 • Book 1, Volume 412, Pages 101 to 118
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px', fontFamily: 'Arial, sans-serif' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569', width: '35%' }}>Vendor (Seller):</td>
                  <td style={{ padding: '8px 12px' }}>Fictional Vendor (Ramesh Sharma)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Purchaser (Current Owner):</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0a2540' }}>Demo Landowner</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Property Conveyed:</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0a2540' }}>Survey Number 124/2 (2.40 Hectares)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Location:</td>
                  <td style={{ padding: '8px 12px' }}>Demo Village, Demo Taluka, Demo District</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Registration Date:</td>
                  <td style={{ padding: '8px 12px' }}>14 May 2021</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Total Consideration:</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#166534' }}>₹ 14,28,000 (Fourteen Lakhs Twenty Eight Thousand)</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Stamp Duty Paid:</td>
                  <td style={{ padding: '8px 12px' }}>₹ 1,42,800 (Receipt #STAMP-MH-2021-0081)</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '12px', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Seal of Joint Sub-Registrar Class-II • Registered without encumbrances
              </div>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>
                Legally Registered Instrument ✓
              </div>
            </div>
          </div>
        )}

        {/* ── DOCUMENT 4: Land Parcel Map ── */}
        {(document.type === 'CADASTRAL_SURVEY_MAP' || document.id === 'DOC-004') && (
          <div style={{ border: '2px solid #0284c7', padding: '20px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0284c7', paddingBottom: '10px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', color: '#0369a1', margin: 0, fontWeight: 700 }}>
                  Cadastral GIS Map Sheet #14 • Survey No. 124/2
                </h3>
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'Arial, sans-serif' }}>
                  Demo Village, Demo District • Geo-referenced Cadastral Boundary Sheet
                </div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'Arial, sans-serif' }}>
                <span style={{ backgroundColor: '#0284c7', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                  DEMO GIS DOCUMENT
                </span>
              </div>
            </div>

            {/* Visual Cadastral Schematic with North Arrow and Scale */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '16px',
              position: 'relative',
              height: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              {/* North Arrow */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '4px 8px',
                borderRadius: '4px',
                fontFamily: 'Arial, sans-serif'
              }}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#dc2626' }}>↑</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>N</span>
              </div>

              {/* Scale Indicator */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#475569',
                fontFamily: 'Arial, sans-serif'
              }}>
                Scale: 1:2000 Metric
              </div>

              {/* Cadastral Polygon SVG */}
              <svg width="280" height="180" viewBox="0 0 280 180">
                {/* Adjacent parcels */}
                <polygon points="20,20 100,20 90,80 10,70" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
                <text x="45" y="50" fontSize="10" fill="#64748b" fontFamily="Arial">Khasra 123</text>

                <polygon points="190,40 260,30 270,110 200,120" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
                <text x="215" y="80" fontSize="10" fill="#64748b" fontFamily="Arial">Khasra 125</text>

                {/* Primary Subject Parcel 124/2 */}
                <polygon points="80,40 200,30 190,140 70,130" fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />
                <circle cx="80" cy="40" r="4" fill="#dc2626" />
                <circle cx="200" cy="30" r="4" fill="#dc2626" />
                <circle cx="190" cy="140" r="4" fill="#dc2626" />
                <circle cx="70" cy="130" r="4" fill="#dc2626" />

                <text x="110" y="80" fontSize="13" fontWeight="bold" fill="#1e3a8a" fontFamily="Arial">
                  SURVEY 124/2
                </text>
                <text x="118" y="96" fontSize="11" fill="#2563eb" fontFamily="Arial">
                  2.40 Hectares
                </text>
                <text x="110" y="112" fontSize="9" fill="#475569" fontFamily="Arial">
                  Demo Landowner
                </text>
              </svg>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
              <div><strong>Survey No:</strong> 124/2</div>
              <div><strong>Total Area:</strong> 2.40 Hectares</div>
              <div><strong>Scale:</strong> 1:2000 Metric</div>
              <div><strong>Village:</strong> Demo Village</div>
              <div><strong>District:</strong> Demo District</div>
              <div><strong>ETRF Coordinates:</strong> 18.5912° N, 73.7385° E</div>
            </div>
          </div>
        )}

        {/* ── DOCUMENT 5: Identity Document ── */}
        {(document.type === 'AADHAAR_IDENTITY' || document.id === 'DOC-005') && (
          <div style={{ border: '2px solid #059669', padding: '24px', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #059669', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>
                Fictional Government Identification Card
              </div>
              <h3 style={{ fontSize: '17px', color: '#065f46', margin: '4px 0 2px 0' }}>
                Digital Citizen e-KYC Identity Verification
              </h3>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                DEMO DOCUMENT — FOR SIH PROTOTYPE (FICTIONAL)
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ width: '80px', height: '100px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '4px' }}>
                [ Photo / e-KYC Headshot ]
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                <div><strong>Full Name:</strong> Demo Landowner</div>
                <div><strong>Date of Birth:</strong> 12/08/1976</div>
                <div><strong>Gender:</strong> Male</div>
                <div><strong>Fictional ID No:</strong> DEMO-ID-9928-XXXX-001</div>
              </div>
            </div>

            <div style={{ fontSize: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginBottom: '14px', fontFamily: 'Arial, sans-serif', color: '#475569' }}>
              <strong>Permanent Address:</strong><br />
              House No. 42, Main Road, Demo Village, Demo Taluka, Demo District, Demo State - 411057
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                Digitally authenticated via Demo NPCI / UIDAI Sandbox
              </div>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                e-KYC Verified ✓
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
