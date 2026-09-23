export interface AgencyProject {
  id: string;
  code: string;
  name: string;
  type: 'Highway' | 'Airport' | 'Metro Rail' | 'Railway' | 'Industrial' | 'Smart City';
  agency: string;
  agencyCode: string;
  status: 'In Progress' | 'Joint Measurement' | 'Valuation & Award' | 'Possession Phase' | 'Statutory Notification';
  location: string;
  district: string;
  state: string;
  totalAreaHa: number;
  totalAreaAcres: number;
  totalParcels: number;
  totalLandowners: number;
  requiredLandAcres: number;
  acquiredLandAcres: number;
  pendingLandAcres: number;
  compensationPendingCount: number;
  documentsPendingCount: number;
  totalCompensationBudgetCr: number;
  disbursedCompensationCr: number;
  center: [number, number]; // [lng, lat]
  zoom: number;
  corridorGeoJSON: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export type AcquisitionStatus =
  | 'PENDING'
  | 'UNDER_VERIFICATION'
  | 'NOTICE_ISSUED'
  | 'NEGOTIATION'
  | 'APPROVED'
  | 'ACQUIRED'
  | 'COMPENSATION_PENDING'
  | 'COMPLETED';

export type CompensationStatus =
  | 'PENDING'
  | 'CALCULATED'
  | 'ESCR_ESCROW'
  | 'PROCESSING'
  | 'DISBURSED'
  | 'FAILED';

export type DocumentVerificationStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export interface AffectedParcel {
  id: string;
  surveyNumber: string;
  khasraNumber: string;
  projectId: string;
  projectName: string;
  landownerName: string;
  landownerPhone?: string;
  landownerAadhaarMasked?: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  totalAreaAcres: number;
  totalAreaHa: number;
  affectedAreaAcres: number;
  affectedAreaHa: number;
  affectedPercentage: number;
  acquisitionStatus: AcquisitionStatus;
  compensationStatus: CompensationStatus;
  compensationAmount: number;
  compensationFormatted: string;
  documentStatus: DocumentVerificationStatus;
  currentStage: string;
  encumbranceStatus: 'CLEARED' | 'UNDER_INSPECTION' | 'DISPUTED';
  soilType: string;
  coordinates: number[][][]; // GeoJSON Polygon coordinates [lng, lat]
  centroid: [number, number]; // [lng, lat]
}

export const AGENCY_PROJECTS: AgencyProject[] = [
  {
    id: 'PRJ-HWY-001',
    code: 'MPE-EXP-03',
    name: 'Mumbai–Pune Highway Expansion (Phase III Corridor)',
    type: 'Highway',
    agency: 'National Highways Authority of India (NHAI)',
    agencyCode: 'NHAI-ORG-2026',
    status: 'In Progress',
    location: 'Hinjawadi–Maan Corridor, Pune to Panvel',
    district: 'Pune',
    state: 'Maharashtra',
    totalAreaHa: 380.0,
    totalAreaAcres: 939.0,
    totalParcels: 174,
    totalLandowners: 128,
    requiredLandAcres: 245.0,
    acquiredLandAcres: 162.0,
    pendingLandAcres: 83.0,
    compensationPendingCount: 37,
    documentsPendingCount: 19,
    totalCompensationBudgetCr: 88.5,
    disbursedCompensationCr: 54.2,
    center: [73.7400, 18.5925],
    zoom: 14.8,
    corridorGeoJSON: {
      type: 'Polygon',
      coordinates: [[
        [73.7310, 18.5870],
        [73.7540, 18.5880],
        [73.7550, 18.5985],
        [73.7320, 18.5975],
        [73.7310, 18.5870]
      ]]
    }
  },
  {
    id: 'PRJ-AIR-002',
    code: 'NMIA-DEV-02',
    name: 'Navi Mumbai International Airport Development',
    type: 'Airport',
    agency: 'City and Industrial Development Corporation (CIDCO)',
    agencyCode: 'CIDCO-MAH-2026',
    status: 'Valuation & Award',
    location: 'Ulwe–Targhar Coastal Aviation Hub, Panvel',
    district: 'Raigad',
    state: 'Maharashtra',
    totalAreaHa: 1160.0,
    totalAreaAcres: 2866.0,
    totalParcels: 142,
    totalLandowners: 96,
    requiredLandAcres: 850.0,
    acquiredLandAcres: 640.0,
    pendingLandAcres: 210.0,
    compensationPendingCount: 28,
    documentsPendingCount: 14,
    totalCompensationBudgetCr: 320.0,
    disbursedCompensationCr: 245.0,
    center: [73.0680, 18.9900],
    zoom: 14.5,
    corridorGeoJSON: {
      type: 'Polygon',
      coordinates: [[
        [73.0520, 18.9780],
        [73.0840, 18.9790],
        [73.0850, 19.0020],
        [73.0530, 19.0010],
        [73.0520, 18.9780]
      ]]
    }
  },
  {
    id: 'PRJ-MTR-003',
    code: 'PUN-MTR-L3',
    name: 'Pune Metro Rail Project (Line 3 Hinjawadi–Shivajinagar Corridor)',
    type: 'Metro Rail',
    agency: 'Pune Metropolitan Region Development Authority (PMRDA)',
    agencyCode: 'PMRDA-PUN-2026',
    status: 'In Progress',
    location: 'Wakad–Balewadi High Street Viaduct Corridor',
    district: 'Pune',
    state: 'Maharashtra',
    totalAreaHa: 145.0,
    totalAreaAcres: 358.0,
    totalParcels: 68,
    totalLandowners: 54,
    requiredLandAcres: 120.0,
    acquiredLandAcres: 92.0,
    pendingLandAcres: 28.0,
    compensationPendingCount: 15,
    documentsPendingCount: 8,
    totalCompensationBudgetCr: 65.0,
    disbursedCompensationCr: 48.0,
    center: [73.7650, 18.5720],
    zoom: 15.0,
    corridorGeoJSON: {
      type: 'Polygon',
      coordinates: [[
        [73.7550, 18.5650],
        [73.7780, 18.5680],
        [73.7760, 18.5800],
        [73.7530, 18.5770],
        [73.7550, 18.5650]
      ]]
    }
  },
  {
    id: 'PRJ-RLY-004',
    code: 'WDFC-VAD-04',
    name: 'Dedicated Freight Corridor & Railway Expansion (Vadodara Section)',
    type: 'Railway',
    agency: 'Dedicated Freight Corridor Corporation of India (DFCCIL)',
    agencyCode: 'DFCCIL-RAIL-2026',
    status: 'Possession Phase',
    location: 'Karjan Industrial Rail Right of Way (RoW)',
    district: 'Vadodara',
    state: 'Gujarat',
    totalAreaHa: 415.0,
    totalAreaAcres: 1025.0,
    totalParcels: 210,
    totalLandowners: 165,
    requiredLandAcres: 310.0,
    acquiredLandAcres: 225.0,
    pendingLandAcres: 85.0,
    compensationPendingCount: 42,
    documentsPendingCount: 22,
    totalCompensationBudgetCr: 139.78,
    disbursedCompensationCr: 98.5,
    center: [73.1200, 22.0520],
    zoom: 14.5,
    corridorGeoJSON: {
      type: 'Polygon',
      coordinates: [[
        [73.1080, 22.0400],
        [73.1340, 22.0420],
        [73.1320, 22.0640],
        [73.1060, 22.0620],
        [73.1080, 22.0400]
      ]]
    }
  },
  {
    id: 'PRJ-IND-005',
    code: 'BCIC-PKG-02',
    name: 'Bengaluru–Chennai Industrial Corridor Node (Package 2)',
    type: 'Industrial',
    agency: 'National Industrial Corridor Development Corporation (NICDC)',
    agencyCode: 'NICDC-IND-2026',
    status: 'Joint Measurement',
    location: 'Narasapura Industrial Node alongside NH-75',
    district: 'Kolar',
    state: 'Karnataka',
    totalAreaHa: 510.0,
    totalAreaAcres: 1260.0,
    totalParcels: 88,
    totalLandowners: 72,
    requiredLandAcres: 450.0,
    acquiredLandAcres: 310.0,
    pendingLandAcres: 140.0,
    compensationPendingCount: 26,
    documentsPendingCount: 16,
    totalCompensationBudgetCr: 81.54,
    disbursedCompensationCr: 52.0,
    center: [78.1350, 13.1350],
    zoom: 14.6,
    corridorGeoJSON: {
      type: 'Polygon',
      coordinates: [[
        [78.1200, 13.1220],
        [78.1520, 13.1230],
        [78.1510, 13.1480],
        [78.1190, 13.1470],
        [78.1200, 13.1220]
      ]]
    }
  },
  {
    id: 'PRJ-SMT-006',
    code: 'AMT-SMT-01',
    name: 'Amravati Smart City Development & Urban Growth Corridor',
    type: 'Smart City',
    agency: 'Andhra Pradesh Capital Region Development Authority (APCRDA)',
    agencyCode: 'APCRDA-GOV-2026',
    status: 'Statutory Notification',
    location: 'Velagapudi & Mandadam Urban Pooling Node',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    totalAreaHa: 650.0,
    totalAreaAcres: 1606.0,
    totalParcels: 95,
    totalLandowners: 82,
    requiredLandAcres: 480.0,
    acquiredLandAcres: 390.0,
    pendingLandAcres: 90.0,
    compensationPendingCount: 19,
    documentsPendingCount: 11,
    totalCompensationBudgetCr: 115.0,
    disbursedCompensationCr: 84.5,
    center: [80.5200, 16.5400],
    zoom: 14.5,
    corridorGeoJSON: {
      type: 'Polygon',
      coordinates: [[
        [80.5050, 16.5280],
        [80.5370, 16.5290],
        [80.5360, 16.5530],
        [80.5040, 16.5510],
        [80.5050, 16.5280]
      ]]
    }
  }
];

export const AGENCY_AFFECTED_PARCELS: AffectedParcel[] = [
  // ── Mumbai–Pune Highway Expansion Parcels (Pune / Hinjawadi) ──
  {
    id: 'LP-1001',
    surveyNumber: '101/1',
    khasraNumber: '101/1',
    projectId: 'PRJ-HWY-001',
    projectName: 'Mumbai–Pune Highway Expansion (Phase III Corridor)',
    landownerName: 'Shri Rameshwar Tukaram Patil',
    landownerPhone: '+91 98231 44012',
    landownerAadhaarMasked: 'XXXX-XXXX-4819',
    village: 'Hinjawadi',
    taluka: 'Haveli / Mulshi',
    district: 'Pune',
    state: 'Maharashtra',
    totalAreaAcres: 5.93,
    totalAreaHa: 2.40,
    affectedAreaAcres: 3.95,
    affectedAreaHa: 1.60,
    affectedPercentage: 66.7,
    acquisitionStatus: 'UNDER_VERIFICATION',
    compensationStatus: 'PENDING',
    compensationAmount: 18960000,
    compensationFormatted: '₹1.89 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'District Collector Ground Inspection',
    encumbranceStatus: 'CLEARED',
    soilType: 'Semi-commercial & Black Cotton Soil',
    centroid: [73.7380, 18.5915],
    coordinates: [[
      [73.7360, 18.5900],
      [73.7405, 18.5900],
      [73.7410, 18.5935],
      [73.7375, 18.5940],
      [73.7355, 18.5925],
      [73.7360, 18.5900]
    ]]
  },
  {
    id: 'LP-1002',
    surveyNumber: '101/2',
    khasraNumber: '101/2',
    projectId: 'PRJ-HWY-001',
    projectName: 'Mumbai–Pune Highway Expansion (Phase III Corridor)',
    landownerName: 'Smt. Sunita Ramesh Patil & Anand Patil',
    landownerPhone: '+91 97652 11984',
    landownerAadhaarMasked: 'XXXX-XXXX-9124',
    village: 'Hinjawadi',
    taluka: 'Haveli / Mulshi',
    district: 'Pune',
    state: 'Maharashtra',
    totalAreaAcres: 4.45,
    totalAreaHa: 1.80,
    affectedAreaAcres: 4.45,
    affectedAreaHa: 1.80,
    affectedPercentage: 100.0,
    acquisitionStatus: 'APPROVED',
    compensationStatus: 'ESCR_ESCROW',
    compensationAmount: 21360000,
    compensationFormatted: '₹2.13 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'State Revenue Clearance Approved',
    encumbranceStatus: 'CLEARED',
    soilType: 'Dry Agricultural Corridor',
    centroid: [73.7430, 18.5918],
    coordinates: [[
      [73.7410, 18.5900],
      [73.7450, 18.5900],
      [73.7455, 18.5938],
      [73.7415, 18.5935],
      [73.7410, 18.5900]
    ]]
  },
  {
    id: 'LP-1003',
    surveyNumber: '102/A',
    khasraNumber: '102/A',
    projectId: 'PRJ-HWY-001',
    projectName: 'Mumbai–Pune Highway Expansion (Phase III Corridor)',
    landownerName: 'Shri Balwant Singh Gurjar',
    landownerPhone: '+91 93721 61379',
    landownerAadhaarMasked: 'XXXX-XXXX-3341',
    village: 'Maan',
    taluka: 'Mulshi',
    district: 'Pune',
    state: 'Maharashtra',
    totalAreaAcres: 5.93,
    totalAreaHa: 2.40,
    affectedAreaAcres: 2.47,
    affectedAreaHa: 1.00,
    affectedPercentage: 41.7,
    acquisitionStatus: 'ACQUIRED',
    compensationStatus: 'DISBURSED',
    compensationAmount: 14280000,
    compensationFormatted: '₹1.42 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'Possession Taken & Mandate Credited',
    encumbranceStatus: 'CLEARED',
    soilType: 'Irrigated Fertile Agricultural',
    centroid: [73.7475, 18.5920],
    coordinates: [[
      [73.7455, 18.5900],
      [73.7495, 18.5900],
      [73.7500, 18.5940],
      [73.7460, 18.5938],
      [73.7455, 18.5900]
    ]]
  },
  {
    id: 'LP-1004',
    surveyNumber: '104/B',
    khasraNumber: '104/B',
    projectId: 'PRJ-HWY-001',
    projectName: 'Mumbai–Pune Highway Expansion (Phase III Corridor)',
    landownerName: 'Shri Anant Mahadev Kulkarni',
    landownerPhone: '+91 98812 77091',
    landownerAadhaarMasked: 'XXXX-XXXX-6612',
    village: 'Hinjawadi',
    taluka: 'Haveli',
    district: 'Pune',
    state: 'Maharashtra',
    totalAreaAcres: 3.21,
    totalAreaHa: 1.30,
    affectedAreaAcres: 2.10,
    affectedAreaHa: 0.85,
    affectedPercentage: 65.4,
    acquisitionStatus: 'NEGOTIATION',
    compensationStatus: 'CALCULATED',
    compensationAmount: 10080000,
    compensationFormatted: '₹1.00 Cr',
    documentStatus: 'UNDER_REVIEW',
    currentStage: 'Public Hearing (Section 15)',
    encumbranceStatus: 'UNDER_INSPECTION',
    soilType: 'Semi-Urban Road Frontage',
    centroid: [73.7380, 18.5955],
    coordinates: [[
      [73.7360, 18.5940],
      [73.7400, 18.5942],
      [73.7405, 18.5975],
      [73.7365, 18.5972],
      [73.7360, 18.5940]
    ]]
  },
  {
    id: 'LP-1005',
    surveyNumber: '108/C',
    khasraNumber: '108/C',
    projectId: 'PRJ-HWY-001',
    projectName: 'Mumbai–Pune Highway Expansion (Phase III Corridor)',
    landownerName: 'M/s Deccan Logistics Infrastructure LLP',
    landownerPhone: '+91 20 2567 8900',
    landownerAadhaarMasked: 'CORP-GST-27AAACD',
    village: 'Maan',
    taluka: 'Mulshi',
    district: 'Pune',
    state: 'Maharashtra',
    totalAreaAcres: 7.41,
    totalAreaHa: 3.00,
    affectedAreaAcres: 4.94,
    affectedAreaHa: 2.00,
    affectedPercentage: 66.7,
    acquisitionStatus: 'NOTICE_ISSUED',
    compensationStatus: 'PENDING',
    compensationAmount: 24000000,
    compensationFormatted: '₹2.40 Cr',
    documentStatus: 'PENDING',
    currentStage: 'RFCTLARR Section 11 Preliminary Notification',
    encumbranceStatus: 'CLEARED',
    soilType: 'Industrial Warehouse Buffer',
    centroid: [73.7435, 18.5958],
    coordinates: [[
      [73.7415, 18.5940],
      [73.7460, 18.5942],
      [73.7465, 18.5978],
      [73.7420, 18.5975],
      [73.7415, 18.5940]
    ]]
  },
  {
    id: 'LP-1006',
    surveyNumber: '112/1',
    khasraNumber: '112/1',
    projectId: 'PRJ-HWY-001',
    projectName: 'Mumbai–Pune Highway Expansion (Phase III Corridor)',
    landownerName: 'Shri Suresh Pandurang Shinde',
    landownerPhone: '+91 99224 88310',
    landownerAadhaarMasked: 'XXXX-XXXX-7703',
    village: 'Maan',
    taluka: 'Mulshi',
    district: 'Pune',
    state: 'Maharashtra',
    totalAreaAcres: 2.96,
    totalAreaHa: 1.20,
    affectedAreaAcres: 2.96,
    affectedAreaHa: 1.20,
    affectedPercentage: 100.0,
    acquisitionStatus: 'COMPENSATION_PENDING',
    compensationStatus: 'PROCESSING',
    compensationAmount: 14400000,
    compensationFormatted: '₹1.44 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'PFMS Public Finance Escrow Mandate',
    encumbranceStatus: 'CLEARED',
    soilType: 'Dry Agricultural Corridor',
    centroid: [73.7485, 18.5958],
    coordinates: [[
      [73.7465, 18.5942],
      [73.7510, 18.5945],
      [73.7515, 18.5978],
      [73.7470, 18.5976],
      [73.7465, 18.5942]
    ]]
  },

  // ── Navi Mumbai Airport Parcels (Raigad / Panvel) ──
  {
    id: 'LP-2001',
    surveyNumber: '145/2',
    khasraNumber: '145/2',
    projectId: 'PRJ-AIR-002',
    projectName: 'Navi Mumbai International Airport Development',
    landownerName: 'Shri Rajesh Dattatray Mhatre',
    landownerPhone: '+91 98200 12345',
    landownerAadhaarMasked: 'XXXX-XXXX-1102',
    village: 'Panvel',
    taluka: 'Panvel',
    district: 'Raigad',
    state: 'Maharashtra',
    totalAreaAcres: 2.40,
    totalAreaHa: 0.97,
    affectedAreaAcres: 1.60,
    affectedAreaHa: 0.65,
    affectedPercentage: 66.7,
    acquisitionStatus: 'UNDER_VERIFICATION',
    compensationStatus: 'PENDING',
    compensationAmount: 21600000,
    compensationFormatted: '₹2.16 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'Collector Ground Inspection Approval',
    encumbranceStatus: 'CLEARED',
    soilType: 'Coastal Saline & Alluvial Buffer',
    centroid: [73.0640, 18.9860],
    coordinates: [[
      [73.0600, 18.9830],
      [73.0680, 18.9830],
      [73.0680, 18.9890],
      [73.0600, 18.9890],
      [73.0600, 18.9830]
    ]]
  },
  {
    id: 'LP-2002',
    surveyNumber: '146/1',
    khasraNumber: '146/1',
    projectId: 'PRJ-AIR-002',
    projectName: 'Navi Mumbai International Airport Development',
    landownerName: 'Shri Pandharinath Govind Patil',
    landownerPhone: '+91 98211 44556',
    landownerAadhaarMasked: 'XXXX-XXXX-9981',
    village: 'Targhar',
    taluka: 'Panvel',
    district: 'Raigad',
    state: 'Maharashtra',
    totalAreaAcres: 3.80,
    totalAreaHa: 1.54,
    affectedAreaAcres: 3.80,
    affectedAreaHa: 1.54,
    affectedPercentage: 100.0,
    acquisitionStatus: 'APPROVED',
    compensationStatus: 'ESCR_ESCROW',
    compensationAmount: 51300000,
    compensationFormatted: '₹5.13 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'Award Sanctioned by Competent Authority (CALA)',
    encumbranceStatus: 'CLEARED',
    soilType: 'Estuarine Flatland',
    centroid: [73.0720, 18.9860],
    coordinates: [[
      [73.0680, 18.9830],
      [73.0760, 18.9830],
      [73.0760, 18.9890],
      [73.0680, 18.9890],
      [73.0680, 18.9830]
    ]]
  },
  {
    id: 'LP-2003',
    surveyNumber: '150/B',
    khasraNumber: '150/B',
    projectId: 'PRJ-AIR-002',
    projectName: 'Navi Mumbai International Airport Development',
    landownerName: 'Shri Suresh Vithal Gharat',
    landownerPhone: '+91 98222 33445',
    landownerAadhaarMasked: 'XXXX-XXXX-8820',
    village: 'Ulwe',
    taluka: 'Panvel',
    district: 'Raigad',
    state: 'Maharashtra',
    totalAreaAcres: 5.20,
    totalAreaHa: 2.10,
    affectedAreaAcres: 4.10,
    affectedAreaHa: 1.66,
    affectedPercentage: 78.8,
    acquisitionStatus: 'ACQUIRED',
    compensationStatus: 'DISBURSED',
    compensationAmount: 55350000,
    compensationFormatted: '₹5.53 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'Possession Cleared & Handed to CIDCO',
    encumbranceStatus: 'CLEARED',
    soilType: 'Reclaimed Aviation Buffer',
    centroid: [73.0640, 18.9940],
    coordinates: [[
      [73.0600, 18.9900],
      [73.0680, 18.9900],
      [73.0680, 18.9980],
      [73.0600, 18.9980],
      [73.0600, 18.9900]
    ]]
  },
  {
    id: 'LP-2004',
    surveyNumber: '152/3',
    khasraNumber: '152/3',
    projectId: 'PRJ-AIR-002',
    projectName: 'Navi Mumbai International Airport Development',
    landownerName: 'Smt. Malatibai Chandrakant Bhagat',
    landownerPhone: '+91 98233 55667',
    landownerAadhaarMasked: 'XXXX-XXXX-4410',
    village: 'Kombadbhuje',
    taluka: 'Panvel',
    district: 'Raigad',
    state: 'Maharashtra',
    totalAreaAcres: 1.90,
    totalAreaHa: 0.77,
    affectedAreaAcres: 1.90,
    affectedAreaHa: 0.77,
    affectedPercentage: 100.0,
    acquisitionStatus: 'COMPENSATION_PENDING',
    compensationStatus: 'CALCULATED',
    compensationAmount: 25650000,
    compensationFormatted: '₹2.56 Cr',
    documentStatus: 'UNDER_REVIEW',
    currentStage: 'R&R 22.5% Developed Land Allotment Review',
    encumbranceStatus: 'CLEARED',
    soilType: 'Alluvial Flatland',
    centroid: [73.0720, 18.9940],
    coordinates: [[
      [73.0680, 18.9900],
      [73.0760, 18.9900],
      [73.0760, 18.9980],
      [73.0680, 18.9980],
      [73.0680, 18.9900]
    ]]
  },

  // ── Pune Metro Line 3 Corridor Parcels (Wakad / Balewadi) ──
  {
    id: 'LP-3001',
    surveyNumber: '78/1A',
    khasraNumber: '78/1A',
    projectId: 'PRJ-MTR-003',
    projectName: 'Pune Metro Rail Project (Line 3 Hinjawadi–Shivajinagar Corridor)',
    landownerName: 'Shri Kiran Balkrishna Deshmukh',
    landownerPhone: '+91 98900 11223',
    landownerAadhaarMasked: 'XXXX-XXXX-5521',
    village: 'Wakad',
    taluka: 'Mulshi',
    district: 'Pune',
    state: 'Maharashtra',
    totalAreaAcres: 1.80,
    totalAreaHa: 0.73,
    affectedAreaAcres: 0.85,
    affectedAreaHa: 0.34,
    affectedPercentage: 47.2,
    acquisitionStatus: 'ACQUIRED',
    compensationStatus: 'DISBURSED',
    compensationAmount: 11900000,
    compensationFormatted: '₹1.19 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'Viaduct Pillar Construction Handover',
    encumbranceStatus: 'CLEARED',
    soilType: 'Commercial Transit Frontage',
    centroid: [73.7620, 18.5710],
    coordinates: [[
      [73.7580, 18.5680],
      [73.7660, 18.5680],
      [73.7660, 18.5740],
      [73.7580, 18.5740],
      [73.7580, 18.5680]
    ]]
  },
  {
    id: 'LP-3002',
    surveyNumber: '82/3',
    khasraNumber: '82/3',
    projectId: 'PRJ-MTR-003',
    projectName: 'Pune Metro Rail Project (Line 3 Hinjawadi–Shivajinagar Corridor)',
    landownerName: 'Shri Mahadev Ramchandra Gaikwad',
    landownerPhone: '+91 98901 22334',
    landownerAadhaarMasked: 'XXXX-XXXX-7712',
    village: 'Balewadi',
    taluka: 'Haveli',
    district: 'Pune',
    state: 'Maharashtra',
    totalAreaAcres: 2.40,
    totalAreaHa: 0.97,
    affectedAreaAcres: 1.10,
    affectedAreaHa: 0.45,
    affectedPercentage: 45.8,
    acquisitionStatus: 'APPROVED',
    compensationStatus: 'ESCR_ESCROW',
    compensationAmount: 15400000,
    compensationFormatted: '₹1.54 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'PMRDA Joint Venture Station Entry Award',
    encumbranceStatus: 'CLEARED',
    soilType: 'Urban Mixed-Use Buffer',
    centroid: [73.7700, 18.5710],
    coordinates: [[
      [73.7660, 18.5680],
      [73.7740, 18.5680],
      [73.7740, 18.5740],
      [73.7660, 18.5740],
      [73.7660, 18.5680]
    ]]
  },
  {
    id: 'LP-3003',
    surveyNumber: '85/1',
    khasraNumber: '85/1',
    projectId: 'PRJ-MTR-003',
    projectName: 'Pune Metro Rail Project (Line 3 Hinjawadi–Shivajinagar Corridor)',
    landownerName: 'Smt. Anita Arvind Chavan',
    landownerPhone: '+91 98902 33445',
    landownerAadhaarMasked: 'XXXX-XXXX-2234',
    village: 'Baner',
    taluka: 'Haveli',
    district: 'Pune',
    state: 'Maharashtra',
    totalAreaAcres: 1.20,
    totalAreaHa: 0.49,
    affectedAreaAcres: 0.60,
    affectedAreaHa: 0.24,
    affectedPercentage: 50.0,
    acquisitionStatus: 'UNDER_VERIFICATION',
    compensationStatus: 'PENDING',
    compensationAmount: 8400000,
    compensationFormatted: '₹84.0 Lakh',
    documentStatus: 'UNDER_REVIEW',
    currentStage: 'Title Deed Mutation Validation',
    encumbranceStatus: 'UNDER_INSPECTION',
    soilType: 'Urban Commercial Frontage',
    centroid: [73.7620, 18.5760],
    coordinates: [[
      [73.7580, 18.5740],
      [73.7660, 18.5740],
      [73.7660, 18.5780],
      [73.7580, 18.5780],
      [73.7580, 18.5740]
    ]]
  },

  // ── Dedicated Freight Corridor Parcels (Vadodara / Karjan) ──
  {
    id: 'LP-4001',
    surveyNumber: '301',
    khasraNumber: '301',
    projectId: 'PRJ-RLY-004',
    projectName: 'Dedicated Freight Corridor & Railway Expansion (Vadodara Section)',
    landownerName: 'Shri Pravinbhai Somabhai Patel',
    landownerPhone: '+91 94270 55112',
    landownerAadhaarMasked: 'XXXX-XXXX-6631',
    village: 'Karjan',
    taluka: 'Karjan',
    district: 'Vadodara',
    state: 'Gujarat',
    totalAreaAcres: 4.80,
    totalAreaHa: 1.94,
    affectedAreaAcres: 3.50,
    affectedAreaHa: 1.42,
    affectedPercentage: 72.9,
    acquisitionStatus: 'ACQUIRED',
    compensationStatus: 'DISBURSED',
    compensationAmount: 21000000,
    compensationFormatted: '₹2.10 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'Track Bed Embankment Handed to DFCCIL',
    encumbranceStatus: 'CLEARED',
    soilType: 'Linear Railway Right of Way (RoW)',
    centroid: [73.1180, 22.0480],
    coordinates: [[
      [73.1120, 22.0440],
      [73.1240, 22.0440],
      [73.1240, 22.0520],
      [73.1120, 22.0520],
      [73.1120, 22.0440]
    ]]
  },
  {
    id: 'LP-4002',
    surveyNumber: '302/1',
    khasraNumber: '302/1',
    projectId: 'PRJ-RLY-004',
    projectName: 'Dedicated Freight Corridor & Railway Expansion (Vadodara Section)',
    landownerName: 'Shri Ishwarbhai Manilal Desai',
    landownerPhone: '+91 94271 66223',
    landownerAadhaarMasked: 'XXXX-XXXX-1190',
    village: 'Kandari',
    taluka: 'Karjan',
    district: 'Vadodara',
    state: 'Gujarat',
    totalAreaAcres: 3.60,
    totalAreaHa: 1.46,
    affectedAreaAcres: 3.60,
    affectedAreaHa: 1.46,
    affectedPercentage: 100.0,
    acquisitionStatus: 'APPROVED',
    compensationStatus: 'ESCR_ESCROW',
    compensationAmount: 21600000,
    compensationFormatted: '₹2.16 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'Central Ministry Special Railway Project Award',
    encumbranceStatus: 'CLEARED',
    soilType: 'Agricultural Black Loam',
    centroid: [73.1280, 22.0480],
    coordinates: [[
      [73.1240, 22.0440],
      [73.1320, 22.0440],
      [73.1320, 22.0520],
      [73.1240, 22.0520],
      [73.1240, 22.0440]
    ]]
  },
  {
    id: 'LP-4003',
    surveyNumber: '302/2',
    khasraNumber: '302/2',
    projectId: 'PRJ-RLY-004',
    projectName: 'Dedicated Freight Corridor & Railway Expansion (Vadodara Section)',
    landownerName: 'Shri Manilal Kanjibhai Solanki',
    landownerPhone: '+91 94272 77334',
    landownerAadhaarMasked: 'XXXX-XXXX-8822',
    village: 'Miyagam',
    taluka: 'Karjan',
    district: 'Vadodara',
    state: 'Gujarat',
    totalAreaAcres: 2.90,
    totalAreaHa: 1.17,
    affectedAreaAcres: 2.10,
    affectedAreaHa: 0.85,
    affectedPercentage: 72.4,
    acquisitionStatus: 'COMPENSATION_PENDING',
    compensationStatus: 'CALCULATED',
    compensationAmount: 12600000,
    compensationFormatted: '₹1.26 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'Treasury Disbursement Sanction Approved',
    encumbranceStatus: 'CLEARED',
    soilType: 'Linear Buffer',
    centroid: [73.1180, 22.0580],
    coordinates: [[
      [73.1120, 22.0520],
      [73.1240, 22.0520],
      [73.1240, 22.0620],
      [73.1120, 22.0620],
      [73.1120, 22.0520]
    ]]
  },

  // ── Bengaluru–Chennai Industrial Node Parcels (Kolar / Narasapura) ──
  {
    id: 'LP-5001',
    surveyNumber: '44/1',
    khasraNumber: '44/1',
    projectId: 'PRJ-IND-005',
    projectName: 'Bengaluru–Chennai Industrial Corridor Node (Package 2)',
    landownerName: 'Shri K. Venkatesh Gowda',
    landownerPhone: '+91 98450 11988',
    landownerAadhaarMasked: 'XXXX-XXXX-9901',
    village: 'Narasapura',
    taluka: 'Kolar',
    district: 'Kolar',
    state: 'Karnataka',
    totalAreaAcres: 6.20,
    totalAreaHa: 2.51,
    affectedAreaAcres: 4.80,
    affectedAreaHa: 1.94,
    affectedPercentage: 77.4,
    acquisitionStatus: 'APPROVED',
    compensationStatus: 'ESCR_ESCROW',
    compensationAmount: 24960000,
    compensationFormatted: '₹2.49 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'KIADB Industrial Layout Clearance Granted',
    encumbranceStatus: 'CLEARED',
    soilType: 'Dry Agricultural & Industrial Node',
    centroid: [78.1320, 13.1310],
    coordinates: [[
      [78.1240, 13.1260],
      [78.1400, 13.1260],
      [78.1400, 13.1360],
      [78.1240, 13.1360],
      [78.1240, 13.1260]
    ]]
  },
  {
    id: 'LP-5002',
    surveyNumber: '44/2',
    khasraNumber: '44/2',
    projectId: 'PRJ-IND-005',
    projectName: 'Bengaluru–Chennai Industrial Corridor Node (Package 2)',
    landownerName: 'Shri Muniswamy Narayana Reddy',
    landownerPhone: '+91 98451 22099',
    landownerAadhaarMasked: 'XXXX-XXXX-4433',
    village: 'Vemagal',
    taluka: 'Kolar',
    district: 'Kolar',
    state: 'Karnataka',
    totalAreaAcres: 4.50,
    totalAreaHa: 1.82,
    affectedAreaAcres: 4.50,
    affectedAreaHa: 1.82,
    affectedPercentage: 100.0,
    acquisitionStatus: 'UNDER_VERIFICATION',
    compensationStatus: 'PENDING',
    compensationAmount: 23400000,
    compensationFormatted: '₹2.34 Cr',
    documentStatus: 'UNDER_REVIEW',
    currentStage: 'Joint Measurement Survey (JMS) Reconciliation',
    encumbranceStatus: 'CLEARED',
    soilType: 'Semi-Arid Red Sandy Loam',
    centroid: [78.1440, 13.1310],
    coordinates: [[
      [78.1400, 13.1260],
      [78.1490, 13.1260],
      [78.1490, 13.1360],
      [78.1400, 13.1360],
      [78.1400, 13.1260]
    ]]
  },

  // ── Amravati Smart City Development Parcels (Guntur / Velagapudi) ──
  {
    id: 'LP-6001',
    surveyNumber: '210/1',
    khasraNumber: '210/1',
    projectId: 'PRJ-SMT-006',
    projectName: 'Amravati Smart City Development & Urban Growth Corridor',
    landownerName: 'Shri Sambasiva Rao Thota',
    landownerPhone: '+91 98480 33441',
    landownerAadhaarMasked: 'XXXX-XXXX-7721',
    village: 'Velagapudi',
    taluka: 'Tulluru',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    totalAreaAcres: 3.20,
    totalAreaHa: 1.30,
    affectedAreaAcres: 3.20,
    affectedAreaHa: 1.30,
    affectedPercentage: 100.0,
    acquisitionStatus: 'APPROVED',
    compensationStatus: 'ESCR_ESCROW',
    compensationAmount: 28800000,
    compensationFormatted: '₹2.88 Cr',
    documentStatus: 'VERIFIED',
    currentStage: 'APCRDA Land Pooling Allotment Clearance',
    encumbranceStatus: 'CLEARED',
    soilType: 'Krishna River Delta Black Fertile',
    centroid: [80.5180, 16.5380],
    coordinates: [[
      [80.5100, 16.5320],
      [80.5260, 16.5320],
      [80.5260, 16.5440],
      [80.5100, 16.5440],
      [80.5100, 16.5320]
    ]]
  },
  {
    id: 'LP-6002',
    surveyNumber: '214/2',
    khasraNumber: '214/2',
    projectId: 'PRJ-SMT-006',
    projectName: 'Amravati Smart City Development & Urban Growth Corridor',
    landownerName: 'Shri Venkata Ramana Murthy',
    landownerPhone: '+91 98481 44552',
    landownerAadhaarMasked: 'XXXX-XXXX-3310',
    village: 'Mandadam',
    taluka: 'Tulluru',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    totalAreaAcres: 2.50,
    totalAreaHa: 1.01,
    affectedAreaAcres: 1.80,
    affectedAreaHa: 0.73,
    affectedPercentage: 72.0,
    acquisitionStatus: 'NOTICE_ISSUED',
    compensationStatus: 'PENDING',
    compensationAmount: 16200000,
    compensationFormatted: '₹1.62 Cr',
    documentStatus: 'PENDING',
    currentStage: 'Statutory Gazette Publication under Section 11',
    encumbranceStatus: 'CLEARED',
    soilType: 'Agricultural Corridor',
    centroid: [80.5300, 16.5380],
    coordinates: [[
      [80.5260, 16.5320],
      [80.5350, 16.5320],
      [80.5350, 16.5440],
      [80.5260, 16.5440],
      [80.5260, 16.5320]
    ]]
  }
];

export function getAgencyProjects(): AgencyProject[] {
  return AGENCY_PROJECTS;
}

export function getProjectById(projectId: string): AgencyProject | undefined {
  return AGENCY_PROJECTS.find(p => p.id === projectId);
}

export function getParcelsForProject(projectId: string): AffectedParcel[] {
  return AGENCY_AFFECTED_PARCELS.filter(p => p.projectId === projectId);
}

export function searchAgencyParcels(query: string, projectId?: string): AffectedParcel[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return projectId ? getParcelsForProject(projectId) : AGENCY_AFFECTED_PARCELS;
  }
  return AGENCY_AFFECTED_PARCELS.filter(p => {
    if (projectId && p.projectId !== projectId) return false;
    return (
      p.id.toLowerCase().includes(q) ||
      p.surveyNumber.toLowerCase().includes(q) ||
      p.khasraNumber.toLowerCase().includes(q) ||
      p.landownerName.toLowerCase().includes(q) ||
      p.village.toLowerCase().includes(q) ||
      p.taluka.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.projectName.toLowerCase().includes(q) ||
      p.projectId.toLowerCase().includes(q)
    );
  });
}
