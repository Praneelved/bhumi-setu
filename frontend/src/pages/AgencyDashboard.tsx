import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, PlusCircle, FileText, CheckCircle2, Clock, XCircle, 
  Layers, MapPin, Send, AlertTriangle, RefreshCw, Eye, ArrowUpRight
} from 'lucide-react';
import { getStoredCases, saveCases, createDefaultReviewData } from '../mock/governmentMockData';
import type { VerificationCase } from '../types/governmentVerification';
import { getStoredUser } from '../services/api';
import { getStoredProposals, type ProjectProposal } from '../data/projectProposalData';
import { NewProjectProposalWizard } from '../components/agency/NewProjectProposalWizard';
import { ProposalDetailModal } from '../components/agency/ProposalDetailModal';

export const AgencyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROJECTS' | 'NEW_PROPOSAL' | 'PARCELS' | 'NOTIFICATIONS'>('OVERVIEW');
  const [cases, setCases] = useState<VerificationCase[]>([]);
  const [proposals, setProposals] = useState<ProjectProposal[]>([]);
  const [wizardOpen, setWizardOpen] = useState<boolean>(false);
  const [selectedProposal, setSelectedProposal] = useState<ProjectProposal | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
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
    setProposals(getStoredProposals());
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
            onClick={() => setWizardOpen(true)}
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
            }}
          >
            <PlusCircle size={16} /> + Submit New Project Proposal
          </button>
          <button
            onClick={() => navigate('/agency/gis')}
            style={{
              backgroundColor: '#0a2540',
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
              boxShadow: '0 4px 12px rgba(10, 37, 64, 0.2)'
            }}
          >
            <MapPin size={16} /> Project GIS Explorer
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
          {/* Agency GIS Callout */}
          <div style={{
            gridColumn: '1 / -1',
            background: 'linear-gradient(135deg, #0a2540 0%, #0d3b66 60%, #059669 100%)',
            color: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '22px 26px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 8px 24px rgba(10, 37, 64, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ maxWidth: '660px', zIndex: 2 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, marginBottom: '8px', backdropFilter: 'blur(4px)' }}>
                <Layers size={13} color="#6ee7b7" /> Interactive Project Geospatial Intelligence
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
                Agency GIS Map & Cadastral Corridor Explorer
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                Inspect project boundaries, impacted survey numbers, landowner holdings, and real-time acquisition status on the interactive geospatial GIS.
              </p>
            </div>
            <div style={{ zIndex: 2, display: 'flex', gap: '10px' }}>
              <button
                onClick={() => navigate('/agency/gis')}
                style={{
                  padding: '11px 20px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                  whiteSpace: 'nowrap'
                }}
              >
                <MapPin size={16} /> Open Project GIS Map <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

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
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Geospatial GIS</th>
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
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => navigate('/agency/gis')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#0a2540',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <MapPin size={12} color="#38bdf8" /> Open GIS Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PROJECT PROPOSALS & SUBMISSION */}
      {activeTab === 'NEW_PROPOSAL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Header Callout Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0a2540 0%, #0d3b66 60%, #059669 100%)',
            color: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 8px 24px rgba(10, 37, 64, 0.2)'
          }}>
            <div style={{ maxWidth: '680px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, marginBottom: '8px', backdropFilter: 'blur(4px)' }}>
                <FileText size={13} color="#6ee7b7" /> Official Statutory Proposal Gateway (Form-A)
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
                New Infrastructure Project Proposal Module
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                Submit comprehensive multi-stage project proposals to the Government with DGPS GIS alignment, capital expenditure schedules, affected cadastral survey numbers, and statutory justification.
              </p>
            </div>
            <div>
              <button
                onClick={() => setWizardOpen(true)}
                style={{
                  padding: '12px 22px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                  whiteSpace: 'nowrap'
                }}
              >
                <PlusCircle size={16} /> + Submit New Project Proposal
              </button>
            </div>
          </div>

          {/* Proposals Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Total Proposals</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0a2540', marginTop: '4px' }}>{proposals.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Agency Submissions</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>Under Review</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                {proposals.filter(p => p.status.includes('Review') || p.status.includes('Submitted')).length}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Collector & State Review</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #fecaca', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>Clarification Req.</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                {proposals.filter(p => p.status === 'Clarification Required').length}
              </div>
              <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '2px' }}>Requires Agency Reply</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Approved & in GIS</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
                {proposals.filter(p => p.status === 'Approved').length}
              </div>
              <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px' }}>Active Corridors</div>
            </div>
          </div>

          {/* Proposals Table */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>
                My Project Proposals Registry
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                Showing <strong>{proposals.length}</strong> proposals
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#0a6d3a', color: '#ffffff' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Proposal ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Project Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Project Type</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Location</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Land Required</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Submitted Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((prop) => {
                  const isClarification = prop.status === 'Clarification Required';
                  const isApproved = prop.status === 'Approved';
                  return (
                    <tr key={prop.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0284c7' }}>{prop.id}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>{prop.title}</td>
                      <td style={{ padding: '14px 16px' }}>{prop.projectType}</td>
                      <td style={{ padding: '14px 16px' }}>{prop.district}, {prop.state}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#9a3412' }}>{prop.totalLandRequiredAcres} Acres</td>
                      <td style={{ padding: '14px 16px' }}>{prop.submittedDate}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 800,
                          backgroundColor: isApproved ? '#f0fdf4' : isClarification ? '#fff1f2' : '#eff6ff',
                          color: isApproved ? '#166534' : isClarification ? '#991b1b' : '#1d4ed8',
                          border: `1px solid ${isApproved ? '#bbf7d0' : isClarification ? '#fecdd3' : '#bfdbfe'}`
                        }}>
                          {isClarification && '⚠ '}
                          {prop.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setSelectedProposal(prop);
                              setDetailModalOpen(true);
                            }}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#0a2540',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={12} /> Inspect Dossier
                          </button>

                          {isClarification && (
                            <button
                              onClick={() => {
                                setSelectedProposal(prop);
                                setDetailModalOpen(true);
                              }}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Send size={12} /> Respond
                            </button>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => navigate('/agency/gis')}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#059669',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <MapPin size={12} /> View in GIS
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

      {/* New Project Proposal Multi-Step Wizard Modal */}
      <NewProjectProposalWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={(newP) => {
          setProposals(getStoredProposals());
          setSuccessMsg(`Project proposal "${newP.title}" (${newP.id}) successfully submitted to Government for statutory review!`);
          setActiveTab('NEW_PROPOSAL');
        }}
      />

      {/* Proposal Detail & Dossier Modal */}
      <ProposalDetailModal
        isOpen={detailModalOpen}
        proposal={selectedProposal}
        onClose={() => setDetailModalOpen(false)}
        onUpdate={(updated) => {
          setProposals(getStoredProposals());
          setSelectedProposal(updated);
        }}
      />
    </div>
  );
};

export default AgencyDashboard;
