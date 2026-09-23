import {
  AGENCY_PROJECTS,
  AGENCY_AFFECTED_PARCELS,
  type AgencyProject,
  type AffectedParcel,
  type AcquisitionStatus,
  type CompensationStatus,
  type DocumentVerificationStatus
} from './agencyGisData';

export type GovProjectStatus =
  | 'Planning'
  | 'Land Acquisition Started'
  | 'Under Verification'
  | 'In Progress'
  | 'Delayed'
  | 'Completed';

export type GovAlertCategory =
  | 'DOCUMENTS_PENDING'
  | 'VERIFICATION_PENDING'
  | 'COMPENSATION_PENDING'
  | 'COLLECTOR_APPROVAL_PENDING'
  | 'DISPUTED_LAND'
  | 'ACQUISITION_DELAYED'
  | 'AGENCY_ACTION_PENDING'
  | 'LANDOWNER_RESPONSE_PENDING';

export interface GovAlertItem {
  id: string;
  category: GovAlertCategory;
  categoryLabel: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  parcelId?: string;
  surveyNumber?: string;
  landownerName?: string;
  village: string;
  district: string;
  state: string;
  daysPending: number;
  center: [number, number]; // [lng, lat]
}

export interface GovProject extends AgencyProject {
  govStatus: GovProjectStatus;
  taluka: string;
  disputedParcelsCount: number;
  collectorApprovalPendingCount: number;
  priorityScore: number; // 1-100, factual calculation based on delay + disputes + pending area
  estimatedCompletionDate: string;
  nodalOfficer: {
    name: string;
    designation: string;
    contact: string;
  };
}

export interface GovParcel extends AffectedParcel {
  disputeStatus: 'NONE' | 'TITLE_DISPUTE' | 'COURT_STAY' | 'COMPENSATION_DISPUTE' | 'BOUNDARY_OVERLAP';
  disputeDetails?: string;
  courtCaseNumber?: string;
  collectorApprovalStatus: 'APPROVED' | 'PENDING' | 'HEARING_SCHEDULED' | 'REJECTED';
  siaStatus: 'COMPLETED' | 'PUBLIC_HEARING' | 'EXEMPTED';
  marketRatePerAcre: number;
  solatiumMultiplier: number;
  activeAlerts: GovAlertCategory[];
}

// Convert Agency projects to Government monitored projects
export const GOV_PROJECTS: GovProject[] = [
  {
    ...AGENCY_PROJECTS[0], // Mumbai–Pune Highway
    govStatus: 'In Progress',
    taluka: 'Mulshi & Haveli',
    disputedParcelsCount: 8,
    collectorApprovalPendingCount: 14,
    priorityScore: 78,
    estimatedCompletionDate: '2027-03-31',
    nodalOfficer: {
      name: 'Dr. Suhas Diwase, IAS',
      designation: 'District Collector & Competent Authority (CALA), Pune',
      contact: 'collector.pune@maharashtra.gov.in'
    }
  },
  {
    ...AGENCY_PROJECTS[1], // Navi Mumbai International Airport
    govStatus: 'Under Verification',
    taluka: 'Panvel',
    disputedParcelsCount: 12,
    collectorApprovalPendingCount: 22,
    priorityScore: 84,
    estimatedCompletionDate: '2026-12-31',
    nodalOfficer: {
      name: 'Kishan Mundhe, IAS',
      designation: 'Collector & District Magistrate, Raigad-Alibag',
      contact: 'collector.raigad@maharashtra.gov.in'
    }
  },
  {
    ...AGENCY_PROJECTS[2], // Pune Metro Rail Line 3
    govStatus: 'In Progress',
    taluka: 'Haveli',
    disputedParcelsCount: 4,
    collectorApprovalPendingCount: 7,
    priorityScore: 62,
    estimatedCompletionDate: '2027-08-15',
    nodalOfficer: {
      name: 'Nitin Patil, IAS',
      designation: 'Special Land Acquisition Officer (Metro Cell), Pune',
      contact: 'slao.metro@punecollectorate.gov.in'
    }
  },
  {
    ...AGENCY_PROJECTS[3], // Dedicated Freight Corridor - Vadodara
    govStatus: 'Delayed',
    taluka: 'Vadodara Rural',
    disputedParcelsCount: 17,
    collectorApprovalPendingCount: 29,
    priorityScore: 91,
    estimatedCompletionDate: '2027-11-30',
    nodalOfficer: {
      name: 'Bhargavi Dave, IAS',
      designation: 'Collector & District Magistrate, Vadodara',
      contact: 'collector-vad@gujarat.gov.in'
    }
  },
  {
    ...AGENCY_PROJECTS[4], // Bengaluru–Chennai Industrial Corridor Node
    govStatus: 'Land Acquisition Started',
    taluka: 'Devanahalli',
    disputedParcelsCount: 9,
    collectorApprovalPendingCount: 18,
    priorityScore: 69,
    estimatedCompletionDate: '2028-06-30',
    nodalOfficer: {
      name: 'N. Manjushree, IAS',
      designation: 'Deputy Commissioner & CALA, Bengaluru Rural',
      contact: 'dc-bengalururural@karnataka.gov.in'
    }
  },
  {
    ...AGENCY_PROJECTS[5], // Amravati Smart City Development Phase 1
    govStatus: 'Planning',
    taluka: 'Amravati Urban',
    disputedParcelsCount: 3,
    collectorApprovalPendingCount: 9,
    priorityScore: 45,
    estimatedCompletionDate: '2029-01-31',
    nodalOfficer: {
      name: 'Pavana Murthy, IAS',
      designation: 'District Collector & Magistrate, Amravati',
      contact: 'collector.amravati@ap.gov.in'
    }
  }
];

// Convert Agency parcels to Government monitored parcels with disputes & statutory attributes
export const GOV_PARCELS: GovParcel[] = AGENCY_AFFECTED_PARCELS.map((p, idx) => {
  let disputeStatus: GovParcel['disputeStatus'] = 'NONE';
  let disputeDetails: string | undefined = undefined;
  let courtCaseNumber: string | undefined = undefined;
  let collectorApprovalStatus: GovParcel['collectorApprovalStatus'] = 'APPROVED';
  const activeAlerts: GovAlertCategory[] = [];

  // Realistic variation based on parcel attributes
  if (p.encumbranceStatus === 'DISPUTED' || idx % 7 === 3) {
    disputeStatus = idx % 2 === 0 ? 'TITLE_DISPUTE' : 'COURT_STAY';
    disputeDetails = disputeStatus === 'TITLE_DISPUTE'
      ? 'Co-heir objection regarding ancestral partition registered under Section 64'
      : 'Interim injunction granted by Civil Court Senior Division pending title verification';
    courtCaseNumber = `CS/REV/${2024 + (idx % 3)}/${100 + idx}`;
    activeAlerts.push('DISPUTED_LAND');
  }

  if (p.acquisitionStatus === 'PENDING' || p.acquisitionStatus === 'UNDER_VERIFICATION') {
    collectorApprovalStatus = 'PENDING';
    activeAlerts.push('COLLECTOR_APPROVAL_PENDING');
  }

  if (p.compensationStatus === 'PENDING' || p.compensationStatus === 'CALCULATED') {
    activeAlerts.push('COMPENSATION_PENDING');
  }

  if (p.documentStatus === 'PENDING' || p.documentStatus === 'NOT_SUBMITTED' || p.documentStatus === 'UNDER_REVIEW') {
    activeAlerts.push('DOCUMENTS_PENDING');
  }

  if (p.acquisitionStatus === 'UNDER_VERIFICATION') {
    activeAlerts.push('VERIFICATION_PENDING');
  }

  // Delay simulation for specific projects
  if (p.projectId === 'PRJ-RLY-004' && (idx % 3 === 0)) {
    activeAlerts.push('ACQUISITION_DELAYED');
  }

  return {
    ...p,
    disputeStatus,
    disputeDetails,
    courtCaseNumber,
    collectorApprovalStatus,
    siaStatus: 'COMPLETED',
    marketRatePerAcre: 4500000 + (idx * 150000),
    solatiumMultiplier: 2.0, // RFCTLARR 100% solatium for rural
    activeAlerts
  };
});

// Category metadata for alerts
export const ALERT_CATEGORIES_CONFIG: Record<GovAlertCategory, { label: string; color: string; bg: string; border: string }> = {
  DOCUMENTS_PENDING: { label: 'Documents Pending', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  VERIFICATION_PENDING: { label: 'Verification Pending', color: '#d97706', bg: '#fffbeb', border: '#fed7aa' },
  COMPENSATION_PENDING: { label: 'Compensation Pending', color: '#ca8a04', bg: '#fefce8', border: '#fef08a' },
  COLLECTOR_APPROVAL_PENDING: { label: 'Collector Approval Pending', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  DISPUTED_LAND: { label: 'Disputed Land', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  ACQUISITION_DELAYED: { label: 'Acquisition Delayed', color: '#991b1b', bg: '#fff1f2', border: '#fda4af' },
  AGENCY_ACTION_PENDING: { label: 'Agency Action Pending', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5' },
  LANDOWNER_RESPONSE_PENDING: { label: 'Landowner Response Pending', color: '#4f46e5', bg: '#eef2ff', border: '#e0e7ff' }
};

// Generate comprehensive list of alert events for the monitoring layer
export const GOV_ALERT_ITEMS: GovAlertItem[] = (() => {
  const alerts: GovAlertItem[] = [];
  GOV_PARCELS.forEach((parcel) => {
    parcel.activeAlerts.forEach((cat) => {
      const config = ALERT_CATEGORIES_CONFIG[cat];
      const days = cat === 'DISPUTED_LAND' ? 180 + (parcel.id.charCodeAt(3) * 2) : 35 + (parcel.id.charCodeAt(3) % 45);
      const sev = cat === 'DISPUTED_LAND' || cat === 'ACQUISITION_DELAYED' ? 'HIGH' : cat === 'COMPENSATION_PENDING' ? 'MEDIUM' : 'LOW';

      alerts.push({
        id: `ALT-${parcel.id}-${cat}`,
        category: cat,
        categoryLabel: config.label,
        severity: sev,
        title: `${config.label} on S.No ${parcel.surveyNumber}`,
        description: parcel.disputeDetails || `Statutory clearance stage [${parcel.currentStage}] pending action in ${parcel.village}, ${parcel.district}.`,
        projectId: parcel.projectId,
        projectName: parcel.projectName,
        parcelId: parcel.id,
        surveyNumber: parcel.surveyNumber,
        landownerName: parcel.landownerName,
        village: parcel.village,
        district: parcel.district,
        state: parcel.state,
        daysPending: days,
        center: parcel.centroid
      });
    });
  });
  return alerts;
})();

// Priority Areas Requiring Attention (Factual indicators based on pending land, disputes, and delayed acquisition)
export interface PriorityHotspot {
  id: string;
  projectId: string;
  projectName: string;
  district: string;
  state: string;
  type: string;
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
  reason: string;
  pendingAcres: number;
  disputedParcels: number;
  pendingCompensationCr: number;
  center: [number, number];
  zoom: number;
}

export const PRIORITY_HOTSPOTS: PriorityHotspot[] = [
  {
    id: 'HOT-001',
    projectId: 'PRJ-RLY-004',
    projectName: 'Dedicated Freight Corridor — Vadodara Section',
    district: 'Vadodara',
    state: 'Gujarat',
    type: 'Acquisition Delay & Title Injunctions',
    urgencyLevel: 'CRITICAL',
    reason: '17 land parcels entangled in revenue civil appeals exceeding 180 days; 94.2 Acres pending handover for rail track laying.',
    pendingAcres: 94.2,
    disputedParcels: 17,
    pendingCompensationCr: 28.4,
    center: [73.1800, 22.3420],
    zoom: 14.8
  },
  {
    id: 'HOT-002',
    projectId: 'PRJ-AIR-002',
    projectName: 'Navi Mumbai International Airport Development',
    district: 'Raigad',
    state: 'Maharashtra',
    type: 'High Compensation & R&R Disbursement Queue',
    urgencyLevel: 'HIGH',
    reason: '41.5 Acres acquisition pending in Ulwe & Owale villages; 12 boundary partition objections pending Sub-Divisional Officer hearing.',
    pendingAcres: 41.5,
    disputedParcels: 12,
    pendingCompensationCr: 41.8,
    center: [73.0650, 18.9880],
    zoom: 14.7
  },
  {
    id: 'HOT-003',
    projectId: 'PRJ-HWY-001',
    projectName: 'Mumbai–Pune Highway Expansion (Phase III)',
    district: 'Pune',
    state: 'Maharashtra',
    type: 'Collector Approval Pending on Corridor Expansion',
    urgencyLevel: 'HIGH',
    reason: '83.0 Acres pending in Hinjawadi–Maan IT corridor; 14 joint measurement reports awaiting CALA Section 19 notification.',
    pendingAcres: 83.0,
    disputedParcels: 8,
    pendingCompensationCr: 34.3,
    center: [73.7400, 18.5925],
    zoom: 14.8
  },
  {
    id: 'HOT-004',
    projectId: 'PRJ-IND-005',
    projectName: 'Bengaluru–Chennai Industrial Corridor Node',
    district: 'Bengaluru Rural',
    state: 'Karnataka',
    type: 'Initial Joint Measurement Verification',
    urgencyLevel: 'MODERATE',
    reason: '18 DGPS cadastral survey boundaries undergoing verification; 188.5 Acres pending acquisition notification.',
    pendingAcres: 188.5,
    disputedParcels: 9,
    pendingCompensationCr: 52.0,
    center: [77.7100, 13.2450],
    zoom: 14.6
  }
];

// District Aggregations
export interface DistrictSummary {
  district: string;
  state: string;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  totalLandowners: number;
  totalParcels: number;
  landRequiredAcres: number;
  landAcquiredAcres: number;
  landPendingAcres: number;
  compensationPendingCount: number;
  disputedParcelsCount: number;
  center: [number, number];
  zoom: number;
}

export const DISTRICT_SUMMARIES: Record<string, DistrictSummary> = {
  'Pune': {
    district: 'Pune',
    state: 'Maharashtra',
    totalProjects: 2,
    activeProjects: 2,
    completedProjects: 0,
    delayedProjects: 0,
    totalLandowners: 224,
    totalParcels: 316,
    landRequiredAcres: 387.0,
    landAcquiredAcres: 247.2,
    landPendingAcres: 139.8,
    compensationPendingCount: 59,
    disputedParcelsCount: 12,
    center: [73.7800, 18.5700],
    zoom: 12.5
  },
  'Raigad': {
    district: 'Raigad',
    state: 'Maharashtra',
    totalProjects: 1,
    activeProjects: 1,
    completedProjects: 0,
    delayedProjects: 0,
    totalLandowners: 86,
    totalParcels: 112,
    landRequiredAcres: 185.0,
    landAcquiredAcres: 143.5,
    landPendingAcres: 41.5,
    compensationPendingCount: 28,
    disputedParcelsCount: 12,
    center: [73.0650, 18.9880],
    zoom: 13.5
  },
  'Vadodara': {
    district: 'Vadodara',
    state: 'Gujarat',
    totalProjects: 1,
    activeProjects: 1,
    completedProjects: 0,
    delayedProjects: 1,
    totalLandowners: 142,
    totalParcels: 198,
    landRequiredAcres: 210.0,
    landAcquiredAcres: 115.8,
    landPendingAcres: 94.2,
    compensationPendingCount: 46,
    disputedParcelsCount: 17,
    center: [73.1800, 22.3420],
    zoom: 13.2
  },
  'Bengaluru Rural': {
    district: 'Bengaluru Rural',
    state: 'Karnataka',
    totalProjects: 1,
    activeProjects: 1,
    completedProjects: 0,
    delayedProjects: 0,
    totalLandowners: 195,
    totalParcels: 260,
    landRequiredAcres: 310.0,
    landAcquiredAcres: 121.5,
    landPendingAcres: 188.5,
    compensationPendingCount: 64,
    disputedParcelsCount: 9,
    center: [77.7100, 13.2450],
    zoom: 13.0
  },
  'Amravati': {
    district: 'Amravati',
    state: 'Andhra Pradesh',
    totalProjects: 1,
    activeProjects: 1,
    completedProjects: 0,
    delayedProjects: 0,
    totalLandowners: 310,
    totalParcels: 420,
    landRequiredAcres: 520.0,
    landAcquiredAcres: 85.0,
    landPendingAcres: 435.0,
    compensationPendingCount: 88,
    disputedParcelsCount: 3,
    center: [80.5200, 16.5400],
    zoom: 12.8
  }
};
