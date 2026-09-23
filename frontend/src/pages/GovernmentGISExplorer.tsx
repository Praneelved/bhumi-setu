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
  Share2,
  ShieldAlert,
  Sliders,
  Scale,
  Columns,
  Map as MapIcon,
  HelpCircle,
  Phone,
  Mail,
  Award
} from 'lucide-react';
import {
  GOV_PROJECTS,
  GOV_PARCELS,
  GOV_ALERT_ITEMS,
  PRIORITY_HOTSPOTS,
  DISTRICT_SUMMARIES,
  ALERT_CATEGORIES_CONFIG,
  type GovProject,
  type GovParcel,
  type GovProjectStatus,
  type GovAlertCategory,
  type GovAlertItem,
  type PriorityHotspot,
  type DistrictSummary
} from '../data/governmentGisData';
import { getStoredUser } from '../services/api';

// Acquisition status styling
const ACQUISITION_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: 'Pending', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  UNDER_VERIFICATION: { label: 'Under Verification', color: '#d97706', bg: '#fffbeb', border: '#fed7aa' },
  NOTICE_ISSUED: { label: 'Notice Issued', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  NEGOTIATION: { label: 'Negotiation', color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
  APPROVED: { label: 'Approved', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  ACQUIRED: { label: 'Acquired', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  COMPENSATION_PENDING: { label: 'Compensation Pending', color: '#ca8a04', bg: '#fefce8', border: '#fef08a' },
  COMPLETED: { label: 'Completed', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
};

// Project status styling
const PROJECT_STATUS_CONFIG: Record<GovProjectStatus, { label: string; color: string; bg: string; border: string }> = {
  Planning: { label: 'Planning', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
  'Land Acquisition Started': { label: 'LA Started', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  'Under Verification': { label: 'Under Verification', color: '#d97706', bg: '#fffbeb', border: '#fed7aa' },
  'In Progress': { label: 'In Progress', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  Delayed: { label: 'Delayed', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  Completed: { label: 'Completed', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' }
};

export const GovernmentGISExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Current logged in government user
  const currentUser = getStoredUser();

  // Active Main Tabs: MONITORING (Map & KPIs), ALERTS (Issues & Hotspots), COMPARISON (Project Comparison)
  const [activeViewMode, setActiveViewMode] = useState<'MAP' | 'HOTSPOTS' | 'COMPARISON'>('MAP');

  // Hierarchy Filters State
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedTaluka, setSelectedTaluka] = useState<string>('ALL');
  const [selectedVillage, setSelectedVillage] = useState<string>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Attribute Filters State
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('ALL');
  const [acquisitionStatusFilter, setAcquisitionStatusFilter] = useState<string>('ALL');
  const [disputeFilter, setDisputeFilter] = useState<string>('ALL');
  const [compensationFilter, setCompensationFilter] = useState<string>('ALL');
  const [documentFilter, setDocumentFilter] = useState<string>('ALL');
  const [activeAlertCategory, setActiveAlertCategory] = useState<string>('ALL');

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Selected Entities
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [inspectedProjectId, setInspectedProjectId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  // Comparison State
  const [compareProjectIds, setCompareProjectIds] = useState<string[]>(['PRJ-HWY-001', 'PRJ-AIR-002']);

  // Map Controls State
  const [isSatellite, setIsSatellite] = useState<boolean>(false);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);

  const [activeLayers, setActiveLayers] = useState({
    projects: true,
    projectBoundaries: true,
    landParcels: true,
    acquiredLand: true,
    pendingLand: true,
    disputedLand: true,
    compensationPending: true,
    documentPending: true,
    infrastructure: true
  });

  // Map DOM Reference & MapLibre instance
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Read initial project from URL if provided
  useEffect(() => {
    const urlProj = searchParams.get('project');
    if (urlProj && GOV_PROJECTS.some(p => p.id === urlProj)) {
      setSelectedProjectId(urlProj);
      setInspectedProjectId(urlProj);
    }
  }, [searchParams]);

  // Derived filter options based on hierarchy
  const availableDistricts = useMemo(() => {
    let projs = GOV_PROJECTS;
    if (selectedState !== 'ALL') {
      projs = projs.filter(p => p.state === selectedState);
    }
    const set = new Set(projs.map(p => p.district));
    return Array.from(set);
  }, [selectedState]);

  const availableTalukas = useMemo(() => {
    let projs = GOV_PROJECTS;
    if (selectedDistrict !== 'ALL') {
      projs = projs.filter(p => p.district === selectedDistrict);
    }
    const set = new Set(projs.map(p => p.taluka));
    return Array.from(set);
  }, [selectedDistrict]);

  const availableVillages = useMemo(() => {
    let parcels = GOV_PARCELS;
    if (selectedDistrict !== 'ALL') {
      parcels = parcels.filter(p => p.district === selectedDistrict);
    }
    if (selectedProjectId !== 'ALL') {
      parcels = parcels.filter(p => p.projectId === selectedProjectId);
    }
    const set = new Set(parcels.map(p => p.village));
    return Array.from(set);
  }, [selectedDistrict, selectedProjectId]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return GOV_PROJECTS.filter(p => {
      if (selectedState !== 'ALL' && p.state !== selectedState) return false;
      if (selectedDistrict !== 'ALL' && p.district !== selectedDistrict) return false;
      if (selectedTaluka !== 'ALL' && !p.taluka.includes(selectedTaluka)) return false;
      if (selectedProjectId !== 'ALL' && p.id !== selectedProjectId) return false;
      if (projectStatusFilter !== 'ALL' && p.govStatus !== projectStatusFilter) return false;
      return true;
    });
  }, [selectedState, selectedDistrict, selectedTaluka, selectedProjectId, projectStatusFilter]);

  // Filtered Parcels
  const filteredParcels = useMemo(() => {
    return GOV_PARCELS.filter(p => {
      if (selectedState !== 'ALL' && p.state !== selectedState) return false;
      if (selectedDistrict !== 'ALL' && p.district !== selectedDistrict) return false;
      if (selectedVillage !== 'ALL' && p.village !== selectedVillage) return false;
      if (selectedProjectId !== 'ALL' && p.projectId !== selectedProjectId) return false;
      if (acquisitionStatusFilter !== 'ALL' && p.acquisitionStatus !== acquisitionStatusFilter) return false;
      if (disputeFilter === 'DISPUTED' && p.disputeStatus === 'NONE') return false;
      if (disputeFilter === 'CLEARED' && p.disputeStatus !== 'NONE') return false;
      if (compensationFilter !== 'ALL' && p.compensationStatus !== compensationFilter) return false;
      if (documentFilter !== 'ALL' && p.documentStatus !== documentFilter) return false;
      if (activeAlertCategory !== 'ALL' && !p.activeAlerts.includes(activeAlertCategory as GovAlertCategory)) return false;
      return true;
    });
  }, [
    selectedState,
    selectedDistrict,
    selectedVillage,
    selectedProjectId,
    acquisitionStatusFilter,
    disputeFilter,
    compensationFilter,
    documentFilter,
    activeAlertCategory
  ]);

  // Dynamic Dashboard Statistics
  const stats = useMemo(() => {
    const totalProjects = filteredProjects.length;
    const activeProjects = filteredProjects.filter(p => p.govStatus === 'In Progress' || p.govStatus === 'Land Acquisition Started' || p.govStatus === 'Under Verification').length;
    const completedProjects = filteredProjects.filter(p => p.govStatus === 'Completed').length;
    const delayedProjects = filteredProjects.filter(p => p.govStatus === 'Delayed').length;

    const totalParcels = filteredParcels.length;
    const totalLandowners = new Set(filteredParcels.map(p => p.landownerName)).size;
    const totalRequiredAcres = Number(filteredParcels.reduce((acc, p) => acc + p.affectedAreaAcres, 0).toFixed(1));

    const acquiredParcels = filteredParcels.filter(p => p.acquisitionStatus === 'ACQUIRED' || p.acquisitionStatus === 'COMPLETED');
    const totalAcquiredAcres = Number(acquiredParcels.reduce((acc, p) => acc + p.affectedAreaAcres, 0).toFixed(1));
    const totalPendingAcres = Number((totalRequiredAcres - totalAcquiredAcres).toFixed(1));

    const compensationPendingCount = filteredParcels.filter(p => p.compensationStatus === 'PENDING' || p.compensationStatus === 'CALCULATED').length;
    const disputedParcelsCount = filteredParcels.filter(p => p.disputeStatus !== 'NONE').length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects,
      totalParcels,
      totalLandowners,
      totalRequiredAcres,
      totalAcquiredAcres,
      totalPendingAcres,
      compensationPendingCount,
      disputedParcelsCount
    };
  }, [filteredProjects, filteredParcels]);

  // Currently inspected parcel object
  const activeParcel = useMemo(() => {
    if (!selectedParcelId) return null;
    return GOV_PARCELS.find(p => p.id === selectedParcelId) || null;
  }, [selectedParcelId]);

  // Currently inspected project object
  const activeProject = useMemo(() => {
    if (selectedProjectId !== 'ALL') {
      return GOV_PROJECTS.find(p => p.id === selectedProjectId) || null;
    }
    if (inspectedProjectId) {
      return GOV_PROJECTS.find(p => p.id === inspectedProjectId) || null;
    }
    return null;
  }, [selectedProjectId, inspectedProjectId]);

  // Filtered Alert Events for the Issues Tab
  const filteredAlerts = useMemo(() => {
    return GOV_ALERT_ITEMS.filter(item => {
      if (selectedDistrict !== 'ALL' && item.district !== selectedDistrict) return false;
      if (selectedProjectId !== 'ALL' && item.projectId !== selectedProjectId) return false;
      if (activeAlertCategory !== 'ALL' && item.category !== activeAlertCategory) return false;
      return true;
    });
  }, [selectedDistrict, selectedProjectId, activeAlertCategory]);

  // Autocomplete Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    const matchedProjects = GOV_PROJECTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q)
    ).map(p => ({
      type: 'PROJECT' as const,
      id: p.id,
      title: p.name,
      subtitle: `ID: ${p.id} • ${p.district}, ${p.state} • Status: ${p.govStatus}`,
      center: p.center,
      zoom: p.zoom
    }));

    const matchedParcels = GOV_PARCELS.filter(p =>
      p.surveyNumber.toLowerCase().includes(q) ||
      p.landownerName.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.village.toLowerCase().includes(q)
    ).slice(0, 10).map(p => ({
      type: 'PARCEL' as const,
      id: p.id,
      title: `S.No ${p.surveyNumber} — ${p.landownerName}`,
      subtitle: `Parcel: ${p.id} • ${p.village}, ${p.district} • ${p.affectedAreaAcres} Ac • ${p.acquisitionStatus}`,
      center: p.centroid,
      zoom: 16.5,
      projectId: p.projectId
    }));

    return [...matchedProjects, ...matchedParcels];
  }, [searchQuery]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedState('ALL');
    setSelectedDistrict('ALL');
    setSelectedTaluka('ALL');
    setSelectedVillage('ALL');
    setSelectedProjectId('ALL');
    setProjectStatusFilter('ALL');
    setAcquisitionStatusFilter('ALL');
    setDisputeFilter('ALL');
    setCompensationFilter('ALL');
    setDocumentFilter('ALL');
    setActiveAlertCategory('ALL');
    setSearchQuery('');
    setSelectedParcelId(null);
    setInspectedProjectId(null);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [75.5000, 19.5000],
        zoom: 6.2,
        essential: true
      });
    }
  };

  // Zoom to District Extents
  const handleSelectDistrict = (district: string) => {
    setSelectedDistrict(district);
    setSelectedTaluka('ALL');
    setSelectedVillage('ALL');
    setSelectedProjectId('ALL');

    if (district !== 'ALL' && DISTRICT_SUMMARIES[district] && mapRef.current) {
      const d = DISTRICT_SUMMARIES[district];
      mapRef.current.flyTo({
        center: d.center,
        zoom: d.zoom,
        essential: true
      });
    }
  };

  // Zoom to Project Extents
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setInspectedProjectId(projectId);

    if (projectId !== 'ALL') {
      const proj = GOV_PROJECTS.find(p => p.id === projectId);
      if (proj && mapRef.current) {
        mapRef.current.flyTo({
          center: proj.center,
          zoom: proj.zoom,
          essential: true
        });
      }
    }
  };

  // Focus on specific Alert item or Hotspot
  const handleFocusAlert = (item: GovAlertItem) => {
    setSelectedProjectId(item.projectId);
    setInspectedProjectId(item.projectId);
    if (item.parcelId) {
      setSelectedParcelId(item.parcelId);
    }
    setActiveViewMode('MAP');

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: item.center,
        zoom: 16.2,
        essential: true
      });
    }
  };

  const handleFocusHotspot = (spot: PriorityHotspot) => {
    setSelectedProjectId(spot.projectId);
    setInspectedProjectId(spot.projectId);
    setActiveViewMode('MAP');

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: spot.center,
        zoom: spot.zoom,
        essential: true
      });
    }
  };

  // Toggle Project comparison selection
  const handleToggleCompareProject = (id: string) => {
    setCompareProjectIds(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 4) return prev; // Limit to 4 max
        return [...prev, id];
      }
    });
  };

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const styleUrl = isSatellite
      ? {
          version: 8 as const,
          sources: {
            'esri-satellite': {
              type: 'raster' as const,
              tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256,
              attribution: 'Esri World Imagery'
            }
          },
          layers: [
            {
              id: 'esri-satellite-layer',
              type: 'raster' as const,
              source: 'esri-satellite',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        }
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [75.5000, 19.5000],
      zoom: 6.2,
      pitch: 0,
      bearing: 0
    });

    mapRef.current = map;

    map.on('load', () => {
      // 1. Projects Corridors Source & Layers
      map.addSource('gov-projects-corridor', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: GOV_PROJECTS.map(p => ({
            type: 'Feature',
            properties: {
              id: p.id,
              name: p.name,
              status: p.govStatus,
              type: p.type,
              district: p.district
            },
            geometry: p.corridorGeoJSON
          }))
        }
      });

      // Project Corridor Fill
      map.addLayer({
        id: 'gov-projects-fill',
        type: 'fill',
        source: 'gov-projects-corridor',
        paint: {
          'fill-color': [
            'match',
            ['get', 'status'],
            'Delayed', '#fee2e2',
            'Completed', '#dcfce7',
            'Under Verification', '#fef3c7',
            'Planning', '#f1f5f9',
            '#e0f2fe'
          ],
          'fill-opacity': 0.35
        }
      });

      // Project Corridor Outline
      map.addLayer({
        id: 'gov-projects-line',
        type: 'line',
        source: 'gov-projects-corridor',
        paint: {
          'line-color': [
            'match',
            ['get', 'status'],
            'Delayed', '#dc2626',
            'Completed', '#059669',
            'Under Verification', '#d97706',
            'Planning', '#64748b',
            '#0284c7'
          ],
          'line-width': 2.5,
          'line-dasharray': [3, 1]
        }
      });

      // 2. Cadastral Land Parcels Source & Layers
      map.addSource('gov-parcels-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: GOV_PARCELS.map(p => ({
            type: 'Feature',
            properties: {
              id: p.id,
              surveyNumber: p.surveyNumber,
              landownerName: p.landownerName,
              projectId: p.projectId,
              village: p.village,
              district: p.district,
              acquisitionStatus: p.acquisitionStatus,
              disputeStatus: p.disputeStatus,
              compensationStatus: p.compensationStatus,
              documentStatus: p.documentStatus,
              affectedAreaAcres: p.affectedAreaAcres,
              totalAreaAcres: p.totalAreaAcres
            },
            geometry: {
              type: 'Polygon',
              coordinates: p.coordinates
            }
          }))
        }
      });

      // Parcels Fill
      map.addLayer({
        id: 'gov-parcels-fill',
        type: 'fill',
        source: 'gov-parcels-source',
        paint: {
          'fill-color': [
            'case',
            ['!=', ['get', 'disputeStatus'], 'NONE'], '#fecdd3', // Red highlight for disputed
            ['==', ['get', 'acquisitionStatus'], 'ACQUIRED'], '#86efac',
            ['==', ['get', 'acquisitionStatus'], 'COMPLETED'], '#4ade80',
            ['==', ['get', 'acquisitionStatus'], 'APPROVED'], '#7dd3fc',
            ['==', ['get', 'acquisitionStatus'], 'NOTICE_ISSUED'], '#c4b5fd',
            ['==', ['get', 'acquisitionStatus'], 'NEGOTIATION'], '#fda4af',
            ['==', ['get', 'acquisitionStatus'], 'COMPENSATION_PENDING'], '#fde047',
            ['==', ['get', 'acquisitionStatus'], 'UNDER_VERIFICATION'], '#fed7aa',
            '#fde68a'
          ],
          'fill-opacity': 0.65
        }
      });

      // Parcels Outline
      map.addLayer({
        id: 'gov-parcels-line',
        type: 'line',
        source: 'gov-parcels-source',
        paint: {
          'line-color': [
            'case',
            ['!=', ['get', 'disputeStatus'], 'NONE'], '#991b1b', // Strong dark red stroke for disputes
            ['==', ['get', 'acquisitionStatus'], 'ACQUIRED'], '#059669',
            ['==', ['get', 'acquisitionStatus'], 'COMPLETED'], '#16a34a',
            ['==', ['get', 'acquisitionStatus'], 'APPROVED'], '#0284c7',
            ['==', ['get', 'acquisitionStatus'], 'NOTICE_ISSUED'], '#7c3aed',
            ['==', ['get', 'acquisitionStatus'], 'NEGOTIATION'], '#e11d48',
            ['==', ['get', 'acquisitionStatus'], 'COMPENSATION_PENDING'], '#ca8a04',
            '#b45309'
          ],
          'line-width': [
            'case',
            ['!=', ['get', 'disputeStatus'], 'NONE'], 2.8,
            1.8
          ]
        }
      });

      // Selected Parcel Outline
      map.addLayer({
        id: 'gov-parcel-selected-stroke',
        type: 'line',
        source: 'gov-parcels-source',
        paint: {
          'line-color': '#0f172a',
          'line-width': 4,
          'line-opacity': [
            'case',
            ['==', ['get', 'id'], ''],
            0,
            1
          ]
        }
      });

      // Click on land parcel
      map.on('click', 'gov-parcels-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const parcelId = feat.properties?.id;
        const projId = feat.properties?.projectId;

        if (parcelId) {
          setSelectedParcelId(parcelId);
          if (projId) setInspectedProjectId(projId);

          map.setPaintProperty('gov-parcel-selected-stroke', 'line-opacity', [
            'case',
            ['==', ['get', 'id'], parcelId],
            1,
            0
          ]);
        }
      });

      // Cursor changes on hover
      map.on('mouseenter', 'gov-parcels-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'gov-parcels-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      // Click on project boundary
      map.on('click', 'gov-projects-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        const projId = e.features[0].properties?.id;
        if (projId) {
          setInspectedProjectId(projId);
        }
      });
    });

    return () => {
      map.remove();
    };
  }, [isSatellite]);

  // Update parcel selected stroke highlight when selectedParcelId changes
  useEffect(() => {
    if (!mapRef.current) return;
    try {
      if (mapRef.current.getLayer('gov-parcel-selected-stroke')) {
        mapRef.current.setPaintProperty('gov-parcel-selected-stroke', 'line-opacity', [
          'case',
          ['==', ['get', 'id'], selectedParcelId || ''],
          1,
          0
        ]);
      }
    } catch {
      // Map style loading
    }
  }, [selectedParcelId]);

  // Update map layer visibilities when activeLayers changes
  useEffect(() => {
    if (!mapRef.current) return;
    const m = mapRef.current;
    try {
      if (m.getLayer('gov-projects-fill')) {
        m.setLayoutProperty('gov-projects-fill', 'visibility', activeLayers.projects ? 'visible' : 'none');
      }
      if (m.getLayer('gov-projects-line')) {
        m.setLayoutProperty('gov-projects-line', 'visibility', activeLayers.projectBoundaries ? 'visible' : 'none');
      }
      if (m.getLayer('gov-parcels-fill')) {
        m.setLayoutProperty('gov-parcels-fill', 'visibility', activeLayers.landParcels ? 'visible' : 'none');
      }
      if (m.getLayer('gov-parcels-line')) {
        m.setLayoutProperty('gov-parcels-line', 'visibility', activeLayers.landParcels ? 'visible' : 'none');
      }
    } catch {
      // Ignore initial render race
    }
  }, [activeLayers]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 64px)',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      {/* ══════════════════════════════════════════════════════════
          1. TOP EXECUTIVE HEADER & MAIN NAVIGATION TABS
          ══════════════════════════════════════════════════════════ */}
      <div style={{
        backgroundColor: '#0a2540',
        color: '#ffffff',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        zIndex: 20
      }}>
        {/* Left: Branding & Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(5, 150, 105, 0.4)'
          }}>
            <Building2 size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Government GIS Monitoring Dashboard
              </h1>
              <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#6ee7b7',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                Statutory Oversight
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              State & District Land Acquisition Command Center • RFCTLARR 2013 Verification & Statutory Clearances
            </p>
          </div>
        </div>

        {/* Center: Main View Switcher Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '4px',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveViewMode('MAP')}
            style={{
              padding: '6px 14px',
              backgroundColor: activeViewMode === 'MAP' ? '#059669' : 'transparent',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <MapIcon size={14} /> Interactive GIS Map
          </button>
          <button
            onClick={() => setActiveViewMode('HOTSPOTS')}
            style={{
              padding: '6px 14px',
              backgroundColor: activeViewMode === 'HOTSPOTS' ? '#dc2626' : 'transparent',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <AlertOctagon size={14} /> Issues & Bottlenecks ({filteredAlerts.length})
          </button>
          <button
            onClick={() => setActiveViewMode('COMPARISON')}
            style={{
              padding: '6px 14px',
              backgroundColor: activeViewMode === 'COMPARISON' ? '#0284c7' : 'transparent',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Columns size={14} /> Project Comparison ({compareProjectIds.length})
          </button>
        </div>

        {/* Right: Quick District Jump & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleResetFilters}
            title="Reset all filters and view extents"
            style={{
              padding: '7px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} /> Reset View
          </button>

          <button
            onClick={() => navigate('/government/dashboard')}
            style={{
              padding: '7px 14px',
              backgroundColor: '#ffffff',
              color: '#0a2540',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={14} color="#059669" /> Verification Portal
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. TOP KPI SUMMARY BAR (10 METRICS)
          ══════════════════════════════════════════════════════════ */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        zIndex: 15
      }}>
        {/* Total Projects */}
        <div style={{ padding: '4px 8px', borderRight: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Projects
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0a2540', marginTop: '2px' }}>
            {stats.totalProjects}
          </div>
        </div>

        {/* Active Projects */}
        <div style={{ padding: '4px 8px', borderRight: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
            Active Projects
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0369a1', marginTop: '2px' }}>
            {stats.activeProjects}
          </div>
        </div>

        {/* Completed Projects */}
        <div style={{ padding: '4px 8px', borderRight: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
            Completed
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#166534', marginTop: '2px' }}>
            {stats.completedProjects}
          </div>
        </div>

        {/* Delayed Projects */}
        <div style={{ padding: '4px 8px', borderRight: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
            Delayed
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#991b1b', marginTop: '2px' }}>
            {stats.delayedProjects}
          </div>
        </div>

        {/* Total Land Parcels */}
        <div style={{ padding: '4px 8px', borderRight: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Land Parcels
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            {stats.totalParcels}
          </div>
        </div>

        {/* Affected Landowners */}
        <div style={{ padding: '4px 8px', borderRight: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Landowners
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            {stats.totalLandowners}
          </div>
        </div>

        {/* Land Required */}
        <div style={{ padding: '4px 8px', borderRight: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
            Land Required
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#9a3412', marginTop: '2px' }}>
            {stats.totalRequiredAcres} <span style={{ fontSize: '11px', fontWeight: 600 }}>Ac</span>
          </div>
        </div>

        {/* Land Acquired */}
        <div style={{ padding: '4px 8px', borderRight: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
            Land Acquired
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#047857', marginTop: '2px' }}>
            {stats.totalAcquiredAcres} <span style={{ fontSize: '11px', fontWeight: 600 }}>Ac</span>
          </div>
        </div>

        {/* Compensation Pending */}
        <div style={{ padding: '4px 8px', borderRight: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#ca8a04', textTransform: 'uppercase' }}>
            Comp. Pending
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#a16207', marginTop: '2px' }}>
            {stats.compensationPendingCount}
          </div>
        </div>

        {/* Disputed Land Parcels */}
        <div style={{ padding: '4px 8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
            Disputed Parcels
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#b91c1c', marginTop: '2px' }}>
            {stats.disputedParcelsCount}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. ADMINISTRATIVE DRILL-DOWN & GLOBAL SEARCH TOOLBAR
          ══════════════════════════════════════════════════════════ */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        zIndex: 14
      }}>
        {/* Global Search Bar */}
        <div style={{ position: 'relative', width: '280px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '6px 10px'
          }}>
            <Search size={15} color="#64748b" />
            <input
              type="text"
              placeholder="Search Project, S.No, Owner, Village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                outline: 'none',
                fontSize: '12px',
                width: '100%',
                color: '#0f172a'
              }}
            />
            {searchQuery && (
              <X
                size={14}
                color="#64748b"
                style={{ cursor: 'pointer' }}
                onClick={() => setSearchQuery('')}
              />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              marginTop: '4px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
              maxHeight: '280px',
              overflowY: 'auto',
              zIndex: 50
            }}>
              {searchResults.map((res, i) => (
                <div
                  key={`${res.type}-${res.id}-${i}`}
                  onClick={() => {
                    if (res.type === 'PROJECT') {
                      handleSelectProject(res.id);
                    } else {
                      setSelectedParcelId(res.id);
                      if (res.projectId) setInspectedProjectId(res.projectId);
                      if (mapRef.current) {
                        mapRef.current.flyTo({
                          center: res.center,
                          zoom: res.zoom,
                          essential: true
                        });
                      }
                    }
                    setIsSearchFocused(false);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ fontWeight: 700, color: '#0a2540' }}>{res.title}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{res.subtitle}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* State Filter */}
        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setSelectedDistrict('ALL');
            setSelectedTaluka('ALL');
            setSelectedVillage('ALL');
            setSelectedProjectId('ALL');
          }}
          style={{
            padding: '6px 10px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontWeight: 600
          }}
        >
          <option value="ALL">State: All States</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="Gujarat">Gujarat</option>
          <option value="Karnataka">Karnataka</option>
          <option value="Andhra Pradesh">Andhra Pradesh</option>
        </select>

        {/* District Filter */}
        <select
          value={selectedDistrict}
          onChange={(e) => handleSelectDistrict(e.target.value)}
          style={{
            padding: '6px 10px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontWeight: 600
          }}
        >
          <option value="ALL">District: All Districts</option>
          {availableDistricts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Taluka Filter */}
        <select
          value={selectedTaluka}
          onChange={(e) => setSelectedTaluka(e.target.value)}
          style={{
            padding: '6px 10px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontWeight: 600
          }}
        >
          <option value="ALL">Taluka: All Talukas</option>
          {availableTalukas.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Village Filter */}
        <select
          value={selectedVillage}
          onChange={(e) => setSelectedVillage(e.target.value)}
          style={{
            padding: '6px 10px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontWeight: 600
          }}
        >
          <option value="ALL">Village: All Villages</option>
          {availableVillages.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        {/* Project Selector */}
        <select
          value={selectedProjectId}
          onChange={(e) => handleSelectProject(e.target.value)}
          style={{
            padding: '6px 12px',
            border: '2px solid #0284c7',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: '#f0f9ff',
            color: '#0369a1',
            fontWeight: 700,
            maxWidth: '220px'
          }}
        >
          <option value="ALL">Project: All Infrastructure Projects</option>
          {GOV_PROJECTS.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* More Filters Toggle */}
        <button
          onClick={() => setShowFilterDrawer(!showFilterDrawer)}
          style={{
            padding: '6px 12px',
            backgroundColor: showFilterDrawer ? '#0a2540' : '#f8fafc',
            color: showFilterDrawer ? '#ffffff' : '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Filter size={13} /> Status & Disputes Filter
        </button>

        {/* Clear Filters (if active) */}
        {(selectedState !== 'ALL' || selectedDistrict !== 'ALL' || selectedProjectId !== 'ALL' || disputeFilter !== 'ALL') && (
          <button
            onClick={handleResetFilters}
            style={{
              padding: '4px 8px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Clear Active Filters ✕
          </button>
        )}
      </div>

      {/* Extended Filters Ribbon */}
      {showFilterDrawer && (
        <div style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #cbd5e1',
          padding: '10px 24px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: '12px',
          zIndex: 13
        }}>
          <div>
            <span style={{ fontWeight: 700, color: '#475569', marginRight: '6px' }}>Project Status:</span>
            <select
              value={projectStatusFilter}
              onChange={(e) => setProjectStatusFilter(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Planning">Planning</option>
              <option value="Land Acquisition Started">LA Started</option>
              <option value="Under Verification">Under Verification</option>
              <option value="In Progress">In Progress</option>
              <option value="Delayed">Delayed</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <span style={{ fontWeight: 700, color: '#475569', marginRight: '6px' }}>Acquisition:</span>
            <select
              value={acquisitionStatusFilter}
              onChange={(e) => setAcquisitionStatusFilter(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            >
              <option value="ALL">All Stages</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_VERIFICATION">Under Verification</option>
              <option value="NOTICE_ISSUED">Notice Issued</option>
              <option value="APPROVED">Approved</option>
              <option value="ACQUIRED">Acquired</option>
            </select>
          </div>

          <div>
            <span style={{ fontWeight: 700, color: '#dc2626', marginRight: '6px' }}>Dispute Status:</span>
            <select
              value={disputeFilter}
              onChange={(e) => setDisputeFilter(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #f87171', fontSize: '12px', color: '#991b1b', fontWeight: 700 }}
            >
              <option value="ALL">All Parcels</option>
              <option value="DISPUTED">Disputed Parcels Only (Court Stay / Title)</option>
              <option value="CLEARED">Clean / Unencumbered Only</option>
            </select>
          </div>

          <div>
            <span style={{ fontWeight: 700, color: '#ca8a04', marginRight: '6px' }}>Compensation:</span>
            <select
              value={compensationFilter}
              onChange={(e) => setCompensationFilter(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            >
              <option value="ALL">All Compensation</option>
              <option value="PENDING">Pending</option>
              <option value="CALCULATED">Calculated / Solatium Approved</option>
              <option value="DISBURSED">Disbursed into Escrow</option>
            </select>
          </div>

          <div>
            <span style={{ fontWeight: 700, color: '#7c3aed', marginRight: '6px' }}>Alert Category:</span>
            <select
              value={activeAlertCategory}
              onChange={(e) => setActiveAlertCategory(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
            >
              <option value="ALL">All Alert Categories</option>
              {Object.entries(ALERT_CATEGORIES_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          4. MAIN WORKSPACE AREA (MAP VIEW, HOTSPOTS VIEW, OR COMPARISON)
          ══════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* ─── TAB 1: INTERACTIVE GIS MAP VIEW ─── */}
        <div style={{
          display: activeViewMode === 'MAP' ? 'block' : 'none',
          width: '100%',
          height: '100%',
          position: 'relative'
        }}>
          {/* Map Canvas */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Floating Map Controls Toolbar */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 10
          }}>
            {/* Satellite / Road Toggle */}
            <button
              onClick={() => setIsSatellite(!isSatellite)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#0f172a',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Globe2 size={15} color="#0284c7" />
              {isSatellite ? 'Street Map' : 'Satellite'}
            </button>

            {/* Layer Toggles Menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowLayerMenu(!showLayerMenu)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Layers size={15} color="#059669" />
                Layers
              </button>

              {showLayerMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '12px',
                  width: '210px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontWeight: 800, color: '#0a2540', marginBottom: '2px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                    Map Layers Control
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={activeLayers.projects}
                      onChange={(e) => setActiveLayers(prev => ({ ...prev, projects: e.target.checked }))}
                    />
                    Projects Corridor
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={activeLayers.landParcels}
                      onChange={(e) => setActiveLayers(prev => ({ ...prev, landParcels: e.target.checked }))}
                    />
                    Affected Land Parcels
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={activeLayers.disputedLand}
                      onChange={(e) => setActiveLayers(prev => ({ ...prev, disputedLand: e.target.checked }))}
                    />
                    Disputed Land Highlight
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={activeLayers.acquiredLand}
                      onChange={(e) => setActiveLayers(prev => ({ ...prev, acquiredLand: e.target.checked }))}
                    />
                    Acquired Land (Green)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={activeLayers.pendingLand}
                      onChange={(e) => setActiveLayers(prev => ({ ...prev, pendingLand: e.target.checked }))}
                    />
                    Pending Land (Amber)
                  </label>
                </div>
              )}
            </div>

            {/* Zoom In */}
            <button
              onClick={() => mapRef.current?.zoomIn()}
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '16px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              +
            </button>

            {/* Zoom Out */}
            <button
              onClick={() => mapRef.current?.zoomOut()}
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '16px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              −
            </button>
          </div>

          {/* Map Status Legend (Bottom-Left) */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(6px)',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            zIndex: 10,
            maxWidth: '360px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0a2540', textTransform: 'uppercase', marginBottom: '8px' }}>
              Cadastral Acquisition & Statutory Legend
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#86efac', border: '1px solid #059669', borderRadius: '2px' }} />
                <span>Acquired / Completed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#7dd3fc', border: '1px solid #0284c7', borderRadius: '2px' }} />
                <span>Collector Approved</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#fde047', border: '1px solid #ca8a04', borderRadius: '2px' }} />
                <span>Comp. Pending</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#c4b5fd', border: '1px solid #7c3aed', borderRadius: '2px' }} />
                <span>Section 11/19 Notice</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#fed7aa', border: '1px solid #d97706', borderRadius: '2px' }} />
                <span>Verification / SIA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#fecdd3', border: '2px solid #991b1b', borderRadius: '2px' }} />
                <span style={{ fontWeight: 700, color: '#991b1b' }}>Disputed / Court Stay</span>
              </div>
            </div>
          </div>

          {/* ─── FLOATING SIDEBAR 1: ACTIVE PROJECT DETAILS ─── */}
          {activeProject && (
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              width: '320px',
              maxHeight: 'calc(100% - 100px)',
              overflowY: 'auto',
              padding: '16px',
              zIndex: 11
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: PROJECT_STATUS_CONFIG[activeProject.govStatus].bg,
                  color: PROJECT_STATUS_CONFIG[activeProject.govStatus].color,
                  border: `1px solid ${PROJECT_STATUS_CONFIG[activeProject.govStatus].border}`
                }}>
                  {activeProject.govStatus}
                </span>
                <button
                  onClick={() => setInspectedProjectId(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={16} />
                </button>
              </div>

              <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 800, color: '#0a2540' }}>
                {activeProject.name}
              </h3>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
                ID: <strong>{activeProject.id}</strong> • Type: <strong>{activeProject.type}</strong> • Location: <strong>{activeProject.district}, {activeProject.state}</strong>
              </div>

              {/* Mini Project Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>Total Land Required</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#9a3412' }}>{activeProject.requiredLandAcres} Ac</div>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '10px', color: '#166534', fontWeight: 700 }}>Land Acquired</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#166534' }}>{activeProject.acquiredLandAcres} Ac</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>Affected Landowners</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{activeProject.totalLandowners}</div>
                </div>
                <div style={{ backgroundColor: '#fef2f2', padding: '8px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: 700 }}>Disputed Parcels</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#991b1b' }}>{activeProject.disputedParcelsCount}</div>
                </div>
              </div>

              {/* Nodal Officer Section */}
              <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '11px' }}>
                <div style={{ fontWeight: 800, color: '#0a2540', marginBottom: '2px' }}>Competent Authority (CALA)</div>
                <div style={{ color: '#334155', fontWeight: 600 }}>{activeProject.nodalOfficer.name}</div>
                <div style={{ color: '#64748b' }}>{activeProject.nodalOfficer.designation}</div>
                <div style={{ color: '#0284c7', marginTop: '4px', wordBreak: 'break-all' }}>{activeProject.nodalOfficer.contact}</div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    handleToggleCompareProject(activeProject.id);
                    setActiveViewMode('COMPARISON');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#0a2540',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Columns size={12} /> Compare
                </button>
                <button
                  onClick={() => navigate('/government/dashboard')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <FileText size={12} /> Verification
                </button>
              </div>
            </div>
          )}

          {/* ─── FLOATING SIDEBAR 2: SELECTED PARCEL DETAILS PANEL ─── */}
          {activeParcel && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '90px',
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              width: '340px',
              maxHeight: 'calc(100% - 100px)',
              overflowY: 'auto',
              padding: '18px',
              zIndex: 11
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#0a2540', color: '#ffffff', padding: '2px 8px', borderRadius: '4px' }}>
                    {activeParcel.id}
                  </span>
                  {activeParcel.disputeStatus !== 'NONE' && (
                    <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '4px' }}>
                      ⚠ Disputed
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedParcelId(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={16} />
                </button>
              </div>

              <h3 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: 800, color: '#0a2540' }}>
                Survey No: {activeParcel.surveyNumber}
              </h3>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#059669', marginBottom: '12px' }}>
                Owner: {activeParcel.landownerName}
              </div>

              {/* Dispute Warning Banner (if disputed) */}
              {activeParcel.disputeStatus !== 'NONE' && (
                <div style={{
                  backgroundColor: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: '6px',
                  padding: '10px',
                  marginBottom: '12px',
                  fontSize: '11px'
                }}>
                  <div style={{ fontWeight: 800, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldAlert size={14} /> Dispute Reason: {activeParcel.disputeStatus.replace('_', ' ')}
                  </div>
                  <div style={{ color: '#be123c', marginTop: '4px', lineHeight: 1.4 }}>
                    {activeParcel.disputeDetails}
                  </div>
                  {activeParcel.courtCaseNumber && (
                    <div style={{ color: '#881337', fontWeight: 700, marginTop: '4px' }}>
                      Case No: {activeParcel.courtCaseNumber}
                    </div>
                  )}
                </div>
              )}

              {/* Parcel Attribute Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '14px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 700 }}>Village & Taluka</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{activeParcel.village}, {activeParcel.taluka}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 700 }}>District & State</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{activeParcel.district}, {activeParcel.state}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 700 }}>Total Land Holding</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{activeParcel.totalAreaAcres} Acres</div>
                </div>
                <div style={{ backgroundColor: '#fffbeb', padding: '8px', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                  <div style={{ color: '#b45309', fontSize: '10px', fontWeight: 700 }}>Affected Corridor Area</div>
                  <div style={{ fontWeight: 800, color: '#9a3412' }}>{activeParcel.affectedAreaAcres} Acres</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 700 }}>Acquisition Status</div>
                  <div style={{ fontWeight: 700, color: '#0284c7' }}>{activeParcel.acquisitionStatus.replace('_', ' ')}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 700 }}>Compensation Status</div>
                  <div style={{ fontWeight: 700, color: '#ca8a04' }}>{activeParcel.compensationStatus}</div>
                </div>
              </div>

              {/* Stage & Documents */}
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '14px', lineHeight: 1.6 }}>
                <div>Document Verification: <strong style={{ color: '#059669' }}>{activeParcel.documentStatus}</strong></div>
                <div>Current Statutory Stage: <strong style={{ color: '#0a2540' }}>{activeParcel.currentStage}</strong></div>
                <div>Calculated Award Estimate: <strong>{activeParcel.compensationFormatted}</strong></div>
              </div>

              {/* View Full Details Button */}
              <button
                onClick={() => setDetailModalOpen(true)}
                style={{
                  width: '100%',
                  padding: '10px',
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
                <FileText size={14} /> View Full Statutory Dossier
              </button>
            </div>
          )}
        </div>

        {/* ─── TAB 2: ISSUES & PRIORITY BOTTLENECKS VIEW ─── */}
        <div style={{
          display: activeViewMode === 'HOTSPOTS' ? 'block' : 'none',
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0a2540' }}>
                Priority Areas Requiring Government Attention
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Factual statutory bottlenecks ranked by pending land acreage, dispute litigation, and delayed acquisition schedules.
              </p>
            </div>

            {/* Hotspots Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {PRIORITY_HOTSPOTS.map(h => (
                <div
                  key={h.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: h.urgencyLevel === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
                        color: h.urgencyLevel === 'CRITICAL' ? '#991b1b' : '#b45309',
                        border: `1px solid ${h.urgencyLevel === 'CRITICAL' ? '#fecaca' : '#fed7aa'}`
                      }}>
                        {h.urgencyLevel} PRIORITY
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{h.district}, {h.state}</span>
                    </div>

                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 800, color: '#0a2540' }}>
                      {h.projectName}
                    </h4>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', marginBottom: '6px' }}>
                      {h.type}
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                      {h.reason}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '14px' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
                        <div style={{ color: '#64748b', fontSize: '10px' }}>Pending Land</div>
                        <div style={{ fontWeight: 800, color: '#9a3412' }}>{h.pendingAcres} Ac</div>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
                        <div style={{ color: '#64748b', fontSize: '10px' }}>Disputes</div>
                        <div style={{ fontWeight: 800, color: '#b91c1c' }}>{h.disputedParcels}</div>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
                        <div style={{ color: '#64748b', fontSize: '10px' }}>Pending Budget</div>
                        <div style={{ fontWeight: 800, color: '#0284c7' }}>₹{h.pendingCompensationCr} Cr</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFocusHotspot(h)}
                    style={{
                      width: '100%',
                      padding: '8px',
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
                    <MapPin size={13} color="#38bdf8" /> Inspect on GIS Map
                  </button>
                </div>
              ))}
            </div>

            {/* Individual Parcels Requiring Statutory Action Table */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 800, color: '#0a2540' }}>
                Pending Action & Alert Registry ({filteredAlerts.length} Active Items)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0a2540', color: '#ffffff' }}>
                      <th style={{ padding: '10px 14px' }}>Alert Category</th>
                      <th style={{ padding: '10px 14px' }}>Project</th>
                      <th style={{ padding: '10px 14px' }}>Survey No & Owner</th>
                      <th style={{ padding: '10px 14px' }}>Location</th>
                      <th style={{ padding: '10px 14px' }}>Pending Details</th>
                      <th style={{ padding: '10px 14px' }}>Days Pending</th>
                      <th style={{ padding: '10px 14px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.slice(0, 15).map(item => {
                      const cfg = ALERT_CATEGORIES_CONFIG[item.category];
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: cfg.bg,
                              color: cfg.color,
                              border: `1px solid ${cfg.border}`
                            }}>
                              {cfg.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>{item.projectName}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <strong>S.No {item.surveyNumber}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{item.landownerName}</div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>{item.village}, {item.district}</td>
                          <td style={{ padding: '10px 14px', color: '#475569', maxWidth: '280px' }}>{item.description}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: item.daysPending > 90 ? '#dc2626' : '#b45309' }}>
                            {item.daysPending} Days
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <button
                              onClick={() => handleFocusAlert(item)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#0a2540',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <MapPin size={11} color="#38bdf8" /> Fly to Parcel
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ─── TAB 3: PROJECT COMPARISON TOOL ─── */}
        <div style={{
          display: activeViewMode === 'COMPARISON' ? 'block' : 'none',
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0a2540' }}>
                Multi-Project Land Acquisition Comparison Tool
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Select up to 4 major projects to benchmark required vs acquired acreage, pending litigation disputes, and compensation queues.
              </p>
            </div>

            {/* Project Selection Checkboxes */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 800, fontSize: '12px', color: '#0a2540' }}>Select Projects to Compare:</span>
              {GOV_PROJECTS.map(p => (
                <label
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: compareProjectIds.includes(p.id) ? '#eff6ff' : 'transparent',
                    border: `1px solid ${compareProjectIds.includes(p.id) ? '#bfdbfe' : '#e2e8f0'}`
                  }}
                >
                  <input
                    type="checkbox"
                    checked={compareProjectIds.includes(p.id)}
                    onChange={() => handleToggleCompareProject(p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>

            {/* Side-by-Side Comparison Matrix */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0a2540', color: '#ffffff' }}>
                    <th style={{ padding: '14px 16px', width: '220px' }}>Metric / Attribute</th>
                    {compareProjectIds.map(id => {
                      const p = GOV_PROJECTS.find(x => x.id === id);
                      return (
                        <th key={id} style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 800 }}>{p?.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {p?.id} • {p?.district}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Project Type</td>
                    {compareProjectIds.map(id => (
                      <td key={id} style={{ padding: '12px 16px', fontWeight: 600 }}>
                        {GOV_PROJECTS.find(x => x.id === id)?.type}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Acquisition Status</td>
                    {compareProjectIds.map(id => {
                      const p = GOV_PROJECTS.find(x => x.id === id);
                      const st = p?.govStatus || 'Planning';
                      return (
                        <td key={id} style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: PROJECT_STATUS_CONFIG[st].bg,
                            color: PROJECT_STATUS_CONFIG[st].color,
                            border: `1px solid ${PROJECT_STATUS_CONFIG[st].border}`
                          }}>
                            {st}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Total Land Required</td>
                    {compareProjectIds.map(id => (
                      <td key={id} style={{ padding: '12px 16px', fontWeight: 800, color: '#9a3412' }}>
                        {GOV_PROJECTS.find(x => x.id === id)?.requiredLandAcres} Acres
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Land Acquired</td>
                    {compareProjectIds.map(id => (
                      <td key={id} style={{ padding: '12px 16px', fontWeight: 800, color: '#166534' }}>
                        {GOV_PROJECTS.find(x => x.id === id)?.acquiredLandAcres} Acres
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Land Pending</td>
                    {compareProjectIds.map(id => (
                      <td key={id} style={{ padding: '12px 16px', fontWeight: 800, color: '#b45309' }}>
                        {GOV_PROJECTS.find(x => x.id === id)?.pendingLandAcres} Acres
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Total Landowners</td>
                    {compareProjectIds.map(id => (
                      <td key={id} style={{ padding: '12px 16px', fontWeight: 700 }}>
                        {GOV_PROJECTS.find(x => x.id === id)?.totalLandowners} Landowners
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Total Cadastral Parcels</td>
                    {compareProjectIds.map(id => (
                      <td key={id} style={{ padding: '12px 16px', fontWeight: 700 }}>
                        {GOV_PROJECTS.find(x => x.id === id)?.totalParcels} Parcels
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Compensation Pending</td>
                    {compareProjectIds.map(id => (
                      <td key={id} style={{ padding: '12px 16px', fontWeight: 700, color: '#ca8a04' }}>
                        {GOV_PROJECTS.find(x => x.id === id)?.compensationPendingCount} Cases
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Active Court Disputes</td>
                    {compareProjectIds.map(id => (
                      <td key={id} style={{ padding: '12px 16px', fontWeight: 800, color: '#dc2626' }}>
                        {GOV_PROJECTS.find(x => x.id === id)?.disputedParcelsCount} Parcels
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>CALA Nodal Officer</td>
                    {compareProjectIds.map(id => {
                      const p = GOV_PROJECTS.find(x => x.id === id);
                      return (
                        <td key={id} style={{ padding: '12px 16px', fontSize: '11px', color: '#334155' }}>
                          <strong>{p?.nodalOfficer.name}</strong>
                          <div style={{ color: '#64748b' }}>{p?.nodalOfficer.designation}</div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Action</td>
                    {compareProjectIds.map(id => (
                      <td key={id} style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => {
                            handleSelectProject(id);
                            setActiveViewMode('MAP');
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#0a2540',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <MapPin size={12} color="#38bdf8" /> Open on Map
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          5. STATUTORY DOSSIER AUDIT MODAL
          ══════════════════════════════════════════════════════════ */}
      {detailModalOpen && activeParcel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0a2540' }}>
                  Statutory Cadastral Dossier — S.No {activeParcel.surveyNumber}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Land Parcel ID: <strong>{activeParcel.id}</strong> • Project: <strong>{activeParcel.projectName}</strong>
                </div>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Audit Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Landowner Name</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{activeParcel.landownerName}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Survey / Khasra Number</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{activeParcel.surveyNumber} ({activeParcel.khasraNumber})</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Village & Taluka</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{activeParcel.village}, {activeParcel.taluka}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>District & State</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{activeParcel.district}, {activeParcel.state}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Total Holding Area</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{activeParcel.totalAreaAcres} Acres ({activeParcel.totalAreaHa} Ha)</div>
              </div>
              <div style={{ backgroundColor: '#fffbeb', padding: '10px', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700 }}>Affected Corridor Area</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#9a3412' }}>{activeParcel.affectedAreaAcres} Acres ({activeParcel.affectedPercentage}%)</div>
              </div>
              <div style={{ backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>Calculated Award Estimate</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#166534' }}>{activeParcel.compensationFormatted}</div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>RFCTLARR Solatium Multiplier</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{activeParcel.solatiumMultiplier}x (100% Solatium Applied)</div>
              </div>
            </div>

            {/* Encumbrance & Dispute Section */}
            <div style={{
              backgroundColor: activeParcel.disputeStatus !== 'NONE' ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${activeParcel.disputeStatus !== 'NONE' ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '18px',
              fontSize: '12px'
            }}>
              <div style={{
                fontWeight: 800,
                color: activeParcel.disputeStatus !== 'NONE' ? '#991b1b' : '#166534',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShieldCheck size={16} />
                Encumbrance & Title Status: {activeParcel.disputeStatus === 'NONE' ? 'CLEARED & UNENCUMBERED' : activeParcel.disputeStatus}
              </div>
              {activeParcel.disputeDetails && (
                <div style={{ color: '#be123c', marginTop: '6px', lineHeight: 1.5 }}>
                  {activeParcel.disputeDetails}
                </div>
              )}
              {activeParcel.courtCaseNumber && (
                <div style={{ fontWeight: 700, color: '#881337', marginTop: '4px' }}>
                  Judicial Appeal Reference: {activeParcel.courtCaseNumber}
                </div>
              )}
            </div>

            {/* Statutory Checklist */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', fontSize: '12px' }}>
              <div style={{ fontWeight: 800, color: '#0a2540', marginBottom: '8px' }}>
                Statutory Compliance Checklist:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', lineHeight: 1.8 }}>
                <li>✓ DGPS Joint Cadastral Boundary Coordinates Geo-referenced</li>
                <li>✓ 7/12 Extract verified against District Revenue Land Registry</li>
                <li>✓ RFCTLARR Section 11 Preliminary Notification gazetted</li>
                <li>✓ Social Impact Assessment (SIA) Committee recommendations recorded</li>
                <li>✓ Direct Purchase Committee solatium appraisal cleared</li>
              </ul>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDetailModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  navigate('/government/dashboard');
                }}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#0a2540',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Proceed to Officer Verification Stage →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernmentGISExplorer;
