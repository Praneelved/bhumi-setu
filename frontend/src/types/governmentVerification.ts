export type AuthorityLevel = 'DISTRICT_COLLECTOR' | 'STATE_GOVERNMENT' | 'CENTRAL_MINISTRY';

export type StageStatus = 'COMPLETED' | 'ACTIVE' | 'PENDING' | 'LOCKED' | 'REJECTED';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type OverallCaseStatus = 'PENDING' | 'IN_PROGRESS' | 'REJECTED' | 'VERIFIED';

/** Strict sequential state machine statuses */
export type VerificationWorkflowStatus =
  | 'DISTRICT_PENDING'
  | 'DISTRICT_IN_REVIEW'
  | 'DISTRICT_REJECTED'
  | 'DISTRICT_APPROVED'
  | 'DISTRICT_DOCUMENT_VERIFICATION_PENDING'
  | 'DISTRICT_DOCUMENT_VERIFICATION_IN_REVIEW'
  | 'DISTRICT_DOCUMENT_VERIFICATION_REJECTED'
  | 'DISTRICT_DOCUMENT_VERIFICATION_APPROVED'
  | 'STATE_LOCKED'
  | 'STATE_PENDING'
  | 'STATE_IN_REVIEW'
  | 'STATE_REJECTED'
  | 'STATE_APPROVED'
  | 'STATE_DOCUMENT_VERIFICATION_PENDING'
  | 'STATE_DOCUMENT_VERIFICATION_IN_REVIEW'
  | 'STATE_DOCUMENT_VERIFICATION_REJECTED'
  | 'STATE_DOCUMENT_VERIFICATION_APPROVED'
  | 'CENTRAL_LOCKED'
  | 'CENTRAL_PENDING'
  | 'CENTRAL_IN_REVIEW'
  | 'CENTRAL_REJECTED'
  | 'CENTRAL_APPROVED'
  | 'CENTRAL_DOCUMENT_VERIFICATION_PENDING'
  | 'CENTRAL_DOCUMENT_VERIFICATION_IN_REVIEW'
  | 'CENTRAL_DOCUMENT_VERIFICATION_REJECTED'
  | 'CENTRAL_DOCUMENT_VERIFICATION_APPROVED'
  | 'FINAL_DOCUMENT_VERIFICATION_COMPLETE'
  | 'FINAL_VERIFIED';

export interface DocumentPage {
  pageNumber: number;
  title: string;
  contentHeading: string;
  khasraNumbers?: string[];
  areaHa?: number;
  officialRef?: string;
  notes?: string;
  addedAt?: string;
  customText?: string;
}

export interface VerificationDocument {
  id: string;
  docNumber: string;
  title: string;
  type: string;
  status: DocumentStatus;
  totalPages: number;
  pages: DocumentPage[];
  uploadedDate: string;
  uploadedBy?: string;
  version?: number;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  rejectionCategory?: string;
  rejectionRemarks?: string;
  requiredCorrection?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  requiredForStage: AuthorityLevel[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  authorityLevel: AuthorityLevel;
  authorityTitle: string;
  officerName: string;
  officerId: string;
  action: string;
  documentTitle?: string;
  remarks: string;
}


export interface CaseStageInfo {
  status: StageStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
  approvedDate?: string;
}

export interface StageChecklistItem {
  id: string;
  label: string;
  description: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  mandatory: boolean;
}

export interface StageRejectionRecord {
  caseId: string;
  stage: AuthorityLevel;
  authorityLevel: AuthorityLevel;
  officerName: string;
  officerId: string;
  timestamp: string;
  issueCategory: string;
  rejectionReason: string;
  requiredCorrection: string;
  remarks: string;
}

export interface DistrictReviewData {
  // Land Details
  khasraNumbers: string[];
  village: string;
  taluka: string;
  district: string;
  areaHectares: number;
  landType: string;
  boundaryCoordinates: string;
  gisParcelId: string;

  // Ownership
  primaryOwner: string;
  ownershipPercentage: number;
  coOwners: Array<{ name: string; share: number; relation: string }>;
  aadhaarPanLinked: boolean;
  encumbranceCertificateNo: string;

  // Field Verification
  fieldInspector: string;
  inspectionDate: string;
  fieldVerificationStatus: 'COMPLETED' | 'PENDING' | 'DISCREPANCY';
  inspectionNotes: string;
  boundaryGeoFenceMatches: boolean;
  sitePhotosCount: number;

  // 8 Mandatory District Checks
  checklist: StageChecklistItem[];
}

export interface StateReviewData {
  // District signoff summary
  districtApprovalDate: string;
  districtApprovedBy: string;
  districtCollectorRemarks: string;

  // Project Validation
  projectPurpose: string;
  projectCategory: string;
  projectAgency: string;
  projectRequirement: string;
  stateGazetteNotificationRef: string;

  // Land Acquisition Compliance
  rfctlarrSection11Date: string;
  section19DeclarationDate: string;
  publicHearingsCompleted: boolean;
  siaAppraisalApproved: boolean;

  // Compensation Review
  landValuationRatePerAcre: number;
  basicMarketValueCr: number;
  solatiumPercentage: number;
  solatiumAmountCr: number;
  additionalInterestCr: number;
  totalAwardPackageCr: number;

  // R&R Review
  affectedFamiliesCount: number;
  displacedFamiliesCount: number;
  rehabilitationColonyLocation: string;
  subsistenceGrantPerFamily: number;
  resettlementPlanStatus: 'APPROVED' | 'IN_REVIEW' | 'PENDING';

  // 8 Mandatory State Checks
  checklist: StageChecklistItem[];
}

export interface CentralReviewData {
  // Prior Approvals
  districtApprovedBy: string;
  districtApprovalDate: string;
  stateApprovedBy: string;
  stateApprovalDate: string;

  // National Project Authorization
  strategicImportance: string;
  gatiShaktiAlignment: boolean;
  implementingMinistry: string;
  cabinetSanctionRef: string;

  // Central Clearances
  moefccForestClearanceStage2: 'CLEARED' | 'PENDING' | 'NOT_APPLICABLE';
  environmentalClearanceRef: string;
  defenseOrRailwayClearance: 'CLEARED' | 'NOT_APPLICABLE';

  // Scale & Outlay
  totalCorridorLengthKm: number;
  affectedDistrictsCount: number;
  totalTreasuryBudgetCrores: number;
  disbursedBudgetCrores: number;

  // Legal & Risk
  supremeCourtHighCourtLitigation: 'CLEARED_NO_STAY' | 'PENDING_OBJECTIONS';
  vigilanceAuditClearance: 'CLEARED' | 'PENDING';

  // 8 Mandatory Central Checks
  checklist: StageChecklistItem[];
}

export interface VerificationCase {
  id: string;
  projectName: string;
  agency: string;
  state: string;
  district: string;
  totalParcels: number;
  affectedFamilies: number;
  submittedDate: string;
  currentStage: AuthorityLevel;
  workflowStatus: VerificationWorkflowStatus;
  overallStatus: OverallCaseStatus;
  stages: Record<AuthorityLevel, CaseStageInfo>;
  documents: VerificationDocument[];
  auditLogs: AuditLogEntry[];
  lastUpdated: string;
  districtData: DistrictReviewData;
  stateData: StateReviewData;
  centralData: CentralReviewData;
  activeRejection?: StageRejectionRecord;
}

export interface GovernmentOfficer {
  name: string;
  designation: string;
  department: string;
  authorityLevel: AuthorityLevel;
  state: string;
  district: string;
  officerId: string;
}

export interface RejectionEvent {
  caseId: string;
  documentId?: string;
  documentName?: string;
  rejectedBy: string;
  authorityLevel: AuthorityLevel;
  reason: string;
  issueCategory: string;
  requiredCorrection?: string;
  timestamp: string;
}
