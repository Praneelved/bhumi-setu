import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Map as MapIcon,
  MapPin,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Crosshair,
  TreePine,
  CreditCard,
  FileText,
  Compass,
  Globe2,
  AlertOctagon
} from 'lucide-react';
import {
  fetchLandownerGisParcels,
  fetchLandownerGisParcelDetail,
  fetchLandownerGisSummary,
  type GISFeatureCollection,
  type LandownerGISSummary,
  type LandownerParcelDetail
} from '../services/api';

// Utility to load Google Maps JS API script using VITE_GOOGLE_MAPS_API_KEY
function loadGoogleMapsScript(apiKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps) {
      resolve((window as any).google);
      return;
    }

    const existingScript = document.getElementById('google-maps-script') as HTMLScriptElement;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any).google));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google?.maps) {
        resolve((window as any).google);
      } else {
        reject(new Error('Google Maps script loaded but window.google.maps is undefined.'));
      }
    };
    script.onerror = (err) => {
      console.error('[BhoomiSetu] Failed to load Google Maps JavaScript API:', err);
      reject(new Error('Google Maps could not be loaded. Please check the Google Maps API configuration.'));
    };

    // Global Google Maps Auth Failure Hook
    (window as any).gm_authFailure = () => {
      console.error('[BhoomiSetu] Google Maps Authentication Failed (gm_authFailure). Check API key and permissions.');
    };

    document.head.appendChild(script);
  });
}

export const LandownerGISExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialParcelId = searchParams.get('parcel') || 'P-001';

  // Read Google Maps API key from environment configuration
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Map DOM & Google Maps Object References
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonsRef = useRef<{ [key: string]: any }>({});
  const markersRef = useRef<{ [key: string]: any }>({});
  const greenBeltPolygonRef = useRef<any>(null);

  // Application State
  const [summary, setSummary] = useState<LandownerGISSummary>({
    total_parcels: 3,
    total_area_ha: 4.40,
    under_acquisition: 2,
    completed: 1
  });
  const [parcelsData, setParcelsData] = useState<GISFeatureCollection | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<string>(initialParcelId);
  const [selectedDetail, setSelectedDetail] = useState<LandownerParcelDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map Controls State
  const [isSatellite, setIsSatellite] = useState<boolean>(false);
  const [showGreenBelt, setShowGreenBelt] = useState<boolean>(true);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // Load Data from Landowner Backend APIs
  const loadData = async (query?: string) => {
    try {
      setLoading(true);
      const [sumRes, parcelsRes] = await Promise.all([
        fetchLandownerGisSummary(),
        fetchLandownerGisParcels(query)
      ]);
      setSummary(sumRes);
      setParcelsData(parcelsRes);

      const targetId = initialParcelId || (parcelsRes.features[0]?.id as string) || 'P-001';
      setSelectedParcelId(targetId);
      loadParcelDetail(targetId);
    } catch (err) {
      console.error('[BhoomiSetu] Failed to load landowner GIS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadParcelDetail = async (parcelId: string) => {
    try {
      const detail = await fetchLandownerGisParcelDetail(parcelId);
      setSelectedDetail(detail);

      // Focus camera on the exact individual parcel
      focusCameraOnParcel(detail);
    } catch (err) {
      console.error(`[BhoomiSetu] Failed to load details for parcel ${parcelId}:`, err);
    }
  };

  // Center & Zoom Google Map directly to the small property level (zoom 17.5 / 18)
  const focusCameraOnParcel = useCallback((detail: LandownerParcelDetail) => {
    if (!mapInstanceRef.current || !detail) return;
    const lat = detail.centroid_lat || 30.8655;
    const lng = detail.centroid_lng || 75.8640;

    mapInstanceRef.current.panTo({ lat, lng });
    mapInstanceRef.current.setZoom(17.5);

    // Update styling on Google Maps polygons
    Object.keys(polygonsRef.current).forEach((pId) => {
      const poly = polygonsRef.current[pId];
      if (pId === detail.id) {
        poly.setOptions({
          strokeColor: '#d97706',
          strokeWeight: 4,
          fillColor: '#f59e0b',
          fillOpacity: 0.45,
          zIndex: 10
        });
      } else {
        poly.setOptions({
          strokeColor: '#461300',
          strokeWeight: 2.5,
          fillColor: '#f59e0b',
          fillOpacity: 0.25,
          zIndex: 1
        });
      }
    });
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Initialize Real Google Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!googleMapsApiKey) {
      setMapError('Google Maps could not be loaded. Please check the Google Maps API configuration (VITE_GOOGLE_MAPS_API_KEY).');
      console.error('[BhoomiSetu] Missing VITE_GOOGLE_MAPS_API_KEY environment variable in frontend/.env');
      return;
    }

    let isCancelled = false;

    loadGoogleMapsScript(googleMapsApiKey)
      .then((google) => {
        if (isCancelled || !mapContainerRef.current) return;

        // Initialize Google Map
        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: 30.865500, lng: 75.864000 },
          zoom: 17.5,
          mapTypeId: isSatellite ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP,
          mapTypeControl: false, // Handled via our custom responsive toggle
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'cooperative'
        });

        mapInstanceRef.current = map;
        setMapError(null);

        // Render Green Belt / Eco-Sensitive Buffer Overlay (Informational)
        const greenBeltCoords = [
          { lat: 30.864600, lng: 75.863100 },
          { lat: 30.864600, lng: 75.864900 },
          { lat: 30.865100, lng: 75.864900 },
          { lat: 30.865100, lng: 75.863100 }
        ];

        const greenBeltPoly = new google.maps.Polygon({
          paths: greenBeltCoords,
          strokeColor: '#059669',
          strokeOpacity: 0.8,
          strokeWeight: 1.5,
          fillColor: '#10b981',
          fillOpacity: 0.22,
          map: showGreenBelt ? map : null,
          zIndex: 0
        });

        greenBeltPolygonRef.current = greenBeltPoly;
      })
      .catch((err) => {
        if (!isCancelled) {
          setMapError('Google Maps could not be loaded. Please check the Google Maps API configuration.');
          console.error('[BhoomiSetu] Error loading Google Maps:', err);
        }
      });

    return () => {
      isCancelled = true;
      Object.values(polygonsRef.current).forEach((p: any) => p.setMap(null));
      Object.values(markersRef.current).forEach((m: any) => m.setMap(null));
      if (greenBeltPolygonRef.current) greenBeltPolygonRef.current.setMap(null);
      polygonsRef.current = {};
      markersRef.current = {};
      mapInstanceRef.current = null;
    };
  }, [googleMapsApiKey]);

  // Render or Update Landowner Parcel Polygons on Google Map
  useEffect(() => {
    if (!mapInstanceRef.current || !parcelsData?.features || !(window as any).google?.maps) return;
    const google = (window as any).google;

    // Clean up existing polygons/markers
    Object.values(polygonsRef.current).forEach((p: any) => p.setMap(null));
    Object.values(markersRef.current).forEach((m: any) => m.setMap(null));
    polygonsRef.current = {};
    markersRef.current = {};

    const bounds = new google.maps.LatLngBounds();

    parcelsData.features.forEach((feat: any) => {
      const ring = feat.geometry.coordinates[0];
      const path = ring.map((pt: number[]) => {
        const latLng = new google.maps.LatLng(pt[1], pt[0]);
        bounds.extend(latLng);
        return latLng;
      });

      const isSelected = feat.id === selectedParcelId;

      // Render actual property polygon boundary
      const polygon = new google.maps.Polygon({
        paths: path,
        strokeColor: isSelected ? '#d97706' : '#461300',
        strokeOpacity: 0.95,
        strokeWeight: isSelected ? 4 : 2.5,
        fillColor: '#f59e0b',
        fillOpacity: isSelected ? 0.45 : 0.28,
        map: mapInstanceRef.current,
        zIndex: isSelected ? 10 : 1
      });

      polygon.addListener('click', () => {
        setSelectedParcelId(feat.id);
        loadParcelDetail(feat.id);
      });

      polygonsRef.current[feat.id] = polygon;

      // Small property marker label at centroid
      const marker = new google.maps.Marker({
        position: { lat: feat.properties.centroid_lat, lng: feat.properties.centroid_lng },
        map: mapInstanceRef.current,
        title: `${feat.id} (${feat.properties.area_ha.toFixed(2)} ha)`,
        label: {
          text: `${feat.id}`,
          color: '#461300',
          fontWeight: 'bold',
          fontSize: '11px'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 4,
          fillColor: '#461300',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 1.5
        }
      });

      marker.addListener('click', () => {
        setSelectedParcelId(feat.id);
        loadParcelDetail(feat.id);
      });

      markersRef.current[feat.id] = marker;
    });

    // Initial camera focus on selected parcel or bounding box
    if (selectedDetail) {
      focusCameraOnParcel(selectedDetail);
    } else if (!bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [parcelsData]);

  // Handle Satellite / Road Map Toggle on Google Maps
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;
    mapInstanceRef.current.setMapTypeId(
      isSatellite ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP
    );
  }, [isSatellite]);

  // Handle Green Belt Layer Toggle on Google Maps
  useEffect(() => {
    if (greenBeltPolygonRef.current && mapInstanceRef.current) {
      greenBeltPolygonRef.current.setMap(showGreenBelt ? mapInstanceRef.current : null);
    }
  }, [showGreenBelt]);

  // Search Handler (Landowner-Specific)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadData();
      return;
    }
    loadData(searchQuery.trim());
  };

  const selectParcelFromList = (pId: string) => {
    setSelectedParcelId(pId);
    loadParcelDetail(pId);
  };

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '24px 28px',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: 'var(--on-background)'
    }}>
      {/* ── 1. Page Header (Simplified Landowner Header, Zero Gov Analytics) ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '18px'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#fff7ed',
            color: '#9a3412',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '6px'
          }}>
            <MapPin size={13} color="#9a3412" />
            Landowner Cadastral Portal
          </div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#461300',
            margin: '0 0 4px 0',
            letterSpacing: '-0.3px'
          }}>
            NATIONAL GIS EXPLORER
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--on-surface-variant)',
            margin: 0
          }}>
            Explore your registered land parcels and their acquisition status.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Map / Satellite Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            padding: '3px',
            border: '1px solid var(--outline-variant)'
          }}>
            <button
              onClick={() => setIsSatellite(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: !isSatellite ? '#ffffff' : 'transparent',
                color: !isSatellite ? '#461300' : '#64748b',
                fontWeight: !isSatellite ? 800 : 600,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: !isSatellite ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <MapIcon size={14} />
              Road Map
            </button>
            <button
              onClick={() => setIsSatellite(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: isSatellite ? '#ffffff' : 'transparent',
                color: isSatellite ? '#461300' : '#64748b',
                fontWeight: isSatellite ? 800 : 600,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: isSatellite ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Globe2 size={14} />
              Satellite View
            </button>
          </div>

          {/* Focus on My Land Button */}
          <button
            onClick={() => selectedDetail && focusCameraOnParcel(selectedDetail)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              color: '#9a3412',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <Compass size={15} color="#9a3412" />
            Focus on My Land
          </button>

          {/* Return to My Land */}
          <button
            onClick={() => navigate('/personal/dashboard')}
            style={{
              padding: '8px 14px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--outline-variant)',
              borderRadius: '8px',
              color: '#461300',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ← My Land
          </button>
        </div>
      </div>

      {/* ── 2. My Land Summary Strip (4 Cards) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '18px'
      }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} color="#9a3412" />
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>MY LAND PARCELS</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#461300' }}>{summary.total_parcels} Parcels</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapIcon size={20} color="#9a3412" />
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>TOTAL AREA</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#461300' }}>{summary.total_area_ha.toFixed(2)} hectares</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="#b45309" />
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>UNDER ACQUISITION</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#b45309' }}>{summary.under_acquisition} Parcels</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #fed7aa', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>COMPLETED</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669' }}>{summary.completed} Parcel</div>
          </div>
        </div>
      </div>

      {/* ── 3. Search & Layers Toolbar ── */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--outline-variant)',
        borderRadius: '12px',
        padding: '10px 16px',
        marginBottom: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 360px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={15} color="var(--outline)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search my land by Parcel ID (P-001), Khasra (124/2), or Village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid var(--outline-variant)',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#461300',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Search My Land
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadData();
              }}
              style={{
                padding: '8px 10px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Map Layers Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              backgroundColor: showLayerMenu ? '#fff7ed' : '#ffffff',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              color: '#9a3412',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Layers size={14} color="#9a3412" />
            Map Layers
          </button>

          {showLayerMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '36px',
              zIndex: 40,
              backgroundColor: '#ffffff',
              border: '1px solid var(--outline-variant)',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              padding: '12px',
              minWidth: '240px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                Visible Map Overlays
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={true} readOnly />
                <span>✓ My Land Parcels (Google Maps)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input type="checkbox" checked={showGreenBelt} onChange={(e) => setShowGreenBelt(e.target.checked)} />
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TreePine size={12} color="#10b981" /> Green Belt Buffer (Informational)
                </span>
              </label>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', fontSize: '10px', color: '#64748b' }}>
                DEMO / INFORMATIONAL DATA overlay. Official clearance records remain in Revenue archives.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Main Interactive Google Map + Parcel Details Panel ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedDetail ? '1fr 390px' : '1fr',
        gap: '18px',
        minHeight: '580px',
        marginBottom: '20px'
      }}>
        {/* Real Interactive Google Map Container */}
        <div style={{
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid var(--outline-variant)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          minHeight: '560px',
          backgroundColor: '#f8fafc'
        }}>
          {/* Error Banner if Google Maps fails to load */}
          {mapError ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '560px',
              padding: '30px',
              textAlign: 'center',
              backgroundColor: '#fff7ed',
              color: '#9a3412'
            }}>
              <AlertOctagon size={48} color="#ea580c" style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>
                {mapError}
              </div>
              <div style={{ fontSize: '13px', color: '#7c2d12', maxWidth: '480px', lineHeight: 1.5 }}>
                Please ensure a valid Google Maps JavaScript API key is configured in <code>frontend/.env</code> as <code>VITE_GOOGLE_MAPS_API_KEY</code>.
              </div>
            </div>
          ) : (
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '560px' }} />
          )}

          {/* Precision Badge in Map Header */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            borderRadius: '6px',
            padding: '6px 10px',
            border: '1px solid #fed7aa',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#15803d',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
          }}>
            <CheckCircle2 size={13} color="#15803d" />
            Exact Property Cadastral Boundary (Google Maps Aerial View)
          </div>

          {/* Map Legend Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            borderRadius: '8px',
            padding: '10px 14px',
            border: '1px solid var(--outline-variant)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            fontSize: '11px',
            lineHeight: 1.6
          }}>
            <div style={{ fontWeight: 800, color: '#461300', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Map Legend
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <div style={{ width: '14px', height: '14px', backgroundColor: '#f59e0b', border: '2px solid #461300', borderRadius: '2px' }} />
              <span style={{ fontWeight: 700, color: '#461300' }}>My Land (Small Individual Parcel)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', backgroundColor: 'rgba(16, 185, 129, 0.25)', border: '1px dashed #059669', borderRadius: '2px' }} />
              <span style={{ color: '#065f46' }}>Green Belt Buffer (DEMO / INFORMATIONAL DATA)</span>
            </div>
          </div>
        </div>

        {/* ── 5. PARCEL DETAILS PANEL ── */}
        {selectedDetail && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fed7aa',
            borderRadius: '14px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            maxHeight: '660px',
            overflowY: 'auto'
          }}>
            {/* Panel Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #ffedd5', paddingBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#9a3412', textTransform: 'uppercase' }}>
                  PARCEL DETAILS
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '19px', fontWeight: 800, color: '#461300' }}>
                    {selectedDetail.id}
                  </span>
                  <span style={{
                    backgroundColor: '#fff7ed',
                    color: '#9a3412',
                    border: '1px solid #fed7aa',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    Survey / Khasra {selectedDetail.khasra_number}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--outline)'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Owner & Status */}
            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: '#854d0e', fontWeight: 700, textTransform: 'uppercase' }}>Owner</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#78350f' }}>{selectedDetail.owner_name}</div>
                <div style={{ fontSize: '11px', color: '#854d0e' }}>Ownership: <strong>{selectedDetail.ownership_percentage}</strong></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#854d0e', fontWeight: 700, textTransform: 'uppercase' }}>Status</div>
                <span style={{
                  display: 'inline-block',
                  marginTop: '2px',
                  backgroundColor: selectedDetail.acquisition_status === 'Possession Taken' ? '#dcfce7' : '#fef3c7',
                  color: selectedDetail.acquisition_status === 'Possession Taken' ? '#15803d' : '#92400e',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: '4px'
                }}>
                  {selectedDetail.acquisition_status}
                </span>
              </div>
            </div>

            {/* Property Area & Case */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Area</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{selectedDetail.area_ha.toFixed(2)} hectares</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>({(selectedDetail.area_ha * 10000).toLocaleString()} m²)</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase' }}>Case Code</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#461300', fontFamily: 'monospace' }}>{selectedDetail.acquisition_case_id}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>RFCTLARR 2013</div>
              </div>
            </div>

            {/* Address & Actual Geographic Location */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Address & Location
              </div>
              <div style={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.5, marginBottom: '6px' }}>
                {selectedDetail.address || `Demo Village, Ludhiana, Punjab - 141001`}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                <div><span style={{ color: 'var(--outline)' }}>Village:</span> <strong>{selectedDetail.village}</strong></div>
                <div><span style={{ color: 'var(--outline)' }}>Taluka:</span> <strong>{selectedDetail.taluka}</strong></div>
                <div><span style={{ color: 'var(--outline)' }}>Municipality:</span> <strong>{selectedDetail.municipality}</strong></div>
                <div><span style={{ color: 'var(--outline)' }}>District:</span> <strong>{selectedDetail.district}</strong></div>
                <div><span style={{ color: 'var(--outline)' }}>State:</span> <strong>{selectedDetail.state}</strong></div>
                <div><span style={{ color: 'var(--outline)' }}>PIN Code:</span> <strong>{selectedDetail.pin_code || '141001'}</strong></div>
              </div>
              <div style={{
                marginTop: '6px',
                padding: '6px 8px',
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#334155'
              }}>
                Latitude: {selectedDetail.centroid_lat.toFixed(6)}° N<br />
                Longitude: {selectedDetail.centroid_lng.toFixed(6)}° E
              </div>
            </div>

            {/* Project Details */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '4px' }}>
                PROJECT
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                {selectedDetail.project_name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--outline)' }}>
                Project Code: {selectedDetail.project_code || 'PROJ-DEMO-001'}
              </div>
            </div>

            {/* Compensation & Payment */}
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '10px 12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>COMPENSATION</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#14532d' }}>{selectedDetail.compensation_formatted}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>PAYMENT STATUS</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: selectedDetail.payment_status === 'Disbursed' ? '#15803d' : '#854d0e' }}>
                    {selectedDetail.payment_status}
                  </div>
                </div>
              </div>
            </div>

            {/* Restricted / Sensitive Zone Overlap Banner (DEMO / INFORMATIONAL DATA) */}
            {selectedDetail.sensitive_zone_overlap?.has_overlap && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <AlertTriangle size={16} color="#b91c1c" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#991b1b' }}>
                    ⚠ Part of this parcel overlaps with: {selectedDetail.sensitive_zone_overlap.zone_type}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7f1d1d', marginTop: '1px' }}>
                    Affected Area: <strong>{selectedDetail.sensitive_zone_overlap.affected_area_ha} hectares</strong>
                  </div>
                  <div style={{ fontSize: '10px', color: '#991b1b', fontStyle: 'italic', marginTop: '3px' }}>
                    "DEMO / INFORMATIONAL DATA: {selectedDetail.sensitive_zone_overlap.disclaimer}"
                  </div>
                </div>
              </div>
            )}

            {/* Quick Action Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => navigate('/personal/dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#461300',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <FileText size={14} />
                View Acquisition Case
              </button>

              <button
                onClick={() => navigate('/personal/dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#f0f9ff',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <CreditCard size={14} />
                View Compensation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 6. MY PARCELS LIST (Quick Selection & Camera Pan) ── */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--outline-variant)',
        borderRadius: '12px',
        padding: '18px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#461300', margin: 0 }}>
              MY PARCELS
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', margin: '2px 0 0 0' }}>
              Click any parcel to center the Google Map on your property and view details.
            </p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#9a3412', backgroundColor: '#fff7ed', padding: '3px 8px', borderRadius: '4px' }}>
            {parcelsData?.features.length || 3} Registered Properties
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '12px'
        }}>
          {parcelsData?.features.map((feat) => {
            const isSelected = selectedParcelId === feat.id;
            return (
              <div
                key={feat.id}
                onClick={() => selectParcelFromList(feat.id as string)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid #461300' : '1px solid var(--outline-variant)',
                  backgroundColor: isSelected ? '#fff7ed' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 6px rgba(70, 19, 0, 0.08)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      backgroundColor: '#461300',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {feat.id}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#461300' }}>
                      Khasra {feat.properties.khasra_number}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: (feat.properties.acquisition_status as string) === 'Possession Taken' || feat.properties.acquisition_status === 'POSSESSION_TAKEN' ? '#dcfce7' : '#fef3c7',
                    color: (feat.properties.acquisition_status as string) === 'Possession Taken' || feat.properties.acquisition_status === 'POSSESSION_TAKEN' ? '#15803d' : '#92400e'
                  }}>
                    {feat.properties.acquisition_status}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                  <span>{feat.properties.village}, {feat.properties.district}</span>
                  <strong style={{ color: '#0f172a' }}>{feat.properties.area_ha.toFixed(2)} ha</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LandownerGISExplorer;
