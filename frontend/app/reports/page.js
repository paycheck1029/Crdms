'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/config';
import { 
  BarChart3, 
  MapPin, 
  Award, 
  TrendingUp, 
  Download, 
  Briefcase,
  AlertCircle
} from 'lucide-react';

export default function ReportsPage() {
  const { token, logout } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      if (!res.ok) throw new Error('Failed to load reports analytical data');
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  // Export to CSV Function
  const handleExportCSV = async () => {
    if (!token) return;
    try {
      setExporting(true);
      // Fetch all candidates
      const res = await fetch(`${API_URL}/candidates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch candidate list for CSV export');
      
      const candidates = await res.json();
      if (candidates.length === 0) {
        alert('No candidates available to export.');
        return;
      }

      // Define Headers
      const headers = [
        'ID', 'Name', 'Email', 'Phone', 'Location', 'Experience (Years)', 
        'Skills', 'Current Status', 'Current CTC', 'Expected CTC', 'Notice Period (Days)', 'Date Added'
      ];

      // Convert data to CSV format
      const csvRows = [];
      csvRows.push(headers.join(',')); // Add headers

      candidates.forEach(c => {
        const row = [
          c.id,
          `"${c.name.replace(/"/g, '""')}"`,
          `"${c.email.replace(/"/g, '""')}"`,
          `"${(c.phone || '').replace(/"/g, '""')}"`,
          `"${c.location.replace(/"/g, '""')}"`,
          c.experience_years,
          `"${c.skills.replace(/"/g, '""')}"`,
          `"${c.status}"`,
          c.current_ctc || '',
          c.expected_ctc || '',
          c.notice_period_days || '',
          `"${c.created_at}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Trigger browser download
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `crdms_candidate_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Compiling database analytics metrics...</p>
      </div>
    );
  }

  const statusCounts = reportData?.statusCounts || [];
  const locationCounts = reportData?.locationCounts || [];
  const topSkills = reportData?.topSkills || [];
  const expStats = reportData?.experienceStats || {};

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Recruitment Analytics & Reports</h1>
          <p className="page-subtitle">Aggregate data metrics and export capabilities for management review.</p>
        </div>
        <button 
          onClick={handleExportCSV} 
          className="btn btn-primary"
          disabled={exporting}
        >
          <Download size={16} />
          <span>{exporting ? 'Exporting...' : 'Export Candidate DB (CSV)'}</span>
        </button>
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px', 
          padding: '1rem', 
          color: 'var(--accent-rose)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Numerical Metrics Row */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Average Experience</h3>
            <div className="kpi-val">{expStats.avgExperience || 0} Years</div>
          </div>
          <div className="kpi-icon-wrapper kpi-cyan">
            <Briefcase size={20} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Minimum Experience</h3>
            <div className="kpi-val">{expStats.minExperience || 0} Years</div>
          </div>
          <div className="kpi-icon-wrapper kpi-purple">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Maximum Experience</h3>
            <div className="kpi-val">{expStats.maxExperience || 0} Years</div>
          </div>
          <div className="kpi-icon-wrapper kpi-emerald">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Total Database Size</h3>
            <div className="kpi-val">{expStats.totalCandidates || 0} Profiles</div>
          </div>
          <div className="kpi-icon-wrapper kpi-blue">
            <BarChart3 size={20} />
          </div>
        </div>
      </div>

      {/* Dynamic Breakdown Charts & Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Status Counts Breakdown */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} className="kpi-cyan" />
            <span>Funnels Status Metrics</span>
          </h2>
          
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status State</th>
                  <th>Quantity</th>
                  <th>Proportion</th>
                </tr>
              </thead>
              <tbody>
                {statusCounts.map(s => {
                  const percent = expStats.totalCandidates > 0 ? (s.count / expStats.totalCandidates) * 100 : 0;
                  return (
                    <tr key={s.status}>
                      <td style={{ fontWeight: '600' }}>
                        <span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span>
                      </td>
                      <td>{s.count} candidates</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '80px', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-gradient)' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{Math.round(percent)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Location Geographic Breakdowns */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} className="kpi-purple" />
            <span>Talent Acquisition Locations</span>
          </h2>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Location Name</th>
                  <th>Candidates Registered</th>
                  <th>Proportion</th>
                </tr>
              </thead>
              <tbody>
                {locationCounts.map(l => {
                  const percent = expStats.totalCandidates > 0 ? (l.count / expStats.totalCandidates) * 100 : 0;
                  return (
                    <tr key={l.location}>
                      <td style={{ fontWeight: '600' }}>{l.location}</td>
                      <td>{l.count} candidates</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '80px', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-gradient)' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{Math.round(percent)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Skills Popularity */}
        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} className="kpi-emerald" />
            <span>Aggregate Skills Inventory & Frequency</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {topSkills.map((skill, idx) => (
              <div 
                key={skill.name} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border-glass)',
                  padding: '1rem', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginRight: '0.25rem' }}>#{idx+1}</span>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{skill.name}</span>
                </div>
                <span style={{ background: 'var(--accent-gradient)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '700', color: '#ffffff' }}>
                  {skill.count} matching profiles
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
