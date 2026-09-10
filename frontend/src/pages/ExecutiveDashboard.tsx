import React, { useState, useEffect } from 'react';
import { Download, Plus, AlertCircle, CheckCircle2, TrendingUp, Filter, MapPin, Building2, Calendar, LayoutGrid, Clock, FileText, Banknote, ShieldAlert, ArrowRight, RefreshCw, Bell } from 'lucide-react';
import { fetchKpis, fetchNotifications, type ProjectKpi, type NotificationItem } from '../services/api';

const ExecutiveDashboard = () => {
  const [kpis, setKpis] = useState<ProjectKpi>({
    active_projects: 142,
    active_trend: "+14 this quarter",
    acquired_hectares: 18421.0,
    verified_percent: 77.0,
    compensation_cr: 4892.0,
    disbursed_percent: 90.2,
    at_risk_projects: 7
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiData, notifData] = await Promise.all([
        fetchKpis(),
        fetchNotifications()
      ]);
      setKpis(kpiData);
      setNotifications(notifData);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div style={{ padding: 'var(--space-lg) var(--space-xl)', backgroundColor: 'var(--background)' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--secondary)' }}></div>
            <span className="label-sm" style={{ color: 'var(--secondary)' }}>Live Gateway</span>
          </div>
          <span style={{ color: 'var(--outline-variant)' }}>›</span>
          <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Punjab Jurisdiction</span>
          <span style={{ color: 'var(--outline-variant)' }}>›</span>
          <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Updated Today, {lastRefreshed}</span>
        </div>

        <button 
          onClick={loadDashboardData}
          disabled={loading}
          className="btn-secondary" 
          style={{ height: '30px', padding: '0 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} /> {loading ? 'Syncing...' : 'Sync Live Data'}
        </button>
      </div>

      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="headline-2xl" style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--on-surface)' }}>Executive Dashboard</h1>
          <p className="body-lg" style={{ margin: 0, color: 'var(--on-surface-variant)' }}>Real-time monitoring of land acquisition projects, compensation disbursements, and statutory timelines.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button 
            onClick={() => alert("Generating Statutory Report (PDF/Excel) for Punjab CALA divisions...")}
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
            <Download size={16} /> Export Report
          </button>
          <button 
            onClick={() => alert("Opening New Acquisition Wizard (Section 11 Gazette Proposal)...")}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
            <Plus size={16} /> New Acquisition
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="desktop-grid" style={{ margin: '0 0 var(--space-xl) 0' }}>
        <div style={{ gridColumn: 'span 3' }}>
          <label className="label-sm" style={{ display: 'block', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-xs)' }}>State</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '10px 12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface-container-lowest)' }}>
            <MapPin size={16} color="var(--outline)" />
            <span className="body-md" style={{ flex: 1, color: 'var(--on-surface)' }}>Punjab</span>
          </div>
        </div>
        <div style={{ gridColumn: 'span 3' }}>
          <label className="label-sm" style={{ display: 'block', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-xs)' }}>District</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '10px 12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface-container-lowest)' }}>
            <Building2 size={16} color="var(--outline)" />
            <span className="body-md" style={{ flex: 1, color: 'var(--on-surface)' }}>Ludhiana</span>
          </div>
        </div>
        <div style={{ gridColumn: 'span 3' }}>
          <label className="label-sm" style={{ display: 'block', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-xs)' }}>Period</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '10px 12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface-container-lowest)' }}>
            <Calendar size={16} color="var(--outline)" />
            <span className="body-md" style={{ flex: 1, color: 'var(--on-surface)' }}>FY 2024-25 (Q4)</span>
          </div>
        </div>
        <div style={{ gridColumn: 'span 3' }}>
          <label className="label-sm" style={{ display: 'block', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-xs)' }}>Status Filter</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '10px 12px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface-container-lowest)' }}>
            <Filter size={16} color="var(--outline)" />
            <span className="body-md" style={{ flex: 1, color: 'var(--on-surface)' }}>All Projects</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="desktop-grid" style={{ margin: '0 0 var(--space-xl) 0' }}>
        {/* KPI 1 */}
        <div className="surface-card" style={{ gridColumn: 'span 3', padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: 'var(--primary-container)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
            <h3 className="label-md" style={{ margin: 0, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Active Projects</h3>
            <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
              <LayoutGrid size={20} color="var(--primary-container)" />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '36px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-heading)' }}>{kpis.active_projects}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <TrendingUp size={16} color="var(--secondary)" />
            <span className="body-sm" style={{ color: 'var(--secondary)', fontWeight: 600 }}>{kpis.active_trend}</span>
            <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>98% on schedule</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="surface-card" style={{ gridColumn: 'span 3', padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: 'var(--secondary)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
            <h3 className="label-md" style={{ margin: 0, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Acquired Land</h3>
            <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
              <MapPin size={20} color="var(--primary-container)" />
            </div>
          </div>
          <div className="tabular-nums" style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
            <span style={{ fontSize: '36px', fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'var(--font-heading)' }}>{kpis.acquired_hectares.toLocaleString()}</span>
            <span className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Hectares</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
              <CheckCircle2 size={16} color="var(--secondary)" />
              <span className="body-sm" style={{ color: 'var(--secondary)', fontWeight: 600 }}>{kpis.verified_percent}% verified</span>
            </div>
            <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Digital records synced</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="surface-card" style={{ gridColumn: 'span 3', padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: 'var(--secondary)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
            <h3 className="label-md" style={{ margin: 0, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Compensation Paid</h3>
            <div style={{ backgroundColor: 'var(--secondary-container)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
              <Banknote size={20} color="var(--on-secondary-container)" />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '36px', fontWeight: 700, color: 'var(--secondary)', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-heading)' }}>₹{kpis.compensation_cr.toLocaleString()} Cr</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ backgroundColor: 'var(--secondary-container)', color: 'var(--on-secondary-container)', padding: '2px 6px', borderRadius: 'var(--radius)', fontSize: '12px', fontWeight: 600 }}>{kpis.disbursed_percent}% disbursed</span>
            <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Direct bank transfer</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="surface-card" style={{ gridColumn: 'span 3', padding: 'var(--space-lg)', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--error-container)', borderColor: 'rgba(186, 26, 26, 0.2)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: 'var(--error)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
            <h3 className="label-md" style={{ margin: 0, color: 'var(--error)', textTransform: 'uppercase' }}>At-Risk Deadlines</h3>
            <div style={{ backgroundColor: 'rgba(186, 26, 26, 0.1)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
              <ShieldAlert size={20} color="var(--error)" />
            </div>
          </div>
          <div className="tabular-nums" style={{ fontSize: '36px', fontWeight: 700, color: 'var(--error)', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-heading)' }}>{kpis.at_risk_projects} Projects</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span className="body-sm" style={{ color: 'var(--error)', fontWeight: 600 }}>Expiring within 45 days</span>
            <span className="body-sm" style={{ color: 'var(--error)' }}>Review required</span>
          </div>
        </div>
      </div>

      {/* Live Statutory Workflow Alerts */}
      <div className="surface-card" style={{ padding: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Bell size={18} color="var(--primary-container)" />
            <h3 className="headline-sm" style={{ margin: 0 }}>Statutory Alerts & Workflow Timeline Stream</h3>
          </div>
          <span className="label-sm" style={{ color: 'var(--outline)' }}>RFCTLARR Compliance Stream</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {notifications.map((n) => (
            <div 
              key={n.id} 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px var(--space-md)',
                borderRadius: 'var(--radius)',
                backgroundColor: n.level === 'HIGH_RISK' ? '#FEF2F2' : n.level === 'SUCCESS' ? '#EDF7EE' : 'var(--surface-container-lowest)',
                border: n.level === 'HIGH_RISK' ? '1px solid #FCA5A5' : n.level === 'SUCCESS' ? '1px solid #86EFAC' : '1px solid var(--outline-variant)'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                {n.level === 'HIGH_RISK' ? (
                  <ShieldAlert size={18} color="#B91C1C" />
                ) : n.level === 'SUCCESS' ? (
                  <CheckCircle2 size={18} color="#046A38" />
                ) : (
                  <FileText size={18} color="var(--primary-container)" />
                )}
                <div>
                  <p className="body-md" style={{ margin: 0, fontWeight: 600, color: n.level === 'HIGH_RISK' ? '#991B1B' : 'var(--on-surface)' }}>{n.message}</p>
                  <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Type: {n.type}</span>
                </div>
              </div>
              <span className="label-sm" style={{ color: 'var(--outline)', whiteSpace: 'nowrap' }}>{n.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
