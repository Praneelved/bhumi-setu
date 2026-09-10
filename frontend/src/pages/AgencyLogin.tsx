import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Eye, EyeOff, Lock, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { agencyAuth, verifyMFA, type MFAResponse } from '../services/authService';
import OTPVerification from '../components/auth/OTPVerification';

type Step = 'credentials' | 'mfa';

const SECTOR_CATEGORIES = [
  { value: 'HIGHWAY', label: 'Highways & Expressways (NHAI / PWD)' },
  { value: 'RAILWAY', label: 'Railways & Dedicated Freight Corridors (DFCCIL)' },
  { value: 'AIRPORT', label: 'Civil Aviation & International Airports (AAI / MIDC)' },
  { value: 'INDUSTRIAL', label: 'Industrial Corridors & Smart Cities (MIDC / NIDC)' },
  { value: 'ENERGY', label: 'Power & Renewable Energy Corridors' },
  { value: 'WATER', label: 'Water Resources & Irrigation Projects' }
];

export const AgencyLogin: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('credentials');

  // Form inputs for Agency ONLY (MUST NOT match Government inputs)
  const [agencyId, setAgencyId] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sector, setSector] = useState('HIGHWAY');
  const [agencyRole, setAgencyRole] = useState<'AGENCY_ADMIN' | 'PROJECT_MANAGER' | 'FIELD_OFFICER'>('PROJECT_MANAGER');

  // MFA State
  const [mfaSession, setMfaSession] = useState<MFAResponse | null>(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);



  const handleAgencyLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agencyId.trim()) {
      setError('Please enter your Organization / Agency ID.');
      return;
    }
    if (!officialEmail.trim()) {
      setError('Please enter your Official Agency Email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const mfaRes = await agencyAuth({
        agencyId: agencyId.trim(),
        officialEmail: officialEmail.trim(),
        password,
        sector,
        agencyRole
      });
      setMfaSession(mfaRes);
      setStep('mfa');
    } catch (err: any) {
      setError(err.message || 'Agency authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (otp: string) => {
    if (!mfaSession) return;
    setMfaError(null);
    setMfaLoading(true);
    try {
      await verifyMFA(mfaSession.session_id, otp);
      navigate('/agency/dashboard', { replace: true });
    } catch (err: any) {
      setMfaError(err.message || 'Invalid agency security code.');
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 'var(--space-2xl) var(--space-xl)',
      minHeight: 'calc(100vh - 160px)',
      backgroundColor: 'var(--background)',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--outline-variant)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {/* Agency Banner Header */}
        <div style={{
          backgroundColor: '#0a6d3a',
          color: '#ffffff',
          padding: '24px 28px',
          textAlign: 'center',
          borderBottom: '4px solid #064e28'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Building2 size={32} color="#ffffff" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Project Executing Agency Portal
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#9ef6b6', margin: 0, letterSpacing: '0.04em' }}>
            INFRASTRUCTURE DEVELOPMENT & LAND PROPOSAL SUBMISSION SYSTEM
          </p>
        </div>

        <div style={{ padding: '28px' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0a6d3a',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              marginBottom: '20px'
            }}
          >
            <ArrowLeft size={14} /> Back to Role Selection
          </Link>



          {error && (
            <div style={{
              backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
              padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px',
              fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <ShieldAlert size={18} /> {error}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleAgencyLoginSubmit}>
              {/* Agency / Organization ID */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a6d3a', marginBottom: '6px' }}>
                  Agency / Organization Code ID <span style={{ color: '#ba1a1a' }}>*</span>
                </label>
                <input
                  type="text"
                  value={agencyId}
                  onChange={(e) => setAgencyId(e.target.value)}
                  placeholder="e.g. NHAI-ORG-2026 or DFCCIL-ORG-88"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--outline-variant)',
                    fontSize: '13px',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    fontWeight: 700
                  }}
                />
              </div>

              {/* Official Email */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a6d3a', marginBottom: '6px' }}>
                  Official Agency Email Address <span style={{ color: '#ba1a1a' }}>*</span>
                </label>
                <input
                  type="email"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  placeholder="e.g. pune.expansion@nhai.gov.in"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--outline-variant)',
                    fontSize: '13px',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#0a6d3a' }}>
                    Password <span style={{ color: '#ba1a1a' }}>*</span>
                  </label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Contact your Agency Administrator for account credentials.'); }} style={{ fontSize: '11px', color: '#0a6d3a', fontWeight: 600 }}>
                    Forgot Password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    style={{
                      width: '100%',
                      padding: '10px 36px 10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--outline-variant)',
                      fontSize: '13px',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Sector Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a6d3a', marginBottom: '6px' }}>
                  Infrastructure Sector Category
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--outline-variant)',
                    fontSize: '13px',
                    fontWeight: 700,
                    backgroundColor: '#ffffff',
                    fontFamily: 'Arial, Helvetica, sans-serif'
                  }}
                >
                  {SECTOR_CATEGORIES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Agency Role */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a6d3a', marginBottom: '6px' }}>
                  Authorized Agency Designation Role
                </label>
                <select
                  value={agencyRole}
                  onChange={(e) => setAgencyRole(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--outline-variant)',
                    fontSize: '13px',
                    fontWeight: 700,
                    backgroundColor: '#ffffff',
                    fontFamily: 'Arial, Helvetica, sans-serif'
                  }}
                >
                  <option value="PROJECT_MANAGER">Project Manager (Proposal & Land Acquisition Submission)</option>
                  <option value="AGENCY_ADMIN">Agency Administrator (Full Organizational Access)</option>
                  <option value="FIELD_OFFICER">Field Officer (Cadastral & Ground Verification)</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#0a6d3a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(10, 109, 58, 0.2)'
                }}
              >
                {loading ? 'Authenticating Agency Access...' : 'Agency Sign In & Proceed'}
              </button>

              <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', fontSize: '11px', color: '#166534', textAlign: 'center' }}>
                🏢 Official Infrastructure Implementing Agency Portal
              </div>
            </form>
          ) : (
            <div>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '12px', color: '#166534' }}>
                📨 Agency 2FA OTP code generated for <strong>{officialEmail}</strong>.<br />
                Please check your registered email inbox for the 6-digit verification code.
              </div>

              <OTPVerification
                sessionId={mfaSession?.session_id || ''}
                maskedPhone={mfaSession?.masked_phone || '+91 97*****026'}
                onVerify={handleMfaVerify}
                onResend={async () => { await agencyAuth({ agencyId, officialEmail, password, sector, agencyRole }); }}
                onBack={() => setMfaSession(null)}
                loading={mfaLoading}
                error={mfaError}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgencyLogin;
