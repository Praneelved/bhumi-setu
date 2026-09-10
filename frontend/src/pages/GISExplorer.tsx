import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate } from 'react-router-dom';
import {
  Map as MapIcon,
  MapPin,
  Layers,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Search,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Building2,
  RefreshCw,
  X,
  Crosshair,
  ShieldAlert,
  TreePine,
  Waves,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  AlertOctagon,
  Info,
  Check,
  FileCheck
} from 'lucide-react';
import {
  fetchGisParcels,
  fetchGisParcelDetail,
  fetchGisZones,
  fetchProjectConstraints,
  updateZoneClearance,
  fetchParcelConstraints
} from '../services/api';
import type {
  GISFeatureCollection,
  DetailedParcel,
  GISZone,
  ZoneIntersection,
  ProjectConstraintsReport,
  ParcelConstraintsReport,
  ClearanceReviewStatus
} from '../services/api';

const GISExplorer: React.FC = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const [parcelsData, setParcelsData] = useState<GISFeatureCollection | null>(null);
  const [zonesData, setZonesData] = useState<GISZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedParcel, setSelectedParcel] = useState<DetailedParcel | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Tabs for right side drawer
  const [activeRightTab, setActiveRightTab] = useState<'PARCEL' | 'CONSTRAINTS'>('PARCEL');

  // Constraints report for current project
  const [constraintsReport, setConstraintsReport] = useState<ProjectConstraintsReport | null>(null);
  const [constraintsLoading, setConstraintsLoading] = useState<boolean>(false);

  // Constraints for selected parcel
  const [parcelConstraints, setParcelConstraints] = useState<ParcelConstraintsReport | null>(null);

  // Clearance Modal
  const [clearanceModalOpen, setClearanceModalOpen] = useState<boolean>(false);
  const [activeClearanceIntersection, setActiveClearanceIntersection] = useState<ZoneIntersection | null>(null);
  const [clearanceFormStatus, setClearanceFormStatus] = useState<ClearanceReviewStatus>('UNDER_REVIEW');
  const [clearanceFormRef, setClearanceFormRef] = useState<string>('');
  const [clearanceFormRemarks, setClearanceFormRemarks] = useState<string>('');
  const [clearanceSubmitting, setClearanceSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Layer Switcher Drawer / Popover
  const [layerSwitcherOpen, setLayerSwitcherOpen] = useState<boolean>(false);
  const [activeLayers, setActiveLayers] = useState<{
    parcels: boolean;
    corridor: boolean;
    FOREST: boolean;
    GREEN_BELT: boolean;
    WATER_BODY: boolean;
    INDUSTRIAL: boolean;
    ECO_SENSITIVE: boolean;
    WETLAND: boolean;
  }>({
    parcels: true,
    corridor: true,
    FOREST: true,
    GREEN_BELT: true,
    WATER_BODY: true,
    INDUSTRIAL: true,
    ECO_SENSITIVE: true,
    WETLAND: true
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [compFilter, setCompFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('prj-mpe-01');

  // Selected Zone popup for map inspection
  const [inspectedZone, setInspectedZone] = useState<GISZone | null>(null);

  // 1. Load Cadastral Parcels
  const loadParcels = async (overrideSearch?: string) => {
    setLoading(true);
    try {
      const activeSearch = overrideSearch !== undefined ? overrideSearch : searchTerm;
      const data = await fetchGisParcels({
        project_id: projectFilter !== 'ALL' ? projectFilter : undefined,
        acquisition_status: statusFilter !== 'ALL' ? statusFilter : undefined,
        compensation_status: compFilter !== 'ALL' ? compFilter : undefined,
        search: activeSearch.trim() || undefined
      });
      setParcelsData(data);

      if (map.current && map.current.isStyleLoaded()) {
        const source = map.current.getSource('cadastral-parcels') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData(data as any);
        }
      }

      if (data.features.length > 0) {
        const showcase = data.features.find(f => f.properties.id === 'P-001') || data.features[0];
        handleSelectParcel(showcase.properties.id, false);
      }
    } catch (err) {
      console.error('Failed to load cadastral parcels:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Load GIS Sensitive/Restricted Zones
  const loadZones = async () => {
    try {
      const resp = await fetchGisZones();
      setZonesData(resp.zones || []);

      if (map.current && map.current.isStyleLoaded()) {
        const source = map.current.getSource('gis-zones') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: resp.features || []
          } as any);
        }
      }
    } catch (err) {
      console.error('Failed to load GIS zones:', err);
    }
  };

  // 3. Load Project Constraints Report
  const loadProjectConstraints = async (projId: string) => {
    setConstraintsLoading(true);
    try {
      const report = await fetchProjectConstraints(projId);
      setConstraintsReport(report);

      if (map.current && map.current.isStyleLoaded() && report.project_corridor_geojson) {
        const cSource = map.current.getSource('project-corridor') as maplibregl.GeoJSONSource;
        if (cSource) {
          cSource.setData({
            type: 'Feature',
            geometry: report.project_corridor_geojson,
            properties: { project_name: report.project_name }
          } as any);
        }
      }
    } catch (err) {
      console.error('Failed to load project constraints report:', err);
    } finally {
      setConstraintsLoading(false);
    }
  };

  useEffect(() => {
    loadParcels();
  }, [statusFilter, compFilter, projectFilter]);

  useEffect(() => {
    loadZones();
    loadProjectConstraints(projectFilter !== 'ALL' ? projectFilter : 'prj-mpe-01');
  }, [projectFilter]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadParcels();
  };

  // Fetch single parcel detail & constraints
  const handleSelectParcel = async (parcelId: string, flyCamera: boolean = true) => {
    setDetailLoading(true);
    try {
      const [detail, constraints] = await Promise.all([
        fetchGisParcelDetail(parcelId),
        fetchParcelConstraints(parcelId).catch(() => null)
      ]);
      setSelectedParcel(detail);
      setParcelConstraints(constraints);

      if (flyCamera && map.current) {
        map.current.flyTo({
          center: [detail.centroid_lng, detail.centroid_lat],
          zoom: 15.2,
          speed: 1.2,
          curve: 1.4,
          essential: true
        });
      }
    } catch (err) {
      console.error('Failed to fetch parcel detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle layer toggle
  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    const nextState = !activeLayers[layerKey];
    setActiveLayers(prev => ({ ...prev, [layerKey]: nextState }));

    if (!map.current || !map.current.isStyleLoaded()) return;

    if (layerKey === 'parcels') {
      const visibility = nextState ? 'visible' : 'none';
      if (map.current.getLayer('parcels-fill')) map.current.setLayoutProperty('parcels-fill', 'visibility', visibility);
      if (map.current.getLayer('parcels-line')) map.current.setLayoutProperty('parcels-line', 'visibility', visibility);
      if (map.current.getLayer('parcels-labels')) map.current.setLayoutProperty('parcels-labels', 'visibility', visibility);
    } else if (layerKey === 'corridor') {
      const visibility = nextState ? 'visible' : 'none';
      if (map.current.getLayer('corridor-fill')) map.current.setLayoutProperty('corridor-fill', 'visibility', visibility);
      if (map.current.getLayer('corridor-line')) map.current.setLayoutProperty('corridor-line', 'visibility', visibility);
    } else {
      // Zone types filter
      applyZoneFilters({ ...activeLayers, [layerKey]: nextState });
    }
  };

  const applyZoneFilters = (layersState: typeof activeLayers) => {
    if (!map.current || !map.current.isStyleLoaded() || !map.current.getLayer('gis-zones-fill')) return;

    const enabledTypes: string[] = [];
    if (layersState.FOREST) enabledTypes.push('FOREST');
    if (layersState.GREEN_BELT) enabledTypes.push('GREEN_BELT');
    if (layersState.WATER_BODY) enabledTypes.push('WATER_BODY');
    if (layersState.INDUSTRIAL) enabledTypes.push('INDUSTRIAL');
    if (layersState.ECO_SENSITIVE) enabledTypes.push('ECO_SENSITIVE');
    if (layersState.WETLAND) enabledTypes.push('WETLAND');

    if (enabledTypes.length === 0) {
      map.current.setLayoutProperty('gis-zones-fill', 'visibility', 'none');
      map.current.setLayoutProperty('gis-zones-line', 'visibility', 'none');
      map.current.setLayoutProperty('gis-zones-labels', 'visibility', 'none');
    } else {
      map.current.setLayoutProperty('gis-zones-fill', 'visibility', 'visible');
      map.current.setLayoutProperty('gis-zones-line', 'visibility', 'visible');
      map.current.setLayoutProperty('gis-zones-labels', 'visibility', 'visible');

      const filterExpr = ['in', ['get', 'zone_type'], ['literal', enabledTypes]];
      map.current.setFilter('gis-zones-fill', filterExpr as any);
      map.current.setFilter('gis-zones-line', filterExpr as any);
      map.current.setFilter('gis-zones-labels', filterExpr as any);
    }
  };

  // Initialize MapLibre GL
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [73.7385, 18.5912], // Hinjawadi Pune Corridor
      zoom: 13.5
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // ── 1. GIS Sensitive / Restricted Zones Source & Layers ──
      map.current.addSource('gis-zones', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Zone Fills
      map.current.addLayer({
        id: 'gis-zones-fill',
        type: 'fill',
        source: 'gis-zones',
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#15803d'],
          'fill-opacity': 0.35
        }
      });

      // Zone Outlines
      map.current.addLayer({
        id: 'gis-zones-line',
        type: 'line',
        source: 'gis-zones',
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#15803d'],
          'line-width': 2,
          'line-opacity': 0.85
        }
      });

      // Zone Labels
      map.current.addLayer({
        id: 'gis-zones-labels',
        type: 'symbol',
        source: 'gis-zones',
        layout: {
          'text-field': ['concat', '⚠️ ', ['get', 'zone_name']],
          'text-size': 11,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });

      // ── 2. Project Corridor Alignment Source & Layer ──
      map.current.addSource('project-corridor', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.current.addLayer({
        id: 'corridor-fill',
        type: 'fill',
        source: 'project-corridor',
        paint: {
          'fill-color': '#0a2540',
          'fill-opacity': 0.12
        }
      });

      map.current.addLayer({
        id: 'corridor-line',
        type: 'line',
        source: 'project-corridor',
        paint: {
          'line-color': '#0a2540',
          'line-width': 2.5,
          'line-dasharray': [3, 2]
        }
      });

      // ── 3. Cadastral Land Parcels Source & Layers ──
      map.current.addSource('cadastral-parcels', {
        type: 'geojson',
        data: parcelsData || { type: 'FeatureCollection', features: [] }
      });

      map.current.addLayer({
        id: 'parcels-fill',
        type: 'fill',
        source: 'cadastral-parcels',
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#0284c7'],
          'fill-opacity': 0.65
        }
      });

      map.current.addLayer({
        id: 'parcels-line',
        type: 'line',
        source: 'cadastral-parcels',
        paint: {
          'line-color': '#0f172a',
          'line-width': 2,
          'line-opacity': 0.9
        }
      });

      map.current.addLayer({
        id: 'parcels-highlight',
        type: 'line',
        source: 'cadastral-parcels',
        paint: {
          'line-color': '#eab308',
          'line-width': 4
        },
        filter: ['==', 'id', '']
      });

      map.current.addLayer({
        id: 'parcels-labels',
        type: 'symbol',
        source: 'cadastral-parcels',
        layout: {
          'text-field': ['concat', 'Surv ', ['get', 'survey_number'], '\n(', ['get', 'owner_name'], ')'],
          'text-size': 11,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });

      // Cursor pointer handlers
      map.current.on('mouseenter', 'parcels-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'parcels-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      map.current.on('mouseenter', 'gis-zones-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'gis-zones-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      // Click on parcel
      map.current.on('click', 'parcels-fill', (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const pid = feature.properties?.id;
          if (pid) {
            handleSelectParcel(pid, true);
            setActiveRightTab('PARCEL');
          }
        }
      });

      // Click on GIS zone to inspect
      map.current.on('click', 'gis-zones-fill', (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties as any;
          if (props) {
            setInspectedZone(props);
          }
        }
      });

      // Apply initial zones and corridor data if already loaded
      loadZones();
      loadProjectConstraints('prj-mpe-01');
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update highlight layer when selectedParcel changes
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded() && map.current.getLayer('parcels-highlight')) {
      map.current.setFilter('parcels-highlight', ['==', 'id', selectedParcel?.id || '']);
    }
  }, [selectedParcel]);

  // Open clearance modal
  const handleOpenClearanceModal = (intersection: ZoneIntersection) => {
    setActiveClearanceIntersection(intersection);
    setClearanceFormStatus(intersection.review_status);
    setClearanceFormRef(intersection.clearance_reference_no || '');
    setClearanceFormRemarks(intersection.remarks || '');
    setClearanceModalOpen(true);
  };

  // Submit clearance status update
  const handleSubmitClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClearanceIntersection || !constraintsReport) return;

    setClearanceSubmitting(true);
    try {
      const updated = await updateZoneClearance(constraintsReport.project_id, {
        zone_id: activeClearanceIntersection.zone_id,
        review_status: clearanceFormStatus,
        clearance_reference_no: clearanceFormRef,
        remarks: clearanceFormRemarks
      });
      setConstraintsReport(updated);
      setClearanceModalOpen(false);
      setToastMessage(`Clearance status for ${activeClearanceIntersection.zone_name} updated to ${clearanceFormStatus}.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update clearance status');
    } finally {
      setClearanceSubmitting(false);
    }
  };

  // Helper for risk badge styling
  const renderRiskBadge = (risk: string) => {
    let bg = '#f0fdf4';
    let text = '#166534';
    let border = '#bbf7d0';

    if (risk === 'CRITICAL') {
      bg = '#fef2f2';
      text = '#991b1b';
      border = '#fecaca';
    } else if (risk === 'HIGH') {
      bg = '#fff7ed';
      text = '#c2410c';
      border = '#fed7aa';
    } else if (risk === 'MODERATE') {
      bg = '#eff6ff';
      text = '#1d4ed8';
      border = '#bfdbfe';
    }

    return (
      <span style={{
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        fontSize: '10px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {risk === 'CRITICAL' || risk === 'HIGH' ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
        {risk} RISK
      </span>
    );
  };

  const renderStatusBadge = (status: ClearanceReviewStatus) => {
    let bg = '#f1f5f9';
    let text = '#475569';
    if (status === 'CLEARED') {
      bg = '#dcfce7';
      text = '#15803d';
    } else if (status === 'CONDITIONAL_CLEARANCE') {
      bg = '#fef9c3';
      text = '#854d0e';
    } else if (status === 'UNDER_REVIEW') {
      bg = '#e0f2fe';
      text = '#0369a1';
    } else if (status === 'REJECTED') {
      bg = '#fee2e2';
      text = '#b91c1c';
    }

    return (
      <span style={{
        backgroundColor: bg,
        color: text,
        fontSize: '10px',
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: '4px',
        display: 'inline-block'
      }}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div style={{ padding: 'var(--space-lg) var(--space-xl)', backgroundColor: 'var(--background)', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#0a2540',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} color="#22c55e" />
          {toastMessage}
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-lg)',
        backgroundColor: 'var(--primary)',
        color: 'var(--on-primary)',
        padding: '16px 24px',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 700 }}>
            Cadastral GIS &amp; Land-Use / Restricted-Zone Intelligence
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
            Multi-Layer Spatial Intersection • Forest Land &amp; Green Belt Detection • Statutory Clearances Decision Support
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveRightTab('CONSTRAINTS')}
            style={{
              backgroundColor: activeRightTab === 'CONSTRAINTS' ? '#eab308' : '#ffffff',
              color: '#0a2540',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <TreePine size={15} /> Land &amp; Environmental Report
          </button>
          <button
            onClick={() => navigate('/government/compensation')}
            style={{
              backgroundColor: '#ffffff',
              color: 'var(--primary)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CreditCard size={15} /> Payment Disbursements
          </button>
          <button
            onClick={() => navigate('/government/verification')}
            style={{
              backgroundColor: 'var(--tertiary-container)',
              color: 'var(--on-tertiary-container)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={15} /> Statutory Verification
          </button>
        </div>
      </div>

      {/* ── KPI Row with GIS Environmental Metrics ── */}
      <div className="desktop-grid" style={{ marginBottom: 'var(--space-md)' }}>
        {[
          {
            title: "TOTAL SURVEYED PARCELS",
            val: parcelsData ? String(parcelsData.features.length) : "14",
            unit: "Parcels",
            sub: "Hinjawadi / Maan Phase III",
            val2: "100% Geo-referenced",
            color: "#0a2540"
          },
          {
            title: "ENVIRONMENTAL RISK STATUS",
            val: constraintsReport ? constraintsReport.overall_risk_level : "HIGH",
            unit: "Level",
            sub: "Forest & Green Belt Overlap",
            val2: "Decision Support Ready",
            color: constraintsReport?.overall_risk_level === 'HIGH' ? '#c2410c' : '#166534'
          },
          {
            title: "CONSTRAINED CORRIDOR AREA",
            val: constraintsReport ? `${constraintsReport.total_constrained_area_ha}` : "27.5",
            unit: "Hectares",
            sub: "Forest, Water & Green Belt",
            val2: "Spatial Polygon Intersection",
            color: "#0284c7"
          },
          {
            title: "STATUTORY CLEARANCES GATED",
            val: constraintsReport ? `${constraintsReport.intersections.filter(i => i.review_status !== 'CLEARED').length}` : "3",
            unit: "Pending / Under Review",
            sub: "MoEFCC & PMRDA Tree NOC",
            val2: "Stage-1 Collector Check",
            color: "#854d0e"
          }
        ].map((kpi, i) => (
          <div key={i} className="surface-card" style={{ gridColumn: 'span 3', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>{kpi.title}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '4px 0' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: kpi.color }}>{kpi.val}</span>
              <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{kpi.unit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--outline)' }}>
              <span>{kpi.sub}</span>
              <span style={{ color: '#166534', fontWeight: 600 }}>{kpi.val2}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Interactive Filters & Search Bar ── */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        marginBottom: 'var(--space-md)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Survey No (124/2), Village, Owner, or Zone..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '6px',
                border: '1px solid var(--outline-variant)',
                fontSize: '13px',
                fontFamily: 'Arial, Helvetica, sans-serif'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Search
          </button>
        </form>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', fontSize: '12px', backgroundColor: '#fff', fontWeight: 600 }}
          >
            <option value="prj-mpe-01">National Highway Project (PROJ-DEMO-001) [Active]</option>
            <option value="prj-bce-02">Bangalore–Chennai Expressway (Pkg 2)</option>
            <option value="prj-dme-04">Delhi–Mumbai Expressway (Vadodara)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', fontSize: '12px', backgroundColor: '#fff' }}
          >
            <option value="ALL">All Statutory Stages</option>
            <option value="SECTION_11">Section 11 (Preliminary)</option>
            <option value="SECTION_19">Section 19 (Declaration)</option>
            <option value="AWARD_DECLARED">Section 23 (Award Declared)</option>
            <option value="POSSESSION_TAKEN">Section 38 (Possession Taken)</option>
          </select>

          <select
            value={compFilter}
            onChange={(e) => setCompFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', fontSize: '12px', backgroundColor: '#fff' }}
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="APPROVED">Compensation Approved</option>
            <option value="PROCESSING">PFMS DBT Processing</option>
            <option value="DISBURSED">Credited / Disbursed</option>
            <option value="NOT_ASSESSED">Not Assessed</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setCompFilter('ALL');
              setProjectFilter('prj-mpe-01');
              loadParcels('');
            }}
            title="Reset Filters"
            style={{
              padding: '8px 10px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={14} color="#475569" />
          </button>
        </div>

        {/* Quick Owner, Survey, Parcel, Project, District Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', width: '100%', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>SIH Quick Filters:</span>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('Demo Landowner');
              loadParcels('Demo Landowner');
            }}
            style={{
              padding: '4px 10px', borderRadius: '12px', border: '1px solid #0a2540',
              backgroundColor: searchTerm === 'Demo Landowner' ? '#0a2540' : '#f0f9ff',
              color: searchTerm === 'Demo Landowner' ? '#ffffff' : '#0369a1',
              fontSize: '11px', fontWeight: 700, cursor: 'pointer'
            }}
          >
            👤 Owner: Demo Landowner
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('124/2');
              loadParcels('124/2');
            }}
            style={{
              padding: '4px 10px', borderRadius: '12px', border: '1px solid #cbd5e1',
              backgroundColor: searchTerm === '124/2' ? '#0a2540' : '#ffffff',
              color: searchTerm === '124/2' ? '#ffffff' : '#334155',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            📍 Survey 124/2
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('P-001');
              loadParcels('P-001');
            }}
            style={{
              padding: '4px 10px', borderRadius: '12px', border: '1px solid #cbd5e1',
              backgroundColor: searchTerm === 'P-001' ? '#0a2540' : '#ffffff',
              color: searchTerm === 'P-001' ? '#ffffff' : '#334155',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            🏷️ Parcel P-001
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('Demo District');
              loadParcels('Demo District');
            }}
            style={{
              padding: '4px 10px', borderRadius: '12px', border: '1px solid #cbd5e1',
              backgroundColor: searchTerm === 'Demo District' ? '#0a2540' : '#ffffff',
              color: searchTerm === 'Demo District' ? '#ffffff' : '#334155',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            🏛️ District: Demo District
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setProjectFilter('prj-mpe-01');
              loadParcels('');
            }}
            style={{
              padding: '4px 10px', borderRadius: '12px', border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc', color: '#334155',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            🛣️ Project: All Affected Parcels
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                loadParcels('');
              }}
              style={{
                padding: '4px 8px', borderRadius: '12px', border: 'none',
                backgroundColor: '#fee2e2', color: '#991b1b',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Reset ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Main Map & Details Layout ── */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', minHeight: '640px' }}>
        
        {/* Map Viewport Card */}
        <div className="surface-card" style={{ flex: '1', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Top Bar on Map */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--outline-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapIcon size={16} color="var(--primary)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-surface)' }}>
                NIC Geo-Spatial Vector Canvas (Carto Positron / EPSG:4326)
              </span>
              <span style={{
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid #bfdbfe',
                fontWeight: 600
              }}>
                Demo/Mock Layer • Authority Integration Ready
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Layer Switcher Toggle Button */}
              <button
                onClick={() => setLayerSwitcherOpen(!layerSwitcherOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: layerSwitcherOpen ? '#0a2540' : '#f1f5f9',
                  color: layerSwitcherOpen ? '#ffffff' : '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Layers size={14} />
                <span>GIS Layers ({Object.values(activeLayers).filter(Boolean).length})</span>
              </button>
            </div>
          </div>

          {/* Map Container */}
          <div ref={mapContainer} style={{ flex: '1', width: '100%', minHeight: '540px', backgroundColor: '#e2e8f0' }} />

          {/* ── Layer Switcher Floating Control Panel ── */}
          {layerSwitcherOpen && (
            <div style={{
              position: 'absolute',
              top: '52px',
              left: '16px',
              width: '280px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              padding: '14px',
              zIndex: 30
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0a2540', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={15} /> Layer Visibility
                </span>
                <button
                  onClick={() => setLayerSwitcherOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={16} color="#64748b" />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                {/* Cadastral Parcels */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', backgroundColor: activeLayers.parcels ? '#f8fafc' : 'transparent' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#0284c7', borderRadius: '2px', display: 'inline-block' }} />
                    <strong>Cadastral Parcels</strong>
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.parcels}
                    onChange={() => toggleLayer('parcels')}
                  />
                </label>

                {/* Project Corridor */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', backgroundColor: activeLayers.corridor ? '#f8fafc' : 'transparent' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', border: '2px dashed #0a2540', borderRadius: '2px', display: 'inline-block' }} />
                    <span>Project Corridor Alignment</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.corridor}
                    onChange={() => toggleLayer('corridor')}
                  />
                </label>

                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.04em' }}>
                  Sensitive / Restricted Zones:
                </div>

                {/* Forest Land */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', backgroundColor: activeLayers.FOREST ? '#f0fdf4' : 'transparent' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#15803d', borderRadius: '2px', display: 'inline-block' }} />
                    <span>Forest Land (FCA 1980)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.FOREST}
                    onChange={() => toggleLayer('FOREST')}
                  />
                </label>

                {/* Green Belt */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', backgroundColor: activeLayers.GREEN_BELT ? '#f7fee7' : 'transparent' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#84cc16', borderRadius: '2px', display: 'inline-block' }} />
                    <span>Green Belt / Master Plan</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.GREEN_BELT}
                    onChange={() => toggleLayer('GREEN_BELT')}
                  />
                </label>

                {/* Water Bodies */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', backgroundColor: activeLayers.WATER_BODY ? '#eff6ff' : 'transparent' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#0284c7', borderRadius: '2px', display: 'inline-block' }} />
                    <span>Water Bodies / Rivers</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.WATER_BODY}
                    onChange={() => toggleLayer('WATER_BODY')}
                  />
                </label>

                {/* Industrial Zones */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', backgroundColor: activeLayers.INDUSTRIAL ? '#faf5ff' : 'transparent' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#8b5cf6', borderRadius: '2px', display: 'inline-block' }} />
                    <span>Industrial / Planning Zones</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.INDUSTRIAL}
                    onChange={() => toggleLayer('INDUSTRIAL')}
                  />
                </label>

                {/* Eco-Sensitive Zones */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', backgroundColor: activeLayers.ECO_SENSITIVE ? '#fffbeb' : 'transparent' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '2px', display: 'inline-block' }} />
                    <span>Eco-Sensitive Zones (ESZ)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.ECO_SENSITIVE}
                    onChange={() => toggleLayer('ECO_SENSITIVE')}
                  />
                </label>

                {/* Wetlands */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', backgroundColor: activeLayers.WETLAND ? '#ecfeff' : 'transparent' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#06b6d4', borderRadius: '2px', display: 'inline-block' }} />
                    <span>Wetlands Catchment</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={activeLayers.WETLAND}
                    onChange={() => toggleLayer('WETLAND')}
                  />
                </label>
              </div>

              <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '4px', fontSize: '10px', color: '#64748b' }}>
                💡 Click any zone on the map to inspect authority metadata and legal status.
              </div>
            </div>
          )}

          {/* ── Inspected Zone Popup Overlay ── */}
          {inspectedZone && (
            <div style={{
              position: 'absolute',
              bottom: '50px',
              left: '16px',
              width: '320px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              border: `2px solid ${inspectedZone.color_hex || '#15803d'}`,
              padding: '14px',
              zIndex: 35
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{
                    backgroundColor: inspectedZone.color_hex || '#15803d',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {inspectedZone.zone_type}
                  </span>
                  <h4 style={{ margin: '4px 0 2px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    {inspectedZone.zone_name}
                  </h4>
                </div>
                <button
                  onClick={() => setInspectedZone(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={15} color="#64748b" />
                </button>
              </div>

              <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Authority:</strong> {inspectedZone.authority}</div>
                <div><strong>Source:</strong> {inspectedZone.source || inspectedZone.source_type}</div>
                <div><strong>Statutory Reference:</strong> {inspectedZone.legal_act_reference}</div>
                <div><strong>Restriction:</strong> {inspectedZone.restriction_level}</div>
              </div>

              <div style={{ marginTop: '8px', fontSize: '10px', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '4px 8px', borderRadius: '4px' }}>
                {inspectedZone.disclaimer || "Demo/Mock Layer • Authority Integration Ready"}
              </div>
            </div>
          )}

          {/* Quick Strip of Found Parcels */}
          {parcelsData && parcelsData.features.length > 0 && (
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid var(--outline-variant)',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                Corridor Parcels ({parcelsData.features.length}):
              </span>
              {parcelsData.features.map(f => {
                const isSelected = selectedParcel?.id === f.properties.id;
                return (
                  <button
                    key={f.properties.id}
                    onClick={() => {
                      handleSelectParcel(f.properties.id, true);
                      setActiveRightTab('PARCEL');
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: isSelected ? '2px solid #0a2540' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#0a2540' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#0f172a',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Khasra {f.properties.survey_number} • {f.properties.village}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right Details Drawer with Tabs ── */}
        <div style={{ width: '450px', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          {/* Drawer Tab Headers */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--outline-variant)'
          }}>
            <button
              onClick={() => setActiveRightTab('PARCEL')}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: activeRightTab === 'PARCEL' ? '#ffffff' : 'transparent',
                color: activeRightTab === 'PARCEL' ? 'var(--primary)' : '#64748b',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: activeRightTab === 'PARCEL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <FileText size={14} /> Parcel Details
            </button>

            <button
              onClick={() => setActiveRightTab('CONSTRAINTS')}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: activeRightTab === 'CONSTRAINTS' ? '#ffffff' : 'transparent',
                color: activeRightTab === 'CONSTRAINTS' ? '#c2410c' : '#64748b',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: activeRightTab === 'CONSTRAINTS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <TreePine size={14} /> Environmental Constraints
              {constraintsReport && constraintsReport.overall_risk_level === 'HIGH' && (
                <span style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }} />
              )}
            </button>
          </div>

          {/* TAB 1: PARCEL DETAILS */}
          {activeRightTab === 'PARCEL' && (
            <>
              {selectedParcel ? (
                <div className="surface-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Parcel Title & ID */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ backgroundColor: '#0a2540', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                          ID: {selectedParcel.id}
                        </span>
                        <span style={{
                          backgroundColor: selectedParcel.acquisition_status === 'POSSESSION_TAKEN' ? '#f0fdf4' : '#eff6ff',
                          color: selectedParcel.acquisition_status === 'POSSESSION_TAKEN' ? '#166534' : '#1d4ed8',
                          border: '1px solid currentColor',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {selectedParcel.acquisition_status}
                        </span>
                      </div>
                      <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--on-surface)' }}>
                        Khasra / Survey {selectedParcel.survey_number}
                      </h2>
                      <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                        {selectedParcel.village} • Taluk: {selectedParcel.taluk} • {selectedParcel.district}, {selectedParcel.state}
                      </div>
                    </div>
                  </div>

                  {/* Environmental Overlap Alert on Parcel Level */}
                  {parcelConstraints && parcelConstraints.has_environmental_restrictions && (
                    <div style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#b45309', marginBottom: '4px' }}>
                        <AlertTriangle size={14} /> Environmental Zone Intersection Detected
                      </div>
                      {parcelConstraints.intersections.map(iz => (
                        <div key={iz.id} style={{ color: '#92400e', fontSize: '11px', marginLeft: '20px' }}>
                          • <strong>{iz.zone_name}</strong>: {iz.intersection_area_ha} Ha overlap ({iz.percentage_affected}% of parcel).
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── PARCEL DETAILS (SIH Specification) ── */}
                  <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #0a2540', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ backgroundColor: '#0a2540', color: '#ffffff', padding: '10px 16px', fontSize: '13px', fontWeight: 800, letterSpacing: '0.05em' }}>
                      PARCEL DETAILS
                    </div>
                    <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Parcel ID:</span>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0a2540' }}>{selectedParcel.id}</div>
                      </div>

                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Survey/Khasra:</span>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#0a2540' }}>{selectedParcel.survey_number || selectedParcel.khasra_number}</div>
                      </div>

                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Owner:</span>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{selectedParcel.owner_name}</div>
                      </div>

                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Ownership:</span>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#166534' }}>{selectedParcel.ownership_percentage ? `${Number(selectedParcel.ownership_percentage)}%` : '100%'}</div>
                      </div>

                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Area:</span>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedParcel.area_ha} hectares</div>
                      </div>

                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Village:</span>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedParcel.village}</div>
                      </div>

                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Taluka:</span>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedParcel.taluka || selectedParcel.taluk}</div>
                      </div>

                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>District:</span>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedParcel.district}</div>
                      </div>

                      <div style={{ gridColumn: 'span 2', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Project:</span>
                        <div style={{ fontWeight: 700, color: '#0a2540' }}>{selectedParcel.project_name || 'National Highway Project'}</div>
                      </div>

                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Acquisition Case:</span>
                        <div style={{ fontWeight: 700, color: '#0284c7' }}>{selectedParcel.acquisition_case_id || 'LA-2026-001'}</div>
                      </div>

                      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Acquisition Status:</span>
                        <div style={{ fontWeight: 700, color: '#854d0e' }}>{selectedParcel.acquisition_status || 'Under Verification'}</div>
                      </div>

                      <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                        <span style={{ color: '#166534', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Compensation:</span>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: '#166534' }}>
                          {selectedParcel.id === 'P-001' ? '₹14,28,000' : (selectedParcel.compensation ? `₹ ${((selectedParcel.compensation.total_amount_lakh || 14.28) * 100000).toLocaleString('en-IN')}` : '₹14,28,000')}
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#fffbeb', padding: '8px 10px', borderRadius: '4px', border: '1px solid #fef3c7' }}>
                        <span style={{ color: '#b45309', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Payment:</span>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#b45309' }}>
                          {selectedParcel.payment?.status === 'SUCCESS' ? 'Disbursed' : (selectedParcel.payment?.status || 'Pending')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                      onClick={() => navigate(`/government/compensation`)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        backgroundColor: 'var(--primary)',
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
                      <CreditCard size={14} /> Open Compensation File
                    </button>
                    <button
                      onClick={() => navigate(`/government/verification`)}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#f1f5f9',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ) : (
                <div className="surface-card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  <MapPin size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>Click any parcel polygon on the map or select from the corridor strip below.</p>
                </div>
              )}
            </>
          )}

          {/* TAB 2: LAND & ENVIRONMENTAL CONSTRAINTS REPORT */}
          {activeRightTab === 'CONSTRAINTS' && (
            <div className="surface-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '700px', overflowY: 'auto' }}>
              
              {/* Constraints Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Project Decision Support Report
                  </span>
                  {constraintsReport && renderRiskBadge(constraintsReport.overall_risk_level)}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0a2540' }}>
                  {constraintsReport?.project_name || "Mumbai–Pune Expressway Expansion Project (Phase III)"}
                </h3>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Total Alignment Corridor Area: <strong>{constraintsReport?.total_corridor_area_ha || 38.5} Ha</strong>
                </div>
              </div>

              {/* Disclaimer Notice */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '11px',
                color: '#475569',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px'
              }}>
                <Info size={14} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>
                  <strong>Demo/Mock Layer Notice:</strong> GIS zoning layers are simulated demo data for decision support and ready for authoritative state NIC/MoEFCC gateway integration.
                </span>
              </div>

              {/* Intersecting Sensitive Zones List */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '8px' }}>
                  Detected Zone Intersections ({constraintsReport?.intersections.length || 0}):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {constraintsReport?.intersections.map((inter) => (
                    <div
                      key={inter.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderLeft: `4px solid ${inter.color_hex || '#15803d'}`,
                        borderRadius: '6px',
                        padding: '10px 12px',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div>
                          <span style={{
                            backgroundColor: inter.color_hex || '#15803d',
                            color: '#ffffff',
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px'
                          }}>
                            {inter.zone_type}
                          </span>
                          <h4 style={{ margin: '3px 0 0 0', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                            {inter.zone_name}
                          </h4>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {renderRiskBadge(inter.risk_level)}
                          <div style={{ marginTop: '3px' }}>{renderStatusBadge(inter.review_status)}</div>
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', margin: '6px 0' }}>
                        <div>Overlap Area: <strong>{inter.intersection_area_ha} Ha</strong></div>
                        <div>Corridor %: <strong>{inter.percentage_affected}%</strong></div>
                        <div style={{ gridColumn: 'span 2' }}>Authority: {inter.authority}</div>
                        {inter.clearance_reference_no && (
                          <div style={{ gridColumn: 'span 2', color: '#166534', fontWeight: 600 }}>
                            Ref No: {inter.clearance_reference_no}
                          </div>
                        )}
                      </div>

                      {inter.remarks && (
                        <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', backgroundColor: '#f8fafc', padding: '4px 6px', borderRadius: '4px', marginBottom: '6px' }}>
                          "{inter.remarks}"
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenClearanceModal(inter)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#0a2540',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FileCheck size={12} /> Update Clearance Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statutory Recommendations */}
              {constraintsReport && constraintsReport.recommendations.length > 0 && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '12px'
                }}>
                  <div style={{ fontWeight: 700, color: '#166534', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={15} /> Statutory Compliance Guidance:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#14532d', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {constraintsReport.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Modal: Update Statutory Clearance / Record NOC ── */}
      {clearanceModalOpen && activeClearanceIntersection && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            width: '480px',
            maxWidth: '90vw',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0a2540' }}>
                Statutory Clearance Review
              </h3>
              <button
                onClick={() => setClearanceModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px' }}>
              Recording statutory review for <strong>{activeClearanceIntersection.zone_name}</strong> ({activeClearanceIntersection.intersection_area_ha} Ha affected).
            </div>

            <form onSubmit={handleSubmitClearance}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '4px' }}>
                  Clearance Status *
                </label>
                <select
                  value={clearanceFormStatus}
                  onChange={(e) => setClearanceFormStatus(e.target.value as ClearanceReviewStatus)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Site Inspection / Scrutiny in Progress)</option>
                  <option value="CONDITIONAL_CLEARANCE">CONDITIONAL_CLEARANCE (In-principle / CA Deposit Req)</option>
                  <option value="CLEARED">CLEARED (Full Statutory NOC / Stage-II Granted)</option>
                  <option value="REJECTED">REJECTED (Alignment Deviation Required)</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '4px' }}>
                  Clearance / NOC Reference Number
                </label>
                <input
                  type="text"
                  value={clearanceFormRef}
                  onChange={(e) => setClearanceFormRef(e.target.value)}
                  placeholder="e.g. FC-MH-2026-9912 / PMRDA-TREE-NOC-44"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0a2540', marginBottom: '4px' }}>
                  Official Remarks / Statutory Conditions
                </label>
                <textarea
                  value={clearanceFormRemarks}
                  onChange={(e) => setClearanceFormRemarks(e.target.value)}
                  placeholder="Record conditions, joint inspection findings, or compensatory requirements..."
                  rows={3}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setClearanceModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clearanceSubmitting}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#0a2540', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                >
                  {clearanceSubmitting ? 'Saving…' : 'Record Clearance Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GISExplorer;
