import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--surface-container-lowest)',
      borderTop: '1px solid var(--outline-variant)',
      padding: 'var(--space-2xl) var(--space-xl) var(--space-lg)',
      marginTop: 'auto'
    }}>
      <div className="desktop-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ gridColumn: 'span 3' }}>
          <h2 className="headline-md" style={{ color: 'var(--on-surface)', marginBottom: 'var(--space-xs)' }}>
            भूमि सेतु | BhoomiSetu
          </h2>
          <p className="body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-md)' }}>
            Apex State Infrastructure for Statutory RFCTLARR, 2013 Land Acquisition and Direct Benefit Transfers.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <span style={{ backgroundColor: 'var(--secondary-container)', color: 'var(--on-secondary-container)', padding: '2px 8px', borderRadius: 'var(--radius)', fontSize: '11px', fontWeight: 600 }}>MeghRaj NIC Cloud</span>
            <span style={{ backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)', padding: '2px 8px', borderRadius: 'var(--radius)', fontSize: '11px', fontWeight: 600 }}>ISO 27001</span>
          </div>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          <h3 className="label-md" style={{ color: 'var(--primary-container)', marginBottom: 'var(--space-sm)' }}>Statutory Sections</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <li><a href="#" className="body-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Section 11 Preliminary Notification</a></li>
            <li><a href="#" className="body-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Section 19 Statutory Declaration</a></li>
            <li><a href="#" className="body-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Section 23 & 30 Land Award Valuation</a></li>
            <li><a href="#" className="body-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>PFMS & Direct Benefit Transfer (DBT)</a></li>
          </ul>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          <h3 className="label-md" style={{ color: 'var(--primary-container)', marginBottom: 'var(--space-sm)' }}>Governance Links</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <li><a href="#" className="body-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Ministry of Road Transport & Highways</a></li>
            <li><a href="#" className="body-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Ministry of Rural Development</a></li>
            <li><a href="#" className="body-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Digital India Land Records (DILRMP)</a></li>
            <li><a href="#" className="body-sm" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none' }}>Smart India Hackathon Initiative</a></li>
          </ul>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          <h3 className="label-md" style={{ color: 'var(--primary-container)', marginBottom: 'var(--space-sm)' }}>Security & Legal Audit</h3>
          <p className="body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-sm)' }}>
            Audited by CERT-In empaneled agency. Compliance under Sections 43 & 66 of the Information Technology Act 2000.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
             <span className="label-sm" style={{ color: 'var(--outline)' }}>STQC Validated</span>
             <span style={{ color: 'var(--outline-variant)' }}>•</span>
             <span className="label-sm" style={{ color: 'var(--outline)' }}>NIC GovStack v4.2</span>
          </div>
        </div>
      </div>

      <div style={{ 
        borderTop: '1px solid var(--surface-container-high)', 
        paddingTop: 'var(--space-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-md)'
      }}>
        <p className="label-sm" style={{ color: 'var(--outline)', margin: 0 }}>
          © 2026 National Informatics Centre (NIC), Government of India. All Rights Reserved.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <a href="#" className="label-sm" style={{ color: 'var(--outline)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" className="label-sm" style={{ color: 'var(--outline)', textDecoration: 'none' }}>Terms of Statutory Service</a>
          <a href="#" className="label-sm" style={{ color: 'var(--outline)', textDecoration: 'none' }}>Hyperlinking Policy</a>
          <a href="#" className="label-sm" style={{ color: 'var(--outline)', textDecoration: 'none' }}>Accessibility Statement</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
