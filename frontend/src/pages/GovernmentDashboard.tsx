import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, Search, Filter, Layers, ArrowRight, Eye, RefreshCw, 
  CheckCircle2, Clock, XCircle, Building2, MapPin, Lock, ShieldCheck, 
  Award, AlertTriangle
} from 'lucide-react';
import type { VerificationCase, GovernmentOfficer, AuthorityLevel } from '../types/governmentVerification';
import { DEFAULT_OFFICERS, getStoredCases, resetCasesToDefault } from '../mock/governmentMockData';
import { OfficerHeaderBanner } from '../components/government/OfficerHeaderBanner';
import { getStoredUser } from '../services/api';
import { getStoredProposals, type ProjectProposal } from '../data/projectProposalData';
import { GovernmentProposalReviewModal } from '../components/government/GovernmentProposalReviewModal';

interface GovernmentDashboardProps {
  tier?: 'DISTRICT' | 'STATE' | 'CENTRAL';
}

export const GovernmentDashboard: React.FC<GovernmentDashboardProps> = ({ tier }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = getStoredUser();

  const effectiveAuthority: AuthorityLevel = (() => {
    if (tier === 'DISTRICT' || location.pathname.includes('/district')) return 'DISTRICT_COLLECTOR';
    if (tier === 'STATE' || location.pathname.includes('/state')) return 'STATE_GOVERNMENT';
    if (tier === 'CENTRAL' || location.pathname.includes('/central')) return 'CENTRAL_MINISTRY';
    if (storedUser?.role?.includes('STATE')) return 'STATE_GOVERNMENT';
    if (storedUser?.role?.includes('CENTRAL')) return 'CENTRAL_MINISTRY';
    return 'DISTRICT_COLLECTOR';
  })();

  const [cases, setCases] = useState<VerificationCase[]>([]);
  const [selectedAuthority, setSelectedAuthority] = useState<AuthorityLevel>(effectiveAuthority);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'ROLE_QUEUE' | 'ALL_CASES' | 'PROJECT_PROPOSALS'>('ROLE_QUEUE');

  // Proposal review state
  const [proposals, setProposals] = useState<ProjectProposal[]>([]);
  const [selectedProposalForReview, setSelectedProposalForReview] = useState<ProjectProposal | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const loadData = () => {
    fetch('/api/verification/cases')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCases(data);
        } else {
          setCases(getStoredCases());
        }
      })
      .catch(() => {
        setCases(getStoredCases());
      });
  };

  const refreshProposals = () => {
    setProposals(getStoredProposals());
  };

  useEffect(() => {
    setSelectedAuthority(effectiveAuthority);
    loadData();
    refreshProposals();
  }, [effectiveAuthority]);

  const currentOfficer: GovernmentOfficer = DEFAULT_OFFICERS[selectedAuthority];

  const handleResetData = () => {
    if (window.confirm('Reset verification cases data to default state?')) {
      fetch('/api/verification/cases/LA-2026-001/reset', { method: 'POST' })
        .then(() => loadData())
        .catch(() => {
          const defaultCases = resetCasesToDefault();
          setCases(defaultCases);
        });
    }
  };

  // Direct navigation to stage-specific page
  const handleOpenCase = (c: VerificationCase) => {
    if (selectedAuthority === 'DISTRICT_COLLECTOR') {
      navigate(`/government/verification/district/${c.id}`);
    } else if (selectedAuthority === 'STATE_GOVERNMENT') {
      navigate(`/government/verification/state/${c.id}`);
    } else if (selectedAuthority === 'CENTRAL_MINISTRY') {
      navigate(`/government/verification/central/${c.id}`);
    }
  };


  const handleOpenSpecificStage = (caseId: string, stage: AuthorityLevel) => {
    if (stage === 'DISTRICT_COLLECTOR') {
      navigate(`/government/verification/district/${caseId}`);
    } else if (stage === 'STATE_GOVERNMENT') {
      navigate(`/government/verification/state/${caseId}`);
    } else {
      navigate(`/government/verification/central/${caseId}`);
    }
  };

  // Filter cases based on role-based queue vs all cases
  const roleFilteredCases = cases.filter((c) => {
    const matchesSearch = 
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.agency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.district.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (viewMode === 'ALL_CASES') return true;

    // Role-based queues:
    if (selectedAuthority === 'DISTRICT_COLLECTOR') {
      return c.currentStage === 'DISTRICT_COLLECTOR';
    } else if (selectedAuthority === 'STATE_GOVERNMENT') {
      // State officer only reviews cases that have passed District!
      return c.stages.DISTRICT_COLLECTOR.status === 'COMPLETED' && c.currentStage === 'STATE_GOVERNMENT';
    } else if (selectedAuthority === 'CENTRAL_MINISTRY') {
      // Central officer only reviews cases that have passed State!
      return c.stages.STATE_GOVERNMENT.status === 'COMPLETED' && c.currentStage === 'CENTRAL_MINISTRY';
    }

    return true;
  });

  const getQueueHeaderInfo = () => {
    if (viewMode === 'ALL_CASES') {
      return {
        title: 'All Land Acquisition Cases (Master Registry)',
        subtitle: 'Comprehensive view of all land acquisition cases across District, State, and Central stages.'
      };
    }

    switch (selectedAuthority) {
      case 'DISTRICT_COLLECTOR':
        return {
          title: 'Cases Awaiting District Verification',
          subtitle: 'Stage 1: Verify correctness of land parcel details, boundary surveys, 7/12 extracts, and physical field inspection reports.'
        };
      case 'STATE_GOVERNMENT':
        return {
          title: 'Cases Awaiting State Verification',
          subtitle: 'Stage 2: Verify RFCTLARR Section 11/19 notifications, compensation solatium calculations, and R&R rehabilitation packages (District clearance certified).'
        };
      case 'CENTRAL_MINISTRY':
        return {
          title: 'Cases Awaiting Central Verification',
          subtitle: 'Stage 3: National corridor authorization, PM Gati Shakti alignment, inter-ministerial clearances, and final statutory award declaration.'
        };
    }
  };

  const queueInfo = getQueueHeaderInfo();

  const getStatusBadge = (c: VerificationCase) => {
    if (c.overallStatus === 'VERIFIED') {
      return (
        <span style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={13} /> Fully Verified
        </span>
      );
    }
    if (c.overallStatus === 'REJECTED') {
      return (
        <span style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <XCircle size={13} /> Rejected / Correction Req.
        </span>
      );
    }
    return (
      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Clock size={13} /> In Progress
      </span>
    );
  };

  const getStageBadge = (stage: AuthorityLevel) => {
    switch (stage) {
      case 'DISTRICT_COLLECTOR':
        return (
          <span style={{ backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
            Stage 1: District
          </span>
        );
      case 'STATE_GOVERNMENT':
        return (
          <span style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
            Stage 2: State
          </span>
        );
      case 'CENTRAL_MINISTRY':
        return (
          <span style={{ backgroundColor: '#fff7ed', color: '#9a3412', border: '1px solid #ffedd5', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
            Stage 3: Central
          </span>
        );
    }
  };

  // Filter proposals
  const filteredProposals = proposals.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.agencyDetails.agencyName.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.projectType.toLowerCase().includes(q)
    );
  });

  const pendingProposalsCount = proposals.filter(p => p.status !== 'Approved' && p.status !== 'Draft').length;

  const getProposalStatusBadge = (status: ProjectProposal['status']) => {
    switch (status) {
      case 'Approved':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
            <CheckCircle2 size={12} /> Approved (In GIS)
          </span>
        );
      case 'Clarification Required':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
            <AlertTriangle size={12} /> Clarification Sent
          </span>
        );
      case 'Submitted – Pending Government Review':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
            <Clock size={12} /> Submitted for Review
          </span>
        );
      case 'Under Government Review':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
            <Clock size={12} /> Under Scrutiny
          </span>
        );
      default:
        return (
          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: 'var(--space-xl)',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: 'var(--on-background)'
    }}>
      {/* Officer Information & Authority Switcher */}
      <OfficerHeaderBanner
        currentOfficer={currentOfficer}
        onSwitchAuthority={(level) => setSelectedAuthority(level)}
      />

      {/* KPI Overview Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)'
      }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Total Cases Registered</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>{cases.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Land Acquisition Proposals</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Stage 1 • District Queue</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#3730a3', marginTop: '4px' }}>
            {cases.filter(c => c.currentStage === 'DISTRICT_COLLECTOR').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Land & Survey Verification</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Stage 2 • State Queue</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#166534', marginTop: '4px' }}>
            {cases.filter(c => c.currentStage === 'STATE_GOVERNMENT').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Compensation & R&R Review</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Stage 3 • Central Ministry</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#9a3412', marginTop: '4px' }}>
            {cases.filter(c => c.currentStage === 'CENTRAL_MINISTRY').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Final Gazette Award Sanction</div>
        </div>

        <div
          onClick={() => setViewMode('PROJECT_PROPOSALS')}
          style={{
            backgroundColor: viewMode === 'PROJECT_PROPOSALS' ? '#eff6ff' : '#ffffff',
            border: `1px solid ${viewMode === 'PROJECT_PROPOSALS' ? '#3b82f6' : 'var(--outline-variant)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to review Agency Project Proposals"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>New Project Proposals</div>
            <span style={{ fontSize: '10px', backgroundColor: '#0284c7', color: '#ffffff', padding: '1px 6px', borderRadius: '8px', fontWeight: 800 }}>Agency</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0284c7', marginTop: '4px' }}>
            {pendingProposalsCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>Awaiting Statutory Review →</div>
        </div>
      </div>

      {/* Main Section Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-md)'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
            {queueInfo.title}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', margin: '4px 0 0 0' }}>
            {queueInfo.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => navigate('/government/gis')}
            style={{
              backgroundColor: '#0a2540',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(10,37,64,0.2)'
            }}
          >
            <MapPin size={14} color="#38bdf8" /> GIS Monitoring Map
          </button>

          <button
            type="button"
            onClick={handleResetData}
            title="Reset mock cases data"
            style={{
              backgroundColor: 'var(--surface-container-low)',
              color: 'var(--primary)',
              border: '1px solid var(--outline-variant)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} /> Reset Mock Data
          </button>
        </div>
      </div>

      {/* Filters and Queue Mode Tabs */}
      <div style={{
        backgroundColor: 'var(--surface-container-lowest)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        marginBottom: 'var(--space-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search input */}
        <div style={{ position: 'relative', width: '360px' }}>
          <Search size={16} color="var(--outline)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search by Case ID, Project, Agency, or District..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              backgroundColor: 'var(--surface-container-low)',
              border: '1px solid var(--outline-variant)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'Arial, Helvetica, sans-serif'
            }}
          />
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            onClick={() => setViewMode('ROLE_QUEUE')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: viewMode === 'ROLE_QUEUE' ? '#0a2540' : 'transparent',
              color: viewMode === 'ROLE_QUEUE' ? '#ffffff' : '#475569'
            }}
          >
            Assigned Role Queue ({roleFilteredCases.length})
          </button>

          <button
            type="button"
            onClick={() => setViewMode('ALL_CASES')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: viewMode === 'ALL_CASES' ? '#0a2540' : 'transparent',
              color: viewMode === 'ALL_CASES' ? '#ffffff' : '#475569'
            }}
          >
            All Cases ({cases.length})
          </button>

          <button
            type="button"
            onClick={() => setViewMode('PROJECT_PROPOSALS')}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: viewMode === 'PROJECT_PROPOSALS' ? '#0a2540' : 'transparent',
              color: viewMode === 'PROJECT_PROPOSALS' ? '#ffffff' : '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={13} />
            <span>New Proposals ({proposals.length})</span>
            {pendingProposalsCount > 0 && (
              <span style={{
                backgroundColor: viewMode === 'PROJECT_PROPOSALS' ? '#ef4444' : '#fee2e2',
                color: viewMode === 'PROJECT_PROPOSALS' ? '#ffffff' : '#b91c1c',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '8px',
                fontWeight: 800
              }}>
                {pendingProposalsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conditionally Render: Project Proposals Review Table OR Acquisition Cases Table */}
      {viewMode === 'PROJECT_PROPOSALS' ? (
        <div style={{
          backgroundColor: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          {/* Section banner */}
          <div style={{
            padding: '14px 20px',
            backgroundColor: '#0a2540',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800 }}>Agency Infrastructure Proposals Awaiting Statutory Review</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Review GIS boundary, cadastral affected parcels, DPR docs, request clarification, or approve directly into GIS.</div>
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Logged in as: <strong style={{ color: '#ffffff' }}>{currentOfficer.name}</strong> ({currentOfficer.designation})
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--outline-variant)', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Proposal ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Project Title & Scope</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Submitting Agency</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Location</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>GIS Extent</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Est. Outlay</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Statutory Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProposals.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid var(--outline-variant)',
                      backgroundColor: p.status === 'Clarification Required' ? '#fffbfc' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                      <div>{p.id}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{p.submittedDate}</div>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.title}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', backgroundColor: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {p.projectType}
                        </span>
                        <span style={{ fontSize: '10px', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                          {p.projectCategory}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155', fontSize: '12px' }}>
                      <div style={{ fontWeight: 700 }}>{p.agencyDetails.agencyName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{p.agencyDetails.authorizedRepresentative}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      <div><strong>{p.village}</strong>, {p.taluka}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{p.district}, {p.state}</div>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontSize: '12px' }}>
                      <div><strong>{p.approximateProjectAreaAcres}</strong> Acres</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {p.affectedParcelsCount} parcels • {p.affectedLandownersCount} owners
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontSize: '12px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>₹{p.estimatedTotalCostCr.toLocaleString()} Cr</div>
                      <div style={{ fontSize: '10px', color: '#16a34a' }}>Land: ₹{p.landAcquisitionCostCr.toLocaleString()} Cr</div>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      {getProposalStatusBadge(p.status)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProposalForReview(p);
                          setReviewModalOpen(true);
                        }}
                        style={{
                          backgroundColor: p.status === 'Approved' ? '#047857' : '#0a2540',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: '8px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 4px rgba(10, 37, 64, 0.2)'
                        }}
                      >
                        <Eye size={14} /> {p.status === 'Approved' ? 'View Approved Dossier' : 'Review & Decide'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProposals.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                      No project proposals found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cases Table */
        <div style={{
          backgroundColor: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#0a2540', color: '#ffffff' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Case ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Project Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Agency</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>District & State</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Parcels</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Gating Pipeline Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Current Stage</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Overall Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Stage Action</th>
                </tr>
              </thead>
              <tbody>
                {roleFilteredCases.map((c) => {
                  const isDistrictDone = c.stages.DISTRICT_COLLECTOR.status === 'COMPLETED';
                  const isStateDone = c.stages.STATE_GOVERNMENT.status === 'COMPLETED';
                  const isCentralDone = c.stages.CENTRAL_MINISTRY.status === 'COMPLETED';

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid var(--outline-variant)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                        {c.id}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--on-surface)', maxWidth: '240px' }}>
                        {c.projectName}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--on-surface-variant)', fontSize: '12px' }}>
                        {c.agency}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--on-surface-variant)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {c.district}, {c.state}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary)' }}>
                        {c.totalParcels}
                      </td>
                      {/* Pipeline mini indicator */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}>
                          <span style={{ color: isDistrictDone ? '#166534' : '#0369a1' }}>
                            D: {isDistrictDone ? '✓' : '●'}
                          </span>
                          <span style={{ color: '#cbd5e1' }}>→</span>
                          <span style={{ color: isStateDone ? '#166534' : isDistrictDone ? '#0369a1' : '#94a3b8' }}>
                            S: {isStateDone ? '✓' : isDistrictDone ? '●' : '🔒'}
                          </span>
                          <span style={{ color: '#cbd5e1' }}>→</span>
                          <span style={{ color: isCentralDone ? '#166534' : isStateDone ? '#0369a1' : '#94a3b8' }}>
                            C: {isCentralDone ? '✓' : isStateDone ? '●' : '🔒'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        {getStageBadge(c.currentStage)}
                      </td>
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        {getStatusBadge(c)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenCase(c)}
                          style={{
                            backgroundColor: '#0a2540',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            padding: '8px 14px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(10, 37, 64, 0.2)'
                          }}
                        >
                          <Eye size={14} /> Review Stage
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {roleFilteredCases.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--outline)' }}>
                      No cases pending in this verification queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Government Proposal Review Modal */}
      {reviewModalOpen && selectedProposalForReview && (
        <GovernmentProposalReviewModal
          proposal={selectedProposalForReview}
          officerName={currentOfficer.name}
          officerDesignation={currentOfficer.designation}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedProposalForReview(null);
          }}
          onProposalUpdated={() => {
            refreshProposals();
          }}
        />
      )}
    </div>
  );
};
