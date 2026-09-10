import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, PlusCircle, FileText, CheckCircle2, Clock, XCircle, 
  Layers, MapPin, Send, AlertTriangle, RefreshCw, Eye, ArrowUpRight
} from 'lucide-react';
import { getStoredCases, saveCases, createDefaultReviewData } from '../mock/governmentMockData';
import type { VerificationCase } from '../types/governmentVerification';
import { getStoredUser } from '../services/api';

export const AgencyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROJECTS' | 'NEW_PROPOSAL' | 'PARCELS' | 'NOTIFICATIONS'>('OVERVIEW');
  const [cases, setCases] = useState<VerificationCase[]>([]);
  const currentUser = getStoredUser() || {
    id: 'AGENCY-NHAI-001',
    name: 'Rajiv Malhotra (Project Director)',
    email: 'pune.expansion@nhai.gov.in',
    user_type: 'AGENCY',
    role: 'PROJECT_MANAGER',
    organization_id: 'NHAI-ORG-2026',
    organization_name: 'National Highways Authority of India (NHAI)',
    assigned_projects: ['LA-2026-001'],
    state: 'Maharashtra',
    district: 'Pune'
  };

  // Form State for New Proposal Submission
  const [newProjectName, setNewProjectName] = useState('');
  const [newAgencyCode, setNewAgencyCode] = useState(currentUser.organization_id || 'NHAI-ORG-2026');
  const [newState, setNewState] = useState('Maharashtra');
  const [newDistrict, setNewDistrict] = useState('Pune');
  const [newTotalParcels, setNewTotalParcels] = useState<number>(45);
  const [newAffectedFamilies, setNewAffectedFamilies] = useState<number>(120);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // GIS Pre-Submission Scan State
  const [gisScanRun, setGisScanRun] = useState(false);
  const [gisScanLoading, setGisScanLoading] = useState(false);
  const [gisAcknowledged, setGisAcknowledged] = useState(false);

  useEffect(() => {
    setCases(getStoredCases());
  }, []);

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newId = `LA-2026-00${cases.length + 1}`;
    const now = new Date().toLocaleDateString();

    const newCase: VerificationCase = {
      id: newId,
      projectName: newProjectName.trim(),
      agency: currentUser.organization_name || 'National Highways Authority of India (NHAI)',
      state: newState,
      district: newDistrict,
      totalParcels: Number(newTotalParcels),
      affectedFamilies: Number(newAffectedFamilies),
      submittedDate: now,
      currentStage: 'DISTRICT_COLLECTOR',
      workflowStatus: 'DISTRICT_PENDING',
      overallStatus: 'IN_PROGRESS',
      stages: {
        DISTRICT_COLLECTOR: { status: 'ACTIVE' },
        STATE_GOVERNMENT: { status: 'LOCKED' },
        CENTRAL_MINISTRY: { status: 'LOCKED' }
      },
      ...createDefaultReviewData(newDistrict, Number(newTotalParcels), Number(newAffectedFamilies)),
      lastUpdated: `${now}, 10:00 AM`,
      auditLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: `${now}, 10:00 AM`,
          authorityLevel: 'DISTRICT_COLLECTOR',
          authorityTitle: 'Agency Proposal Submission',
          officerName: currentUser.name,
          officerId: currentUser.id,
          action: 'CASE_CREATED',
          remarks: `New project land acquisition proposal submitted by ${currentUser.organization_name}.`
        }
      ],
      documents: [
        {
          id: `DOC-${newId}-01`,
          docNumber: '01',
          title: 'Land Acquisition Proposal Sheet',
          type: 'Official Proposal',
          status: 'PENDING',
          totalPages: 4,
          requiredForStage: ['DISTRICT_COLLECTOR', 'STATE_GOVERNMENT', 'CENTRAL_MINISTRY'],
          uploadedDate: now,
          pages: [
            { pageNumber: 1, title: 'Project Overview', contentHeading: `Proposal for ${newProjectName}`, areaHa: 25.0 }
          ]
        },
        {
          id: `DOC-${newId}-02`,
          docNumber: '02',
          title: 'Land Ownership Records',
          type: '7/12 Extracts',
          status: 'PENDING',
          totalPages: 6,
          requiredForStage: ['DISTRICT_COLLECTOR', 'STATE_GOVERNMENT', 'CENTRAL_MINISTRY'],
          uploadedDate: now,
          pages: [
            { pageNumber: 1, title: 'Revenue Records', contentHeading: `${newDistrict} Revenue Division` }
          ]
        }
      ]
    };

    const updated = [newCase, ...cases];
    setCases(updated);
    saveCases(updated);

    setSuccessMsg(`Project Proposal ${newId} submitted successfully to District Collector Verification queue!`);
    setNewProjectName('');
    setActiveTab('PROJECTS');
  };

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: 'var(--space-xl)',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: 'var(--on-background)'
    }}>
      {/* Agency Header Banner */}
      <div style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              backgroundColor: '#0a6d3a', color: '#ffffff', borderRadius: '50%',
              width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Building2 size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#166534', margin: 0 }}>
                  {currentUser.organization_name || 'Executing Infrastructure Agency'}
                </h2>
                <span style={{ backgroundColor: '#0a6d3a', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                  AGENCY PORTAL
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#14532d' }}>
                Logged Officer: <strong>{currentUser.name}</strong> ({currentUser.role}) | Agency ID: <strong>{currentUser.organization_id || 'NHAI-ORG-2026'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('NEW_PROPOSAL')}
            style={{
              backgroundColor: '#0a6d3a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(10, 109, 58, 0.2)'
            }}
          >
            <PlusCircle size={16} /> Submit New Land Proposal
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)'
      }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Submitted Proposals</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0a6d3a', marginTop: '4px' }}>{cases.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Infrastructure Projects</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>District Verification Stage</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#3730a3', marginTop: '4px' }}>
            {cases.filter(c => c.currentStage === 'DISTRICT_COLLECTOR').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Stage 1 Review</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>State Government Stage</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#166534', marginTop: '4px' }}>
            {cases.filter(c => c.currentStage === 'STATE_GOVERNMENT').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Stage 2 Review</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Central Ministry Stage</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#9a3412', marginTop: '4px' }}>
            {cases.filter(c => c.currentStage === 'CENTRAL_MINISTRY').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Stage 3 Final Review</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '2px solid var(--outline-variant)',
        marginBottom: 'var(--space-lg)'
      }}>
        {[
          { key: 'OVERVIEW', label: 'Overview & Status' },
          { key: 'PROJECTS', label: 'My Projects & Proposals' },
          { key: 'NEW_PROPOSAL', label: '+ New Project Proposal' },
          { key: 'NOTIFICATIONS', label: 'Government Objections & Updates' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === t.key ? '3px solid #0a6d3a' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === t.key ? '#0a6d3a' : 'var(--on-surface-variant)',
              fontWeight: activeTab === t.key ? 700 : 600,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontWeight: 700, fontSize: '13px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-lg)' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 16px 0' }}>
              Active Proposals Tracking
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cases.map((c) => (
                <div key={c.id} style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)', padding: '14px', backgroundColor: 'var(--surface-container-low)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '14px' }}>{c.id} — {c.projectName}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                      {c.currentStage.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>
                    Parcels: <strong>{c.totalParcels}</strong> | Submitted: <strong>{c.submittedDate}</strong> | District: <strong>{c.district}</strong>
                  </div>

                  {/* Stage Progress Bar */}
                  <div style={{ display: 'flex', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
                    <span style={{ color: c.stages.DISTRICT_COLLECTOR.status === 'COMPLETED' ? '#166534' : '#0369a1' }}>
                      1. District: {c.stages.DISTRICT_COLLECTOR.status}
                    </span>
                    <span>→</span>
                    <span style={{ color: c.stages.STATE_GOVERNMENT.status === 'COMPLETED' ? '#166534' : c.stages.STATE_GOVERNMENT.status === 'ACTIVE' ? '#0369a1' : '#94a3b8' }}>
                      2. State: {c.stages.STATE_GOVERNMENT.status}
                    </span>
                    <span>→</span>
                    <span style={{ color: c.stages.CENTRAL_MINISTRY.status === 'COMPLETED' ? '#166534' : c.stages.CENTRAL_MINISTRY.status === 'ACTIVE' ? '#0369a1' : '#94a3b8' }}>
                      3. Central: {c.stages.CENTRAL_MINISTRY.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 12px 0' }}>
              Agency Statutory Checklist
            </h3>
            <ul style={{ fontSize: '12px', color: 'var(--on-surface-variant)', paddingLeft: '18px', margin: 0, lineHeight: 1.8 }}>
              <li>Submit Form-A Land Acquisition Proposal</li>
              <li>Upload 7/12 Revenue Extracts & Jamabandi Records</li>
              <li>Attach DGPS Verified Cadastral Survey Map</li>
              <li>Submit Land Valuation & Guideline Rate Schedule</li>
              <li>Provide RFCTLARR Award Calculation Matrix</li>
              <li>Upload Rehabilitation & Resettlement (R&R) Scheme</li>
              <li>Attach Section 11 & Section 19 Gazette Notices</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: PROJECTS */}
      {activeTab === 'PROJECTS' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#0a6d3a', color: '#ffffff' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Case ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Project Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>District</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Land Parcels</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Submitted Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Government Stage</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary)' }}>{c.id}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>{c.projectName}</td>
                  <td style={{ padding: '14px 16px' }}>{c.district}, {c.state}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>{c.totalParcels} Parcels</td>
                  <td style={{ padding: '14px 16px' }}>{c.submittedDate}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0369a1' }}>{c.currentStage.replace('_', ' ')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                      {c.overallStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: NEW PROPOSAL FORM */}
      {activeTab === 'NEW_PROPOSAL' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '28px', maxWidth: '700px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 16px 0' }}>
            Submit New Land Acquisition Proposal
          </h3>

          <form onSubmit={handleCreateProposal}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                Project Title / Infrastructure Corridor Name *
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Pune–Nashik High-Speed Rail Corridor"
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--outline-variant)', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                  State
                </label>
                <input
                  type="text"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--outline-variant)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                  Target District
                </label>
                <input
                  type="text"
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--outline-variant)', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                  Estimated Land Parcels
                </label>
                <input
                  type="number"
                  value={newTotalParcels}
                  onChange={(e) => setNewTotalParcels(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--outline-variant)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                  Estimated Affected Families
                </label>
                <input
                  type="number"
                  value={newAffectedFamilies}
                  onChange={(e) => setNewAffectedFamilies(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--outline-variant)', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* GIS Land-Use & Restricted-Zone Pre-Submission Scan */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#0a2540" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0a2540' }}>
                    Automated GIS Land-Use &amp; Restricted-Zone Pre-Check
                  </span>
                </div>
                {!gisScanRun && (
                  <button
                    type="button"
                    onClick={() => {
                      setGisScanLoading(true);
                      setTimeout(() => {
                        setGisScanLoading(false);
                        setGisScanRun(true);
                      }, 500);
                    }}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#0a2540',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {gisScanLoading ? 'Scanning GIS Layers…' : 'Run GIS Overlay Scan'}
                  </button>
                )}
              </div>

              {!gisScanRun ? (
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Evaluate proposed project alignment against Forest Land, Green Belt, Water Bodies, and Industrial Planning zones before formal submission.
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      backgroundColor: '#fff7ed',
                      color: '#c2410c',
                      border: '1px solid #fed7aa',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertTriangle size={12} /> HIGH RISK (Decision Support Flag)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      3 Sensitive Layer Intersections Detected
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#334155', backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#15803d', fontWeight: 700 }}>• Forest Land (Mulshi Block III):</span>
                      <span>8.4 Ha overlap. MoEFCC Stage-I Forest Clearance (FCA 1980) required prior to declaration.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#84cc16', fontWeight: 700 }}>• Green Belt (PMRDA Buffer):</span>
                      <span>3.2 Ha overlap. Compensatory tree plantation plan (1:3 sapling ratio) required.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#0284c7', fontWeight: 700 }}>• Riparian Buffer (Mula River):</span>
                      <span>1.1 Ha overlap. WRD high flood level clearance required.</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '6px 8px', borderRadius: '4px', marginBottom: '10px' }}>
                    ℹ️ <strong>Demo/Mock Layer • Authority Integration Ready:</strong> These intersections are decision support notifications and will not silently block submission.
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#0f172a', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={gisAcknowledged}
                      onChange={(e) => setGisAcknowledged(e.target.checked)}
                    />
                    <span>I acknowledge the statutory environmental clearance requirements identified by the GIS overlay.</span>
                  </label>
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#0a6d3a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Send size={16} /> Submit Proposal to District Verification Queue
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'NOTIFICATIONS' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 16px 0' }}>
            Government Verification Notifications & Feedback Log
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '4px', fontSize: '13px' }}>
              <strong style={{ color: '#166534' }}>✓ Stage 1 Passed (LA-2026-002 - DFC Corridor)</strong>
              <p style={{ margin: '4px 0 0 0', color: '#14532d', fontSize: '12px' }}>
                District Collector - Thane approved all 8 documents. Case forwarded to State Government Stage.
              </p>
            </div>

            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '4px', fontSize: '13px' }}>
              <strong style={{ color: '#166534' }}>✓ Stage 2 Passed (LA-2026-003 - Greenfield Airport)</strong>
              <p style={{ margin: '4px 0 0 0', color: '#14532d', fontSize: '12px' }}>
                State Revenue Secretariat verified proposal. Recommended for Central Ministry final clearance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyDashboard;
