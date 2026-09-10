// BhoomiSetu Centralized API Client with Multi-Role Auth & Scoped Access

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  user_type: 'GOVERNMENT' | 'AGENCY' | 'PERSONAL';
  role: string;
  organization_id?: string;
  organization_name?: string;
  state?: string;
  district?: string;
  assigned_projects?: string[];
  linked_parcels?: string[];
}

export interface MFAResponse {
  mfa_required: boolean;
  session_id: string;
  masked_phone: string;
  message: string;
  dev_otp?: string;
}

export interface AuthSessionResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface ProjectKpi {
  active_projects: number;
  active_trend: string;
  acquired_hectares: number;
  verified_percent: number;
  compensation_cr: number;
  disbursed_percent: number;
  at_risk_projects: number;
}

export interface NotificationItem {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  level: string;
}

export interface Parcel {
  id: string;
  project_id: string;
  khasra_no: string;
  mauza: string;
  hadbast_no: string;
  land_type: string;
  area_ha: number;
  owners: string;
  owner_count: number;
  status: 'VERIFIED' | 'UNDER_REVIEW' | 'AWARD_DECLARED' | 'OBJECTION';
  status_label: string;
  estimated_value_cr: number;
  dgps_accuracy: string;
  hearing_date?: string | null;
  objection_summary?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
}

export interface CompensationCalcResult {
  area_ha: number;
  base_rate_lakh_per_ha: number;
  market_value_lakh: number;
  multiplier_factor: number;
  assessed_value_lakh: number;
  solatium_100_percent_lakh: number;
  total_payable_lakh: number;
  total_payable_cr: number;
}

export interface OCRResult {
  document_id: string;
  document_type: string;
  owner_name: string;
  co_owners: string[];
  survey_number: string;
  village: string;
  district: string;
  land_area_ha: number;
  document_number: string;
  mutation_number: string;
  confidence_score: number;
  extracted_at: string;
  status: string;
}

const API_BASE = ''; // Uses Vite reverse proxy /api -> http://localhost:8000/api

// --- Local Storage Session Management ---
export function getAuthToken(): string | null {
  return localStorage.getItem('bhoomi_token');
}

export function getStoredUser(): UserProfile | null {
  const str = localStorage.getItem('bhoomi_user');
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: UserProfile) {
  localStorage.setItem('bhoomi_token', token);
  localStorage.setItem('bhoomi_user', JSON.stringify(user));
  window.dispatchEvent(new Event('storage'));
}

export function clearAuthSession() {
  localStorage.removeItem('bhoomi_token');
  localStorage.removeItem('bhoomi_user');
  window.dispatchEvent(new Event('storage'));
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// --- 1. Authentication Endpoints ---

export async function loginGovernment(email_or_username: string, password: string): Promise<MFAResponse> {
  const res = await fetch(`${API_BASE}/api/auth/government/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_or_username, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Government login failed' }));
    throw new Error(err.detail || 'Government login failed');
  }
  return res.json();
}

export async function loginAgency(email_or_username: string, password: string): Promise<MFAResponse> {
  const res = await fetch(`${API_BASE}/api/auth/agency/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_or_username, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Agency login failed' }));
    throw new Error(err.detail || 'Agency login failed');
  }
  return res.json();
}

export async function verifyMfa(session_id: string, otp: string): Promise<AuthSessionResponse> {
  const res = await fetch(`${API_BASE}/api/auth/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, otp })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'MFA verification failed' }));
    throw new Error(err.detail || 'MFA verification failed');
  }
  const data: AuthSessionResponse = await res.json();
  setAuthSession(data.access_token, data.user);
  return data;
}

export async function personalSendOtp(identifier: string): Promise<{ success: boolean; session_id: string; message: string; dev_otp?: string }> {
  const res = await fetch(`${API_BASE}/api/auth/personal/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to send OTP' }));
    throw new Error(err.detail || 'Failed to send OTP');
  }
  return res.json();
}

export async function personalVerifyOtp(session_id: string, otp: string): Promise<AuthSessionResponse> {
  const res = await fetch(`${API_BASE}/api/auth/personal/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, otp })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'OTP verification failed' }));
    throw new Error(err.detail || 'OTP verification failed');
  }
  const data: AuthSessionResponse = await res.json();
  setAuthSession(data.access_token, data.user);
  return data;
}

export async function getMe(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Session expired');
  return res.json();
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: authHeaders()
    });
  } catch (e) {
    // Ignore network error on logout
  } finally {
    clearAuthSession();
  }
}

// --- 2. Dashboard Endpoints ---
export async function fetchKpis(): Promise<ProjectKpi> {
  const res = await fetch(`${API_BASE}/api/dashboard/kpis`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard KPIs');
  return res.json();
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch(`${API_BASE}/api/workflow/notifications`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

// --- 3. Cadastral Land Parcels (Scoped) ---
export async function fetchParcels(statusFilter?: string): Promise<Parcel[]> {
  const url = statusFilter && statusFilter !== 'ALL'
    ? `${API_BASE}/api/parcels?status_filter=${encodeURIComponent(statusFilter)}`
    : `${API_BASE}/api/parcels`;
  const res = await fetch(url, {
    headers: authHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch parcels' }));
    throw new Error(err.detail || 'Failed to fetch land parcels');
  }
  return res.json();
}

export async function getParcelDetail(parcelId: string): Promise<Parcel> {
  const res = await fetch(`${API_BASE}/api/parcels/${encodeURIComponent(parcelId)}`, {
    headers: authHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch parcel' }));
    throw new Error(err.detail || 'Access Denied: You are not authorized to view this land parcel.');
  }
  return res.json();
}

export async function verifyParcel(parcelId: string): Promise<{ success: boolean; message: string; parcel: Parcel }> {
  const res = await fetch(`${API_BASE}/api/parcels/${encodeURIComponent(parcelId)}/verify`, {
    method: 'POST',
    headers: authHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Verification failed' }));
    throw new Error(err.detail || 'Verification failed');
  }
  return res.json();
}

// --- 4. Compensation Calculator ---
export async function calculateCompensation(areaHa: number, baseRateLakh: number = 18.40, ruralMultiplier: number = 1.50): Promise<CompensationCalcResult> {
  const res = await fetch(`${API_BASE}/api/parcels/compensation-calc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      area_ha: areaHa,
      base_rate_lakh_per_ha: baseRateLakh,
      rural_multiplier: ruralMultiplier,
      include_solatium: true
    })
  });
  if (!res.ok) throw new Error('Failed to calculate compensation');
  return res.json();
}

// --- 5. AI OCR Extraction ---
export async function extractDocumentOCR(documentType: string = 'JAMABANDI'): Promise<OCRResult> {
  const res = await fetch(`${API_BASE}/api/ocr/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_type: documentType })
  });
  if (!res.ok) throw new Error('AI OCR extraction failed');
  return res.json();
}

// --- 6. GIS Features & Cadastral Parcels ---
export interface GISParcelProperties {
  id: string;
  survey_number: string;
  khasra_number: string;
  village: string;
  taluk: string;
  taluka?: string;
  district: string;
  state: string;
  project_id: string;
  project_name: string;
  acquisition_case_id: string;
  owner_id?: string;
  owner_name: string;
  owner_contact?: string;
  ownership_percentage?: number;
  is_primary_owner?: boolean;
  land_classification: string;
  area_ha: number;
  area_sqm: number;
  acquisition_status: 'PROPOSED' | 'SECTION_11' | 'SECTION_19' | 'AWARD_DECLARED' | 'POSSESSION_TAKEN';
  compensation_status: 'NOT_ASSESSED' | 'ASSESSED' | 'APPROVED' | 'PROCESSING' | 'DISBURSED' | 'PAYMENT_FAILED';
  possession_status: 'PENDING' | 'NOTICED' | 'TAKEN';
  centroid_lat: number;
  centroid_lng: number;
  bbox?: [number, number, number, number];
  market_rate_per_sqm: number;
  color: string;
}

export interface GISFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: any;
  };
  properties: GISParcelProperties;
}

export interface GISFeatureCollection {
  type: 'FeatureCollection';
  features: GISFeature[];
}

export interface CompensationRecord {
  id: string;
  case_id: string;
  parcel_id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  base_market_value: number;
  multiplication_factor: number;
  market_value_total: number;
  solatium_amount: number;
  assets_attached_value: number;
  total_award_amount: number;
  total_amount_lakh?: number;
  total_amount_cr?: number;
  status: 'ASSESSED' | 'REVIEWED' | 'APPROVED';
  approved_by?: string | null;
  approval_date?: string | null;
  award_gazette_ref?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface PaymentAuditStep {
  timestamp: string;
  status: 'INITIATED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  actor: string;
  remarks: string;
}

export interface PaymentRecord {
  id: string;
  compensation_id: string;
  case_id: string;
  parcel_id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  beneficiary_aadhaar_mask?: string;
  bank_account_mask: string;
  bank_ifsc: string;
  bank_name: string;
  amount: number;
  payment_channel: string;
  payment_reference: string;
  batch_id: string;
  status: 'INITIATED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  failure_reason?: string | null;
  retry_count: number;
  initiated_by: string;
  initiated_at: string;
  credited_at?: string | null;
  audit_trail: PaymentAuditStep[];
  created_at: string;
  updated_at?: string;
}

export interface DetailedParcel extends GISParcelProperties {
  geometry: any;
  compensation?: CompensationRecord | null;
  payment?: PaymentRecord | null;
  ownership_percentage?: number;
  is_primary_owner?: boolean;
}

export async function fetchGisParcels(filters?: {
  project_id?: string;
  state?: string;
  district?: string;
  acquisition_status?: string;
  compensation_status?: string;
  search?: string;
}): Promise<GISFeatureCollection> {
  const params = new URLSearchParams();
  if (filters?.project_id) params.append('project_id', filters.project_id);
  if (filters?.state) params.append('state', filters.state);
  if (filters?.district) params.append('district', filters.district);
  if (filters?.acquisition_status) params.append('acquisition_status', filters.acquisition_status);
  if (filters?.compensation_status) params.append('compensation_status', filters.compensation_status);
  if (filters?.search) params.append('search', filters.search);

  const qs = params.toString();
  const url = `${API_BASE}/api/gis/parcels${qs ? '?' + qs : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch GIS cadastral parcels');
  return res.json();
}

export async function fetchGisParcelDetail(parcelId: string): Promise<DetailedParcel> {
  const res = await fetch(`${API_BASE}/api/gis/parcels/${encodeURIComponent(parcelId)}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch parcel detail');
  return res.json();
}

export async function fetchParcelAcquisitionContext(parcelId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/gis/parcels/${encodeURIComponent(parcelId)}/acquisition`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch parcel acquisition context');
  return res.json();
}

// --- 7. Compensations ---
export async function fetchCaseCompensations(caseId: string): Promise<CompensationRecord[]> {
  const res = await fetch(`${API_BASE}/api/compensation/${encodeURIComponent(caseId)}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch case compensations');
  return res.json();
}

export async function createCompensationRecord(data: {
  case_id: string;
  parcel_id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  base_market_value: number;
  multiplication_factor: number;
  solatium_amount: number;
  assets_attached_value?: number;
  award_gazette_ref?: string;
  notes?: string;
}): Promise<CompensationRecord> {
  const res = await fetch(`${API_BASE}/api/compensation/create`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to assess compensation');
  return res.json();
}

export async function approveCompensationAward(compensationId: string): Promise<{ success: boolean; compensation: CompensationRecord }> {
  const res = await fetch(`${API_BASE}/api/compensation/${encodeURIComponent(compensationId)}/approve`, {
    method: 'POST',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to approve compensation award');
  return res.json();
}

// --- 8. Government-to-Landowner Payments ---
export async function fetchPayments(filters?: {
  project_id?: string;
  case_id?: string;
  status?: string;
}): Promise<PaymentRecord[]> {
  const params = new URLSearchParams();
  if (filters?.case_id) params.append('case_id', filters.case_id);
  if (filters?.project_id) params.append('project_id', filters.project_id);
  if (filters?.status) params.append('status', filters.status);

  const qs = params.toString();
  const url = `${API_BASE}/api/payments${qs ? '?' + qs : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch payments');
  return res.json();
}

export async function fetchPaymentDetail(paymentId: string): Promise<PaymentRecord> {
  const res = await fetch(`${API_BASE}/api/payments/${encodeURIComponent(paymentId)}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch payment details');
  return res.json();
}

export async function fetchBeneficiaryPayments(beneficiaryId: string = 'usr-landowner-01'): Promise<PaymentRecord[]> {
  const res = await fetch(`${API_BASE}/api/payments/beneficiary/${encodeURIComponent(beneficiaryId)}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch beneficiary payments');
  return res.json();
}

export async function initiatePayment(data: {
  compensation_id: string;
  case_id: string;
  parcel_id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  beneficiary_aadhaar_mask?: string;
  bank_account_mask: string;
  bank_ifsc: string;
  bank_name: string;
  amount: number;
  payment_channel?: string;
}): Promise<{ success: boolean; message: string; payment: PaymentRecord }> {
  const res = await fetch(`${API_BASE}/api/payments/initiate`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to initiate payment' }));
    throw new Error(err.detail || 'Failed to initiate payment');
  }
  return res.json();
}

export async function retryPayment(paymentId: string, reason?: string): Promise<{ success: boolean; message: string; payment: PaymentRecord }> {
  const res = await fetch(`${API_BASE}/api/payments/${encodeURIComponent(paymentId)}/retry`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) throw new Error('Failed to retry payment');
  return res.json();
}

export async function simulatePaymentStatus(
  paymentId: string,
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED',
  failureReason?: string
): Promise<{ success: boolean; simulated_status: string; message: string; payment: PaymentRecord }> {
  const res = await fetch(`${API_BASE}/api/payments/${encodeURIComponent(paymentId)}/simulate-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, failure_reason: failureReason })
  });
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
}

// ----------------- GIS Land-Use & Restricted-Zone Detection APIs -----------------

export type ZoneType = 'FOREST' | 'GREEN_BELT' | 'ECO_SENSITIVE' | 'WETLAND' | 'WATER_BODY' | 'AGRICULTURAL' | 'RESIDENTIAL' | 'INDUSTRIAL';
export type ClearanceReviewStatus = 'PENDING' | 'UNDER_REVIEW' | 'CLEARED' | 'CONDITIONAL_CLEARANCE' | 'REJECTED' | 'NOT_APPLICABLE';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface GISZone {
  id: string;
  zone_code: string;
  zone_name: string;
  zone_type: ZoneType;
  description: string;
  authority: string;
  source: string;
  source_type: string;
  source_date?: string;
  legal_act_reference: string;
  color_hex: string;
  color: string;
  opacity: number;
  restriction_level: string;
  buffer_meters?: number;
  metadata?: Record<string, any>;
  is_active: boolean;
  disclaimer: string;
  geometry?: any;
}

export interface ZoneIntersection {
  id: string;
  project_id: string;
  zone_id: string;
  zone_code: string;
  zone_name: string;
  zone_type: ZoneType;
  zone_description?: string;
  authority: string;
  source_type: string;
  legal_act_reference: string;
  restriction_level: string;
  color_hex: string;
  intersection_area_ha: number;
  percentage_affected: number;
  risk_level: RiskLevel;
  review_status: ClearanceReviewStatus;
  cleared_by_officer?: string | null;
  clearance_authority?: string | null;
  clearance_reference_no?: string | null;
  clearance_date?: string | null;
  remarks?: string | null;
  intersection_geometry?: any;
}

export interface ProjectConstraintsReport {
  project_id: string;
  project_name: string;
  total_corridor_area_ha: number;
  overall_risk_level: RiskLevel;
  total_constrained_area_ha: number;
  intersections_count: number;
  intersections: ZoneIntersection[];
  recommendations: string[];
  project_corridor_geojson?: any;
  disclaimer: string;
}

export interface ParcelConstraintsReport {
  parcel_id: string;
  survey_number: string;
  village: string;
  owner_name: string;
  area_ha: number;
  intersections: {
    id: string;
    parcel_id: string;
    zone_id: string;
    zone_code: string;
    intersection_area_ha: number;
    percentage_affected: number;
    risk_level: RiskLevel;
    detected_at?: string;
    zone_name: string;
    zone_type: ZoneType;
    authority: string;
    color_hex: string;
  }[];
  has_environmental_restrictions: boolean;
}

export async function fetchGisZones(zoneType?: string): Promise<{ type: string; features: any[]; zones: GISZone[]; total_zones: number }> {
  const url = zoneType ? `${API_BASE}/api/gis/zones?zone_type=${encodeURIComponent(zoneType)}` : `${API_BASE}/api/gis/zones`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch GIS zones');
  return res.json();
}

export async function fetchProjectConstraints(projectId: string): Promise<ProjectConstraintsReport> {
  const res = await fetch(`${API_BASE}/api/gis/analysis/project/${encodeURIComponent(projectId)}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch project constraints report');
  return res.json();
}

export async function evaluateProjectAlignment(projectId: string, alignmentGeojson?: any): Promise<ProjectConstraintsReport> {
  const res = await fetch(`${API_BASE}/api/gis/analysis/evaluate-project`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, alignment_geojson: alignmentGeojson })
  });
  if (!res.ok) throw new Error('Failed to evaluate project alignment');
  return res.json();
}

export async function updateZoneClearance(projectId: string, data: {
  zone_id: string;
  review_status: ClearanceReviewStatus;
  cleared_by_officer?: string;
  clearance_authority?: string;
  clearance_reference_no?: string;
  remarks?: string;
}): Promise<ProjectConstraintsReport> {
  const res = await fetch(`${API_BASE}/api/gis/analysis/project/${encodeURIComponent(projectId)}/clearance`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update clearance status' }));
    throw new Error(err.detail || 'Failed to update clearance status');
  }
  return res.json();
}

export async function fetchParcelConstraints(parcelId: string): Promise<ParcelConstraintsReport> {
  const res = await fetch(`${API_BASE}/api/gis/analysis/parcel/${encodeURIComponent(parcelId)}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch parcel constraints');
  return res.json();
}
