import React from 'react';
import { ShieldCheck, User, Building2, MapPin, Award, Layers } from 'lucide-react';
import type { GovernmentOfficer, AuthorityLevel } from '../../types/governmentVerification';
import { DEFAULT_OFFICERS } from '../../mock/governmentMockData';

interface OfficerHeaderBannerProps {
  currentOfficer: GovernmentOfficer;
  onSwitchAuthority?: (level: AuthorityLevel) => void;
  currentStageTitle?: string;
}

export const OfficerHeaderBanner: React.FC<OfficerHeaderBannerProps> = ({
  currentOfficer,
  onSwitchAuthority,
  currentStageTitle
}) => {
  const getAuthorityBadgeColor = (level: AuthorityLevel) => {
    switch (level) {
      case 'DISTRICT_COLLECTOR':
        return { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe' };
      case 'STATE_GOVERNMENT':
        return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' };
      case 'CENTRAL_MINISTRY':
        return { bg: '#fff7ed', text: '#9a3412', border: '#ffedd5' };
    }
  };

  const badgeStyle = getAuthorityBadgeColor(currentOfficer.authorityLevel);

  return (
    <div style={{
      backgroundColor: 'var(--surface-container-lowest)',
      border: '1px solid var(--outline-variant)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      marginBottom: 'var(--space-lg)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
        borderBottom: '1px solid var(--surface-container-high)',
        paddingBottom: 'var(--space-md)',
        marginBottom: 'var(--space-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{
            backgroundColor: 'var(--primary-container)',
            color: '#ffffff',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--primary)',
                margin: 0,
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}>
                Government Verification Portal
              </h2>
              <span style={{
                backgroundColor: '#0a2540',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.05em'
              }}>
                OFFICIAL PORTAL
              </span>
            </div>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: 'var(--on-surface-variant)',
              fontFamily: 'Arial, Helvetica, sans-serif'
            }}>
              National Land Acquisition & Management System — RFCTLARR Act 2013 Statutory Workflows
            </p>
          </div>
        </div>

        {/* Interactive Authority Switcher for Testing */}
        {onSwitchAuthority && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            backgroundColor: 'var(--surface-container-low)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--outline-variant)'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>
              Switch Authority Level:
            </span>
            <select
              value={currentOfficer.authorityLevel}
              onChange={(e) => onSwitchAuthority(e.target.value as AuthorityLevel)}
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--outline)',
                backgroundColor: '#ffffff',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}
            >
              <option value="DISTRICT_COLLECTOR">1. District Collector (Level 1)</option>
              <option value="STATE_GOVERNMENT">2. State Government (Level 2)</option>
              <option value="CENTRAL_MINISTRY">3. Central Ministry (Level 3)</option>
            </select>
          </div>
        )}
      </div>

      {/* Logged-in Authority Information Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-md)',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <User size={18} color="var(--primary-container)" style={{ marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 600, textTransform: 'uppercase' }}>Officer Name</div>
            <div style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{currentOfficer.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>ID: {currentOfficer.officerId}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <Award size={18} color="var(--primary-container)" style={{ marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 600, textTransform: 'uppercase' }}>Designation & Dept</div>
            <div style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{currentOfficer.designation}</div>
            <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>{currentOfficer.department}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <MapPin size={18} color="var(--primary-container)" style={{ marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 600, textTransform: 'uppercase' }}>Jurisdiction</div>
            <div style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{currentOfficer.district}, {currentOfficer.state}</div>
            <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>Sovereign Realm</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <Layers size={18} color="var(--primary-container)" style={{ marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--outline)', fontWeight: 600, textTransform: 'uppercase' }}>Authority Level</div>
            <span style={{
              display: 'inline-block',
              marginTop: '2px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: badgeStyle.bg,
              color: badgeStyle.text,
              border: `1px solid ${badgeStyle.border}`
            }}>
              {currentOfficer.authorityLevel.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
