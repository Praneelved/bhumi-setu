// BhoomiSetu Authentication Services — Distinct Auth Handlers & Session Providers
import { 
  setAuthSession, 
  loginGovernment, 
  loginAgency, 
  verifyMfa, 
  personalSendOtp, 
  personalVerifyOtp, 
  type UserProfile 
} from './api';

export type UserType = 'GOVERNMENT' | 'AGENCY' | 'PERSONAL';

export type GovernmentRole = 'CENTRAL_ADMIN' | 'STATE_OFFICER' | 'DISTRICT_OFFICER';
export type AgencyRole = 'AGENCY_ADMIN' | 'PROJECT_MANAGER' | 'FIELD_OFFICER';
export type PersonalRole = 'LANDOWNER';

// ─── Request Interfaces ───────────────────────────────────────────────────

export interface GovernmentAuthRequest {
  officialIdOrEmail: string;
  password: string;
  authorityLevel?: 'DISTRICT_COLLECTOR' | 'STATE_GOVERNMENT' | 'CENTRAL_MINISTRY';
  captchaCode?: string;
}

export interface AgencyAuthRequest {
  agencyId: string;
  officialEmail: string;
  password: string;
  sector?: string;
  agencyRole?: AgencyRole;
}

export interface PersonalAuthSendRequest {
  mobileNumber: string;
  landownerIdOrCaseId?: string;
}

export interface PersonalAuthVerifyRequest {
  sessionId: string;
  otp: string;
  landownerIdOrCaseId?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface MFAResponse {
  mfa_required: boolean;
  session_id: string;
  masked_phone: string;
  message: string;
  dev_otp?: string;
}

// ─── Test Accounts for Mock Authentication ────────────────────────────────

export const MOCK_GOVERNMENT_USERS: Record<string, UserProfile> = {
  'GOV-IAS-2024-8842': {
    id: 'GOV-IAS-2024-8842',
    name: 'Dr. Rajesh Sharma, IAS',
    email: 'district.collector@pune.gov.in',
    user_type: 'GOVERNMENT',
    role: 'DISTRICT_OFFICER',
    state: 'Maharashtra',
    district: 'Pune',
    organization_name: 'District Revenue & Land Acquisition Administration'
  },
  'GOV-MH-SEC-1092': {
    id: 'GOV-MH-SEC-1092',
    name: 'Smt. Ananya Deshmukh, IAS',
    email: 'state.sec@maharashtra.gov.in',
    user_type: 'GOVERNMENT',
    role: 'STATE_OFFICER',
    state: 'Maharashtra',
    district: 'State Secretariat (Mantralaya)',
    organization_name: 'Department of Revenue & Urban Land, Govt of Maharashtra'
  },
  'GOV-GOI-JS-0047': {
    id: 'GOV-GOI-JS-0047',
    name: 'Shri Vikramaditya Verma, IAS',
    email: 'js.land@nic.in',
    user_type: 'GOVERNMENT',
    role: 'CENTRAL_ADMIN',
    state: 'National Portal',
    district: 'New Delhi',
    organization_name: 'Ministry of Rural Development & MoRTH, Govt of India'
  }
};

export const MOCK_AGENCY_USERS: Record<string, UserProfile> = {
  'NHAI-ORG-2026': {
    id: 'AGENCY-NHAI-001',
    name: 'Rajiv Malhotra (Project Director)',
    email: 'pune.expansion@nhai.gov.in',
    user_type: 'AGENCY',
    role: 'PROJECT_MANAGER',
    organization_id: 'NHAI-ORG-2026',
    organization_name: 'National Highways Authority of India (NHAI)',
    assigned_projects: ['LA-2026-001', 'NHAI-MH-PUNE-03'],
    state: 'Maharashtra',
    district: 'Pune'
  },
  'DFCCIL-ORG-88': {
    id: 'AGENCY-DFC-002',
    name: 'Sanjay Kulkarni (Chief Project Engineer)',
    email: 'dfc.lead@railways.gov.in',
    user_type: 'AGENCY',
    role: 'AGENCY_ADMIN',
    organization_id: 'DFCCIL-ORG-88',
    organization_name: 'Dedicated Freight Corridor Corp. (DFCCIL / Railways)',
    assigned_projects: ['LA-2026-002'],
    state: 'Maharashtra',
    district: 'Thane'
  },
  'MIDC-AIR-55': {
    id: 'AGENCY-MIDC-003',
    name: 'Priya Nambiar (Infra Lead)',
    email: 'airport.land@midc.gov.in',
    user_type: 'AGENCY',
    role: 'FIELD_OFFICER',
    organization_id: 'MIDC-AIR-55',
    organization_name: 'Maharashtra Industrial Development Corp (MIDC)',
    assigned_projects: ['LA-2026-003'],
    state: 'Maharashtra',
    district: 'Raigad'
  }
};

export const MOCK_PERSONAL_USERS: Record<string, UserProfile> = {
  '9876543210': {
    id: 'LANDOWNER-MH-7710',
    name: 'Ramesh Baliram Patil',
    phone: '+919876543210',
    user_type: 'PERSONAL',
    role: 'LANDOWNER',
    state: 'Maharashtra',
    district: 'Pune',
    linked_parcels: ['101/1', '101/2', '204'],
    assigned_projects: ['LA-2026-001']
  },
  '9123456789': {
    id: 'LANDOWNER-MH-9942',
    name: 'Savitri Bai Deshmukh',
    phone: '+919123456789',
    user_type: 'PERSONAL',
    role: 'LANDOWNER',
    state: 'Maharashtra',
    district: 'Thane',
    linked_parcels: ['88/A', '89/B'],
    assigned_projects: ['LA-2026-002']
  }
};

// ─── 1. Government Authentication Service ─────────────────────────────────

export async function governmentAuth(request: GovernmentAuthRequest): Promise<MFAResponse> {
  const input = request.officialIdOrEmail.trim();
  const res = await loginGovernment(input, request.password);
  return {
    mfa_required: true,
    session_id: res.session_id,
    masked_phone: res.masked_phone,
    message: res.message,
    dev_otp: res.dev_otp
  };
}

// ─── 2. Agency Authentication Service ─────────────────────────────────────

export async function agencyAuth(request: AgencyAuthRequest): Promise<MFAResponse> {
  const identifier = request.officialEmail.trim() || request.agencyId.trim();
  const res = await loginAgency(identifier, request.password);
  return {
    mfa_required: true,
    session_id: res.session_id,
    masked_phone: res.masked_phone,
    message: res.message,
    dev_otp: res.dev_otp
  };
}

// ─── 3. MFA / OTP Verification Handler (Government & Agency) ─────────────

export async function verifyMFA(sessionId: string, otp: string): Promise<AuthResponse> {
  const res = await verifyMfa(sessionId, otp);
  return res;
}

// ─── 4. Personal / Landowner OTP Authentication Service ────────────────────

export async function sendPersonalOTP(request: PersonalAuthSendRequest): Promise<{
  success: boolean;
  session_id: string;
  message: string;
  dev_otp?: string;
}> {
  let cleanMobile = request.mobileNumber.replace(/\D/g, '');
  if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
    cleanMobile = cleanMobile.slice(2);
  } else if (cleanMobile.length === 11 && cleanMobile.startsWith('0')) {
    cleanMobile = cleanMobile.slice(1);
  }
  if (cleanMobile.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number.');
  }

  const res = await personalSendOtp(cleanMobile);
  return {
    success: res.success,
    session_id: res.session_id,
    message: res.message,
    dev_otp: res.dev_otp
  };
}

export async function verifyPersonalOTP(request: PersonalAuthVerifyRequest): Promise<AuthResponse> {
  const res = await personalVerifyOtp(request.sessionId, request.otp);
  return res;
}
