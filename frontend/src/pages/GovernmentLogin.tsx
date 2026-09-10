import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Lock, ArrowLeft, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { governmentAuth, verifyMFA, type MFAResponse } from '../services/authService';
import OTPVerification from '../components/auth/OTPVerification';

type Step = 'credentials' | 'mfa';

export const GovernmentLogin: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('credentials');

  // Form inputs for Government
  const [officialId, setOfficialId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authorityLevel, setAuthorityLevel] = useState<'DISTRICT_COLLECTOR' | 'STATE_GOVERNMENT' | 'CENTRAL_MINISTRY'>('DISTRICT_COLLECTOR');
  
  // Security Captcha State
  const [captchaCode, setCaptchaCode] = useState('8W7P2Q');
  const [captchaInput, setCaptchaInput] = useState('8W7P2Q');

  // MFA State
  const [mfaSession, setMfaSession] = useState<MFAResponse | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);

  const handleRefreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(res);
    setCaptchaInput(res);
  };


  const handleGovernmentLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!officialId.trim()) {
      setError('Please enter your Government Official ID or Email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (captchaInput.toUpperCase() !== captchaCode.toUpperCase()) {
      setError('Security Captcha code does not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const mfaRes = await governmentAuth({
        officialIdOrEmail: officialId.trim(),
        password,
        authorityLevel,
        captchaCode: captchaInput
      });
      setMfaSession(mfaRes);
      setStep('mfa');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
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
      navigate('/government/dashboard', { replace: true });
    } catch (err: any) {
      setMfaError(err.message || 'Invalid 2FA verification code.');
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
        {/* Government Portal Official Banner Header */}
        <div style={{
          backgroundColor: '#0a2540',
          color: '#ffffff',
          padding: '24px 28px',
          textAlign: 'center',
          borderBottom: '4px solid #000f22'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="Emblem of India"
              style={{ height: '36px', filter: 'brightness(0) invert(1)' }}
            />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Government Verification Portal
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#b0c8eb', margin: 0, letterSpacing: '0.04em' }}>
            STATUTORY LAND ACQUISITION AUTHORITY ACCESS — RFCTLARR ACT 2013
          </p>
        </div>

        <div style={{ padding: '28px' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--primary)',
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
            <form onSubmit={handleGovernmentLoginSubmit}>
              {/* Official ID or Email */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                  Government Official ID / Official Email <span style={{ color: '#ba1a1a' }}>*</span>
                </label>
                <input
                  type="text"
                  value={officialId}
                  onChange={(e) => setOfficialId(e.target.value)}
                  placeholder="e.g. GOV-IAS-2024-8842 or district.collector@pune.gov.in"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--outline-variant)',
                    fontSize: '13px',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    backgroundColor: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                    Password <span style={{ color: '#ba1a1a' }}>*</span>
                  </label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact National NIC Administrator for password reset.'); }} style={{ fontSize: '11px', color: 'var(--primary-container)', fontWeight: 600 }}>
                    Forgot Password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter official password"
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

              {/* Authority Level Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                  Statutory Authority Jurisdiction Level
                </label>
                <select
                  value={authorityLevel}
                  onChange={(e) => setAuthorityLevel(e.target.value as any)}
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
                  <option value="DISTRICT_COLLECTOR">Level 1: District Collector & CALA Authority</option>
                  <option value="STATE_GOVERNMENT">Level 2: State Government Secretariat</option>
                  <option value="CENTRAL_MINISTRY">Level 3: Central Ministry (MoRTH / Rural Dev)</option>
                </select>
              </div>

              {/* Security Captcha */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>
                  Security Verification Code (Captcha)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{
                    backgroundColor: '#0a2540', color: '#ffffff', letterSpacing: '6px', fontWeight: 900,
                    fontSize: '18px', padding: '8px 16px', borderRadius: 'var(--radius-md)', userSelect: 'none'
                  }}>
                    {captchaCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshCaptcha}
                    title="Refresh Captcha"
                    style={{ backgroundColor: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', borderRadius: '4px', padding: '8px', cursor: 'pointer' }}
                  >
                    <RefreshCw size={16} color="var(--primary)" />
                  </button>
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Enter code"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--outline-variant)',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#0a2540',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(10, 37, 64, 0.2)'
                }}
              >
                {loading ? 'Authenticating Security Credentials...' : 'Authenticate & Generate MFA Code'}
              </button>

              <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', fontSize: '11px', color: '#166534', textAlign: 'center' }}>
                🛡️ NIC Sovereign 256-Bit Encrypted Government Security Access
              </div>
            </form>
          ) : (
            <div>
              <div style={{ backgroundColor: '#e0f2fe', border: '1px solid #7dd3fc', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '12px', color: '#0369a1' }}>
                📨 Official 2FA / MFA Code generated for <strong>{officialId}</strong>.<br />
                Please check your registered email inbox for the 6-digit verification code.
              </div>

              <OTPVerification
                sessionId={mfaSession?.session_id || ''}
                maskedPhone={mfaSession?.masked_phone || '+91 98*****842'}
                onVerify={handleMfaVerify}
                onResend={async () => { await governmentAuth({ officialIdOrEmail: officialId, password }); }}
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

export default GovernmentLogin;
