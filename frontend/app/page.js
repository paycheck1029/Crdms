'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/config';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  MapPin, 
  FileSpreadsheet, 
  Activity,
  Award,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { token, hasRole, logout } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Reports
        const reportsRes = await fetch(`${API_URL}/reports`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (reportsRes.status === 401 || reportsRes.status === 403) {
          logout();
          return;
        }
        
        if (!reportsRes.ok) {
          throw new Error('Failed to fetch dashboard reports');
        }
        
        const reportsJson = await reportsRes.json();
        setReportData(reportsJson);

        // Fetch logs if Admin or IT Team
        if (hasRole(['Admin', 'IT Team'])) {
          const logsRes = await fetch(`${API_URL}/logs`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (logsRes.status === 401 || logsRes.status === 403) {
            logout();
            return;
          }
          if (logsRes.ok) {
            const logsJson = await logsRes.ok ? await logsRes.json() : [];
            setLogs(logsJson.slice(0, 5)); // Keep latest 5
          }
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'An error occurred fetching dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading analytical metrics...</p>
      </div>
    );
  }

  // Fallbacks if data empty
  const totalCandidates = reportData?.experienceStats?.totalCandidates || 0;
  const statusCounts = reportData?.statusCounts || [];
  const locationCounts = reportData?.locationCounts || [];
  const topSkills = reportData?.topSkills || [];
  const avgExp = reportData?.experienceStats?.avgExperience || 0;

  // Extract counts for KPIs
  const getCount = (status) => {
    const found = statusCounts.find(s => s.status.toLowerCase() === status.toLowerCase());
    return found ? found.count : 0;
  };

  const screeningCount = getCount('Screening');
  const interviewingCount = getCount('Interviewing');
  const offeredCount = getCount('Offered');
  const hiredCount = getCount('Hired');

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

      {/* KPI Tiles */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Total Database</h3>
            <div className="kpi-val">{totalCandidates}</div>
          </div>
          <div className="kpi-icon-wrapper kpi-cyan">
            <Users size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Screening & Interview</h3>
            <div className="kpi-val">{screeningCount + interviewingCount}</div>
          </div>
          <div className="kpi-icon-wrapper kpi-purple">
            <Calendar size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Offers Out</h3>
            <div className="kpi-val">{offeredCount}</div>
          </div>
          <div className="kpi-icon-wrapper kpi-emerald">
            <Award size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-details">
            <h3>Total Hired</h3>
            <div className="kpi-val">{hiredCount}</div>
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
                {statusCounts.map((s) => {
                  const percent = totalCandidates > 0 ? (s.count / totalCandidates) * 100 : 0;
                  
                  // Pick colors based on status
                  let colorClass = 'badge-applied';
                  if (s.status === 'Screening') colorClass = 'badge-screening';
                  if (s.status === 'Interviewing') colorClass = 'badge-interviewing';
                  if (s.status === 'Offered') colorClass = 'badge-offered';
                  if (s.status === 'Hired') colorClass = 'badge-hired';
                  if (s.status === 'Rejected') colorClass = 'badge-rejected';

                  return (
                    <div key={s.status}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                        <span className={`badge ${colorClass}`}>{s.status}</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {s.count} candidates ({Math.round(percent)}%)
                        </span>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${percent}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, var(--accent) 0%, #689916 100%)',
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
                      <span style={{ fontWeight: '600', color: 'var(--accent-cyan)' }}>{loc.count} profiles</span>
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
                        background: 'rgba(255, 255, 255, 0.03)', 
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {skill.name} <strong style={{ color: 'var(--accent-purple)' }}>({skill.count})</strong>
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

          {/* Recent Audits (Admin & IT Only) */}
          <div className="glass-card" style={{ flexGrow: 1 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} className="kpi-rose" />
              <span>System Audit Logs</span>
            </h2>
            
            {!hasRole(['Admin', 'IT Team']) ? (
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
                    borderBottom: '1px solid var(--border-glass)', 
                    paddingBottom: '0.75rem',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <strong style={{ color: 'var(--accent-cyan)' }}>@{log.username}</strong>
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
