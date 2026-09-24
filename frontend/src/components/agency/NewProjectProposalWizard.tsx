import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Building2,
  MapPin,
  Layers,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Crosshair,
  ArrowRight,
  ArrowLeft,
  Upload,
  Trash2,
  Eye,
  Check,
  ShieldCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  FileCheck,
  Map as MapIcon,
  HelpCircle,
  ExternalLink,
  Save
} from 'lucide-react';
import {
  type ProjectProposal,
  type ProposalDocument,
  type ProposalPhase,
  type AffectedProposalParcel,
  generateNextProposalId,
  submitOrUpdateProposal
} from '../../data/projectProposalData';
import { AGENCY_AFFECTED_PARCELS } from '../../data/agencyGisData';
import { getStoredUser, dispatchProposalNotificationEvent } from '../../services/api';
import { ParcelDetailModal } from './ParcelDetailModal';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (proposal: ProjectProposal) => void;
  draftProposal?: ProjectProposal | null;
}

export const NewProjectProposalWizard: React.FC<WizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  draftProposal
}) => {
  const currentUser = getStoredUser();

  // Wizard Step State (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [inspectedParcel, setInspectedParcel] = useState<AffectedProposalParcel | null>(null);

  // STEP 1: Basic Project Details
  const [proposalId] = useState<string>(draftProposal?.id || generateNextProposalId());
  const [projectName, setProjectName] = useState<string>(draftProposal?.title || '');
  const [projectType, setProjectType] = useState<ProjectProposal['projectType']>(draftProposal?.projectType || 'Highway');
  const [projectCategory, setProjectCategory] = useState<string>(draftProposal?.projectCategory || 'National Expressway Corridor');
  const [projectDescription, setProjectDescription] = useState<string>(draftProposal?.projectDescription || '');
  const [projectObjective, setProjectObjective] = useState<string>(draftProposal?.projectObjective || '');
  const [projectPriority, setProjectPriority] = useState<ProjectProposal['projectPriority']>(draftProposal?.projectPriority || 'High');
  const [estimatedDurationMonths, setEstimatedDurationMonths] = useState<number>(draftProposal?.estimatedDurationMonths || 36);
  const [proposedStartDate, setProposedStartDate] = useState<string>(draftProposal?.proposedStartDate || '2027-02-01');
  const [proposedCompletionDate, setProposedCompletionDate] = useState<string>(draftProposal?.proposedCompletionDate || '2030-01-31');

  // STEP 2: Location & GIS Selection
  const [state, setState] = useState<string>(draftProposal?.state || 'Maharashtra');
  const [district, setDistrict] = useState<string>(draftProposal?.district || 'Pune');
  const [taluka, setTaluka] = useState<string>(draftProposal?.taluka || 'Haveli & Mulshi');
  const [village, setVillage] = useState<string>(draftProposal?.village || 'Hinjawadi, Maan & Marunji');
  const [projectAddress, setProjectAddress] = useState<string>(draftProposal?.projectAddress || 'Hinjawadi IT Corridor Extension Alignment');
  const [pinCode, setPinCode] = useState<string>(draftProposal?.pinCode || '411057');
  const [gisSelectionType, setGisSelectionType] = useState<ProjectProposal['gisSelectionType']>(draftProposal?.gisSelectionType || 'Line/Corridor');

  // Pre-configured corridor alignments
  const [selectedAlignmentPreset, setSelectedAlignmentPreset] = useState<string>('Corridor-A');
  const [approximateAreaAcres, setApproximateAreaAcres] = useState<number>(draftProposal?.approximateProjectAreaAcres || 245.0);
  const [approximateAreaHa, setApproximateAreaHa] = useState<number>(draftProposal?.approximateProjectAreaHa || 99.1);
  const [affectedParcelsCount, setAffectedParcelsCount] = useState<number>(draftProposal?.affectedParcelsCount || 174);
  const [affectedLandownersCount, setAffectedLandownersCount] = useState<number>(draftProposal?.affectedLandownersCount || 128);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // STEP 3: Project Details, Financials & Justification
  const [publicPurpose, setPublicPurpose] = useState<string>(
    draftProposal?.publicPurpose || 'Industrial logistics decongestion and rapid multimodal transport corridor under PM Gati Shakti.'
  );
  const [expectedBenefits, setExpectedBenefits] = useState<string[]>(
    draftProposal?.expectedBenefits || ['Transportation improvement', 'Connectivity', 'Employment', 'Infrastructure development']
  );
  const [estimatedTotalCostCr, setEstimatedTotalCostCr] = useState<number>(draftProposal?.estimatedTotalCostCr || 4850.0);
  const [landAcquisitionCostCr, setLandAcquisitionCostCr] = useState<number>(draftProposal?.landAcquisitionCostCr || 1120.0);
  const [constructionCostCr, setConstructionCostCr] = useState<number>(draftProposal?.constructionCostCr || 3250.0);
  const [otherEstimatedCostCr, setOtherEstimatedCostCr] = useState<number>(draftProposal?.otherEstimatedCostCr || 480.0);
  const [fundingSource, setFundingSource] = useState<ProjectProposal['fundingSource']>(draftProposal?.fundingSource || 'Government Funding');
  const [fundingDetails, setFundingDetails] = useState<string>(
    draftProposal?.fundingDetails || 'Budgetary allocation by Ministry of Road Transport and Highways (MoRTH).'
  );

  const [existingProblem, setExistingProblem] = useState<string>(
    draftProposal?.justification?.existingProblem || 'Severe commuter traffic saturation and freight choke points exceeding 4 hours during peak hours.'
  );
  const [proposedSolution, setProposedSolution] = useState<string>(
    draftProposal?.justification?.proposedSolution || 'Construct an elevated 6-lane access-controlled expressway with automated tolling and grade separators.'
  );
  const [expectedImpact, setExpectedImpact] = useState<string>(
    draftProposal?.justification?.expectedImpact || 'Reduces transit times by 65% and connects key manufacturing clusters to central freight bypasses.'
  );
  const [publicBenefit, setPublicBenefit] = useState<string>(
    draftProposal?.justification?.publicBenefit || 'Direct benefit to over 150,000 daily commuters and reduction of road accident fatalities.'
  );
  const [urgency, setUrgency] = useState<string>(
    draftProposal?.justification?.urgency || 'Immediate priority requirement prior to regional industrial corridor operationalization.'
  );
  const [consequencesIfNotImplemented, setConsequencesIfNotImplemented] = useState<string>(
    draftProposal?.justification?.consequencesIfNotImplemented || 'Acute traffic paralysis and substantial economic output loss estimated at ₹18 Cr/month.'
  );

  // STEP 4: Land Requirement & Affected Parcels
  const [totalLandRequiredAcres, setTotalLandRequiredAcres] = useState<number>(draftProposal?.totalLandRequiredAcres || 245.0);
  const [governmentLandRequiredAcres, setGovernmentLandRequiredAcres] = useState<number>(draftProposal?.governmentLandRequiredAcres || 82.5);
  const [privateLandRequiredAcres, setPrivateLandRequiredAcres] = useState<number>(draftProposal?.privateLandRequiredAcres || 152.5);
  const [forestProtectedLandAcres, setForestProtectedLandAcres] = useState<number>(draftProposal?.forestProtectedLandAcres || 10.0);
  const [otherLandAcres, setOtherLandAcres] = useState<number>(draftProposal?.otherLandAcres || 0.0);

  // Auto-populated affected parcels list from database
  const [affectedParcels, setAffectedParcels] = useState<AffectedProposalParcel[]>(
    draftProposal?.affectedParcels ||
    AGENCY_AFFECTED_PARCELS.slice(0, 12).map((p, idx) => ({
      id: `PROP-P-${100 + idx}`,
      surveyNumber: p.surveyNumber,
      khasraNumber: p.khasraNumber,
      landownerName: p.landownerName,
      village: p.village,
      taluka: p.taluka,
      district: p.district,
      totalAreaAcres: p.totalAreaAcres,
      affectedAreaAcres: p.affectedAreaAcres,
      landCategory: idx % 3 === 0 ? 'Government Revenue' : 'Private Agricultural',
      estimatedCompensationCr: Number((p.affectedAreaAcres * 0.45).toFixed(2)),
      status: 'IDENTIFIED'
    }))
  );

  // STEP 5: Documents & Implementation Plan
  const [documents, setDocuments] = useState<ProposalDocument[]>(
    draftProposal?.documents || [
      { id: 'DOC-1', name: 'Detailed_Project_Report_DPR_Final.pdf', type: 'Detailed Project Report (DPR)', uploadDate: '23/09/2026', fileSize: '18.4 MB', status: 'Uploaded' },
      { id: 'DOC-2', name: 'Feasibility_and_Traffic_Study_2026.pdf', type: 'Feasibility Report', uploadDate: '23/09/2026', fileSize: '9.8 MB', status: 'Uploaded' },
      { id: 'DOC-3', name: 'Cadastral_Survey_Map_Corridor_Alignment.pdf', type: 'Project Plan / Layout', uploadDate: '23/09/2026', fileSize: '14.1 MB', status: 'Uploaded' },
      { id: 'DOC-4', name: 'RFCTLARR_Land_Schedule_Matrix.xlsx', type: 'Land Requirement Report', uploadDate: '23/09/2026', fileSize: '2.5 MB', status: 'Uploaded' }
    ]
  );

  const [newDocType, setNewDocType] = useState<string>('Detailed Project Report (DPR)');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

  const [implementationPhases, setImplementationPhases] = useState<ProposalPhase[]>(
    draftProposal?.implementationPhases || [
      { id: 'PH-1', phaseNumber: 1, phaseName: 'Statutory Notification & Section 11 Publication', startDate: '2027-02-01', endDate: '2027-06-30', description: 'Publication in Gazette & DGPS joint measurement verification.', status: 'Upcoming' },
      { id: 'PH-2', phaseNumber: 2, phaseName: 'Public Objections (Section 15) & Direct Purchase', startDate: '2027-07-01', endDate: '2027-11-30', description: 'CALA hearings and mutual consent agreement execution.', status: 'Upcoming' },
      { id: 'PH-3', phaseNumber: 3, phaseName: 'Award Declaration & Solatium Disbursement', startDate: '2027-12-01', endDate: '2028-06-30', description: 'RFCTLARR award calculation, escrow deposition, and title mutation.', status: 'Upcoming' },
      { id: 'PH-4', phaseNumber: 4, phaseName: 'Civil Construction & Infrastructure Execution', startDate: '2028-07-01', endDate: '2030-01-31', description: 'Access-controlled carriageway construction and commissioning.', status: 'Upcoming' }
    ]
  );

  // STEP 6: Agency Details, Declaration & Authorization
  const [agencyName] = useState<string>(currentUser?.organization_name || 'National Highways Authority of India (NHAI)');
  const [agencyId] = useState<string>(currentUser?.organization_id || 'NHAI-ORG-2026');
  const [department] = useState<string>('National Corridor Infrastructure & Land Cell');
  const [authorizedRepresentative] = useState<string>(currentUser?.name || 'Rajiv Malhotra (Project Director)');
  const [contactNumber] = useState<string>('+91 20 2567 4410');
  const [agencyEmail] = useState<string>(currentUser?.email || 'pune.expansion@nhai.gov.in');
  const [officeAddress] = useState<string>('NHAI Project Implementation Unit (PIU), Model Colony, Pune 411016');

  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(draftProposal?.declarationAccepted || false);
  const [authorizedSignatoryName, setAuthorizedSignatoryName] = useState<string>(draftProposal?.authorizedSignatoryName || currentUser?.name || 'Rajiv Malhotra');
  const [authorizedSignatoryDesignation, setAuthorizedSignatoryDesignation] = useState<string>(draftProposal?.authorizedSignatoryDesignation || 'Project Director & Authorized CALA Liaison');
  const [digitalSignatureAcknowledged, setDigitalSignatureAcknowledged] = useState<boolean>(draftProposal?.digitalSignatureAcknowledged || true);

  // Initialize MapLibre on Step 2
  useEffect(() => {
    if (currentStep !== 2 || !mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [73.7400, 18.5925],
      zoom: 13.5
    });

    mapRef.current = map;

    map.on('load', () => {
      // Proposed Corridor Alignment GeoJSON
      const corridorGeo = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: { name: 'Proposed Alignment Corridor' },
            geometry: {
              type: 'Polygon' as const,
              coordinates: [[
                [73.7310, 18.5870],
                [73.7540, 18.5880],
                [73.7550, 18.5985],
                [73.7320, 18.5975],
                [73.7310, 18.5870]
              ]]
            }
          }
        ]
      };

      map.addSource('proposed-corridor', {
        type: 'geojson',
        data: corridorGeo
      });

      map.addLayer({
        id: 'corridor-fill',
        type: 'fill',
        source: 'proposed-corridor',
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': 0.35
        }
      });

      map.addLayer({
        id: 'corridor-outline',
        type: 'line',
        source: 'proposed-corridor',
        paint: {
          'line-color': '#0369a1',
          'line-width': 3,
          'line-dasharray': [3, 1]
        }
      });
    });

    return () => {
      map.remove();
    };
  }, [currentStep]);

  if (!isOpen) return null;

  // Handle Document Upload
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocFile) return;

    const newDoc: ProposalDocument = {
      id: `DOC-${Date.now()}`,
      name: newDocFile.name,
      type: newDocType,
      uploadDate: new Date().toLocaleDateString(),
      fileSize: `${(newDocFile.size / (1024 * 1024)).toFixed(1)} MB`,
      status: 'Uploaded'
    };

    setDocuments([newDoc, ...documents]);
    setNewDocFile(null);
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  // Compile Current Proposal Object
  const compileProposal = (status: ProjectProposal['status']): ProjectProposal => {
    const now = new Date().toLocaleDateString();
    return {
      id: proposalId,
      title: projectName.trim() || 'Untitled Infrastructure Proposal',
      status,
      currentWorkflowStage: status === 'Draft' ? 'PROPOSAL_CREATED' : 'SUBMITTED_TO_GOVERNMENT',
      submittedDate: now,
      lastUpdated: `${now}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,

      projectType,
      projectCategory,
      projectDescription,
      projectObjective,
      projectPriority,
      estimatedDurationMonths: Number(estimatedDurationMonths),
      proposedStartDate,
      proposedCompletionDate,

      state,
      district,
      taluka,
      village,
      projectAddress,
      pinCode,
      gisSelectionType,
      approximateProjectAreaAcres: Number(approximateAreaAcres),
      approximateProjectAreaHa: Number(approximateAreaHa),
      affectedParcelsCount: Number(affectedParcelsCount),
      affectedLandownersCount: Number(affectedLandownersCount),
      corridorCoordinates: [[
        [73.7310, 18.5870],
        [73.7540, 18.5880],
        [73.7550, 18.5985],
        [73.7320, 18.5975],
        [73.7310, 18.5870]
      ]],
      corridorCenter: [73.7430, 18.5925],

      publicPurpose,
      expectedBenefits,
      estimatedTotalCostCr: Number(estimatedTotalCostCr),
      landAcquisitionCostCr: Number(landAcquisitionCostCr),
      constructionCostCr: Number(constructionCostCr),
      otherEstimatedCostCr: Number(otherEstimatedCostCr),
      fundingSource,
      fundingDetails,
      justification: {
        existingProblem,
        proposedSolution,
        expectedImpact,
        publicBenefit,
        urgency,
        consequencesIfNotImplemented
      },

      totalLandRequiredAcres: Number(totalLandRequiredAcres),
      governmentLandRequiredAcres: Number(governmentLandRequiredAcres),
      privateLandRequiredAcres: Number(privateLandRequiredAcres),
      forestProtectedLandAcres: Number(forestProtectedLandAcres),
      otherLandAcres: Number(otherLandAcres),
      affectedParcels,

      documents,
      implementationPhases,

      agencyDetails: {
        agencyName,
        agencyId,
        department,
        authorizedRepresentative,
        contactNumber,
        email: agencyEmail,
        officeAddress
      },
      declarationAccepted,
      authorizedSignatoryName,
      authorizedSignatoryDesignation,
      digitalSignatureAcknowledged,
      clarificationRequests: draftProposal?.clarificationRequests || []
    };
  };

  // Save as Draft
  const handleSaveDraft = () => {
    const draft = compileProposal('Draft');
    submitOrUpdateProposal(draft);
    setSaveSuccessNotice('Proposal draft saved successfully in your local registry.');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  // Final Submit to Government
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!declarationAccepted) {
      alert('Please confirm and accept the statutory declaration before submitting.');
      return;
    }
    if (!projectName.trim()) {
      alert('Please provide a Project Name.');
      setCurrentStep(1);
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to formally submit this project proposal to the Government for review and statutory approval?'
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    const submitted = compileProposal('Submitted – Pending Government Review');
    submitOrUpdateProposal(submitted);

    try {
      await dispatchProposalNotificationEvent('proposal.submitted', submitted, {
        recipientEmail: 'district.officer@test.gov'
      });
      console.log('[viaSocket] Proposal submitted notification dispatched successfully.');
    } catch (err) {
      console.error('[viaSocket Error] Failed to dispatch proposal submission notification:', err);
    } finally {
      setIsSubmitting(false);
      onSuccess(submitted);
      onClose();
    }
  };

  const stepsList = [
    { number: 1, title: 'Project Information' },
    { number: 2, title: 'Location & Land Requirement' },
    { number: 3, title: 'Project Details' },
    { number: 4, title: 'Land & Landowner Details' },
    { number: 5, title: 'Documents' },
    { number: 6, title: 'Review & Submit' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 37, 64, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '1080px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* ─── MODAL HEADER ─── */}
        <div style={{
          backgroundColor: '#0a2540',
          color: '#ffffff',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ backgroundColor: '#059669', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                FORM-A
              </span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                New Infrastructure Project Proposal Submission
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              Proposal ID: <strong>{proposalId}</strong> • Statutory Submission to District Collector &amp; State Revenue Ministry
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#cbd5e1' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* ─── STEPPER PROGRESS BAR ─── */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          overflowX: 'auto'
        }}>
          {stepsList.map((s, idx) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            return (
              <div
                key={s.number}
                onClick={() => setCurrentStep(s.number)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  opacity: isCurrent || isCompleted ? 1 : 0.6
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#059669' : isCurrent ? '#0a2540' : '#e2e8f0',
                  color: isCompleted || isCurrent ? '#ffffff' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isCompleted ? '✓' : s.number}
                </div>
                <div style={{ fontSize: '12px', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#0a2540' : '#475569', whiteSpace: 'nowrap' }}>
                  {s.title}
                </div>
                {idx < stepsList.length - 1 && (
                  <div style={{ width: '24px', height: '1px', backgroundColor: '#cbd5e1', margin: '0 4px' }} />
                )}
              </div>
            );
          })}
        </div>

        {saveSuccessNotice && (
          <div style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', color: '#166534', padding: '8px 24px', fontSize: '12px', fontWeight: 700 }}>
            ✓ {saveSuccessNotice}
          </div>
        )}

        {/* ─── SCROLLABLE STEP CONTENT BODY ─── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

          {/* STEP 1: PROJECT INFORMATION */}
          {currentStep === 1 && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0a2540' }}>
                  Step 1: Project Information &amp; Basic Charter
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Define the core identity, scope, objective, and statutory classification of the proposed infrastructure project.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    Project Name / Corridor Title *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Pune–Nashik Semi High-Speed Rail Corridor (Phase I)"
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    Proposal ID (Auto-Generated)
                  </label>
                  <input
                    type="text"
                    value={proposalId}
                    disabled
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', color: '#0284c7', fontWeight: 800, fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    Project Type *
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as any)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff' }}
                  >
                    <option value="Highway">Highway</option>
                    <option value="Airport">Airport</option>
                    <option value="Metro">Metro</option>
                    <option value="Railway">Railway</option>
                    <option value="Industrial Development">Industrial Development</option>
                    <option value="Government Infrastructure">Government Infrastructure</option>
                    <option value="Residential Development">Residential Development</option>
                    <option value="Commercial Development">Commercial Development</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    Project Category
                  </label>
                  <input
                    type="text"
                    value={projectCategory}
                    onChange={(e) => setProjectCategory(e.target.value)}
                    placeholder="e.g. National Expressway / Green Field Corridor"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    Project Priority
                  </label>
                  <select
                    value={projectPriority}
                    onChange={(e) => setProjectPriority(e.target.value as any)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff' }}
                  >
                    <option value="High">High (State Priority / PM Gati Shakti)</option>
                    <option value="Medium">Medium</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                  Project Description (Comprehensive Scope) *
                </label>
                <textarea
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Detail the technical alignment, dimensions, capacity, and infrastructure components..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                  Project Objective (Public Purpose Rationale) *
                </label>
                <textarea
                  rows={2}
                  value={projectObjective}
                  onChange={(e) => setProjectObjective(e.target.value)}
                  placeholder="State the core public and developmental objectives to be achieved..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    Estimated Project Duration
                  </label>
                  <input
                    type="number"
                    value={estimatedDurationMonths}
                    onChange={(e) => setEstimatedDurationMonths(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Months</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    Proposed Start Date
                  </label>
                  <input
                    type="date"
                    value={proposedStartDate}
                    onChange={(e) => setProposedStartDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    Proposed Completion Date
                  </label>
                  <input
                    type="date"
                    value={proposedCompletionDate}
                    onChange={(e) => setProposedCompletionDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION & GIS SELECTION */}
          {currentStep === 2 && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0a2540' }}>
                  Step 2: Project Location &amp; Interactive GIS Boundary
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Define the administrative jurisdiction and interactive geographic corridor boundary on the GIS map.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    District *
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    Taluka / Tahsil
                  </label>
                  <input
                    type="text"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    Target Village(s)
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    Project Alignment Address
                  </label>
                  <input
                    type="text"
                    value={projectAddress}
                    onChange={(e) => setProjectAddress(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* GIS Boundary Selection Toolbar */}
              <div style={{
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#0284c7" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0a2540' }}>
                    Select Project Area on GIS Map:
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['Line/Corridor', 'Polygon', 'Point'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setGisSelectionType(mode)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid #cbd5e1',
                        backgroundColor: gisSelectionType === mode ? '#0a2540' : '#ffffff',
                        color: gisSelectionType === mode ? '#ffffff' : '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      {mode} Mode
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive GIS Map Container */}
              <div style={{ height: '320px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative', marginBottom: '14px' }}>
                <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0a2540',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}>
                  Interactive Corridor Buffer: 50m RoW
                </div>
              </div>

              {/* GIS Calculated Metrics Summary Strip */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 700 }}>Approx. Project Area</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>
                    {approximateAreaAcres} Acres
                  </div>
                  <div style={{ fontSize: '11px', color: '#3b82f6' }}>({approximateAreaHa} Hectares)</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 700 }}>Affected Land Parcels</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>
                    {affectedParcelsCount} Parcels
                  </div>
                  <div style={{ fontSize: '11px', color: '#3b82f6' }}>Intersecting Survey Nos</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 700 }}>Estimated Landowners</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>
                    {affectedLandownersCount} Landowners
                  </div>
                  <div style={{ fontSize: '11px', color: '#3b82f6' }}>Title Holders in Corridor</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 700 }}>GIS Boundary Precision</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    DGPS Grade
                  </div>
                  <div style={{ fontSize: '11px', color: '#059669' }}>WGS84 Transverse Mercator</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PROJECT DETAILS, FINANCIALS & JUSTIFICATION */}
          {currentStep === 3 && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0a2540' }}>
                  Step 3: Project Purpose, Financials &amp; Statutory Justification
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Provide complete capital expenditure, funding source, and RFCTLARR 2013 public interest justification.
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '6px' }}>
                  Public / Development Purpose Statement *
                </label>
                <textarea
                  rows={2}
                  value={publicPurpose}
                  onChange={(e) => setPublicPurpose(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Expected Benefits Checkboxes */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '8px' }}>
                  Expected Benefits (Select All That Apply):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12px' }}>
                  {[
                    'Transportation improvement',
                    'Connectivity',
                    'Employment',
                    'Infrastructure development',
                    'Economic development',
                    'Public facilities'
                  ].map(b => (
                    <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={expectedBenefits.includes(b)}
                        onChange={() => {
                          if (expectedBenefits.includes(b)) {
                            setExpectedBenefits(expectedBenefits.filter(x => x !== b));
                          } else {
                            setExpectedBenefits([...expectedBenefits, b]);
                          }
                        }}
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '18px'
              }}>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#0a2540', marginBottom: '12px' }}>
                  Estimated Project Cost Breakdown (₹ Crores)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Estimated Total Cost
                    </label>
                    <input
                      type="number"
                      value={estimatedTotalCostCr}
                      onChange={(e) => setEstimatedTotalCostCr(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 800, color: '#0a2540', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Land Acquisition Cost
                    </label>
                    <input
                      type="number"
                      value={landAcquisitionCostCr}
                      onChange={(e) => setLandAcquisitionCostCr(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 800, color: '#9a3412', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Construction Cost
                    </label>
                    <input
                      type="number"
                      value={constructionCostCr}
                      onChange={(e) => setConstructionCostCr(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 800, color: '#047857', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Other / Contingency
                    </label>
                    <input
                      type="number"
                      value={otherEstimatedCostCr}
                      onChange={(e) => setOtherEstimatedCostCr(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 800, color: '#475569', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginTop: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Funding Source
                    </label>
                    <select
                      value={fundingSource}
                      onChange={(e) => setFundingSource(e.target.value as any)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#ffffff' }}
                    >
                      <option value="Government Funding">Government Funding (100% Budgetary)</option>
                      <option value="Private Funding">Private Funding</option>
                      <option value="PPP">PPP (Public-Private Partnership)</option>
                      <option value="Multilateral Funding">Multilateral Funding (World Bank / ADB)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Funding Allocation Details
                    </label>
                    <input
                      type="text"
                      value={fundingDetails}
                      onChange={(e) => setFundingDetails(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Project Justification Matrix */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#0a2540', marginBottom: '12px' }}>
                  Statutory Project Justification (Why is this project required?)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Existing Problem
                    </label>
                    <textarea
                      rows={2}
                      value={existingProblem}
                      onChange={(e) => setExistingProblem(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Proposed Solution
                    </label>
                    <textarea
                      rows={2}
                      value={proposedSolution}
                      onChange={(e) => setProposedSolution(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Public Benefit &amp; Urgency
                    </label>
                    <textarea
                      rows={2}
                      value={publicBenefit}
                      onChange={(e) => setPublicBenefit(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>
                      Consequences if Project is Not Implemented
                    </label>
                    <textarea
                      rows={2}
                      value={consequencesIfNotImplemented}
                      onChange={(e) => setConsequencesIfNotImplemented(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: LAND REQUIREMENT & AFFECTED LAND PARCELS */}
          {currentStep === 4 && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0a2540' }}>
                  Step 4: Land Requirement Breakdown &amp; Cadastral Parcels
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Detailed land classification schedule and automatically identified affected survey numbers from the spatial GIS database.
                </p>
              </div>

              {/* Land Breakdown Summary Flow Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ backgroundColor: '#0a2540', color: '#ffffff', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase' }}>TOTAL REQUIRED</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>{totalLandRequiredAcres} Ac</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1' }}>100% Corridor Footprint</div>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>GOVERNMENT LAND</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#166534', marginTop: '2px' }}>{governmentLandRequiredAcres} Ac</div>
                  <div style={{ fontSize: '10px', color: '#15803d' }}>Revenue / Gaikran</div>
                </div>
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fed7aa', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>PRIVATE LAND</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#9a3412', marginTop: '2px' }}>{privateLandRequiredAcres} Ac</div>
                  <div style={{ fontSize: '10px', color: '#b45309' }}>Requires RFCTLARR Acquisition</div>
                </div>
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>FOREST / PROTECTED</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#991b1b', marginTop: '2px' }}>{forestProtectedLandAcres} Ac</div>
                  <div style={{ fontSize: '10px', color: '#be123c' }}>MoEFCC Clearance Req.</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>OTHER / MUNICIPAL</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{otherLandAcres} Ac</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Utilities / Road RoW</div>
                </div>
              </div>

              {/* Editable Breakdown Inputs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Total Required (Ac)</label>
                  <input
                    type="number"
                    value={totalLandRequiredAcres}
                    onChange={(e) => setTotalLandRequiredAcres(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Govt Land (Ac)</label>
                  <input
                    type="number"
                    value={governmentLandRequiredAcres}
                    onChange={(e) => setGovernmentLandRequiredAcres(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Private Land (Ac)</label>
                  <input
                    type="number"
                    value={privateLandRequiredAcres}
                    onChange={(e) => setPrivateLandRequiredAcres(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Forest Land (Ac)</label>
                  <input
                    type="number"
                    value={forestProtectedLandAcres}
                    onChange={(e) => setForestProtectedLandAcres(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Other Land (Ac)</label>
                  <input
                    type="number"
                    value={otherLandAcres}
                    onChange={(e) => setOtherLandAcres(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Automatically Identified Affected Cadastral Parcels Table */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#f1f5f9', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#0a2540' }}>
                    Affected Land Parcels Schedule ({affectedParcels.length} Cadastral Parcels Auto-Identified from GIS)
                  </div>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                    ✓ Auto-linked to Sub-Registrar Jamabandi Database
                  </span>
                </div>

                <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 12px' }}>Parcel ID</th>
                        <th style={{ padding: '8px 12px' }}>Survey No.</th>
                        <th style={{ padding: '8px 12px' }}>Landowner Name</th>
                        <th style={{ padding: '8px 12px' }}>Village</th>
                        <th style={{ padding: '8px 12px' }}>Total Area</th>
                        <th style={{ padding: '8px 12px' }}>Affected Area</th>
                        <th style={{ padding: '8px 12px' }}>Category</th>
                        <th style={{ padding: '8px 12px' }}>Est. Compensation</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affectedParcels.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => setInspectedParcel(p)}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title="Click to view cadastral parcel details"
                        >
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0284c7' }}>{p.id}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{p.surveyNumber}</td>
                          <td style={{ padding: '8px 12px' }}>{p.landownerName}</td>
                          <td style={{ padding: '8px 12px' }}>{p.village}</td>
                          <td style={{ padding: '8px 12px' }}>{p.totalAreaAcres} Ac</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#9a3412' }}>{p.affectedAreaAcres} Ac</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              backgroundColor: p.landCategory === 'Government Revenue' ? '#f0fdf4' : '#fffbeb',
                              color: p.landCategory === 'Government Revenue' ? '#166534' : '#b45309'
                            }}>
                              {p.landCategory}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#166534' }}>₹{p.estimatedCompensationCr} Cr</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectedParcel(p);
                              }}
                              style={{
                                padding: '4px 8px',
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
                              <Eye size={11} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: DOCUMENTS & IMPLEMENTATION PLAN */}
          {currentStep === 5 && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0a2540' }}>
                  Step 5: Project Documents &amp; Implementation Phases
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Upload mandatory statutory reports (DPR, Feasibility, Environmental SIA) and specify project milestones.
                </p>
              </div>

              {/* Document Upload Box */}
              <form onSubmit={handleAddDocument} style={{
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '18px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Document Type *
                  </label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#ffffff' }}
                  >
                    <option value="Detailed Project Report (DPR)">Detailed Project Report (DPR)</option>
                    <option value="Project Proposal Document">Project Proposal Document</option>
                    <option value="Project Plan / Layout">Project Plan / Layout</option>
                    <option value="Feasibility Report">Feasibility Report</option>
                    <option value="Environmental Documents">Environmental Documents (SIA)</option>
                    <option value="Financial/Cost Estimate">Financial/Cost Estimate</option>
                    <option value="Land Requirement Report">Land Requirement Report</option>
                    <option value="Other Supporting Documents">Other Supporting Documents</option>
                  </select>
                </div>

                <div style={{ flex: 2, minWidth: '240px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Select File (PDF, DWG, XLSX, DOCX up to 50MB)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setNewDocFile(e.target.files?.[0] || null)}
                    style={{ fontSize: '12px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newDocFile}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: newDocFile ? '#059669' : '#cbd5e1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: newDocFile ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Upload size={14} /> Upload File
                </button>
              </form>

              {/* Uploaded Documents List */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#0a2540', marginBottom: '8px' }}>
                  Uploaded Project Documents ({documents.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '10px 14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={18} color="#0284c7" />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#0a2540' }}>{doc.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Type: <strong>{doc.type}</strong> • Size: {doc.fileSize} • Uploaded: {doc.uploadDate}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: doc.status === 'Uploaded' ? '#f0fdf4' : '#fff7ed',
                          color: doc.status === 'Uploaded' ? '#166534' : '#c2410c'
                        }}>
                          {doc.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444' }}
                          title="Remove document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposed Implementation Timeline Phases */}
              <div>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#0a2540', marginBottom: '8px' }}>
                  Proposed Implementation Schedule &amp; Milestone Phases
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {implementationPhases.map((phase) => (
                    <div
                      key={phase.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#0a2540', color: '#ffffff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {phase.phaseNumber}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#0a2540' }}>{phase.phaseName}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginLeft: '30px' }}>
                          {phase.description}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '11px' }}>
                        <div style={{ fontWeight: 700, color: '#0369a1' }}>{phase.startDate} → {phase.endDate}</div>
                        <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, marginTop: '2px', display: 'inline-block' }}>
                          {phase.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW BEFORE SUBMISSION */}
          {currentStep === 6 && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0a2540' }}>
                  Step 6: Comprehensive Review &amp; Statutory Authorization
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Review all entered details, confirm agency authorization, and formally submit proposal for Government review.
                </p>
              </div>

              {/* Review Section 1: Project Overview */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0a2540' }}>1. Project Information</div>
                  <button onClick={() => setCurrentStep(1)} style={{ color: '#0284c7', background: 'none', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                    Edit ✏️
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div><strong>Title:</strong> {projectName}</div>
                  <div><strong>Proposal ID:</strong> {proposalId}</div>
                  <div><strong>Type &amp; Category:</strong> {projectType} ({projectCategory})</div>
                  <div><strong>Priority:</strong> {projectPriority}</div>
                  <div><strong>Duration:</strong> {estimatedDurationMonths} Months ({proposedStartDate} to {proposedCompletionDate})</div>
                </div>
              </div>

              {/* Review Section 2: Location & GIS */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0a2540' }}>2. Location &amp; GIS Land Requirement</div>
                  <button onClick={() => setCurrentStep(2)} style={{ color: '#0284c7', background: 'none', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                    Edit ✏️
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div><strong>Jurisdiction:</strong> {village}, {taluka}, {district}, {state} - {pinCode}</div>
                  <div><strong>Alignment:</strong> {projectAddress}</div>
                  <div><strong>Approx Area:</strong> {approximateAreaAcres} Acres ({approximateAreaHa} Ha)</div>
                  <div><strong>Affected Parcels &amp; Owners:</strong> {affectedParcelsCount} Parcels ({affectedLandownersCount} Landowners)</div>
                </div>
              </div>

              {/* Review Section 3: Financials */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0a2540' }}>3. Financials &amp; Funding</div>
                  <button onClick={() => setCurrentStep(3)} style={{ color: '#0284c7', background: 'none', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                    Edit ✏️
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '12px' }}>
                  <div><strong>Total Cost:</strong> ₹{estimatedTotalCostCr} Cr</div>
                  <div><strong>Land Acquisition:</strong> ₹{landAcquisitionCostCr} Cr</div>
                  <div><strong>Construction:</strong> ₹{constructionCostCr} Cr</div>
                  <div><strong>Funding Source:</strong> {fundingSource}</div>
                </div>
              </div>

              {/* Review Section 4: Auto-populated Agency Details */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#0a2540', marginBottom: '8px' }}>
                  Agency Credentials (Authenticated Session)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div><strong>Agency:</strong> {agencyName} ({agencyId})</div>
                  <div><strong>Authorized Representative:</strong> {authorizedRepresentative}</div>
                  <div><strong>Official Email:</strong> {agencyEmail}</div>
                  <div><strong>Contact Phone:</strong> {contactNumber}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Registered Office:</strong> {officeAddress}</div>
                </div>
              </div>

              {/* Mandatory Declaration & Authorization */}
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#9a3412', marginBottom: '8px' }}>
                  Statutory Declaration &amp; Submission Confirmation
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    <strong>I confirm that the information and documents submitted in this project proposal are accurate and complete</strong> to the best of my knowledge and that the submitting agency is fully responsible for the proposal accuracy, spatial cadastral alignment, and statutory RFCTLARR compliance.
                  </span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                      Authorized Signatory Name *
                    </label>
                    <input
                      type="text"
                      value={authorizedSignatoryName}
                      onChange={(e) => setAuthorizedSignatoryName(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                      Designation *
                    </label>
                    <input
                      type="text"
                      value={authorizedSignatoryDesignation}
                      onChange={(e) => setAuthorizedSignatoryDesignation(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── MODAL FOOTER CONTROLS ─── */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <button
              type="button"
              onClick={handleSaveDraft}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Save size={14} /> Save as Draft
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0a2540',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !projectName.trim()) {
                    alert('Please enter a Project Name to proceed.');
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#0a2540',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Next: {stepsList[currentStep].title} <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitProposal}
                disabled={!declarationAccepted}
                style={{
                  padding: '10px 24px',
                  backgroundColor: declarationAccepted ? '#059669' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#ffffff',
                  cursor: declarationAccepted ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: declarationAccepted ? '0 4px 12px rgba(5, 150, 105, 0.4)' : 'none'
                }}
              >
                <CheckCircle2 size={16} /> Submit Proposal to Government
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cadastral Parcel Detail Modal */}
      <ParcelDetailModal
        parcel={inspectedParcel}
        isOpen={!!inspectedParcel}
        onClose={() => setInspectedParcel(null)}
      />
    </div>
  );
};

export default NewProjectProposalWizard;
