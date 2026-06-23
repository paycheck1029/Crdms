'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import reportService from '@/services/reportService';
import auditService from '@/services/auditService';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  MapPin, 
  Activity,
  Award,
  AlertCircle,
  TrendingUp,
  Briefcase
} from 'lucide-react';

export default function DashboardPage() {
  const { hasRole, logout } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Reports
      const reportsRes = await reportService.getReports();
      setReportData(reportsRes.data);

      // Fetch logs if Admin or HR Manager
      if (hasRole(['Admin', 'HR Manager', 'Recruiter'])) {
        const logsRes = await auditService.listLogs({ limit: 5 });
        setLogs(logsRes.data.logs);
      }
    } catch (err) {
      if (err.message === 'Session expired') {
        logout();
      } else {
        setError(err.message || 'An error occurred fetching dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading analytical metrics...</p>
      </div>
    );
  }

  // Fallbacks if data empty
  const kpis = reportData?.kpi || {
    totalCandidates: 0,
    todaysInterviews: 0,
    pending: 0,
    selected: 0,
    rejected: 0,
    offers: 0,
    joining: 0
  };

  const statusCounts = reportData?.statusCounts || [];
  const locationCounts = reportData?.locationCounts || [];
  const topSkills = reportData?.topSkills || [];
  const avgExp = reportData?.experienceStats?.avgExperience || 0;
  
  // Trends
  const monthlyTrends = reportData?.trends?.monthly || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Recruitment Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here is the overview of candidate funnels and system activities.</p>
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

      {/* KPI Tiles (Phase 8 - Expanded Dashboard Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        
        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Total Candidates</h3>
            <div className="kpi-val">{kpis.totalCandidates}</div>
          </div>
          <div className="kpi-icon-wrapper kpi-cyan">
            <Users size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Today's Interviews</h3>
            <div className="kpi-val">{kpis.todaysInterviews}</div>
          </div>
          <div className="kpi-icon-wrapper kpi-rose">
            <Calendar size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Pending Screening</h3>
            <div className="kpi-val">{kpis.pending}</div>
          </div>
          <div className="kpi-icon-wrapper kpi-purple">
            <Briefcase size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Selected / Offers</h3>
            <div className="kpi-val">{kpis.selected}</div>
          </div>
          <div className="kpi-icon-wrapper kpi-emerald">
            <Award size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Rejected</h3>
            <div className="kpi-val" style={{ color: 'var(--danger)' }}>{kpis.rejected}</div>
          </div>
          <div className="kpi-icon-wrapper kpi-rose" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Joining / Hired</h3>
            <div className="kpi-val">{kpis.joining}</div>
          </div>
          <div className="kpi-icon-wrapper kpi-blue">
            <UserCheck size={24} />
          </div>
        </div>

      </div>

      {/* Dashboard Analytics Grid */}
      <div className="dashboard-grid">
        {/* Left Panel: Funnel & Skills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Status Recruitment Funnel */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} className="kpi-purple" />
              <span>Recruitment Funnel Overview</span>
            </h2>
            
            {statusCounts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No candidate data available to construct funnel.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[...statusCounts]
                  .sort((a, b) => {
                    const FUNNEL_ORDER = ['Applied', 'Screening', 'Interviewing', 'Offered', 'Hired', 'Rejected', 'Selected', 'Joining', 'Pending'];
                    const idxA = FUNNEL_ORDER.indexOf(a.status);
                    const idxB = FUNNEL_ORDER.indexOf(b.status);
                    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
                  })
                  .map((s) => {
                    const percent = kpis.totalCandidates > 0 ? (s.count / kpis.totalCandidates) * 100 : 0;
                    const displayPercent = (percent > 0 && percent < 1) ? '< 1' : Math.round(percent);
                    
                    let colorClass = 'badge-applied';
                    if (s.status === 'Screening') colorClass = 'badge-screening';
                    if (s.status === 'Interviewing') colorClass = 'badge-interviewing';
                    if (s.status === 'Offered') colorClass = 'badge-offered';
                    if (s.status === 'Hired') colorClass = 'badge-hired';
                    if (s.status === 'Rejected') colorClass = 'badge-rejected';
                    if (s.status === 'Selected') colorClass = 'badge-offered';
                    if (s.status === 'Joining') colorClass = 'badge-interviewing';
                    if (s.status === 'Pending') colorClass = 'badge-screening';

                    return (
                      <div key={s.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                          <span className={`badge ${colorClass}`}>{s.status}</span>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {s.count} candidates ({displayPercent}%)
                          </span>
                        </div>
                        <div style={{ 
                          width: '100%', 
                          height: '8px', 
                          background: 'var(--bg-surface-dim)', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${percent}%`, 
                            minWidth: s.count > 0 ? '6px' : '0',
                            height: '100%', 
                            background: 'linear-gradient(90deg, var(--accent) 0%, var(--status-offered) 100%)',
                            borderRadius: '4px',
                            boxShadow: '0 0 10px var(--accent-glow)',
                            transition: 'width 1s ease-out'
                          }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Locations & Average Experience row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* Top Locations */}
            <div className="glass-card">
              <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} className="kpi-cyan" />
                <span>Geographic Spread</span>
              </h2>
              {locationCounts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No location details.</p>
              ) : (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {locationCounts.map((loc, idx) => (
                    <li key={loc.location} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{idx + 1}.</span> {loc.location}
                      </span>
                      <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{loc.count} profiles</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top Skills Tag Cloud */}
            <div className="glass-card">
              <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={18} className="kpi-emerald" />
                <span>Key Talent Skills</span>
              </h2>
              {topSkills.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills recorded.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {topSkills.map((skill) => (
                    <span 
                      key={skill.name} 
                      style={{ 
                        background: 'var(--bg-surface-dim)', 
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {skill.name} <strong style={{ color: 'var(--status-interviewing)' }}>({skill.count})</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Panel: Logs and Averages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Quick Metrics */}
          <div className="glass-card" style={{ background: 'var(--accent-gradient)', border: 'none', color: '#ffffff' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', opacity: 0.8, marginBottom: '0.5rem' }}>
              Database Depth
            </h3>
            <p style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>
              {avgExp} Years
            </p>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, lineHeight: '1.4' }}>
              Average professional work experience of candidate profiles in the database.
            </p>
          </div>

          {/* Monthly Registration Trends (Phase 8 - Dashboard Chart Data) */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} className="kpi-cyan" />
              <span>Talent Registration Trends</span>
            </h2>
            {monthlyTrends.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No registration history recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {monthlyTrends.map((trend) => {
                  const maxVal = Math.max(...monthlyTrends.map(t => t.count), 1);
                  const trendPercent = (trend.count / maxVal) * 100;
                  
                  return (
                    <div key={trend.period} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <span style={{ width: '60px', color: 'var(--text-secondary)' }}>{trend.period}</span>
                      <div style={{ flexGrow: 1, background: 'var(--bg-surface-dim)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${trendPercent}%`, background: 'var(--accent)', height: '100%', borderRadius: '6px' }} />
                      </div>
                      <span style={{ width: '30px', fontWeight: '700', textAlign: 'right', color: 'var(--text-primary)' }}>{trend.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Audits (Admin & HR Managers Only) */}
          <div className="glass-card" style={{ flexGrow: 1 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} className="kpi-rose" />
              <span>System Audit Logs</span>
            </h2>
            
            {!hasRole(['Admin', 'HR Manager', 'Recruiter']) ? (
              <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  Audit logs are restricted to IT Team and System Administrators.
                </p>
              </div>
            ) : logs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent events logged.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {logs.map((log) => (
                  <div key={log.id} style={{ 
                    borderBottom: '1px solid var(--border)', 
                    paddingBottom: '0.75rem',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <strong style={{ color: 'var(--accent)' }}>@{log.username || 'system'}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.1rem' }}>
                      {log.action}
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {log.details}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
