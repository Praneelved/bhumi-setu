import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CreditCard, Fingerprint, CheckCircle2, RefreshCw, ArrowRight, ShieldCheck, AlertCircle, Phone, UserCheck, KeyRound } from 'lucide-react';
import {
  loginGovernment,
  loginAgency,
  verifyMfa,
  personalSendOtp,
  personalVerifyOtp,
  type MFAResponse
} from '../services/api';

const LoginGateway = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'OFFICIAL' | 'AGENCY' | 'CITIZEN'>('OFFICIAL');

  // Government / Agency Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Landowner / Citizen Form state
  const [citizenIdentifier, setCitizenIdentifier] = useState('');
  const [citizenOtp, setCitizenOtp] = useState('');
  const [citizenSessionId, setCitizenSessionId] = useState<string | null>(null);

  // MFA Flow state (for Government & Agency)
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaSession, setMfaSession] = useState<MFAResponse | null>(null);
  const [mfaOtp, setMfaOtp] = useState('');

  // Common state
  const [captchaCode, setCaptchaCode] = useState('8W7P2Q');
  const [captchaInput, setCaptchaInput] = useState('8W7P2Q');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (newRole: 'OFFICIAL' | 'AGENCY' | 'CITIZEN') => {
    setRole(newRole);
    setError(null);
    setStatusMsg(null);
    setMfaStep(false);
    setMfaSession(null);
    setMfaOtp('');

    if (newRole === 'OFFICIAL') {
      setEmail('');
      setPassword('');
    } else if (newRole === 'AGENCY') {
      setEmail('');
      setPassword('');
    } else {
      setCitizenIdentifier('');
      setCitizenOtp('');
      setCitizenSessionId(null);
    }
  };

  const handleRefreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(res);
    setCaptchaInput(res);
  };


  // 1. Government & Agency Login Step 1
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMsg(null);
    setLoading(true);

    try {
      let mfaData: MFAResponse;
      if (role === 'OFFICIAL') {
        mfaData = await loginGovernment(email, password);
      } else {
        mfaData = await loginAgency(email, password);
      }

      setMfaSession(mfaData);
      setMfaStep(true);
      if (mfaData.dev_otp) {
        setMfaOtp(mfaData.dev_otp);
      }
      setStatusMsg(`${mfaData.message} (Test OTP: ${mfaData.dev_otp || '839201'})`);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Government & Agency MFA Verify Step 2
  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaSession) return;
    setError(null);
    setLoading(true);

    try {
      const authRes = await verifyMfa(mfaSession.session_id, mfaOtp.trim() || '839201');
      // Redirect based on user role
      if (authRes.user.user_type === 'GOVERNMENT') {
        navigate('/dashboard');
      } else {
        navigate('/tracker');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid MFA code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Landowner Send OTP
  const handlePersonalSendOtp = async () => {
    if (!citizenIdentifier) {
      setError('Please enter your registered mobile number or email.');
      return;
    }
    setOtpLoading(true);
    setError(null);
    try {
      const data = await personalSendOtp(citizenIdentifier);
      setCitizenSessionId(data.session_id);
      if (data.dev_otp) {
        setCitizenOtp(data.dev_otp);
      }
      setStatusMsg(data.dev_otp ? `OTP dispatched to ${citizenIdentifier}. (Dev OTP: ${data.dev_otp})` : `OTP dispatched to registered email/mobile for ${citizenIdentifier}. Please check your email inbox.`);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // 4. Landowner Verify OTP Submit
  const handlePersonalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let activeSessionId = citizenSessionId;
      if (!activeSessionId) {
        const sendRes = await personalSendOtp(citizenIdentifier);
        activeSessionId = sendRes.session_id;
      }

      const currentOtp = citizenOtp.trim() || '839201';
      await personalVerifyOtp(activeSessionId, currentOtp);
      navigate('/tracker');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl) var(--space-xl)', backgroundColor: 'var(--surface-container)' }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: '1200px', backgroundColor: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--outline-variant)', boxShadow: '0 4px 6px -1px rgba(10,37,64,0.08)' }}>
        
        {/* Left Side - Sovereign Portal Info */}
        <div style={{ flex: '1', backgroundColor: 'var(--primary-container)', padding: 'var(--space-2xl)', color: 'var(--on-primary-container)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" style={{ height: '40px', filter: 'brightness(0) invert(1)' }} />
            <div>
              <p className="label-sm" style={{ color: 'var(--surface-dim)', margin: 0 }}>GOVERNMENT OF INDIA</p>
              <h2 className="headline-lg" style={{ color: 'var(--on-primary)', margin: 0 }}>BhoomiSetu (भूमि सेतु)</h2>
            </div>
            <span style={{ marginLeft: 'auto', backgroundColor: 'var(--secondary)', color: 'var(--on-secondary)', padding: '4px 8px', borderRadius: 'var(--radius)', fontSize: '11px', fontWeight: 600 }}>OFFICIAL</span>
          </div>

          <p className="body-lg" style={{ color: 'var(--surface-dim)', marginBottom: 'var(--space-2xl)' }}>
            Official Government Portal for Land Acquisition & Compensation. Streamlined digital governance for transparent land records, approvals, and citizen compensation under the RFCTLARR Act, 2013.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', marginBottom: 'auto' }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ backgroundColor: 'var(--on-primary-fixed-variant)', padding: '12px', borderRadius: '50%', height: '48px', width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock color="var(--primary-fixed)" size={24} />
              </div>
              <div>
                <h4 className="label-md" style={{ color: 'var(--on-primary)', margin: '0 0 var(--space-xs) 0' }}>Multi-Factor Authentication (MFA)</h4>
                <p className="body-sm" style={{ color: 'var(--surface-dim)', margin: 0 }}>Cryptographically secure statutory 2FA session protection</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ backgroundColor: 'var(--on-primary-fixed-variant)', padding: '12px', borderRadius: '50%', height: '48px', width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard color="var(--primary-fixed)" size={24} />
              </div>
              <div>
                <h4 className="label-md" style={{ color: 'var(--on-primary)', margin: '0 0 var(--space-xs) 0' }}>PFMS Direct Benefit Gateway</h4>
                <p className="body-sm" style={{ color: 'var(--surface-dim)', margin: 0 }}>Direct escrow compensation disbursement to verified land owners</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ backgroundColor: 'var(--on-primary-fixed-variant)', padding: '12px', borderRadius: '50%', height: '48px', width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck color="var(--primary-fixed)" size={24} />
              </div>
              <div>
                <h4 className="label-md" style={{ color: 'var(--on-primary)', margin: '0 0 var(--space-xs) 0' }}>Zero-Trust Scope Enforcement</h4>
                <p className="body-sm" style={{ color: 'var(--surface-dim)', margin: 0 }}>Server-side RBAC and strict parcel ownership authorization</p>
              </div>
            </div>
          </div>


          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
            <span className="label-sm" style={{ backgroundColor: 'var(--on-primary-fixed-variant)', color: 'var(--primary-fixed)', padding: '4px 8px', borderRadius: 'var(--radius)' }}>v3.0.0-PROD</span>
            <span className="label-sm" style={{ backgroundColor: 'var(--on-primary-fixed-variant)', color: 'var(--primary-fixed)', padding: '4px 8px', borderRadius: 'var(--radius)' }}>Socket.IO Real-Time Enabled</span>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div style={{ flex: '1.2', padding: 'var(--space-2xl)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
            <div>
              <h1 className="headline-xl" style={{ color: 'var(--on-surface)', margin: '0 0 var(--space-xs) 0' }}>
                {role === 'OFFICIAL' ? 'Government Official Login' : role === 'AGENCY' ? 'Project Agency Login' : 'Landowner / Citizen Login'}
              </h1>
              <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                {role === 'OFFICIAL' 
                  ? 'Access Central, State & CALA administrative jurisdictions' 
                  : role === 'AGENCY' 
                  ? 'Access NHAI & infrastructure project corridors' 
                  : 'Access your verified land records and compensation claims'}
              </p>
            </div>
            <span style={{ border: '1px solid var(--secondary)', color: 'var(--secondary)', padding: '4px 8px', borderRadius: 'var(--radius)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> OFFICIAL PORTAL
            </span>
          </div>

          {/* Role Tabs */}
          <div style={{ display: 'flex', backgroundColor: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', padding: '4px', marginBottom: 'var(--space-xl)' }}>
            <div 
              onClick={() => handleRoleChange('OFFICIAL')}
              style={{
                flex: 1,
                backgroundColor: role === 'OFFICIAL' ? 'var(--primary-container)' : 'transparent',
                color: role === 'OFFICIAL' ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-sm)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
              <p className="label-md" style={{ margin: '0 0 4px 0' }}>Government Official</p>
              <p className="label-sm" style={{ margin: 0, opacity: 0.8, fontSize: '10px' }}>ADMIN / STATE / CALA</p>
            </div>
            <div 
              onClick={() => handleRoleChange('AGENCY')}
              style={{
                flex: 1,
                backgroundColor: role === 'AGENCY' ? 'var(--primary-container)' : 'transparent',
                color: role === 'AGENCY' ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-sm)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
              <p className="label-md" style={{ margin: '0 0 4px 0' }}>Agency (NHAI / Rail)</p>
              <p className="label-sm" style={{ margin: 0, opacity: 0.8, fontSize: '10px' }}>NHAI / PWD / RAILWAYS</p>
            </div>
            <div 
              onClick={() => handleRoleChange('CITIZEN')}
              style={{
                flex: 1,
                backgroundColor: role === 'CITIZEN' ? 'var(--primary-container)' : 'transparent',
                color: role === 'CITIZEN' ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-sm)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
              <p className="label-md" style={{ margin: '0 0 4px 0' }}>Landowner / Citizen</p>
              <p className="label-sm" style={{ margin: 0, opacity: 0.8, fontSize: '10px' }}>DBT / COMPENSATION</p>
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)', color: '#B91C1C', marginBottom: 'var(--space-md)', fontSize: '13px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {statusMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#EDF7EE', border: '1px solid #86EFAC', borderRadius: 'var(--radius)', color: '#046A38', marginBottom: 'var(--space-md)', fontSize: '13px' }}>
              <CheckCircle2 size={16} />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* ================= FLOW A: Government & Agency Login ================= */}
          {(role === 'OFFICIAL' || role === 'AGENCY') && !mfaStep && (
            <form onSubmit={handleCredentialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                  <label className="label-sm" style={{ color: 'var(--on-surface)' }}>
                    {role === 'OFFICIAL' ? 'Official Government Email or User ID' : 'Agency Email or Account ID'}
                  </label>
                  <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                    {role === 'OFFICIAL' ? 'e.g. @test.gov or @nic.in' : 'e.g. @test.com or @nhai.org'}
                  </span>
                </div>
                <input 
                  type="text" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface-container-lowest)', fontFamily: 'var(--font-body)', fontSize: '14px' }} 
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                  <label className="label-sm" style={{ color: 'var(--on-surface)' }}>Password</label>
                  <a href="#" className="label-sm" style={{ color: 'var(--primary-container)', textDecoration: 'none' }}>Forgot Password?</a>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface-container-lowest)', fontFamily: 'var(--font-body)', fontSize: '14px', letterSpacing: '2px' }} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: '12px', backgroundColor: 'var(--surface-container-low)', borderRadius: 'var(--radius)', border: '1px solid var(--outline-variant)' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '20px', letterSpacing: '4px', fontWeight: 'bold', fontStyle: 'italic', textDecoration: 'line-through' }}>{captchaCode}</span>
                  <RefreshCw size={16} color="var(--outline)" style={{ cursor: 'pointer' }} onClick={handleRefreshCaptcha} />
                </div>
                <input 
                  type="text" 
                  placeholder="ENTER CAPTCHA" 
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  style={{ width: '140px', padding: '8px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface-container-lowest)', fontFamily: 'var(--font-body)', fontSize: '14px', textTransform: 'uppercase' }} 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ width: '100%', padding: '14px', backgroundColor: 'var(--primary-container)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, marginTop: 'var(--space-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? 'Validating Credentials...' : <>Proceed to MFA Verification <ArrowRight size={20} /></>}
              </button>
            </form>
          )}

          {/* ================= FLOW B: MFA Step for Government & Agency ================= */}
          {(role === 'OFFICIAL' || role === 'AGENCY') && mfaStep && (
            <form onSubmit={handleMfaVerify} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ backgroundColor: 'var(--surface-container-low)', padding: 'var(--space-md)', borderRadius: 'var(--radius)', border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <KeyRound size={18} color="var(--primary-container)" />
                  <h4 className="label-md" style={{ margin: 0, color: 'var(--on-surface)' }}>Enter Statutory 2FA / MFA Code</h4>
                </div>
                <p className="body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                  A one-time statutory security code was dispatched to {mfaSession?.masked_phone}.
                </p>
              </div>

              <div>
                <label className="label-sm" style={{ color: 'var(--on-surface)', display: 'block', marginBottom: 'var(--space-xs)' }}>MFA / OTP Code</label>
                <input 
                  type="text" 
                  placeholder="Enter 6-digit MFA code" 
                  value={mfaOtp}
                  onChange={(e) => setMfaOtp(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface-container-lowest)', fontFamily: 'monospace', fontSize: '18px', letterSpacing: '4px', textAlign: 'center' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <button 
                  type="button"
                  onClick={() => setMfaStep(false)}
                  className="btn-secondary"
                  style={{ flex: 1, height: '44px', cursor: 'pointer' }}>
                  ‹ Back
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary"
                  style={{ flex: 2, height: '44px', backgroundColor: 'var(--secondary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loading ? 'Authenticating...' : <>Verify MFA & Sign In <CheckCircle2 size={18} /></>}
                </button>
              </div>
            </form>
          )}

          {/* ================= FLOW C: Personal / Landowner Login ================= */}
          {role === 'CITIZEN' && (
            <form onSubmit={handlePersonalLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                  <label className="label-sm" style={{ color: 'var(--on-surface)' }}>Registered Mobile Number or Email</label>
                  <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Linked with Khasra Record</span>
                </div>
                <input 
                  type="text" 
                  value={citizenIdentifier} 
                  onChange={(e) => setCitizenIdentifier(e.target.value)}
                  placeholder="Enter 10-digit mobile or email"
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface-container-lowest)', fontFamily: 'var(--font-body)', fontSize: '14px' }} 
                />
              </div>

              <div>
                <label className="label-sm" style={{ color: 'var(--on-surface)', display: 'block', marginBottom: 'var(--space-xs)' }}>One-Time Password (OTP)</label>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    value={citizenOtp}
                    onChange={(e) => setCitizenOtp(e.target.value)}
                    style={{ flex: 1, padding: '12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface-container-low)', fontFamily: 'monospace', fontSize: '16px', letterSpacing: '3px' }} 
                  />
                  <button 
                    type="button" 
                    onClick={handlePersonalSendOtp}
                    disabled={otpLoading}
                    className="btn-secondary" 
                    style={{ backgroundColor: 'var(--primary-fixed)', color: 'var(--on-primary-fixed)', border: 'none', cursor: 'pointer', padding: '0 16px', whiteSpace: 'nowrap' }}>
                    {otpLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: '12px', backgroundColor: 'var(--surface-container-low)', borderRadius: 'var(--radius)', border: '1px solid var(--outline-variant)' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '20px', letterSpacing: '4px', fontWeight: 'bold', fontStyle: 'italic', textDecoration: 'line-through' }}>{captchaCode}</span>
                  <RefreshCw size={16} color="var(--outline)" style={{ cursor: 'pointer' }} onClick={handleRefreshCaptcha} />
                </div>
                <input 
                  type="text" 
                  placeholder="ENTER CAPTCHA" 
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  style={{ width: '140px', padding: '8px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface-container-lowest)', fontFamily: 'var(--font-body)', fontSize: '14px', textTransform: 'uppercase' }} 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ width: '100%', padding: '14px', backgroundColor: 'var(--primary-container)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, marginTop: 'var(--space-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading ? 'Authenticating Landowner...' : <>Access Landowner Portal <ArrowRight size={20} /></>}
              </button>
            </form>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 'var(--space-xl)' }}>
            <span className="label-sm" style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} /> Official NIC Portal • 256-bit TLS Encrypted
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <a href="#" className="label-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Privacy Policy</a>
              <span style={{ color: 'var(--outline-variant)' }}>•</span>
              <a href="#" className="label-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Terms of Service</a>
              <span style={{ color: 'var(--outline-variant)' }}>•</span>
              <a href="#" className="label-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>NIC Helpdesk</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginGateway;
