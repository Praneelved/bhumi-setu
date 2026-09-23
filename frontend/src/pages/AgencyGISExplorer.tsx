import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Building2,
  MapPin,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Crosshair,
  Filter,
  Maximize2,
  RefreshCw,
  Eye,
  FileText,
  User,
  Compass,
  Globe2,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Percent,
  AlertOctagon,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react';
import {
  AGENCY_PROJECTS,
  AGENCY_AFFECTED_PARCELS,
  type AgencyProject,
  type AffectedParcel,
  type AcquisitionStatus,
  type CompensationStatus,
  type DocumentVerificationStatus
} from '../data/agencyGisData';
import { getStoredUser } from '../services/api';

// Status colors and display names for acquisition
const STATUS_CONFIG: Record<AcquisitionStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: 'Pending', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  UNDER_VERIFICATION: { label: 'Under Verification', color: '#d97706', bg: '#fffbeb', border: '#fed7aa' },
  NOTICE_ISSUED: { label: 'Notice Issued', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  NEGOTIATION: { label: 'Negotiation', color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
  APPROVED: { label: 'Approved', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  ACQUIRED: { label: 'Acquired', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  COMPENSATION_PENDING: { label: 'Compensation Pending', color: '#ca8a04', bg: '#fefce8', border: '#fef08a' },
  COMPLETED: { label: 'Completed', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
};

export const AgencyGISExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Current logged in agency user
  const currentUser = getStoredUser();

  // Selected Project State
  const initialProjectId = searchParams.get('project') || AGENCY_PROJECTS[0].id;
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);

  const selectedProject = useMemo(() => {
    return AGENCY_PROJECTS.find(p => p.id === selectedProjectId) || AGENCY_PROJECTS[0];
  }, [selectedProjectId]);

  // Selected Parcel State
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [compFilter, setCompFilter] = useState<string>('ALL');
  const [docFilter, setDocFilter] = useState<string>('ALL');
  const [villageFilter, setVillageFilter] = useState<string>('ALL');
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);

  // Map Controls State
  const [isSatellite, setIsSatellite] = useState<boolean>(false);
  const [activeLayers, setActiveLayers] = useState({
    projectBoundary: true,
    landParcels: true,
    landownerLabels: true,
    acquiredLand: true,
    pendingLand: true,
    infrastructureRoute: true
  });
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // Map DOM Reference & MapLibre instance
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Parcels for selected project
  const projectParcels = useMemo(() => {
    return AGENCY_AFFECTED_PARCELS.filter(p => p.projectId === selectedProject.id);
  }, [selectedProject.id]);

  // Unique villages for filter dropdown
  const availableVillages = useMemo(() => {
    const set = new Set(projectParcels.map(p => p.village));
    return Array.from(set);
  }, [projectParcels]);

  // Filtered parcels based on search and filters
  const filteredParcels = useMemo(() => {
    return projectParcels.filter(p => {
      // Status filter
      if (statusFilter !== 'ALL' && p.acquisitionStatus !== statusFilter) return false;
      // Compensation filter
      if (compFilter !== 'ALL' && p.compensationStatus !== compFilter) return false;
      // Document filter
      if (docFilter !== 'ALL' && p.documentStatus !== docFilter) return false;
      // Village filter
      if (villageFilter !== 'ALL' && p.village !== villageFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          p.id.toLowerCase().includes(q) ||
          p.surveyNumber.toLowerCase().includes(q) ||
          p.khasraNumber.toLowerCase().includes(q) ||
          p.landownerName.toLowerCase().includes(q) ||
          p.village.toLowerCase().includes(q) ||
          p.taluka.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Layer toggles: Acquired vs Pending
      if (!activeLayers.acquiredLand && (p.acquisitionStatus === 'ACQUIRED' || p.acquisitionStatus === 'COMPLETED')) {
        return false;
      }
      if (!activeLayers.pendingLand && p.acquisitionStatus !== 'ACQUIRED' && p.acquisitionStatus !== 'COMPLETED') {
        return false;
      }

      return true;
    });
  }, [projectParcels, statusFilter, compFilter, docFilter, villageFilter, searchQuery, activeLayers]);

  // Selected Parcel detail
  const selectedParcel = useMemo(() => {
    if (!selectedParcelId) return null;
    return AGENCY_AFFECTED_PARCELS.find(p => p.id === selectedParcelId) || null;
  }, [selectedParcelId]);

  // Dynamic KPI stats based on filtered / current project
  const stats = useMemo(() => {
    const totalParcelsCount = projectParcels.length;
    const totalLandownersCount = new Set(projectParcels.map(p => p.landownerName)).size;
    const totalAffectedAcres = projectParcels.reduce((sum, p) => sum + p.affectedAreaAcres, 0);
    const acquiredAcres = projectParcels
      .filter(p => p.acquisitionStatus === 'ACQUIRED' || p.acquisitionStatus === 'COMPLETED')
      .reduce((sum, p) => sum + p.affectedAreaAcres, 0);
    const pendingAcres = totalAffectedAcres - acquiredAcres;
    const compPending = projectParcels.filter(p => p.compensationStatus === 'PENDING' || p.compensationStatus === 'PROCESSING').length;
    const docsPending = projectParcels.filter(p => p.documentStatus === 'PENDING' || p.documentStatus === 'UNDER_REVIEW').length;

    return {
      totalParcelsCount: selectedProject.totalParcels,
      totalLandownersCount: selectedProject.totalLandowners,
      totalProjectAreaAcres: selectedProject.totalAreaAcres,
      totalAffectedAcres: selectedProject.requiredLandAcres,
      acquiredAcres: selectedProject.acquiredLandAcres,
      pendingAcres: selectedProject.pendingLandAcres,
      compPending: selectedProject.compensationPendingCount,
      docsPending: selectedProject.documentsPendingCount,
      percentAcquired: Math.round((selectedProject.acquiredLandAcres / selectedProject.requiredLandAcres) * 100) || 0
    };
  }, [projectParcels, selectedProject]);

  // Prepare GeoJSON for parcels
  const parcelsGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: filteredParcels.map(p => ({
        type: 'Feature',
        id: p.id,
        geometry: {
          type: 'Polygon',
          coordinates: p.coordinates
        },
        properties: {
          id: p.id,
          surveyNumber: p.surveyNumber,
          landownerName: p.landownerName,
          village: p.village,
          taluka: p.taluka,
          district: p.district,
          affectedAreaAcres: p.affectedAreaAcres,
          affectedAreaHa: p.affectedAreaHa,
          acquisitionStatus: p.acquisitionStatus,
          compensationStatus: p.compensationStatus,
          compensationFormatted: p.compensationFormatted,
          color: STATUS_CONFIG[p.acquisitionStatus]?.color || '#0284c7',
          centroidLng: p.centroid[0],
          centroidLat: p.centroid[1]
        }
      }))
    };
  }, [filteredParcels]);

  // Handle Project Selection Change
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSearchParams({ project: projectId });
    setSelectedParcelId(null);
    setSearchQuery('');
    setStatusFilter('ALL');
    setCompFilter('ALL');
    setDocFilter('ALL');
    setVillageFilter('ALL');

    const proj = AGENCY_PROJECTS.find(p => p.id === projectId);
    if (proj && mapRef.current) {
      mapRef.current.flyTo({
        center: proj.center,
        zoom: proj.zoom,
        essential: true,
        speed: 1.2
      });
    }
  };

  // Center on Parcel
  const zoomToParcel = useCallback((parcel: AffectedParcel) => {
    setSelectedParcelId(parcel.id);
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: parcel.centroid,
      zoom: 16.5,
      essential: true,
      speed: 1.3
    });
  }, []);

  // Fit to Full Project View
  const fitToProjectView = () => {
    if (!mapRef.current || !selectedProject.corridorGeoJSON?.coordinates[0]) return;
    const ring = selectedProject.corridorGeoJSON.coordinates[0];
    const bounds = new maplibregl.LngLatBounds(ring[0] as [number, number], ring[0] as [number, number]);
    ring.forEach(pt => bounds.extend(pt as [number, number]));
    mapRef.current.fitBounds(bounds, { padding: 60, speed: 1.2 });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setCompFilter('ALL');
    setDocFilter('ALL');
    setVillageFilter('ALL');
    setSearchQuery('');
  };

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: selectedProject.center,
      zoom: selectedProject.zoom
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      if (!map) return;

      // ── 1. Satellite Imagery Raster Layer ──
      map.addSource('esri-satellite-tiles', {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Esri, Maxar'
      });

      map.addLayer({
        id: 'satellite-imagery-layer',
        type: 'raster',
        source: 'esri-satellite-tiles',
        layout: {
          visibility: isSatellite ? 'visible' : 'none'
        },
        paint: {
          'raster-opacity': 1.0
        }
      });

      // ── 2. Project Boundary & Alignment Corridor Layer ──
      map.addSource('project-corridor', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: selectedProject.corridorGeoJSON,
          properties: { name: selectedProject.name }
        }
      });

      map.addLayer({
        id: 'project-corridor-fill',
        type: 'fill',
        source: 'project-corridor',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.12
        },
        layout: {
          visibility: activeLayers.projectBoundary ? 'visible' : 'none'
        }
      });

      map.addLayer({
        id: 'project-corridor-line',
        type: 'line',
        source: 'project-corridor',
        paint: {
          'line-color': '#1d4ed8',
          'line-width': 3,
          'line-dasharray': [4, 2]
        },
        layout: {
          visibility: activeLayers.projectBoundary ? 'visible' : 'none'
        }
      });

      // ── 3. Affected Land Parcels Source & Layers ──
      map.addSource('affected-parcels', {
        type: 'geojson',
        data: parcelsGeoJSON as any
      });

      // Parcel Fill with Acquisition Status Colors
      map.addLayer({
        id: 'parcels-fill',
        type: 'fill',
        source: 'affected-parcels',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': [
            'case',
            ['==', ['get', 'id'], selectedParcelId || ''],
            0.65,
            0.35
          ]
        },
        layout: {
          visibility: activeLayers.landParcels ? 'visible' : 'none'
        }
      });

      // Parcel Outlines
      map.addLayer({
        id: 'parcels-line',
        type: 'line',
        source: 'affected-parcels',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'id'], selectedParcelId || ''],
            '#b45309',
            '#334155'
          ],
          'line-width': [
            'case',
            ['==', ['get', 'id'], selectedParcelId || ''],
            4,
            2
          ]
        },
        layout: {
          visibility: activeLayers.landParcels ? 'visible' : 'none'
        }
      });

      // Selected Parcel Pulsing / Highlight Border
      map.addLayer({
        id: 'parcels-highlight',
        type: 'line',
        source: 'affected-parcels',
        paint: {
          'line-color': '#d97706',
          'line-width': 5
        },
        filter: ['==', ['get', 'id'], selectedParcelId || '']
      });

      // Landowner & Survey Number Labels
      map.addLayer({
        id: 'parcels-labels',
        type: 'symbol',
        source: 'affected-parcels',
        layout: {
          'text-field': [
            'concat',
            'Surv ',
            ['get', 'surveyNumber'],
            '\n',
            ['get', 'landownerName']
          ],
          'text-size': 11,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-anchor': 'center',
          visibility: activeLayers.landownerLabels ? 'visible' : 'none'
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2.5
        }
      });

      // Hover Pointer Cursor
      map.on('mouseenter', 'parcels-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'parcels-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      // Click on Parcel
      map.on('click', 'parcels-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const parcelId = e.features[0].id as string;
          if (parcelId) {
            setSelectedParcelId(parcelId);
            const found = AGENCY_AFFECTED_PARCELS.find(p => p.id === parcelId);
            if (found) {
              map.flyTo({
                center: found.centroid,
                zoom: 16.5,
                essential: true
              });
            }
          }
        }
      });
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Corridor on Project Switch
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    const source = mapRef.current.getSource('project-corridor') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        geometry: selectedProject.corridorGeoJSON,
        properties: { name: selectedProject.name }
      } as any);
    }
  }, [selectedProject]);

  // Update Parcels Data on Filter or Project Change
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    const source = mapRef.current.getSource('affected-parcels') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(parcelsGeoJSON as any);
    }
  }, [parcelsGeoJSON]);

  // Update Selected Parcel Highlight
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    if (mapRef.current.getLayer('parcels-highlight')) {
      mapRef.current.setFilter('parcels-highlight', ['==', ['get', 'id'], selectedParcelId || '']);
    }
    if (mapRef.current.getLayer('parcels-fill')) {
      mapRef.current.setPaintProperty('parcels-fill', 'fill-opacity', [
        'case',
        ['==', ['get', 'id'], selectedParcelId || ''],
        0.65,
        0.35
      ]);
    }
    if (mapRef.current.getLayer('parcels-line')) {
      mapRef.current.setPaintProperty('parcels-line', 'line-color', [
        'case',
        ['==', ['get', 'id'], selectedParcelId || ''],
        '#b45309',
        '#334155'
      ]);
      mapRef.current.setPaintProperty('parcels-line', 'line-width', [
        'case',
        ['==', ['get', 'id'], selectedParcelId || ''],
        4,
        2
      ]);
    }
  }, [selectedParcelId]);

  // Update Layer Visibility
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    if (mapRef.current.getLayer('project-corridor-fill')) {
      mapRef.current.setLayoutProperty(
        'project-corridor-fill',
        'visibility',
        activeLayers.projectBoundary ? 'visible' : 'none'
      );
      mapRef.current.setLayoutProperty(
        'project-corridor-line',
        'visibility',
        activeLayers.projectBoundary ? 'visible' : 'none'
      );
    }
    if (mapRef.current.getLayer('parcels-fill')) {
      mapRef.current.setLayoutProperty(
        'parcels-fill',
        'visibility',
        activeLayers.landParcels ? 'visible' : 'none'
      );
      mapRef.current.setLayoutProperty(
        'parcels-line',
        'visibility',
        activeLayers.landParcels ? 'visible' : 'none'
      );
    }
    if (mapRef.current.getLayer('parcels-labels')) {
      mapRef.current.setLayoutProperty(
        'parcels-labels',
        'visibility',
        activeLayers.landownerLabels ? 'visible' : 'none'
      );
    }
  }, [activeLayers]);

  // Update Satellite View
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    if (mapRef.current.getLayer('satellite-imagery-layer')) {
      mapRef.current.setLayoutProperty(
        'satellite-imagery-layer',
        'visibility',
        isSatellite ? 'visible' : 'none'
      );
    }
  }, [isSatellite]);

  return (
    <div style={{
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '20px 24px',
      fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      color: 'var(--on-background, #0f172a)'
    }}>
      {/* ── 1. Top Header & Agency Breadcrumb ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '6px',
            border: '1px solid #bfdbfe'
          }}>
            <Building2 size={13} color="#1d4ed8" />
            Agency Infrastructure Portal • Spatial Planning & Acquisition
          </div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#0a2540',
            margin: '0 0 4px 0',
            letterSpacing: '-0.3px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            AGENCY PROJECT GIS EXPLORER
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: '#ecfdf5',
              color: '#059669',
              padding: '3px 8px',
              borderRadius: '20px',
              border: '1px solid #a7f3d0'
            }}>
              Live Multi-Project
            </span>
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--on-surface-variant, #64748b)',
            margin: 0
          }}>
            Identify project corridors, geographic impact zones, affected cadastral land parcels, and landowner acquisition status.
          </p>
        </div>

        {/* Quick Agency Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/agency/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--outline-variant, #cbd5e1)',
              borderRadius: '8px',
              color: '#0f172a',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            ← Agency Dashboard
          </button>
          <button
            onClick={fitToProjectView}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#0a2540',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(10,37,64,0.15)'
            }}
          >
            <Maximize2 size={14} />
            Full Project View
          </button>
        </div>
      </div>

      {/* ── 2. Project Selection Bar (Main Feature) ── */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid var(--outline-variant, #e2e8f0)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '320px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #bfdbfe'
          }}>
            <Building2 size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
              Active Infrastructure Project Selection
            </div>
            <select
              value={selectedProjectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '560px',
                padding: '9px 14px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#0f172a',
                backgroundColor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {AGENCY_PROJECTS.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  [{proj.code}] {proj.name} — ({proj.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Project Quick Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '6px 12px',
            backgroundColor: '#f1f5f9',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#334155'
          }}>
            Type: <span style={{ color: '#0f172a', fontWeight: 800 }}>{selectedProject.type}</span>
          </div>
          <div style={{
            padding: '6px 12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#15803d',
            border: '1px solid #bbf7d0'
          }}>
            Status: <span style={{ fontWeight: 800 }}>{selectedProject.status}</span>
          </div>
          <div style={{
            padding: '6px 12px',
            backgroundColor: '#eff6ff',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#1d4ed8',
            border: '1px solid #bfdbfe'
          }}>
            Location: <span style={{ fontWeight: 800 }}>{selectedProject.district}, {selectedProject.state}</span>
          </div>
        </div>
      </div>

      {/* ── 3. Project-Wise Summary Cards (Dynamic Updating KPIs) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Total Landowners */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1px solid var(--outline-variant, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            Total Landowners
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0a2540' }}>
            {stats.totalLandownersCount}
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
            Registered Titleholders
          </div>
        </div>

        {/* Total Land Parcels */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1px solid var(--outline-variant, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            Total Land Parcels
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0a2540' }}>
            {stats.totalParcelsCount}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
            Cadastral Boundaries
          </div>
        </div>

        {/* Total Project Area */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1px solid var(--outline-variant, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            Total Project Area
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0a2540' }}>
            {stats.totalProjectAreaAcres} <span style={{ fontSize: '13px', fontWeight: 600 }}>Acres</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
            ({selectedProject.totalAreaHa} Hectares)
          </div>
        </div>

        {/* Total Affected Land */}
        <div style={{
          backgroundColor: '#fffbeb',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1px solid #fed7aa',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', marginBottom: '4px' }}>
            Required / Affected
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#9a3412' }}>
            {stats.totalAffectedAcres} <span style={{ fontSize: '13px', fontWeight: 600 }}>Acres</span>
          </div>
          <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px', fontWeight: 600 }}>
            Target Acquisition Corridor
          </div>
        </div>

        {/* Acquired Land */}
        <div style={{
          backgroundColor: '#f0fdf4',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1px solid #bbf7d0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', marginBottom: '4px' }}>
            Acquired Land
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#166534' }}>
            {stats.acquiredAcres} <span style={{ fontSize: '13px', fontWeight: 600 }}>Acres</span>
          </div>
          <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px', fontWeight: 700 }}>
            {stats.percentAcquired}% Handed Over
          </div>
        </div>

        {/* Pending Land */}
        <div style={{
          backgroundColor: '#fff1f2',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1px solid #fecdd3',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#be123c', textTransform: 'uppercase', marginBottom: '4px' }}>
            Pending Land
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#9f1239' }}>
            {stats.pendingAcres} <span style={{ fontSize: '13px', fontWeight: 600 }}>Acres</span>
          </div>
          <div style={{ fontSize: '11px', color: '#be123c', marginTop: '2px', fontWeight: 600 }}>
            Under Valuation & Notice
          </div>
        </div>

        {/* Compensation Pending */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1px solid var(--outline-variant, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            Comp. Pending
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0a2540' }}>
            {stats.compPending} <span style={{ fontSize: '12px', fontWeight: 600, color: '#ca8a04' }}>Cases</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
            PFMS Mandate Queue
          </div>
        </div>

        {/* Documents Pending */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1px solid var(--outline-variant, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            Docs Pending
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0a2540' }}>
            {stats.docsPending} <span style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed' }}>Cases</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
            7/12 & Title Checks
          </div>
        </div>
      </div>

      {/* ── 4. Search, Filter Toolbar & Map Mode Controls ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Search Bar with Autocomplete Popup */}
        <div style={{ position: 'relative', flex: '1 1 340px', maxWidth: '520px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            padding: '4px 12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <Search size={16} color="#64748b" style={{ marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Search by Landowner, Survey No, Parcel ID, Village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '13px',
                padding: '6px 0',
                color: '#0f172a'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Autocomplete Results Dropdown */}
          {isSearchFocused && searchQuery.trim().length > 1 && (
            <div style={{
              position: 'absolute',
              top: '42px',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              maxHeight: '260px',
              overflowY: 'auto',
              zIndex: 50
            }}>
              {filteredParcels.length === 0 ? (
                <div style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>
                  No matching parcels or landowners found.
                </div>
              ) : (
                filteredParcels.slice(0, 6).map((parcel) => (
                  <div
                    key={parcel.id}
                    onClick={() => {
                      zoomToParcel(parcel);
                      setIsSearchFocused(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        {parcel.landownerName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Parcel: <span style={{ fontWeight: 600 }}>{parcel.id}</span> • Survey: <span style={{ fontWeight: 600 }}>{parcel.surveyNumber}</span> • {parcel.village}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: STATUS_CONFIG[parcel.acquisitionStatus]?.bg,
                      color: STATUS_CONFIG[parcel.acquisitionStatus]?.color
                    }}>
                      {STATUS_CONFIG[parcel.acquisitionStatus]?.label}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Status: All Acquisition</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_VERIFICATION">Under Verification</option>
            <option value="NOTICE_ISSUED">Notice Issued</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="APPROVED">Approved</option>
            <option value="ACQUIRED">Acquired</option>
            <option value="COMPENSATION_PENDING">Compensation Pending</option>
          </select>

          {/* Village Filter */}
          {availableVillages.length > 1 && (
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Village: All ({availableVillages.length})</option>
              {availableVillages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          )}

          {/* Compensation Filter */}
          <select
            value={compFilter}
            onChange={(e) => setCompFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Payment: All</option>
            <option value="DISBURSED">Disbursed (Completed)</option>
            <option value="ESCR_ESCROW">In Escrow</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending Calculation</option>
          </select>

          {/* Layer Controls Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                backgroundColor: showLayerMenu ? '#eff6ff' : '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#1d4ed8',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Layers size={14} color="#1d4ed8" />
              Layers
            </button>

            {showLayerMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '36px',
                zIndex: 40,
                backgroundColor: '#ffffff',
                border: '1px solid var(--outline-variant, #e2e8f0)',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                padding: '12px',
                minWidth: '240px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Map Overlays & GIS Layers
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={activeLayers.projectBoundary}
                    onChange={(e) => setActiveLayers(prev => ({ ...prev, projectBoundary: e.target.checked }))}
                  />
                  <span style={{ fontWeight: 600 }}>Project Boundary Polygon</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={activeLayers.landParcels}
                    onChange={(e) => setActiveLayers(prev => ({ ...prev, landParcels: e.target.checked }))}
                  />
                  <span style={{ fontWeight: 600 }}>Land Parcel Boundaries</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={activeLayers.landownerLabels}
                    onChange={(e) => setActiveLayers(prev => ({ ...prev, landownerLabels: e.target.checked }))}
                  />
                  <span style={{ fontWeight: 600 }}>Landowner Name Labels</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={activeLayers.acquiredLand}
                    onChange={(e) => setActiveLayers(prev => ({ ...prev, acquiredLand: e.target.checked }))}
                  />
                  <span style={{ fontWeight: 600, color: '#059669' }}>Acquired Land Parcels</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={activeLayers.pendingLand}
                    onChange={(e) => setActiveLayers(prev => ({ ...prev, pendingLand: e.target.checked }))}
                  />
                  <span style={{ fontWeight: 600, color: '#e11d48' }}>Pending Acquisition Land</span>
                </label>
              </div>
            )}
          </div>

          {/* Road / Satellite Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '6px',
            padding: '2px',
            border: '1px solid #cbd5e1'
          }}>
            <button
              onClick={() => setIsSatellite(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: !isSatellite ? '#ffffff' : 'transparent',
                color: !isSatellite ? '#0f172a' : '#64748b',
                fontWeight: !isSatellite ? 800 : 600,
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Road
            </button>
            <button
              onClick={() => setIsSatellite(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: isSatellite ? '#ffffff' : 'transparent',
                color: isSatellite ? '#0f172a' : '#64748b',
                fontWeight: isSatellite ? 800 : 600,
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              <Globe2 size={12} />
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Main Map & Dual Sidebar Layout ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedParcel ? '280px 1fr 360px' : '300px 1fr',
        gap: '18px',
        minHeight: '620px',
        marginBottom: '20px'
      }}>
        {/* Left Side: Project Overview Panel & Parcels List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '740px',
          overflowY: 'auto'
        }}>
          {/* Project Details Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--outline-variant, #e2e8f0)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Project Overview
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0a2540', marginBottom: '2px', lineHeight: 1.3 }}>
              {selectedProject.name}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
              ID: <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedProject.id}</span> • Code: <span style={{ fontWeight: 700 }}>{selectedProject.code}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Executing Agency:</span>
                <span style={{ fontWeight: 700, color: '#0f172a', textAlign: 'right', maxWidth: '160px' }}>{selectedProject.agency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Project Type:</span>
                <span style={{ fontWeight: 700 }}>{selectedProject.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Location:</span>
                <span style={{ fontWeight: 700 }}>{selectedProject.district}, {selectedProject.state}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Current Status:</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>{selectedProject.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Compensation Budget:</span>
                <span style={{ fontWeight: 800, color: '#0a2540' }}>₹{selectedProject.totalCompensationBudgetCr} Cr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Disbursed Fund:</span>
                <span style={{ fontWeight: 800, color: '#16a34a' }}>₹{selectedProject.disbursedCompensationCr} Cr</span>
              </div>
            </div>

            {/* Acquisition Progress Bar */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                <span>Acquisition Progress</span>
                <span style={{ color: '#059669' }}>{stats.percentAcquired}%</span>
              </div>
              <div style={{ height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${stats.percentAcquired}%`,
                  height: '100%',
                  backgroundColor: '#059669',
                  borderRadius: '4px'
                }} />
              </div>
            </div>
          </div>

          {/* Affected Parcels List */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid var(--outline-variant, #e2e8f0)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                Affected Land Parcels ({filteredParcels.length})
              </div>
              {(statusFilter !== 'ALL' || compFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={handleResetFilters}
                  style={{
                    fontSize: '11px',
                    color: '#1d4ed8',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px' }}>
              {filteredParcels.length === 0 ? (
                <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                  No parcels match the current filters.
                </div>
              ) : (
                filteredParcels.map((parcel) => {
                  const isSelected = parcel.id === selectedParcelId;
                  const cfg = STATUS_CONFIG[parcel.acquisitionStatus] || STATUS_CONFIG.PENDING;
                  return (
                    <div
                      key={parcel.id}
                      onClick={() => zoomToParcel(parcel)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                        border: isSelected ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                          {parcel.id} (Surv {parcel.surveyNumber})
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: cfg.bg,
                          color: cfg.color
                        }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                        {parcel.landownerName}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        <span>{parcel.village}, {parcel.district}</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{parcel.affectedAreaAcres} Acres</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Center: Map Canvas Container */}
        <div style={{
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid var(--outline-variant, #cbd5e1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          backgroundColor: '#f8fafc',
          minHeight: '620px'
        }}>
          {/* Map Target Container */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '620px' }} />

          {/* Top-Left Geographic Corridor Badge */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(6px)',
            borderRadius: '8px',
            padding: '8px 12px',
            border: '1px solid #bfdbfe',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#1d4ed8' }} />
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e3a8a' }}>
              Project Corridor: {selectedProject.name}
            </div>
          </div>

          {/* Bottom-Left Map Legend */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(6px)',
            borderRadius: '10px',
            padding: '10px 14px',
            border: '1px solid var(--outline-variant, #cbd5e1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            fontSize: '11px',
            lineHeight: 1.5,
            maxWidth: '300px'
          }}>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              GIS Status Legend
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#ecfdf5', border: '2px solid #059669', borderRadius: '2px' }} />
                <span style={{ fontWeight: 600, color: '#059669' }}>Acquired</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#f0f9ff', border: '2px solid #0284c7', borderRadius: '2px' }} />
                <span style={{ fontWeight: 600, color: '#0284c7' }}>Approved</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#fffbeb', border: '2px solid #d97706', borderRadius: '2px' }} />
                <span style={{ fontWeight: 600, color: '#d97706' }}>Under Verif.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#fefce8', border: '2px solid #ca8a04', borderRadius: '2px' }} />
                <span style={{ fontWeight: 600, color: '#ca8a04' }}>Comp. Pending</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#f5f3ff', border: '2px solid #7c3aed', borderRadius: '2px' }} />
                <span style={{ fontWeight: 600, color: '#7c3aed' }}>Notice Issued</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#fff1f2', border: '2px solid #e11d48', borderRadius: '2px' }} />
                <span style={{ fontWeight: 600, color: '#e11d48' }}>Negotiation</span>
              </div>
            </div>
            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '8px', border: '2px dashed #1d4ed8', backgroundColor: 'rgba(59, 130, 246, 0.15)' }} />
              <span style={{ fontSize: '10px', color: '#64748b' }}>Project Corridor Boundary</span>
            </div>
          </div>
        </div>

        {/* Right Side: Landowner & Parcel Detail Panel (Opens on click) */}
        {selectedParcel && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            padding: '18px',
            border: '1px solid var(--outline-variant, #e2e8f0)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            maxHeight: '740px',
            overflowY: 'auto'
          }}>
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#1d4ed8',
                    backgroundColor: '#eff6ff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginBottom: '4px'
                  }}>
                    {selectedParcel.id}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0a2540' }}>
                    Survey / Khasra {selectedParcel.surveyNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedParcelId(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Landowner Profile Box */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <User size={16} color="#0a2540" />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0a2540' }}>
                    {selectedParcel.landownerName}
                  </span>
                </div>
                {selectedParcel.landownerPhone && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                    Contact: <span style={{ fontWeight: 600, color: '#334155' }}>{selectedParcel.landownerPhone}</span>
                  </div>
                )}
                {selectedParcel.landownerAadhaarMasked && (
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Identity: <span style={{ fontWeight: 600, color: '#334155' }}>{selectedParcel.landownerAadhaarMasked}</span> (Aadhaar Verified)
                  </div>
                )}
              </div>

              {/* Area & Impact Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  padding: '10px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Total Parcel Area
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0a2540', marginTop: '2px' }}>
                    {selectedParcel.totalAreaAcres} Acres
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    ({selectedParcel.totalAreaHa} Ha)
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#fffbeb',
                  borderRadius: '8px',
                  padding: '10px',
                  border: '1px solid #fde68a'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                    Affected in Project
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#9a3412', marginTop: '2px' }}>
                    {selectedParcel.affectedAreaAcres} Acres
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#b45309' }}>
                    {selectedParcel.affectedPercentage}% Corridor Impact
                  </div>
                </div>
              </div>

              {/* Acquisition & Compensation Details List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Village & Taluka:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedParcel.village}, {selectedParcel.taluka}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>District:</span>
                  <span style={{ fontWeight: 700 }}>{selectedParcel.district}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Acquisition Status:</span>
                  <span style={{
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: STATUS_CONFIG[selectedParcel.acquisitionStatus]?.bg,
                    color: STATUS_CONFIG[selectedParcel.acquisitionStatus]?.color
                  }}>
                    {STATUS_CONFIG[selectedParcel.acquisitionStatus]?.label}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Compensation Award:</span>
                  <span style={{ fontWeight: 800, color: '#0a2540' }}>{selectedParcel.compensationFormatted}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Payment Status:</span>
                  <span style={{ fontWeight: 700, color: selectedParcel.compensationStatus === 'DISBURSED' ? '#059669' : '#ca8a04' }}>
                    {selectedParcel.compensationStatus}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Document Verification:</span>
                  <span style={{ fontWeight: 700, color: selectedParcel.documentStatus === 'VERIFIED' ? '#059669' : '#7c3aed' }}>
                    {selectedParcel.documentStatus}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Encumbrance Check:</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>{selectedParcel.encumbranceStatus}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Current Process Stage:</span>
                  <span style={{ fontWeight: 700, color: '#1d4ed8', textAlign: 'right', maxWidth: '170px' }}>
                    {selectedParcel.currentStage}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => setDetailModalOpen(true)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#0a2540',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Eye size={14} />
                View Full Details & Documents
              </button>
              <button
                type="button"
                onClick={() => alert(`Exporting statutory land schedule for parcel ${selectedParcel.id} (${selectedParcel.landownerName})...`)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Download size={13} />
                Download Land Schedule (PDF)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 6. Full Parcel Detail Modal ── */}
      {detailModalOpen && selectedParcel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase' }}>
                  Detailed Cadastral Land Record
                </div>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0a2540' }}>
                  Parcel {selectedParcel.id} • Survey {selectedParcel.surveyNumber}
                </h2>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Primary Landowner</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{selectedParcel.landownerName}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Phone: {selectedParcel.landownerPhone || 'N/A'}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {selectedParcel.landownerAadhaarMasked || 'N/A'}</div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Project Assignment</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{selectedParcel.projectName}</div>
                <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 700, marginTop: '4px' }}>Project ID: {selectedParcel.projectId}</div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Location & Jurisdiction</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Village: {selectedParcel.village}</div>
                <div style={{ fontSize: '12px', color: '#475569' }}>Taluka: {selectedParcel.taluka}, District: {selectedParcel.district}</div>
                <div style={{ fontSize: '12px', color: '#475569' }}>State: {selectedParcel.state}</div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Compensation & Settlement</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669' }}>{selectedParcel.compensationFormatted}</div>
                <div style={{ fontSize: '11px', color: '#ca8a04', fontWeight: 700 }}>Status: {selectedParcel.compensationStatus}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Soil Classification: {selectedParcel.soilType}</div>
              </div>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e3a8a', marginBottom: '4px' }}>
                Statutory Milestone: {selectedParcel.currentStage}
              </div>
              <div style={{ fontSize: '12px', color: '#1e40af' }}>
                All procedural documents including 7/12 land extract, DGPS boundary coordinates, and joint measurement records are verified under RFCTLARR Act 2013 compliance.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#0a2540',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyGISExplorer;
