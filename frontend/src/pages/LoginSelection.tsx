import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Building2, User, ArrowRight, Lock } from 'lucide-react';

const loginOptions = [
  {
    id: 'government',
    title: 'Government Login',
    description: 'For authorized government officials involved in land acquisition administration',
    sublabel: 'Central / State / District Officials',
    icon: ShieldCheck,
    route: '/login/government',
    accentColor: 'var(--primary-container)',
    accentBg: 'var(--surface-container-high)',
  },
  {
    id: 'agency',
    title: 'Agency Login',
    description: 'For authorized project implementing agencies managing infrastructure development',
    sublabel: 'NHAI / Railways / PWD / State Agencies',
    icon: Building2,
    route: '/login/agency',
    accentColor: 'var(--secondary)',
    accentBg: 'var(--secondary-container)',
  },
  {
    id: 'personal',
    title: 'Personal / Landowner Login',
    description: 'For landowners and affected families to access land acquisition and compensation information',
    sublabel: 'OTP-based secure verification',
    icon: User,
    route: '/login/personal',
    accentColor: 'var(--tertiary-container)',
    accentBg: 'var(--tertiary-fixed)',
  },
];

const LoginSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 'var(--space-2xl) var(--space-xl)',
      minHeight: 'calc(100vh - 200px)',
      backgroundColor: 'var(--surface-container)',
    }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-md)',
          }}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="Emblem of India"
              style={{ height: '36px' }}
            />
            <div style={{ textAlign: 'left' }}>
              <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: 0, textTransform: 'uppercase' }}>
                Government of India
              </p>
              <h1 className="headline-lg" style={{ color: 'var(--primary)', margin: 0 }}>
                BhoomiSetu (भूमि सेतु)
              </h1>
            </div>
          </div>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
            Select your role to access the secure authentication portal
          </p>
        </div>

        {/* Login Option Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {loginOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => navigate(option.route)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-lg)',
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--surface-container-lowest)',
                  border: '1px solid var(--outline-variant)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.2s',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = option.accentColor;
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(10,37,64,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--outline-variant)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: option.accentBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={24} color={option.accentColor} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="headline-sm" style={{ margin: '0 0 2px 0', color: 'var(--on-surface)' }}>
                    {option.title}
                  </h3>
                  <p className="body-sm" style={{ margin: '0 0 4px 0', color: 'var(--on-surface-variant)' }}>
                    {option.description}
                  </p>
                  <span className="label-sm" style={{ color: option.accentColor }}>
                    {option.sublabel}
                  </span>
                </div>

                {/* Arrow */}
                <ArrowRight size={20} color="var(--outline)" style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-sm)',
          marginTop: 'var(--space-xl)',
        }}>
          <Lock size={12} color="var(--outline)" />
          <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>
            256-bit TLS Encrypted • Official NIC Portal
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;
