import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  wasOffline: boolean;
  /** If true, shows a smaller inline variant instead of a top banner */
  inline?: boolean;
}

/**
 * OfflineBanner - Shows a contextual network status alert.
 * - Red banner when offline: explains OTP cannot be sent without internet
 * - Green brief banner when connection is restored
 */
const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, wasOffline, inline = false }) => {
  if (isOnline && !wasOffline) return null; // nothing to show if always been online

  if (!isOnline) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: inline ? '10px 12px' : '12px 16px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fca5a5',
        borderRadius: '8px',
        marginBottom: inline ? '0' : '16px',
        fontSize: '13px',
        color: '#991b1b',
        lineHeight: 1.5,
      }}>
        <WifiOff size={18} style={{ marginTop: '1px', flexShrink: 0, color: '#dc2626' }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: '3px' }}>
            📵 No Internet Connection
          </div>
          <div style={{ color: '#b91c1c' }}>
            OTP cannot be sent without an active internet connection. The verification code is delivered via email through our secure gateway.
            Please reconnect to the internet and try again.
          </div>
        </div>
      </div>
    );
  }

  // Was offline but now back online
  if (isOnline && wasOffline) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: inline ? '8px 12px' : '10px 16px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '8px',
        marginBottom: inline ? '0' : '12px',
        fontSize: '13px',
        color: '#166534',
        fontWeight: 600,
      }}>
        <Wifi size={16} style={{ color: '#16a34a' }} />
        ✅ Internet connection restored. You can now send OTP.
      </div>
    );
  }

  return null;
};

export default OfflineBanner;
