import React, { useState, useRef, useEffect, useCallback } from 'react';
import { KeyRound, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface OTPVerificationProps {
  /** Title shown above the OTP input */
  title?: string;
  /** Description text e.g. "Code sent to ****1234" */
  description?: string;
  /** Number of OTP digits */
  digits?: number;
  /** Countdown seconds before resend is allowed */
  resendCooldown?: number;
  /** Called when user submits the OTP */
  onVerify: (otp: string) => Promise<void>;
  /** Called when user clicks "Resend OTP" */
  onResend?: () => Promise<unknown> | void;
  /** Called when user clicks back */
  onBack?: () => void;
  /** Session ID for MFA */
  sessionId?: string;
  /** Masked phone number displayed */
  maskedPhone?: string;
  /** Whether verification is in progress */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Success message to display */
  success?: string | null;
  /** Pre-filled OTP (dev mode) */
  devOtp?: string;
  /** Accent color CSS variable for the header stripe */
  accentColor?: string;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  title = 'Enter Verification Code',
  description = 'A one-time verification code has been sent to your registered device.',
  digits = 6,
  resendCooldown = 30,
  onVerify,
  onResend,
  onBack,
  loading = false,
  error = null,
  success = null,
  devOtp,
  accentColor = 'var(--primary-container)',
}) => {
  const [otpValues, setOtpValues] = useState<string[]>(Array(digits).fill(''));
  const [countdown, setCountdown] = useState(resendCooldown);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Pre-fill dev OTP if provided
  useEffect(() => {
    if (devOtp && devOtp.length === digits) {
      setOtpValues(devOtp.split(''));
    }
  }, [devOtp, digits]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newValues = [...otpValues];
    newValues[index] = value.slice(-1); // take last char
    setOtpValues(newValues);

    // Auto-advance to next input
    if (value && index < digits - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otpValues, digits]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otpValues]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, digits);
    if (pasted.length > 0) {
      const newValues = Array(digits).fill('');
      pasted.split('').forEach((char, i) => { newValues[i] = char; });
      setOtpValues(newValues);
      const focusIdx = Math.min(pasted.length, digits - 1);
      inputRefs.current[focusIdx]?.focus();
    }
  }, [digits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpValues.join('');
    if (otp.length !== digits) return;
    await onVerify(otp);
  };

  const handleResend = async () => {
    if (!onResend || countdown > 0 || resending) return;
    setResending(true);
    try {
      await onResend();
      setCountdown(resendCooldown);
      setOtpValues(Array(digits).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  };

  const otpComplete = otpValues.every((v) => v !== '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Header card */}
      <div style={{
        backgroundColor: 'var(--surface-container-low)',
        padding: 'var(--space-lg)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--outline-variant)',
        borderLeft: `4px solid ${accentColor}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
          <KeyRound size={20} color={accentColor} />
          <h3 className="headline-sm" style={{ margin: 0, color: 'var(--on-surface)' }}>{title}</h3>
        </div>
        <p className="body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
          {description}
        </p>
      </div>

      {/* Feedback messages */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
          padding: 'var(--space-md)',
          backgroundColor: 'var(--error-container)',
          border: '1px solid var(--error)',
          borderRadius: 'var(--radius)',
          color: 'var(--on-error-container)',
          fontSize: '13px',
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
          padding: 'var(--space-md)',
          backgroundColor: 'var(--secondary-container)',
          border: '1px solid var(--secondary)',
          borderRadius: 'var(--radius)',
          color: 'var(--on-secondary-container)',
          fontSize: '13px',
        }}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* OTP Digit Inputs */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <div>
          <label className="label-sm" style={{
            color: 'var(--on-surface)',
            display: 'block',
            marginBottom: 'var(--space-sm)',
          }}>
            Verification Code
          </label>
          <div style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            justifyContent: 'center',
          }} onPaste={handlePaste}>
            {otpValues.map((val, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={val}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: '48px',
                  height: '56px',
                  textAlign: 'center',
                  fontSize: '22px',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  border: `2px solid ${val ? accentColor : 'var(--outline-variant)'}`,
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--surface-container-lowest)',
                  color: 'var(--on-surface)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.target.style.borderColor = accentColor; }}
                onBlur={(e) => { if (!val) e.target.style.borderColor = 'var(--outline-variant)'; }}
              />
            ))}
          </div>
        </div>

        {/* Resend OTP */}
        <div style={{ textAlign: 'center' }}>
          {countdown > 0 ? (
            <p className="body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
              Resend code in <span style={{ fontWeight: 600, color: accentColor }}>{countdown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{
                background: 'none',
                border: 'none',
                color: accentColor,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: resending ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                opacity: resending ? 0.6 : 1,
              }}
            >
              <RefreshCw size={14} />
              {resending ? 'Resending...' : 'Resend Code'}
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
            style={{ flex: 1, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="submit"
            disabled={loading || !otpComplete}
            className="btn-primary"
            style={{
              flex: 2,
              height: '44px',
              backgroundColor: otpComplete ? accentColor : 'var(--outline-variant)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1,
              cursor: loading || !otpComplete ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</>
            ) : (
              <><CheckCircle2 size={18} /> Verify & Sign In</>
            )}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OTPVerification;
