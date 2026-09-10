import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertTriangle } from 'lucide-react';

interface Props {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

type CameraState = 'idle' | 'requesting' | 'active' | 'captured' | 'denied' | 'error';

export const CameraCapture: React.FC<Props> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState('requesting');
    setErrorMsg('');
    try {
      // Prefer environment (rear) camera on mobile devices
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('active');
    } catch (err: unknown) {
      const error = err as DOMException;
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError'
      ) {
        setCameraState('denied');
      } else {
        setCameraState('error');
        setErrorMsg(error.message || 'Camera could not be started.');
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedUrl(dataUrl);
    stopCamera();
    setCameraState('captured');
  };

  const handleRetake = () => {
    setCapturedUrl(null);
    startCamera();
  };

  const handleUsePhoto = () => {
    if (capturedUrl) onCapture(capturedUrl);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div style={{
      backgroundColor: '#000000',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      {/* Header bar */}
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.85)',
        color: '#ffffff',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '14px', fontWeight: 700 }}>📷 Capture Document Page</span>
        <button
          onClick={handleClose}
          style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          aria-label="Close camera"
        >
          <X size={20} />
        </button>
      </div>

      {/* Requesting */}
      {cameraState === 'requesting' && (
        <div style={{ backgroundColor: '#111827', padding: '56px 32px', textAlign: 'center', color: '#ffffff' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>📷</div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>Requesting camera permission…</div>
        </div>
      )}

      {/* Denied */}
      {cameraState === 'denied' && (
        <div style={{ backgroundColor: '#111827', padding: '36px 28px', textAlign: 'center' }}>
          <AlertTriangle size={40} color="#f59e0b" style={{ marginBottom: '14px' }} />
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
            Camera Access Denied
          </div>
          <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6, marginBottom: '22px' }}>
            Camera access was denied by the browser or device.<br />
            You can still upload the document using <strong style={{ color: '#ffffff' }}>Select from Files</strong>.
          </div>
          <button onClick={handleClose} style={darkBtnStyle}>
            Use "Select from Files" Instead
          </button>
        </div>
      )}

      {/* Error */}
      {cameraState === 'error' && (
        <div style={{ backgroundColor: '#111827', padding: '36px 28px', textAlign: 'center' }}>
          <X size={40} color="#ef4444" style={{ marginBottom: '14px' }} />
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
            Camera Error
          </div>
          <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '22px' }}>
            {errorMsg || 'Could not access camera. Please try again or use file upload.'}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleRetake} style={outlineBtnStyle}>Retry</button>
            <button onClick={handleClose} style={darkBtnStyle}>Close</button>
          </div>
        </div>
      )}

      {/* Live video feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          width: '100%',
          maxHeight: '420px',
          objectFit: 'cover',
          display: cameraState === 'active' ? 'block' : 'none',
          backgroundColor: '#000000'
        }}
      />

      {/* Capture button — shown only when camera is live */}
      {cameraState === 'active' && (
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.75)',
          padding: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '24px'
        }}>
          <button
            onClick={handleClose}
            style={{ ...outlineBtnStyle, fontSize: '12px', padding: '8px 14px' }}
          >
            Cancel
          </button>
          {/* Large circular shutter button */}
          <button
            onClick={handleCapture}
            aria-label="Capture photo"
            style={{
              backgroundColor: '#ffffff',
              border: '5px solid #461300',
              borderRadius: '50%',
              width: '68px',
              height: '68px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 3px rgba(70,19,0,0.3)'
            }}
          >
            <Camera size={30} color="#461300" />
          </button>
          <div style={{ width: '70px' }} /> {/* spacer for visual centering */}
        </div>
      )}

      {/* Captured preview */}
      {cameraState === 'captured' && capturedUrl && (
        <>
          <img
            src={capturedUrl}
            alt="Captured document"
            style={{
              width: '100%',
              maxHeight: '420px',
              objectFit: 'contain',
              backgroundColor: '#111827',
              display: 'block'
            }}
          />
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: '18px 20px',
            display: 'flex',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap'
          }}>
            <button onClick={handleRetake} style={outlineBtnStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={15} /> Retake
              </span>
            </button>
            <button onClick={handleUsePhoto} style={darkBtnStyle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={15} /> Use This Photo
              </span>
            </button>
          </div>
        </>
      )}

      {/* Hidden canvas used to capture frame from video */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

// Shared button styles
const darkBtnStyle: React.CSSProperties = {
  backgroundColor: '#461300',
  border: 'none',
  color: '#ffffff',
  borderRadius: '6px',
  padding: '10px 22px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'Arial, Helvetica, sans-serif'
};

const outlineBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: '2px solid #ffffff',
  color: '#ffffff',
  borderRadius: '6px',
  padding: '10px 22px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'Arial, Helvetica, sans-serif'
};
