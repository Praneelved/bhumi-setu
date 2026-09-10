import type { 
  VerificationCase, GovernmentOfficer, AuthorityLevel, 
  StageChecklistItem, StageRejectionRecord 
} from '../types/governmentVerification';

export const DEFAULT_OFFICERS: Record<AuthorityLevel, GovernmentOfficer> = {
  DISTRICT_COLLECTOR: {
    name: 'Dr. Rajesh Sharma, IAS',
    designation: 'District Collector & Magistrate',
    department: 'Revenue & Land Acquisition Dept.',
    authorityLevel: 'DISTRICT_COLLECTOR',
    state: 'Maharashtra',
    district: 'Pune District',
    officerId: 'GOV-IAS-2024-8842'
  },
  STATE_GOVERNMENT: {
    name: 'Smt. Ananya Deshmukh, IAS',
    designation: 'Principal Secretary (Revenue & Urban Land)',
    department: 'State Revenue Department, Govt of Maharashtra',
    authorityLevel: 'STATE_GOVERNMENT',
    state: 'Maharashtra',
    district: 'State Secretariat (Mantralaya)',
    officerId: 'GOV-MH-SEC-1092'
  },
  CENTRAL_MINISTRY: {
    name: 'Shri Vikramaditya Verma, IAS',
    designation: 'Joint Secretary (Land Resources)',
    department: 'Ministry of Rural Development & MoRTH, Govt of India',
    authorityLevel: 'CENTRAL_MINISTRY',
    state: 'National Portal',
    district: 'New Delhi',
    officerId: 'GOV-GOI-JS-0047'
  }
};

export const INITIAL_DISTRICT_CHECKLIST: StageChecklistItem[] = [
  { id: 'DC-01', label: 'Land parcel details verified', description: 'Khasra numbers, village revenue boundary, and parcel classification match sub-registrar records.', verified: false, mandatory: true },
  { id: 'DC-02', label: 'Ownership verified', description: 'Title deeds, mutation register entries (Form 6), and co-owner percentage shares verified.', verified: false, mandatory: true },
  { id: 'DC-03', label: 'Survey number verified', description: 'Cadastral survey numbers cross-referenced against Talathi revenue sheets.', verified: false, mandatory: true },
  { id: 'DC-04', label: 'Area verified', description: 'Total acquired area (14.50 Ha) validated against spatial GIS polygon calculations.', verified: false, mandatory: true },
  { id: 'DC-05', label: 'GIS location verified', description: 'GPS boundary coordinates and drone boundary geo-fence confirmed without encroachment.', verified: false, mandatory: true },
  { id: 'DC-06', label: 'Land documents verified', description: '7/12 extracts, Jamabandi records, and encumbrance non-dispute certificate authenticated.', verified: false, mandatory: true },
  { id: 'DC-07', label: 'Field verification completed', description: 'Site inspection report by Tahsildar / Revenue Inspector submitted with geo-tagged photos.', verified: false, mandatory: true },
  { id: 'DC-08', label: 'No discrepancy found', description: 'No boundary overlap or unresolved title dispute found in civil court registries.', verified: false, mandatory: true },
];

export const INITIAL_STATE_CHECKLIST: StageChecklistItem[] = [
  { id: 'SC-01', label: 'District verification completed', description: 'District Collector certified land schedule and revenue clearance authenticated.', verified: false, mandatory: true },
  { id: 'SC-02', label: 'Project details validated', description: 'Public purpose requirement and state infrastructure alignment authenticated.', verified: false, mandatory: true },
  { id: 'SC-03', label: 'Required statutory documents available', description: 'RFCTLARR Section 11 preliminary notification and Section 19 declaration published in State Gazette.', verified: false, mandatory: true },
  { id: 'SC-04', label: 'Acquisition process reviewed', description: 'Public objections hearing (Section 15) completed and administrative sanction granted.', verified: false, mandatory: true },
  { id: 'SC-05', label: 'Compensation assessment reviewed', description: 'Market valuation per acre, 100% Solatium, and 12% annual additional interest calculated accurately.', verified: false, mandatory: true },
  { id: 'SC-06', label: 'R&R plan reviewed', description: 'Rehabilitation & Resettlement package approved for all 412 affected families.', verified: false, mandatory: true },
  { id: 'SC-07', label: 'State-level requirements satisfied', description: 'State Revenue Department statutory clearances and environmental impact appraisal satisfied.', verified: false, mandatory: true },
  { id: 'SC-08', label: 'No unresolved issue', description: 'All public representations, state assembly queries, and compensations escrow accounts resolved.', verified: false, mandatory: true },
];

export const INITIAL_CENTRAL_CHECKLIST: StageChecklistItem[] = [
  { id: 'CC-01', label: 'District approval completed', description: 'District Collector statutory verification and ground parcel clearances authenticated.', verified: false, mandatory: true },
  { id: 'CC-02', label: 'State approval completed', description: 'State Government gazette notification and statutory compensation scheme authenticated.', verified: false, mandatory: true },
  { id: 'CC-03', label: 'Central documentation complete', description: 'Cabinet Committee on Economic Affairs (CCEA) sanction and expenditure approvals verified.', verified: false, mandatory: true },
  { id: 'CC-04', label: 'Required central approvals available', description: 'MoEFCC Forest Clearance Stage-II and Environmental Clearance orders on record.', verified: false, mandatory: true },
  { id: 'CC-05', label: 'Project requirements satisfied', description: 'Alignment with PM Gati Shakti National Master Plan and inter-state logistics corridor guidelines.', verified: false, mandatory: true },
  { id: 'CC-06', label: 'Compensation review completed', description: 'Central treasury fund allocation and Direct Benefit Transfer (DBT) escrow funds validated.', verified: false, mandatory: true },
  { id: 'CC-07', label: 'R&R review completed', description: 'Central monitoring committee satisfaction on National R&R policy benchmarks.', verified: false, mandatory: true },
  { id: 'CC-08', label: 'No unresolved critical issue', description: 'Supreme Court and High Court litigation status clear; zero stay orders in effect.', verified: false, mandatory: true },
];

const INITIAL_CASES: VerificationCase[] = [
  {
    id: 'LA-2026-001',
    projectName: 'Mumbai–Pune Expressway Expansion Project (Phase III)',
    agency: 'National Highways Authority of India (NHAI)',
    state: 'Maharashtra',
    district: 'Pune District',
    totalParcels: 124,
    affectedFamilies: 412,
    submittedDate: '10 Sep 2026',
    currentStage: 'DISTRICT_COLLECTOR',
    workflowStatus: 'DISTRICT_PENDING',
    overallStatus: 'IN_PROGRESS',
    stages: {
      DISTRICT_COLLECTOR: { status: 'ACTIVE' },
      STATE_GOVERNMENT: { status: 'LOCKED' },
      CENTRAL_MINISTRY: { status: 'LOCKED' }
    },
    lastUpdated: '10 Sep 2026, 09:30 AM',
    auditLogs: [
      {
        id: 'LOG-1001',
        timestamp: '10 Sep 2026, 09:15 AM',
        authorityLevel: 'DISTRICT_COLLECTOR',
        authorityTitle: 'District Collector (Pune District)',
        officerName: 'Dr. Rajesh Sharma, IAS',
        officerId: 'GOV-IAS-2024-8842',
        action: 'CASE_CREATED',
        remarks: 'Case LA-2026-001 submitted by NHAI and assigned to District Verification Queue.'
      }
    ],
    documents: [
      {
        id: 'DOC-001',
        docNumber: '01',
        title: '7/12 Extract (Record of Rights)',
        type: 'Revenue Record',
        status: 'PENDING',
        totalPages: 4,
        requiredForStage: ['DISTRICT_COLLECTOR'],
        uploadedDate: '10 Sep 2026',
        pages: [
          { pageNumber: 1, title: 'Mouza Hinjawadi - Khasra 101/1 to 101/4', contentHeading: 'Form VII-XII Certified Extract', khasraNumbers: ['101/1', '101/2'], areaHa: 6.8 },
          { pageNumber: 2, title: 'Mutation History - Form 6', contentHeading: 'Certified Succession & Sale Entries (1998-2025)', khasraNumbers: ['101/3', '101/4'], areaHa: 5.2 },
          { pageNumber: 3, title: 'Cultivation & Crop Rights (Pik Pahani)', contentHeading: 'Kharif & Rabi Crop Record Sheet', areaHa: 2.5 },
          { pageNumber: 4, title: 'Revenue Court Clearance Certificate', contentHeading: 'Sub-Divisional Officer Non-Encumbrance Attestation', officialRef: 'REV-SDO-2026-118' }
        ]
      },
      {
        id: 'DOC-002',
        docNumber: '02',
        title: 'Cadastral Survey & Boundary Map',
        type: 'Spatial Survey',
        status: 'PENDING',
        totalPages: 3,
        requiredForStage: ['DISTRICT_COLLECTOR'],
        uploadedDate: '10 Sep 2026',
        pages: [
          { pageNumber: 1, title: 'Cadastral Map Sheet #14 - Pune Rural', contentHeading: 'Scale 1:5000 DGPS Survey Overlay', officialRef: 'SUR-PUNE-2026-09' },
          { pageNumber: 2, title: 'Joint Measurement Survey (JMS) Coordinates', contentHeading: 'ETRF-2000 GIS Pillar Geo-tag Points', areaHa: 14.5 },
          { pageNumber: 3, title: 'Adjacent Boundary Demarcation Signatures', contentHeading: 'Abutting Landowner NOCs and Talathi Endorsement' }
        ]
      },
      {
        id: 'DOC-003',
        docNumber: '03',
        title: 'Field Inspection & Physical Verification Report',
        type: 'Officer Report',
        status: 'PENDING',
        totalPages: 2,
        requiredForStage: ['DISTRICT_COLLECTOR'],
        uploadedDate: '10 Sep 2026',
        pages: [
          { pageNumber: 1, title: 'Physical Site Inspection Assessment', contentHeading: 'Inspection by Revenue Inspector & Dy. Collector (LA)', officialRef: 'INSP-PUNE-2026-44' },
          { pageNumber: 2, title: 'Geo-tagged Site Photographs & Ground Truth', contentHeading: 'Photographic Evidence of Vacant Boundary Alignment' }
        ]
      }
    ],
    districtData: {
      khasraNumbers: ['101/1', '101/2', '101/3', '102/A', '104/B'],
      village: 'Hinjawadi',
      taluka: 'Mulshi / Haveli',
      district: 'Pune District',
      areaHectares: 14.50,
      landType: 'Dry Agricultural & Semi-commercial Corridor',
      boundaryCoordinates: '18.5912° N, 73.7389° E to 18.5988° N, 73.7465° E',
      gisParcelId: 'MH-PUN-HINJ-2026-00492',
      primaryOwner: 'Shri Rameshwar Tukaram Patil',
      ownershipPercentage: 62.5,
      coOwners: [
        { name: 'Smt. Sunita Ramesh Patil', share: 25.0, relation: 'Spouse' },
        { name: 'Shri Anand Ramesh Patil', share: 12.5, relation: 'Son' }
      ],
      aadhaarPanLinked: true,
      encumbranceCertificateNo: 'EC-MAH-PUN-2026-88319',
      fieldInspector: 'Shri S. K. Kulkarni (Revenue Inspector, Mulshi)',
      inspectionDate: '08 Sep 2026',
      fieldVerificationStatus: 'COMPLETED',
      inspectionNotes: 'Physical field inspection completed. Parcel boundaries match DGPS survey. Ground verification shows no unauthorized permanent masonry structures or religious sites.',
      boundaryGeoFenceMatches: true,
      sitePhotosCount: 8,
      checklist: INITIAL_DISTRICT_CHECKLIST.map(item => ({ ...item }))
    },
    stateData: {
      districtApprovalDate: '',
      districtApprovedBy: '',
      districtCollectorRemarks: '',
      projectPurpose: 'Strategic National Expressway Capacity Expansion (Phase III 8-lane widening)',
      projectCategory: 'National Highways & Linear Infrastructure',
      projectAgency: 'National Highways Authority of India (NHAI)',
      projectRequirement: 'Acquisition of 14.50 Ha linear buffer for service roads & intelligent traffic management center.',
      stateGazetteNotificationRef: 'MAH-GAZ-REV-2026-1944 (Section 11(1) RFCTLARR)',
      rfctlarrSection11Date: '15 Jan 2026',
      section19DeclarationDate: '28 Jul 2026',
      publicHearingsCompleted: true,
      siaAppraisalApproved: true,
      landValuationRatePerAcre: 4800000,
      basicMarketValueCr: 17.20,
      solatiumPercentage: 100,
      solatiumAmountCr: 17.20,
      additionalInterestCr: 4.12,
      totalAwardPackageCr: 38.52,
      affectedFamiliesCount: 412,
      displacedFamiliesCount: 48,
      rehabilitationColonyLocation: 'Mouza Maan Sector-4 Integrated R&R Layout',
      subsistenceGrantPerFamily: 360000,
      resettlementPlanStatus: 'APPROVED',
      checklist: INITIAL_STATE_CHECKLIST.map(item => ({ ...item }))
    },
    centralData: {
      districtApprovedBy: '',
      districtApprovalDate: '',
      stateApprovedBy: '',
      stateApprovalDate: '',
      strategicImportance: 'Part of Golden Quadrilateral High-Density Freight & Passenger Corridor (PM Gati Shakti Master Plan)',
      gatiShaktiAlignment: true,
      implementingMinistry: 'Ministry of Road Transport and Highways (MoRTH), Govt of India',
      cabinetSanctionRef: 'CCEA-NH-2026-SANCTION-904',
      moefccForestClearanceStage2: 'CLEARED',
      environmentalClearanceRef: 'EC-ENV-CENTRAL-2026-88',
      defenseOrRailwayClearance: 'NOT_APPLICABLE',
      totalCorridorLengthKm: 94.5,
      affectedDistrictsCount: 3,
      totalTreasuryBudgetCrores: 248.50,
      disbursedBudgetCrores: 248.50,
      supremeCourtHighCourtLitigation: 'CLEARED_NO_STAY',
      vigilanceAuditClearance: 'CLEARED',
      checklist: INITIAL_CENTRAL_CHECKLIST.map(item => ({ ...item }))
    }
  },
  {
    id: 'LA-2026-002',
    projectName: 'Bengaluru–Chennai Industrial Corridor (Package 2)',
    agency: 'National Industrial Corridor Development Corporation (NICDC)',
    state: 'Karnataka',
    district: 'Kolar District',
    totalParcels: 88,
    affectedFamilies: 290,
    submittedDate: '01 Sep 2026',
    currentStage: 'STATE_GOVERNMENT',
    workflowStatus: 'STATE_PENDING',
    overallStatus: 'IN_PROGRESS',
    stages: {
      DISTRICT_COLLECTOR: { 
        status: 'COMPLETED', 
        verifiedBy: 'Dr. Rajesh Sharma, IAS', 
        verifiedAt: '05 Sep 2026, 04:30 PM',
        remarks: 'All 8 land-level checks and revenue records verified with zero boundary discrepancies.'
      },
      STATE_GOVERNMENT: { status: 'ACTIVE' },
      CENTRAL_MINISTRY: { status: 'LOCKED' }
    },
    lastUpdated: '05 Sep 2026, 04:30 PM',
    auditLogs: [
      {
        id: 'LOG-2001',
        timestamp: '05 Sep 2026, 04:30 PM',
        authorityLevel: 'DISTRICT_COLLECTOR',
        authorityTitle: 'District Collector (Kolar District)',
        officerName: 'Dr. Rajesh Sharma, IAS',
        officerId: 'GOV-IAS-2024-8842',
        action: 'STAGE_ADVANCED',
        remarks: 'District verification completed with certified land schedules. Forwarded to State Government.'
      }
    ],
    documents: [],
    districtData: {
      khasraNumbers: ['44/1', '44/2', '45', '46/A'],
      village: 'Narasapura',
      taluka: 'Kolar',
      district: 'Kolar District',
      areaHectares: 28.40,
      landType: 'Dry Agricultural & Industrial buffer',
      boundaryCoordinates: '13.1342° N, 78.1349° E',
      gisParcelId: 'KA-KOL-NAR-2026-00122',
      primaryOwner: 'Shri K. Venkatesh Gowda',
      ownershipPercentage: 100,
      coOwners: [],
      aadhaarPanLinked: true,
      encumbranceCertificateNo: 'EC-KAR-KOL-2026-1192',
      fieldInspector: 'Smt. R. Manjula (Tahsildar)',
      inspectionDate: '03 Sep 2026',
      fieldVerificationStatus: 'COMPLETED',
      inspectionNotes: 'All 28.40 Ha surveyed and demarcated. Soil stability certified.',
      boundaryGeoFenceMatches: true,
      sitePhotosCount: 12,
      checklist: INITIAL_DISTRICT_CHECKLIST.map(item => ({ ...item, verified: true, verifiedAt: '05 Sep 2026', verifiedBy: 'Dr. Rajesh Sharma, IAS' }))
    },
    stateData: {
      districtApprovalDate: '05 Sep 2026',
      districtApprovedBy: 'Dr. Rajesh Sharma, IAS (District Collector)',
      districtCollectorRemarks: 'All revenue titles cleared. Demarcation confirmed on DGPS.',
      projectPurpose: 'Dedicated Industrial Node & Freight Terminal',
      projectCategory: 'Industrial Corridor & Freight Logistics',
      projectAgency: 'NICDC & Karnataka Industrial Areas Development Board (KIADB)',
      projectRequirement: 'Linear industrial connectivity node alongside NH-75.',
      stateGazetteNotificationRef: 'KAR-GAZ-KIADB-2026-4401',
      rfctlarrSection11Date: '10 Feb 2026',
      section19DeclarationDate: '15 Aug 2026',
      publicHearingsCompleted: true,
      siaAppraisalApproved: true,
      landValuationRatePerAcre: 5200000,
      basicMarketValueCr: 36.40,
      solatiumPercentage: 100,
      solatiumAmountCr: 36.40,
      additionalInterestCr: 8.74,
      totalAwardPackageCr: 81.54,
      affectedFamiliesCount: 290,
      displacedFamiliesCount: 32,
      rehabilitationColonyLocation: 'KIADB Resettlement Enclave, Kolar',
      subsistenceGrantPerFamily: 360000,
      resettlementPlanStatus: 'IN_REVIEW',
      checklist: INITIAL_STATE_CHECKLIST.map(item => ({ ...item }))
    },
    centralData: {
      districtApprovedBy: 'Dr. Rajesh Sharma, IAS',
      districtApprovalDate: '05 Sep 2026',
      stateApprovedBy: '',
      stateApprovalDate: '',
      strategicImportance: 'National Industrial Corridor Development Programme',
      gatiShaktiAlignment: true,
      implementingMinistry: 'Ministry of Commerce & Industry (DPIIT)',
      cabinetSanctionRef: 'CCEA-NICDC-2026-781',
      moefccForestClearanceStage2: 'CLEARED',
      environmentalClearanceRef: 'EC-ENV-2026-NICDC',
      defenseOrRailwayClearance: 'CLEARED',
      totalCorridorLengthKm: 260.0,
      affectedDistrictsCount: 5,
      totalTreasuryBudgetCrores: 480.00,
      disbursedBudgetCrores: 480.00,
      supremeCourtHighCourtLitigation: 'CLEARED_NO_STAY',
      vigilanceAuditClearance: 'CLEARED',
      checklist: INITIAL_CENTRAL_CHECKLIST.map(item => ({ ...item }))
    }
  },
  {
    id: 'LA-2026-003',
    projectName: 'Dedicated Freight Corridor (Western DFC - Vadodara Section)',
    agency: 'Dedicated Freight Corridor Corporation of India (DFCCIL)',
    state: 'Gujarat',
    district: 'Vadodara District',
    totalParcels: 210,
    affectedFamilies: 680,
    submittedDate: '20 Aug 2026',
    currentStage: 'CENTRAL_MINISTRY',
    workflowStatus: 'CENTRAL_PENDING',
    overallStatus: 'IN_PROGRESS',
    stages: {
      DISTRICT_COLLECTOR: { 
        status: 'COMPLETED', 
        verifiedBy: 'Dr. Rajesh Sharma, IAS', 
        verifiedAt: '25 Aug 2026, 05:00 PM',
        remarks: 'Land boundaries and revenue extracts certified.'
      },
      STATE_GOVERNMENT: { 
        status: 'COMPLETED', 
        verifiedBy: 'Smt. Ananya Deshmukh, IAS', 
        verifiedAt: '02 Sep 2026, 03:30 PM',
        remarks: 'Section 19 gazette published, 100% solatium approved, and R&R scheme sanctioned.'
      },
      CENTRAL_MINISTRY: { status: 'ACTIVE' }
    },
    lastUpdated: '02 Sep 2026, 03:30 PM',
    auditLogs: [
      {
        id: 'LOG-3001',
        timestamp: '02 Sep 2026, 03:30 PM',
        authorityLevel: 'STATE_GOVERNMENT',
        authorityTitle: 'State Revenue Department',
        officerName: 'Smt. Ananya Deshmukh, IAS',
        officerId: 'GOV-MH-SEC-1092',
        action: 'STAGE_ADVANCED',
        remarks: 'State-level compliance, compensation award, and R&R certified. Forwarded to Central Ministry for Final Award.'
      }
    ],
    documents: [],
    districtData: {
      khasraNumbers: ['301', '302/1', '302/2'],
      village: 'Karjan',
      taluka: 'Karjan',
      district: 'Vadodara District',
      areaHectares: 42.10,
      landType: 'Linear Railway Right of Way (RoW)',
      boundaryCoordinates: '22.0511° N, 73.1204° E',
      gisParcelId: 'GJ-VAD-KAR-2026-00991',
      primaryOwner: 'Shri Pravinbhai Patel & Co-owners',
      ownershipPercentage: 100,
      coOwners: [],
      aadhaarPanLinked: true,
      encumbranceCertificateNo: 'EC-GUJ-VAD-2026-9901',
      fieldInspector: 'Revenue Team Karjan',
      inspectionDate: '23 Aug 2026',
      fieldVerificationStatus: 'COMPLETED',
      inspectionNotes: 'All linear markers verified along rail alignment.',
      boundaryGeoFenceMatches: true,
      sitePhotosCount: 16,
      checklist: INITIAL_DISTRICT_CHECKLIST.map(item => ({ ...item, verified: true, verifiedAt: '25 Aug 2026', verifiedBy: 'District Authority' }))
    },
    stateData: {
      districtApprovalDate: '25 Aug 2026',
      districtApprovedBy: 'District Collector (Vadodara)',
      districtCollectorRemarks: 'Zero revenue discrepancies. All 210 parcels verified.',
      projectPurpose: 'High-speed Rail Freight Corridor (Western DFC)',
      projectCategory: 'Railways & National Freight Infrastructure',
      projectAgency: 'DFCCIL / Ministry of Railways',
      projectRequirement: 'Linear track bed width of 45m along existing rail spine.',
      stateGazetteNotificationRef: 'GUJ-GAZ-RAIL-2026-891',
      rfctlarrSection11Date: '01 Dec 2025',
      section19DeclarationDate: '15 Jul 2026',
      publicHearingsCompleted: true,
      siaAppraisalApproved: true,
      landValuationRatePerAcre: 6000000,
      basicMarketValueCr: 62.40,
      solatiumPercentage: 100,
      solatiumAmountCr: 62.40,
      additionalInterestCr: 14.98,
      totalAwardPackageCr: 139.78,
      affectedFamiliesCount: 680,
      displacedFamiliesCount: 94,
      rehabilitationColonyLocation: 'Karjan Model Resettlement Township',
      subsistenceGrantPerFamily: 360000,
      resettlementPlanStatus: 'APPROVED',
      checklist: INITIAL_STATE_CHECKLIST.map(item => ({ ...item, verified: true, verifiedAt: '02 Sep 2026', verifiedBy: 'Smt. Ananya Deshmukh, IAS' }))
    },
    centralData: {
      districtApprovedBy: 'District Collector (Vadodara)',
      districtApprovalDate: '25 Aug 2026',
      stateApprovedBy: 'Smt. Ananya Deshmukh, IAS',
      stateApprovalDate: '02 Sep 2026',
      strategicImportance: 'Strategic Western Dedicated Freight Corridor linking Dadri to JNPT Port',
      gatiShaktiAlignment: true,
      implementingMinistry: 'Ministry of Railways, Govt of India',
      cabinetSanctionRef: 'CCEA-RAIL-DFC-2026-SANCTION-01',
      moefccForestClearanceStage2: 'CLEARED',
      environmentalClearanceRef: 'EC-ENV-2026-DFC-W',
      defenseOrRailwayClearance: 'CLEARED',
      totalCorridorLengthKm: 1504.0,
      affectedDistrictsCount: 16,
      totalTreasuryBudgetCrores: 1240.00,
      disbursedBudgetCrores: 1240.00,
      supremeCourtHighCourtLitigation: 'CLEARED_NO_STAY',
      vigilanceAuditClearance: 'CLEARED',
      checklist: INITIAL_CENTRAL_CHECKLIST.map(item => ({ ...item }))
    }
  },
  {
    id: 'LA-2026-004',
    projectName: 'Delhi–Mumbai Industrial Mega Green Energy Corridor',
    agency: 'Power Grid Corporation of India Limited (POWERGRID)',
    state: 'Rajasthan',
    district: 'Jodhpur District',
    totalParcels: 76,
    affectedFamilies: 145,
    submittedDate: '15 Jul 2026',
    currentStage: 'CENTRAL_MINISTRY',
    workflowStatus: 'FINAL_VERIFIED',
    overallStatus: 'VERIFIED',
    stages: {
      DISTRICT_COLLECTOR: { 
        status: 'COMPLETED', 
        verifiedBy: 'Dr. Rajesh Sharma, IAS', 
        verifiedAt: '20 Jul 2026, 03:00 PM',
        remarks: 'Land revenue records certified.'
      },
      STATE_GOVERNMENT: { 
        status: 'COMPLETED', 
        verifiedBy: 'Smt. Ananya Deshmukh, IAS', 
        verifiedAt: '05 Aug 2026, 02:00 PM',
        remarks: 'State compliance and solatium award sanctioned.'
      },
      CENTRAL_MINISTRY: { 
        status: 'COMPLETED', 
        verifiedBy: 'Shri Vikramaditya Verma, IAS', 
        verifiedAt: '20 Aug 2026, 11:30 AM',
        remarks: 'Final Central Statutory Award declared and published in Gazette of India.'
      }
    },
    lastUpdated: '20 Aug 2026, 11:30 AM',
    auditLogs: [
      {
        id: 'LOG-4001',
        timestamp: '20 Aug 2026, 11:30 AM',
        authorityLevel: 'CENTRAL_MINISTRY',
        authorityTitle: 'Ministry of Rural Development & Power',
        officerName: 'Shri Vikramaditya Verma, IAS',
        officerId: 'GOV-GOI-JS-0047',
        action: 'VERIFIED',
        remarks: 'Land acquisition fully verified across District, State, and Central authorities. Statutory award declared.'
      }
    ],
    documents: [],
    districtData: {
      khasraNumbers: ['501', '502', '503'],
      village: 'Bap',
      taluka: 'Bap',
      district: 'Jodhpur District',
      areaHectares: 120.0,
      landType: 'Barren & Solar Generation Buffer',
      boundaryCoordinates: '27.3811° N, 72.3619° E',
      gisParcelId: 'RJ-JOD-BAP-2026-00041',
      primaryOwner: 'State Revenue & Gram Panchayat',
      ownershipPercentage: 100,
      coOwners: [],
      aadhaarPanLinked: true,
      encumbranceCertificateNo: 'EC-RAJ-JOD-2026-001',
      fieldInspector: 'Revenue Authority Jodhpur',
      inspectionDate: '18 Jul 2026',
      fieldVerificationStatus: 'COMPLETED',
      inspectionNotes: 'Barren land verified for solar grid substation.',
      boundaryGeoFenceMatches: true,
      sitePhotosCount: 8,
      checklist: INITIAL_DISTRICT_CHECKLIST.map(item => ({ ...item, verified: true, verifiedAt: '20 Jul 2026' }))
    },
    stateData: {
      districtApprovalDate: '20 Jul 2026',
      districtApprovedBy: 'District Collector',
      districtCollectorRemarks: 'Clear title, zero private encroachments.',
      projectPurpose: 'Inter-state Transmission System for 20GW Renewable Energy',
      projectCategory: 'Green Energy Corridor',
      projectAgency: 'POWERGRID',
      projectRequirement: 'Substation and tower footings.',
      stateGazetteNotificationRef: 'RAJ-GAZ-ENERGY-2026-102',
      rfctlarrSection11Date: '01 Mar 2026',
      section19DeclarationDate: '15 Jun 2026',
      publicHearingsCompleted: true,
      siaAppraisalApproved: true,
      landValuationRatePerAcre: 1500000,
      basicMarketValueCr: 44.50,
      solatiumPercentage: 100,
      solatiumAmountCr: 44.50,
      additionalInterestCr: 10.68,
      totalAwardPackageCr: 99.68,
      affectedFamiliesCount: 145,
      displacedFamiliesCount: 0,
      rehabilitationColonyLocation: 'N/A (No displacement)',
      subsistenceGrantPerFamily: 200000,
      resettlementPlanStatus: 'APPROVED',
      checklist: INITIAL_STATE_CHECKLIST.map(item => ({ ...item, verified: true, verifiedAt: '05 Aug 2026' }))
    },
    centralData: {
      districtApprovedBy: 'District Collector (Jodhpur)',
      districtApprovalDate: '20 Jul 2026',
      stateApprovedBy: 'State Energy Secretary',
      stateApprovalDate: '05 Aug 2026',
      strategicImportance: 'National Green Hydrogen & Solar Mission Transmission Spine',
      gatiShaktiAlignment: true,
      implementingMinistry: 'Ministry of Power & MoRTH',
      cabinetSanctionRef: 'CCEA-POWER-2026-441',
      moefccForestClearanceStage2: 'CLEARED',
      environmentalClearanceRef: 'EC-ENV-2026-SOLAR',
      defenseOrRailwayClearance: 'CLEARED',
      totalCorridorLengthKm: 420.0,
      affectedDistrictsCount: 4,
      totalTreasuryBudgetCrores: 640.00,
      disbursedBudgetCrores: 640.00,
      supremeCourtHighCourtLitigation: 'CLEARED_NO_STAY',
      vigilanceAuditClearance: 'CLEARED',
      checklist: INITIAL_CENTRAL_CHECKLIST.map(item => ({ ...item, verified: true, verifiedAt: '20 Aug 2026' }))
    }
  }
];

const STORAGE_KEY = 'bhumi_setu_gov_verification_cases_v2';

export const getStoredCases = (): VerificationCase[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
  }
  // Initialize with deep cloned initial cases
  const clone = JSON.parse(JSON.stringify(INITIAL_CASES));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
  return clone;
};

export const getCaseById = (id: string): VerificationCase | undefined => {
  const cases = getStoredCases();
  return cases.find(c => c.id === id);
};

export const updateCase = (updatedCase: VerificationCase): void => {
  const cases = getStoredCases();
  const index = cases.findIndex(c => c.id === updatedCase.id);
  if (index !== -1) {
    cases[index] = updatedCase;
  } else {
    cases.push(updatedCase);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

export const saveCases = (cases: VerificationCase[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

export const createDefaultReviewData = (
  district: string,
  totalParcels: number,
  affectedFamilies: number
) => {
  return {
    districtData: {
      khasraNumbers: ['101', '102', '103'],
      village: 'Proposed Area',
      taluka: district,
      district,
      areaHectares: 25.0,
      landType: 'Agricultural & Buffer',
      boundaryCoordinates: '18.5912° N, 73.7389° E',
      gisParcelId: `PROP-${Date.now()}`,
      primaryOwner: 'Revenue & Private Landowners',
      ownershipPercentage: 100,
      coOwners: [],
      aadhaarPanLinked: true,
      encumbranceCertificateNo: `EC-${Date.now()}`,
      fieldInspector: 'Revenue Inspector',
      inspectionDate: new Date().toLocaleDateString(),
      fieldVerificationStatus: 'PENDING' as const,
      inspectionNotes: 'Awaiting initial district field survey.',
      boundaryGeoFenceMatches: true,
      sitePhotosCount: 0,
      checklist: INITIAL_DISTRICT_CHECKLIST.map(i => ({ ...i }))
    },
    stateData: {
      districtApprovalDate: '',
      districtApprovedBy: '',
      districtCollectorRemarks: '',
      projectPurpose: 'Infrastructure Acquisition',
      projectCategory: 'State & National Infrastructure',
      projectAgency: 'Public Agency',
      projectRequirement: 'Linear corridor alignment.',
      stateGazetteNotificationRef: 'PENDING',
      rfctlarrSection11Date: '',
      section19DeclarationDate: '',
      publicHearingsCompleted: false,
      siaAppraisalApproved: false,
      landValuationRatePerAcre: 4000000,
      basicMarketValueCr: 10.0,
      solatiumPercentage: 100,
      solatiumAmountCr: 10.0,
      additionalInterestCr: 2.4,
      totalAwardPackageCr: 22.4,
      affectedFamiliesCount: affectedFamilies,
      displacedFamiliesCount: Math.round(affectedFamilies * 0.1),
      rehabilitationColonyLocation: 'Proposed R&R Layout',
      subsistenceGrantPerFamily: 360000,
      resettlementPlanStatus: 'PENDING' as const,
      checklist: INITIAL_STATE_CHECKLIST.map(i => ({ ...i }))
    },
    centralData: {
      districtApprovedBy: '',
      districtApprovalDate: '',
      stateApprovedBy: '',
      stateApprovalDate: '',
      strategicImportance: 'National Infrastructure Corridor',
      gatiShaktiAlignment: true,
      implementingMinistry: 'Ministry of Infrastructure',
      cabinetSanctionRef: 'PENDING',
      moefccForestClearanceStage2: 'PENDING' as const,
      environmentalClearanceRef: 'PENDING',
      defenseOrRailwayClearance: 'NOT_APPLICABLE' as const,
      totalCorridorLengthKm: 50.0,
      affectedDistrictsCount: 2,
      totalTreasuryBudgetCrores: 100.0,
      disbursedBudgetCrores: 100.0,
      supremeCourtHighCourtLitigation: 'CLEARED_NO_STAY' as const,
      vigilanceAuditClearance: 'PENDING' as const,
      checklist: INITIAL_CENTRAL_CHECKLIST.map(i => ({ ...i }))
    }
  };
};

export const resetCasesToDefault = (): VerificationCase[] => {
  const clone = JSON.parse(JSON.stringify(INITIAL_CASES));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
  } catch (e) {
    console.error('Failed to reset localStorage:', e);
  }
  return clone;
};

// Toggle a checklist item for a stage
export const toggleStageCheckItem = (
  caseId: string,
  stage: AuthorityLevel,
  checkId: string,
  officerName: string
): VerificationCase | null => {
  const currentCase = getCaseById(caseId);
  if (!currentCase) return null;

  const now = new Date().toLocaleString();
  let listKey: 'districtData' | 'stateData' | 'centralData';
  if (stage === 'DISTRICT_COLLECTOR') listKey = 'districtData';
  else if (stage === 'STATE_GOVERNMENT') listKey = 'stateData';
  else listKey = 'centralData';

  const updatedChecklist = currentCase[listKey].checklist.map(item => {
    if (item.id === checkId) {
      const nextVerified = !item.verified;
      return {
        ...item,
        verified: nextVerified,
        verifiedAt: nextVerified ? now : undefined,
        verifiedBy: nextVerified ? officerName : undefined
      };
    }
    return item;
  });

  const updatedCase: VerificationCase = {
    ...currentCase,
    [listKey]: {
      ...currentCase[listKey],
      checklist: updatedChecklist
    },
    lastUpdated: now
  };

  updateCase(updatedCase);
  return updatedCase;
};

// Approve District Stage -> Forward to State
export const approveDistrictStage = (
  caseId: string,
  officer: GovernmentOfficer,
  remarks: string
): VerificationCase | null => {
  const currentCase = getCaseById(caseId);
  if (!currentCase) return null;

  const now = new Date().toLocaleString();
  const allChecksPassed = currentCase.districtData.checklist.every(c => c.verified);
  if (!allChecksPassed) return null;

  const newAuditLog = {
    id: `LOG-${Date.now()}`,
    timestamp: now,
    authorityLevel: 'DISTRICT_COLLECTOR' as const,
    authorityTitle: `${officer.designation} (${officer.district})`,
    officerName: officer.name,
    officerId: officer.officerId,
    action: 'STAGE_ADVANCED' as const,
    remarks: remarks || 'District Collector completed all 8 statutory checks and approved forwarding to State Government Verification.'
  };

  const updatedCase: VerificationCase = {
    ...currentCase,
    currentStage: 'STATE_GOVERNMENT',
    workflowStatus: 'STATE_PENDING',
    overallStatus: 'IN_PROGRESS',
    stages: {
      ...currentCase.stages,
      DISTRICT_COLLECTOR: {
        status: 'COMPLETED',
        verifiedBy: officer.name,
        verifiedAt: now,
        remarks: remarks || 'All land-level checks verified.'
      },
      STATE_GOVERNMENT: {
        status: 'ACTIVE'
      }
    },
    stateData: {
      ...currentCase.stateData,
      districtApprovalDate: now,
      districtApprovedBy: `${officer.name} (${officer.designation})`,
      districtCollectorRemarks: remarks || 'Certified that land parcel boundaries, titles, and DGPS surveys are fully verified.'
    },
    auditLogs: [newAuditLog, ...currentCase.auditLogs],
    lastUpdated: now
  };

  updateCase(updatedCase);
  return updatedCase;
};

// Approve State Stage -> Forward to Central
export const approveStateStage = (
  caseId: string,
  officer: GovernmentOfficer,
  remarks: string
): VerificationCase | null => {
  const currentCase = getCaseById(caseId);
  if (!currentCase) return null;

  const now = new Date().toLocaleString();
  const allChecksPassed = currentCase.stateData.checklist.every(c => c.verified);
  if (!allChecksPassed) return null;

  const newAuditLog = {
    id: `LOG-${Date.now()}`,
    timestamp: now,
    authorityLevel: 'STATE_GOVERNMENT' as const,
    authorityTitle: `${officer.designation} (${officer.district})`,
    officerName: officer.name,
    officerId: officer.officerId,
    action: 'STAGE_ADVANCED' as const,
    remarks: remarks || 'State Government verified statutory notifications, compensation award, and R&R plan. Approved progression to Central Ministry.'
  };

  const updatedCase: VerificationCase = {
    ...currentCase,
    currentStage: 'CENTRAL_MINISTRY',
    workflowStatus: 'CENTRAL_PENDING',
    overallStatus: 'IN_PROGRESS',
    stages: {
      ...currentCase.stages,
      STATE_GOVERNMENT: {
        status: 'COMPLETED',
        verifiedBy: officer.name,
        verifiedAt: now,
        remarks: remarks || 'State statutory reviews and compensation matrix approved.'
      },
      CENTRAL_MINISTRY: {
        status: 'ACTIVE'
      }
    },
    centralData: {
      ...currentCase.centralData,
      stateApprovalDate: now,
      stateApprovedBy: `${officer.name} (${officer.designation})`
    },
    auditLogs: [newAuditLog, ...currentCase.auditLogs],
    lastUpdated: now
  };

  updateCase(updatedCase);
  return updatedCase;
};

// Approve Central Stage -> Final Award Declared
export const approveCentralStage = (
  caseId: string,
  officer: GovernmentOfficer,
  remarks: string
): VerificationCase | null => {
  const currentCase = getCaseById(caseId);
  if (!currentCase) return null;

  const now = new Date().toLocaleString();
  const allChecksPassed = currentCase.centralData.checklist.every(c => c.verified);
  if (!allChecksPassed) return null;

  const newAuditLog = {
    id: `LOG-${Date.now()}`,
    timestamp: now,
    authorityLevel: 'CENTRAL_MINISTRY' as const,
    authorityTitle: `${officer.designation} (${officer.district})`,
    officerName: officer.name,
    officerId: officer.officerId,
    action: 'VERIFIED' as const,
    remarks: remarks || 'Central Ministry granted final statutory approval. Case declared FULLY VERIFIED under RFCTLARR statutory award standards.'
  };

  const updatedCase: VerificationCase = {
    ...currentCase,
    workflowStatus: 'FINAL_VERIFIED',
    overallStatus: 'VERIFIED',
    stages: {
      ...currentCase.stages,
      CENTRAL_MINISTRY: {
        status: 'COMPLETED',
        verifiedBy: officer.name,
        verifiedAt: now,
        remarks: remarks || 'Final Central Statutory Award declared.'
      }
    },
    auditLogs: [newAuditLog, ...currentCase.auditLogs],
    lastUpdated: now
  };

  updateCase(updatedCase);
  return updatedCase;
};

// Reject Stage
export const rejectStage = (
  caseId: string,
  rejection: StageRejectionRecord
): VerificationCase | null => {
  const currentCase = getCaseById(caseId);
  if (!currentCase) return null;

  const now = new Date().toLocaleString();
  let workflowStatus: VerificationCase['workflowStatus'] = 'DISTRICT_REJECTED';
  if (rejection.stage === 'STATE_GOVERNMENT') workflowStatus = 'STATE_REJECTED';
  else if (rejection.stage === 'CENTRAL_MINISTRY') workflowStatus = 'CENTRAL_REJECTED';

  const newAuditLog = {
    id: `LOG-${Date.now()}`,
    timestamp: now,
    authorityLevel: rejection.authorityLevel,
    authorityTitle: `${rejection.officerName} (${rejection.stage})`,
    officerName: rejection.officerName,
    officerId: rejection.officerId,
    action: 'REJECTED' as const,
    remarks: `Stage rejected. Category: ${rejection.issueCategory}. Reason: ${rejection.rejectionReason}. Correction required: ${rejection.requiredCorrection}`
  };

  const updatedStages = { ...currentCase.stages };
  updatedStages[rejection.stage] = {
    ...updatedStages[rejection.stage],
    status: 'REJECTED',
    remarks: rejection.rejectionReason
  };

  const updatedCase: VerificationCase = {
    ...currentCase,
    workflowStatus,
    overallStatus: 'REJECTED',
    stages: updatedStages,
    activeRejection: rejection,
    auditLogs: [newAuditLog, ...currentCase.auditLogs],
    lastUpdated: now
  };

  updateCase(updatedCase);
  return updatedCase;
};
