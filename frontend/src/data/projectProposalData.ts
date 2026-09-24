import { AGENCY_PROJECTS, AGENCY_AFFECTED_PARCELS, type AgencyProject } from './agencyGisData';
import { GOV_PROJECTS, type GovProject } from './governmentGisData';

export type ProposalStatus =
  | 'Draft'
  | 'Submitted – Pending Government Review'
  | 'Under Government Review'
  | 'Clarification Required'
  | 'Approved'
  | 'Rejected'
  | 'Resubmission Required';

export type ProposalWorkflowStage =
  | 'PROPOSAL_CREATED'
  | 'SUBMITTED_TO_GOVERNMENT'
  | 'GOVERNMENT_REVIEW'
  | 'CLARIFICATION_VERIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROJECT_CREATED';

export interface AffectedProposalParcel {
  id: string;
  surveyNumber: string;
  khasraNumber: string;
  landownerName: string;
  village: string;
  taluka: string;
  district: string;
  totalAreaAcres: number;
  affectedAreaAcres: number;
  landCategory: 'Private Agricultural' | 'Private Commercial' | 'Government Revenue' | 'Gaikran / Grazing' | 'Forest';
  estimatedCompensationCr: number;
  status: 'IDENTIFIED' | 'PRELIMINARY_NOTICED' | 'VERIFIED';
}

export interface ProposalDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  fileSize: string;
  status: 'Uploaded' | 'Verified' | 'Pending Review' | 'Revision Requested';
}

export interface ProposalPhase {
  id: string;
  phaseNumber: number;
  phaseName: string;
  startDate: string;
  endDate: string;
  description: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
}

export interface ClarificationRecord {
  id: string;
  message: string;
  requestedDate: string;
  requiredAction: string;
  officerName: string;
  officerDesignation: string;
  agencyResponse?: string;
  responseDate?: string;
  resolved: boolean;
}

export interface ProjectProposal {
  id: string; // e.g. PRP-2026-00125
  title: string;
  status: ProposalStatus;
  currentWorkflowStage: ProposalWorkflowStage;
  submittedDate: string;
  lastUpdated: string;

  // Step 1: Project Information
  projectType: 'Highway' | 'Airport' | 'Metro' | 'Railway' | 'Industrial Development' | 'Government Infrastructure' | 'Residential Development' | 'Commercial Development' | 'Other';
  projectCategory: string;
  projectDescription: string;
  projectObjective: string;
  projectPriority: 'High' | 'Medium' | 'Normal';
  estimatedDurationMonths: number;
  proposedStartDate: string;
  proposedCompletionDate: string;

  // Step 2: Location & GIS Selection
  state: string;
  district: string;
  taluka: string;
  village: string;
  projectAddress: string;
  pinCode: string;
  gisSelectionType: 'Polygon' | 'Line/Corridor' | 'Point';
  approximateProjectAreaAcres: number;
  approximateProjectAreaHa: number;
  affectedParcelsCount: number;
  affectedLandownersCount: number;
  corridorCoordinates: number[][][]; // GeoJSON polygon
  corridorCenter: [number, number];

  // Step 3: Project Details, Financials & Justification
  publicPurpose: string;
  expectedBenefits: string[];
  estimatedTotalCostCr: number;
  landAcquisitionCostCr: number;
  constructionCostCr: number;
  otherEstimatedCostCr: number;
  fundingSource: 'Government Funding' | 'Private Funding' | 'PPP' | 'Multilateral Funding' | 'Other';
  fundingDetails: string;
  justification: {
    existingProblem: string;
    proposedSolution: string;
    expectedImpact: string;
    publicBenefit: string;
    urgency: string;
    consequencesIfNotImplemented: string;
  };

  // Step 4: Land Requirement & Affected Parcels
  totalLandRequiredAcres: number;
  governmentLandRequiredAcres: number;
  privateLandRequiredAcres: number;
  forestProtectedLandAcres: number;
  otherLandAcres: number;
  affectedParcels: AffectedProposalParcel[];

  // Step 5: Documents & Implementation Plan
  documents: ProposalDocument[];
  implementationPhases: ProposalPhase[];

  // Step 6: Agency Details, Declaration & Authorization
  agencyDetails: {
    agencyName: string;
    agencyId: string;
    department: string;
    authorizedRepresentative: string;
    contactNumber: string;
    email: string;
    officeAddress: string;
  };
  declarationAccepted: boolean;
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
  digitalSignatureAcknowledged: boolean;

  // Review & Workflow Logs
  clarificationRequests: ClarificationRecord[];
  governmentReviewNotes?: string;
  reviewedByOfficer?: string;
  approvedProjectId?: string; // Populated when approved, linking to GIS!
}

const STORAGE_KEY = 'bhoomi_project_proposals';

// Initial Sample Proposals demonstrating diverse stages (Submitted, Clarification Required, Approved, Draft)
export const INITIAL_PROPOSALS: ProjectProposal[] = [
  {
    id: 'PRP-2026-00125',
    title: 'Pune–Nashik Semi High-Speed Rail Corridor (Phase I)',
    status: 'Submitted – Pending Government Review',
    currentWorkflowStage: 'SUBMITTED_TO_GOVERNMENT',
    submittedDate: '23/09/2026',
    lastUpdated: '23/09/2026, 14:30',

    projectType: 'Railway',
    projectCategory: 'High-Speed Rail Infrastructure',
    projectDescription: 'Construction of a dedicated 235 km greenfield semi high-speed broad-gauge rail corridor connecting Pune, Ahmednagar, and Nashik to reduce passenger transit time from 6 hours to 105 minutes.',
    projectObjective: 'Catalyze agro-industrial logistics and passenger commute across western Maharashtra manufacturing hubs.',
    projectPriority: 'High',
    estimatedDurationMonths: 48,
    proposedStartDate: '2027-01-15',
    proposedCompletionDate: '2031-01-15',

    state: 'Maharashtra',
    district: 'Pune',
    taluka: 'Haveli & Shirur',
    village: 'Chakan, Alandi & Bhosari',
    projectAddress: 'Chakan Industrial Node to Nashik Border Alignment',
    pinCode: '410501',
    gisSelectionType: 'Line/Corridor',
    approximateProjectAreaAcres: 312.5,
    approximateProjectAreaHa: 126.4,
    affectedParcelsCount: 84,
    affectedLandownersCount: 68,
    corridorCoordinates: [[
      [73.8500, 18.7500],
      [73.8900, 18.7700],
      [73.9200, 18.8200],
      [73.8800, 18.8400],
      [73.8500, 18.7500]
    ]],
    corridorCenter: [73.8750, 18.7800],

    publicPurpose: 'National logistics acceleration and regional high-speed passenger rail transport under National Rail Plan 2030.',
    expectedBenefits: ['Transportation improvement', 'Connectivity', 'Employment', 'Economic development', 'Infrastructure development'],
    estimatedTotalCostCr: 16039.0,
    landAcquisitionCostCr: 2850.0,
    constructionCostCr: 11400.0,
    otherEstimatedCostCr: 1789.0,
    fundingSource: 'PPP',
    fundingDetails: 'Equity participation by Government of Maharashtra (20%), Ministry of Railways (20%), and Bilateral Debt Financing (60%).',
    justification: {
      existingProblem: 'Heavy vehicular congestion on Pune-Nashik NH-60 resulting in severe freight delays and road accidents.',
      proposedSolution: 'Dedicated double-line electrified corridor with automated train protection and multimodal logistics hubs.',
      expectedImpact: 'Direct connectivity for automobile & electronics clusters in Chakan-Talegaon to northern consumption centers.',
      publicBenefit: 'Over 85,000 daily commuters served; estimated 3.2 million metric tons freight capacity annually.',
      urgency: 'Crucial for decongesting Pune metropolitan transit before 2028 industrial expansion.',
      consequencesIfNotImplemented: 'Freight gridlock will increase logistics overheads by 34% and exacerbate carbon emissions.'
    },

    totalLandRequiredAcres: 312.5,
    governmentLandRequiredAcres: 68.0,
    privateLandRequiredAcres: 228.5,
    forestProtectedLandAcres: 16.0,
    otherLandAcres: 0.0,
    affectedParcels: [
      {
        id: 'PRP-PARCEL-01',
        surveyNumber: '112/1A',
        khasraNumber: 'KH-112',
        landownerName: 'Vikas Tukaram Patil',
        village: 'Chakan',
        taluka: 'Haveli',
        district: 'Pune',
        totalAreaAcres: 4.8,
        affectedAreaAcres: 3.2,
        landCategory: 'Private Agricultural',
        estimatedCompensationCr: 1.44,
        status: 'IDENTIFIED'
      },
      {
        id: 'PRP-PARCEL-02',
        surveyNumber: '114/2',
        khasraNumber: 'KH-114',
        landownerName: 'Suman Baburao Kadam',
        village: 'Chakan',
        taluka: 'Haveli',
        district: 'Pune',
        totalAreaAcres: 2.5,
        affectedAreaAcres: 2.1,
        landCategory: 'Private Agricultural',
        estimatedCompensationCr: 0.94,
        status: 'IDENTIFIED'
      },
      {
        id: 'PRP-PARCEL-03',
        surveyNumber: '118/Gov',
        khasraNumber: 'KH-118',
        landownerName: 'Maharashtra Revenue Dept (Gaikran)',
        village: 'Chakan',
        taluka: 'Haveli',
        district: 'Pune',
        totalAreaAcres: 18.0,
        affectedAreaAcres: 14.5,
        landCategory: 'Government Revenue',
        estimatedCompensationCr: 0.0,
        status: 'IDENTIFIED'
      }
    ],

    documents: [
      { id: 'DOC-PRP-01', name: 'Detailed_Project_Report_DPR_PuneNashik.pdf', type: 'Detailed Project Report (DPR)', uploadDate: '23/09/2026', fileSize: '14.2 MB', status: 'Uploaded' },
      { id: 'DOC-PRP-02', name: 'Alignment_Corridor_Map_GIS_Export.dwg', type: 'Project Plan / Layout', uploadDate: '23/09/2026', fileSize: '8.6 MB', status: 'Uploaded' },
      { id: 'DOC-PRP-03', name: 'Social_Impact_Assessment_Preliminary_SIA.pdf', type: 'Environmental Documents', uploadDate: '23/09/2026', fileSize: '5.1 MB', status: 'Uploaded' },
      { id: 'DOC-PRP-04', name: 'Land_Acquisition_Schedule_RFCTLARR.xlsx', type: 'Land Requirement Report', uploadDate: '23/09/2026', fileSize: '2.4 MB', status: 'Uploaded' }
    ],

    implementationPhases: [
      { id: 'PH-1', phaseNumber: 1, phaseName: 'Planning & Statutory Gazette Notifications', startDate: '2027-01-15', endDate: '2027-07-31', description: 'RFCTLARR Section 11 publication and joint measurement survey.', status: 'Upcoming' },
      { id: 'PH-2', phaseNumber: 2, phaseName: 'Land Acquisition & Award Solatium Disbursement', startDate: '2027-08-01', endDate: '2028-09-30', description: 'Direct purchase committee hearings, award declaration, and R&R settlement.', status: 'Upcoming' },
      { id: 'PH-3', phaseNumber: 3, phaseName: 'Civil Construction & Track Laying', startDate: '2028-10-01', endDate: '2030-10-31', description: 'Viaducts, rail bed grading, signaling, and station architecture.', status: 'Upcoming' },
      { id: 'PH-4', phaseNumber: 4, phaseName: 'Trial Runs & Commissioning', startDate: '2030-11-01', endDate: '2031-01-15', description: 'CRS safety certification and commercial operational launch.', status: 'Upcoming' }
    ],

    agencyDetails: {
      agencyName: 'Maharashtra Rail Infrastructure Development Corporation (MahaRail)',
      agencyId: 'MAHARAIL-ORG-2026',
      department: 'Infrastructure & High-Speed Transit Division',
      authorizedRepresentative: 'Rajesh Kumar Agarwal (General Manager - Civil)',
      contactNumber: '+91 22 2658 9100',
      email: 'gm.civil@maharail.com',
      officeAddress: '2nd Floor, Hoechst House, Nariman Point, Mumbai 400021'
    },
    declarationAccepted: true,
    authorizedSignatoryName: 'Rajesh Kumar Agarwal',
    authorizedSignatoryDesignation: 'General Manager (Civil Infrastructure)',
    digitalSignatureAcknowledged: true,
    clarificationRequests: []
  },
  {
    id: 'PRP-2026-00124',
    title: 'Thane-Borivali Twin Tunnel Infrastructure Link',
    status: 'Clarification Required',
    currentWorkflowStage: 'CLARIFICATION_VERIFICATION',
    submittedDate: '18/09/2026',
    lastUpdated: '21/09/2026, 11:20',

    projectType: 'Highway',
    projectCategory: 'Sub-surface Urban Expressway',
    projectDescription: 'Twin 3-lane tunnels of 11.8 km length passing underneath Sanjay Gandhi National Park, cutting travel time from 2 hours to 15 minutes.',
    projectObjective: 'Decongest Ghodbunder Road and Western Express Highway.',
    projectPriority: 'High',
    estimatedDurationMonths: 60,
    proposedStartDate: '2026-11-01',
    proposedCompletionDate: '2031-10-31',

    state: 'Maharashtra',
    district: 'Thane',
    taluka: 'Thane Urban & Borivali',
    village: 'Yeoor, Magathane & Tikuji-ni-wadi',
    projectAddress: 'Tikuji-ni-wadi (Thane) to Western Express Highway (Borivali)',
    pinCode: '400607',
    gisSelectionType: 'Line/Corridor',
    approximateProjectAreaAcres: 88.0,
    approximateProjectAreaHa: 35.6,
    affectedParcelsCount: 32,
    affectedLandownersCount: 28,
    corridorCoordinates: [[
      [72.9600, 19.2300],
      [72.8700, 19.2300],
      [72.8700, 19.2450],
      [72.9600, 19.2450],
      [72.9600, 19.2300]
    ]],
    corridorCenter: [72.9150, 19.2370],

    publicPurpose: 'Major urban bottleneck alleviation under Mumbai Metropolitan Regional Transport Plan.',
    expectedBenefits: ['Transportation improvement', 'Connectivity', 'Economic development'],
    estimatedTotalCostCr: 18838.0,
    landAcquisitionCostCr: 1250.0,
    constructionCostCr: 16200.0,
    otherEstimatedCostCr: 1388.0,
    fundingSource: 'Government Funding',
    fundingDetails: 'MMRDA Infrastructure Fund and State Government Budgetary Allocation.',
    justification: {
      existingProblem: 'Ghodbunder Road peak traffic jam exceeds 3 hours with severe vehicular emissions.',
      proposedSolution: 'Direct sub-surface tunnel alignment bypassing surface national park flora and fauna.',
      expectedImpact: 'Reduces commute distance by 12 km and fuel wastage by 10 million liters/year.',
      publicBenefit: 'Over 120,000 daily passenger cars accommodated.',
      urgency: 'Critical regional bottleneck relief.',
      consequencesIfNotImplemented: 'Total gridlock on northern Mumbai entry corridors by 2027.'
    },

    totalLandRequiredAcres: 88.0,
    governmentLandRequiredAcres: 72.0,
    privateLandRequiredAcres: 16.0,
    forestProtectedLandAcres: 44.0,
    otherLandAcres: 0.0,
    affectedParcels: [
      {
        id: 'PRP-PARCEL-TB-01',
        surveyNumber: '45/1',
        khasraNumber: 'KH-45',
        landownerName: 'Sunil Rameshwar Gupta',
        village: 'Yeoor',
        taluka: 'Thane',
        district: 'Thane',
        totalAreaAcres: 3.0,
        affectedAreaAcres: 1.2,
        landCategory: 'Private Commercial',
        estimatedCompensationCr: 2.1,
        status: 'IDENTIFIED'
      }
    ],

    documents: [
      { id: 'DOC-TB-01', name: 'MMRDA_Twin_Tunnel_DPR.pdf', type: 'Detailed Project Report (DPR)', uploadDate: '18/09/2026', fileSize: '18.4 MB', status: 'Uploaded' },
      { id: 'DOC-TB-02', name: 'Forest_Clearance_Stage_I_Proposal.pdf', type: 'Environmental Documents', uploadDate: '18/09/2026', fileSize: '9.2 MB', status: 'Revision Requested' }
    ],

    implementationPhases: [
      { id: 'PH-TB-1', phaseNumber: 1, phaseName: 'Tunnel Boring Machine (TBM) Mobilization', startDate: '2026-11-01', endDate: '2027-04-30', description: 'Shaft sinking and TBM assembly at Borivali and Thane portals.', status: 'Upcoming' }
    ],

    agencyDetails: {
      agencyName: 'Mumbai Metropolitan Region Development Authority (MMRDA)',
      agencyId: 'MMRDA-ORG-2026',
      department: 'Engineering & Highway Projects Cell',
      authorizedRepresentative: 'Anil Kumar Gaikwad (Superintending Engineer)',
      contactNumber: '+91 22 2659 0001',
      email: 'se.highway@mmrda.maharashtra.gov.in',
      officeAddress: 'MMRDA Building, Bandra-Kurla Complex, Bandra (E), Mumbai 400051'
    },
    declarationAccepted: true,
    authorizedSignatoryName: 'Anil Kumar Gaikwad',
    authorizedSignatoryDesignation: 'Superintending Engineer',
    digitalSignatureAcknowledged: true,

    clarificationRequests: [
      {
        id: 'CLR-01',
        message: 'Please upload the revised DGPS cadastral survey map showing exact portal boundary at Borivali shaft and provide Chief Wildlife Warden clearance status under Wildlife Protection Act 1972.',
        requestedDate: '21/09/2026, 11:20',
        requiredAction: 'Upload revised Wildlife Clearance Affidavit and updated boundary coordinates.',
        officerName: 'Dr. Rajesh Sharma, IAS',
        officerDesignation: 'District Collector & Competent Authority',
        resolved: false
      }
    ]
  },
  {
    id: 'PRP-2026-00120',
    title: 'Nagpur Multi-Modal Logistics Hub & Dry Port Expansion',
    status: 'Approved',
    currentWorkflowStage: 'PROJECT_CREATED',
    submittedDate: '05/08/2026',
    lastUpdated: '15/09/2026, 16:45',

    projectType: 'Industrial Development',
    projectCategory: 'Multi-Modal Logistics Park (MMLP)',
    projectDescription: 'Development of 150-acre integrated multimodal freight hub with rail sidings, cold chain warehouses, and container terminal at MIHAN, Nagpur.',
    projectObjective: 'Transform Vidarbha into central India logistics gateway.',
    projectPriority: 'High',
    estimatedDurationMonths: 36,
    proposedStartDate: '2026-10-01',
    proposedCompletionDate: '2029-09-30',

    state: 'Maharashtra',
    district: 'Nagpur',
    taluka: 'Nagpur Rural',
    village: 'Dahegaon & Shivangaon',
    projectAddress: 'MIHAN Special Economic Zone South Boundary',
    pinCode: '441108',
    gisSelectionType: 'Polygon',
    approximateProjectAreaAcres: 150.0,
    approximateProjectAreaHa: 60.7,
    affectedParcelsCount: 42,
    affectedLandownersCount: 35,
    corridorCoordinates: [[
      [79.0200, 21.0500],
      [79.0500, 21.0500],
      [79.0500, 21.0750],
      [79.0200, 21.0750],
      [79.0200, 21.0500]
    ]],
    corridorCenter: [79.0350, 21.0620],

    publicPurpose: 'National logistics integration under PM Gati Shakti National Master Plan.',
    expectedBenefits: ['Transportation improvement', 'Connectivity', 'Employment', 'Economic development'],
    estimatedTotalCostCr: 1250.0,
    landAcquisitionCostCr: 320.0,
    constructionCostCr: 810.0,
    otherEstimatedCostCr: 120.0,
    fundingSource: 'PPP',
    fundingDetails: 'National Highways Logistics Management Limited (NHLML) & State Joint Venture.',
    justification: {
      existingProblem: 'Insufficient storage and lack of direct broad-gauge rail sidings at central transit points.',
      proposedSolution: 'State-of-the-art container terminal with bonded warehouse facility.',
      expectedImpact: 'Lowers logistics cost by 14% and creates 4,500 direct regional jobs.',
      publicBenefit: 'Serves agricultural and industrial exporters across Maharashtra and MP.',
      urgency: 'Scheduled for completion prior to dedicated freight rail link.',
      consequencesIfNotImplemented: 'Loss of inter-state freight transit revenue.'
    },

    totalLandRequiredAcres: 150.0,
    governmentLandRequiredAcres: 95.0,
    privateLandRequiredAcres: 55.0,
    forestProtectedLandAcres: 0.0,
    otherLandAcres: 0.0,
    affectedParcels: [],
    documents: [],
    implementationPhases: [],

    agencyDetails: {
      agencyName: 'National Highways Logistics Management Limited (NHLML)',
      agencyId: 'NHLML-ORG-2026',
      department: 'Logistics Parks Division',
      authorizedRepresentative: 'Suresh Chandra Panda (Project Director)',
      contactNumber: '+91 712 254 9900',
      email: 'pd.nagpur@nhlml.gov.in',
      officeAddress: 'MIHAN Administrative Building, Nagpur 441108'
    },
    declarationAccepted: true,
    authorizedSignatoryName: 'Suresh Chandra Panda',
    authorizedSignatoryDesignation: 'Project Director',
    digitalSignatureAcknowledged: true,
    clarificationRequests: [],
    approvedProjectId: 'PRJ-MMLP-007'
  }
];

// Helper to get stored proposals with fallback
export const getStoredProposals = (): ProjectProposal[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading stored proposals from localStorage:', e);
  }
  // Initialize with sample proposals
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROPOSALS));
  } catch (e) {
    // Ignore storage quota
  }
  return INITIAL_PROPOSALS;
};

// Helper to save all proposals
export const saveProposals = (proposals: ProjectProposal[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
  } catch (e) {
    console.error('Error saving proposals to localStorage:', e);
  }
};

// Generate a clean next proposal ID
export const generateNextProposalId = (): string => {
  const current = getStoredProposals();
  const nextNum = 125 + current.length + 1;
  return `PRP-2026-00${nextNum}`;
};

// Submit or save a proposal
export const submitOrUpdateProposal = (proposal: ProjectProposal): ProjectProposal => {
  const all = getStoredProposals();
  const existingIdx = all.findIndex(p => p.id === proposal.id);
  let updatedList: ProjectProposal[];

  if (existingIdx >= 0) {
    updatedList = [...all];
    updatedList[existingIdx] = proposal;
  } else {
    updatedList = [proposal, ...all];
  }

  saveProposals(updatedList);
  return proposal;
};

// Government Officer Clarification Request action
export const sendProposalClarification = (
  proposalId: string,
  message: string,
  requiredAction: string,
  officerName: string,
  officerDesignation: string
): ProjectProposal | null => {
  const all = getStoredProposals();
  const p = all.find(x => x.id === proposalId);
  if (!p) return null;

  const now = new Date().toLocaleString();
  const newClarification: ClarificationRecord = {
    id: `CLR-${Date.now()}`,
    message,
    requestedDate: now,
    requiredAction,
    officerName,
    officerDesignation,
    resolved: false
  };

  const updated: ProjectProposal = {
    ...p,
    status: 'Clarification Required',
    currentWorkflowStage: 'CLARIFICATION_VERIFICATION',
    lastUpdated: now,
    clarificationRequests: [newClarification, ...(p.clarificationRequests || [])]
  };

  submitOrUpdateProposal(updated);
  return updated;
};

// Government Officer Approval action (connects to GIS!)
export const approveProposalAndCreateProject = (
  proposalId: string,
  officerName: string,
  officerDesignation: string,
  remarks: string
): { proposal: ProjectProposal; newProjectId: string } | null => {
  const all = getStoredProposals();
  const p = all.find(x => x.id === proposalId);
  if (!p) return null;

  const now = new Date().toLocaleString();
  const newProjectId = `PRJ-${p.projectType.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const updated: ProjectProposal = {
    ...p,
    status: 'Approved',
    currentWorkflowStage: 'PROJECT_CREATED',
    lastUpdated: now,
    reviewedByOfficer: `${officerName} (${officerDesignation})`,
    governmentReviewNotes: remarks || 'Project proposal approved under statutory development scheme.',
    approvedProjectId: newProjectId
  };

  // Connect into Agency GIS & Government GIS by creating a new active project object
  const newProjectEntry: AgencyProject = {
    id: newProjectId,
    code: `APPR-${p.id.slice(-5)}`,
    name: p.title,
    type: p.projectType === 'Railway' ? 'Railway' : p.projectType === 'Airport' ? 'Airport' : p.projectType === 'Metro' ? 'Metro Rail' : p.projectType === 'Highway' ? 'Highway' : 'Industrial',
    agency: p.agencyDetails.agencyName,
    agencyCode: p.agencyDetails.agencyId,
    status: 'In Progress',
    location: `${p.village}, ${p.taluka}, ${p.district}`,
    district: p.district,
    state: p.state,
    totalAreaHa: p.approximateProjectAreaHa,
    totalAreaAcres: p.approximateProjectAreaAcres,
    totalParcels: p.affectedParcelsCount,
    totalLandowners: p.affectedLandownersCount,
    requiredLandAcres: p.totalLandRequiredAcres,
    acquiredLandAcres: 0.0,
    pendingLandAcres: p.totalLandRequiredAcres,
    compensationPendingCount: p.affectedLandownersCount,
    documentsPendingCount: p.affectedParcelsCount,
    totalCompensationBudgetCr: p.landAcquisitionCostCr,
    disbursedCompensationCr: 0.0,
    center: p.corridorCenter,
    zoom: 14.5,
    corridorGeoJSON: {
      type: 'Polygon',
      coordinates: p.corridorCoordinates
    }
  };

  // Add to in-memory agency and gov projects
  AGENCY_PROJECTS.unshift(newProjectEntry);
  const govProjectEntry: GovProject = {
    ...newProjectEntry,
    govStatus: 'Land Acquisition Started',
    taluka: p.taluka,
    disputedParcelsCount: 0,
    collectorApprovalPendingCount: p.affectedParcelsCount,
    priorityScore: 70,
    estimatedCompletionDate: p.proposedCompletionDate,
    nodalOfficer: {
      name: officerName,
      designation: officerDesignation,
      contact: 'cala.approval@gov.in'
    }
  };
  GOV_PROJECTS.unshift(govProjectEntry);

  submitOrUpdateProposal(updated);
  return { proposal: updated, newProjectId };
};

// Government Officer Rejection action
export const rejectProposal = (
  proposalId: string,
  officerName: string,
  officerDesignation: string,
  rejectionReason: string
): ProjectProposal | null => {
  const all = getStoredProposals();
  const p = all.find(x => x.id === proposalId);
  if (!p) return null;

  const now = new Date().toLocaleString();
  const updated: ProjectProposal = {
    ...p,
    status: 'Rejected',
    currentWorkflowStage: 'REJECTED',
    lastUpdated: now,
    reviewedByOfficer: `${officerName} (${officerDesignation})`,
    governmentReviewNotes: rejectionReason || 'Proposal rejected by Competent Authority under statutory provisions.'
  };

  submitOrUpdateProposal(updated);
  return updated;
};

// Sync any existing approved proposals into AGENCY_PROJECTS and GOV_PROJECTS
export const syncApprovedProposalsToGis = (): void => {
  try {
    const all = getStoredProposals();
    const approved = all.filter(p => p.status === 'Approved' && p.approvedProjectId);
    for (const p of approved) {
      if (!AGENCY_PROJECTS.some(x => x.id === p.approvedProjectId)) {
        const newProjectEntry: AgencyProject = {
          id: p.approvedProjectId!,
          code: `APPR-${p.id.slice(-5)}`,
          name: p.title,
          type: p.projectType === 'Railway' ? 'Railway' : p.projectType === 'Airport' ? 'Airport' : p.projectType === 'Metro' ? 'Metro Rail' : p.projectType === 'Highway' ? 'Highway' : 'Industrial',
          agency: p.agencyDetails.agencyName,
          agencyCode: p.agencyDetails.agencyId,
          status: 'In Progress',
          location: `${p.village}, ${p.taluka}, ${p.district}`,
          district: p.district,
          state: p.state,
          totalAreaHa: p.approximateProjectAreaHa,
          totalAreaAcres: p.approximateProjectAreaAcres,
          totalParcels: p.affectedParcelsCount,
          totalLandowners: p.affectedLandownersCount,
          requiredLandAcres: p.totalLandRequiredAcres,
          acquiredLandAcres: 0.0,
          pendingLandAcres: p.totalLandRequiredAcres,
          compensationPendingCount: p.affectedLandownersCount,
          documentsPendingCount: p.affectedParcelsCount,
          totalCompensationBudgetCr: p.landAcquisitionCostCr,
          disbursedCompensationCr: 0.0,
          center: p.corridorCenter,
          zoom: 14.5,
          corridorGeoJSON: {
            type: 'Polygon',
            coordinates: p.corridorCoordinates
          }
        };
        AGENCY_PROJECTS.unshift(newProjectEntry);
        const govProjectEntry: GovProject = {
          ...newProjectEntry,
          govStatus: 'Land Acquisition Started',
          taluka: p.taluka,
          disputedParcelsCount: 0,
          collectorApprovalPendingCount: p.affectedParcelsCount,
          priorityScore: 70,
          estimatedCompletionDate: p.proposedCompletionDate,
          nodalOfficer: {
            name: p.reviewedByOfficer || 'Competent Authority',
            designation: 'CALA / Revenue Officer',
            contact: 'cala.approval@gov.in'
          }
        };
        GOV_PROJECTS.unshift(govProjectEntry);
      }
    }
  } catch (e) {
    console.warn('Error syncing approved proposals to GIS:', e);
  }
};

// Initial sync call on module load
syncApprovedProposalsToGis();
