import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, ArrowLeft, ShieldAlert, CheckCircle2, User, KeyRound, Sparkles } from 'lucide-react';
import { sendPersonalOTP, verifyPersonalOTP } from '../services/authService';
import OTPVerification from '../components/auth/OTPVerification';

type Step = 'phone' | 'otp';

export const PersonalLogin: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('phone');

  // Form inputs for Personal / Landowner ONLY (MUST NOT use email/password)
  const [mobileNumber, setMobileNumber] = useState('');
  const [landownerCaseId, setLandownerCaseId] = useState('');

  // OTP State
  const [sessionId, setSessionId] = useState<string | null>(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);


  const handleSendOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = mobileNumber.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const data = await sendPersonalOTP({
        mobileNumber: `+91${cleaned}`,
        landownerIdOrCaseId: landownerCaseId
      });
      setSessionId(data.session_id);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check your mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (otp: string) => {
    if (!sessionId) return;
    setOtpError(null);
    setOtpLoading(true);
    try {
      await verifyPersonalOTP({
        sessionId,
        otp,
        landownerIdOrCaseId: landownerCaseId
      });
      navigate('/personal/dashboard', { replace: true });
    } catch (err: any) {
      setOtpError(err.message || 'Invalid OTP code. Please check the code sent to your email.');
    } finally {
      setOtpLoading(false);
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
        maxWidth: '500px',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--outline-variant)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {/* Personal / Landowner Banner Header */}
        <div style={{
          backgroundColor: '#461300',
          color: '#ffffff',
          padding: '24px 28px',
          textAlign: 'center',
          borderBottom: '4px solid #220600'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <User size={32} color="#ffffff" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Landowner & Citizen Portal
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#ffdbcf', margin: 0, letterSpacing: '0.04em' }}>
            MOBILE OTP SECURE VERIFICATION — MY LAND & COMPENSATION
          </p>
        </div>

        <div style={{ padding: '28px' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#461300',
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

          {step === 'phone' ? (
            <form onSubmit={handleSendOtpSubmit}>
              {/* Mobile Number Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#461300', marginBottom: '6px' }}>
                  Registered Mobile Number <span style={{ color: '#ba1a1a' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    backgroundColor: 'var(--surface-container-low)',
                    border: '1px solid var(--outline-variant)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--primary)'
                  }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile number"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--outline-variant)',
                      fontSize: '14px',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      outline: 'none',
                      fontWeight: 700,
                      letterSpacing: '1px'
                    }}
                  />
                </div>
              </div>

              {/* Optional Landowner ID or Case ID */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#461300', marginBottom: '6px' }}>
                  Landowner ID / Case Code (Optional for Record Linking)
                </label>
                <input
                  type="text"
                  value={landownerCaseId}
                  onChange={(e) => setLandownerCaseId(e.target.value)}
                  placeholder="e.g. LA-2026-001 or Khasra 101/1"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#461300',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(70, 19, 0, 0.2)'
                }}
              >
                {loading ? 'Sending OTP Code...' : 'Send 6-Digit Mobile OTP'}
              </button>

              <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 'var(--radius-md)', fontSize: '11px', color: '#9a3412', lineHeight: 1.4 }}>
                🔒 <strong>Privacy Commitment:</strong> Landowners can strictly view only their own assigned land parcels, compensation awards, and statutory notifications.
              </div>
            </form>
          ) : (
            <div>
              <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '12px', color: '#9a3412' }}>
                📨 OTP verification code has been sent to your registered email.
                Please check your inbox for the 6-digit code.
              </div>

              <OTPVerification
                sessionId={sessionId || ''}
                maskedPhone={`+91 ${mobileNumber.slice(0, 5)}*****`}
                onVerify={handleOtpVerify}
                onResend={async () => { await sendPersonalOTP({ mobileNumber: `+91${mobileNumber}`, landownerIdOrCaseId: landownerCaseId }); }}
                onBack={() => setStep('phone')}
                loading={otpLoading}
                error={otpError}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalLogin;
