import React from 'react';
import { History, Shield, CheckCircle, XCircle, ArrowUpRight, PlusCircle, FileText } from 'lucide-react';
import type { AuditLogEntry } from '../../types/governmentVerification';

interface AuditHistoryTableProps {
  logs: AuditLogEntry[];
}

export const AuditHistoryTable: React.FC<AuditHistoryTableProps> = ({ logs }) => {
  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'VERIFIED':
        return (
          <span style={{
            backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <CheckCircle size={12} /> Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{
            backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <XCircle size={12} /> Rejected
          </span>
        );
      case 'STAGE_ADVANCED':
        return (
          <span style={{
            backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc',
            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <ArrowUpRight size={12} /> Stage Advanced
          </span>
        );
      case 'PAGE_ADDED':
        return (
          <span style={{
            backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <PlusCircle size={12} /> Page Added
          </span>
        );
      case 'CASE_CREATED':
      default:
        return (
          <span style={{
            backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}>
            <FileText size={12} /> Case Initiated
          </span>
        );
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--surface-container-lowest)',
      border: '1px solid var(--outline-variant)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      marginTop: 'var(--space-lg)',
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '2px solid var(--surface-container-high)',
        paddingBottom: 'var(--space-md)',
        marginBottom: 'var(--space-md)'
      }}>
        <History size={20} color="var(--primary-container)" />
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
            Verification History & Audit Log
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', margin: 0 }}>
            Sovereign Audit Trail of Statutory Review Actions
          </p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-container-low)', color: 'var(--primary)', borderBottom: '1px solid var(--outline-variant)' }}>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>Date & Time</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>Authority</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>Officer Name & ID</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>Action</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>Document</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--surface-container-high)' }}>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--on-surface-variant)' }}>
                    {log.timestamp}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--primary)' }}>
                    {log.authorityTitle}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{log.officerName}</div>
                    <div style={{ fontSize: '10px', color: 'var(--outline)' }}>{log.officerId}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {getActionBadge(log.action)}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--on-surface)' }}>
                    {log.documentTitle || '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--on-surface-variant)', maxWidth: '300px' }}>
                    {log.remarks}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--outline)' }}>
                  No audit log entries available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
