import React from 'react';
import { ShieldCheck, Scale, MapPin, Landmark, FileCheck, Layers, Cpu, Users } from 'lucide-react';

const About = () => {
  return (
    <div style={{ padding: 'var(--space-2xl) var(--space-xl)', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        backgroundColor: 'var(--primary-container)',
        color: 'var(--on-primary)',
        padding: 'var(--space-2xl)',
        borderRadius: 'var(--radius-xl)',
        marginBottom: 'var(--space-2xl)',
        boxShadow: '0 4px 6px -1px rgba(10,37,64,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" style={{ height: '48px', filter: 'brightness(0) invert(1)' }} />
          <div>
            <span className="label-sm" style={{ color: 'var(--primary-fixed)', letterSpacing: '0.08em' }}>MINISTRY OF RURAL DEVELOPMENT & NATIONAL HIGHWAYS AUTHORITY</span>
            <h1 className="headline-2xl" style={{ margin: '4px 0 0 0', color: 'white' }}>BhoomiSetu (भूमि सेतु)</h1>
          </div>
        </div>
        <p className="body-lg" style={{ maxWidth: '880px', color: 'var(--surface-dim)', lineHeight: '1.6' }}>
          An integrated sovereign civic platform engineered for deterministic land acquisition workflows, transparent Direct Benefit Transfer (PFMS) disbursements, AI-assisted cadastral document validation, and GIS-synchronized spatial tracking under the RFCTLARR Act, 2013.
        </p>
      </div>

      {/* Key Architectural Pillars */}
      <h2 className="headline-xl" style={{ color: 'var(--on-surface)', marginBottom: 'var(--space-lg)' }}>Core System Pillars & Scope</h2>
      <div className="desktop-grid" style={{ marginBottom: 'var(--space-2xl)', gap: 'var(--space-lg)' }}>
        {[
          {
            icon: <Scale size={28} color="var(--primary)" />,
            title: "RFCTLARR Act Compliance",
            desc: "Automates deterministic statutory deadlines across Section 11 (Preliminary Notification), Section 15 (Objection Hearing), Section 19 (Declaration), and Section 23/30 (Final Awards & Solatium)."
          },
          {
            icon: <Layers size={28} color="var(--secondary)" />,
            title: "Cadastral GIS Geofencing",
            desc: "Vectorized Khasra & Survey plot boundaries synced with high-resolution satellite imagery, preventing overlapping acquisition claims and encroachment discrepancies."
          },
          {
            icon: <Cpu size={28} color="var(--tertiary-container)" />,
            title: "AI OCR Document Extraction",
            desc: "Automated vision-based extraction of landowner identities, Mauza records, and mutation entries from Form 7/12, Jamabandi, and regional Revenue Records."
          },
          {
            icon: <Landmark size={28} color="var(--secondary)" />,
            title: "Direct Benefit Transfer (PFMS)",
            desc: "Direct escrow disbursement connected to Aadhaar and PFMS gateway, ensuring solatium and rehabilitation funds reach certified land owners with zero leakage."
          },
          {
            icon: <FileCheck size={28} color="var(--primary)" />,
            title: "Auditability & Immutability",
            desc: "Tamper-evident audit trail for every revenue official determination, collector declaration, and mutation certificate issuance."
          },
          {
            icon: <Users size={28} color="var(--outline)" />,
            title: "Rehabilitation & Resettlement (R&R)",
            desc: "Integrated family tracking modules compliant with Schedules II & III to safeguard affected agricultural and forest communities."
          }
        ].map((pillar, idx) => (
          <div key={idx} className="surface-card" style={{ gridColumn: 'span 4', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div style={{ marginBottom: 'var(--space-xs)' }}>{pillar.icon}</div>
            <h3 className="headline-md" style={{ color: 'var(--on-surface)', margin: 0 }}>{pillar.title}</h3>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)', margin: 0, lineHeight: '1.5' }}>{pillar.desc}</p>
          </div>
        ))}
      </div>

      {/* Statutory Timeline Map */}
      <div className="surface-card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
        <h3 className="headline-lg" style={{ color: 'var(--on-surface)', marginBottom: 'var(--space-sm)' }}>Statutory Milestone Timeline (RFCTLARR 2013)</h3>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-xl)' }}>
          Statutory timelines enforced programmatically by BhoomiSetu to eliminate bureaucratic lapses and multi-year litigations:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
          {[
            { step: "01", section: "Section 11(1)", title: "Preliminary Notification", limit: "Public Gazette + 60-day objection window" },
            { step: "02", section: "Section 15(2)", title: "Objection & Hearing", limit: "District Collector determination within statutory notice" },
            { step: "03", section: "Section 19(1)", title: "Final Declaration", limit: "Strict 12-month limit from §11 notification" },
            { step: "04", section: "Section 23 & 30", title: "Award & Solatium", limit: "100% Solatium + Direct DBT Transfer" }
          ].map((item, i) => (
            <div key={i} style={{ borderLeft: '3px solid var(--secondary)', paddingLeft: 'var(--space-md)' }}>
              <span className="label-sm" style={{ color: 'var(--secondary)', fontWeight: 700 }}>STAGE {item.step} • {item.section}</span>
              <h4 className="headline-sm" style={{ margin: '4px 0', color: 'var(--on-surface)' }}>{item.title}</h4>
              <p className="body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>{item.limit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
