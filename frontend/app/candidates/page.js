'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import candidateService from '@/services/candidateService';
import TimelineWidget from '@/components/TimelineWidget';
import ModalWrapper from '@/components/ModalWrapper';
import { API_URL } from '@/config';
import { STATUS_STYLE_MAP } from '@/utils/constants';
import { getInitials, getAvatarColor, formatCurrency, formatNoticePeriod } from '@/utils/helpers';
import { 
  Search, 
  Trash2, 
  Eye, 
  Edit3, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FolderLock
} from 'lucide-react';

const LinkedInIcon = ({ size = 14 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const PAGE_SIZE = 10;

export default function CandidatesDirectoryPage() {
  const { token, hasRole, logout } = useAuth();
  
  // Talent Pool list & count states
  const [candidates, setCandidates] = useState([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewDeleted, setViewDeleted] = useState(false); // Recycle bin toggle

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [minExp, setMinExp] = useState('');
  const [maxExp, setMaxExp] = useState('');
  const [skills, setSkills] = useState('');
  
  // Advanced filters toggle & states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sorting
  const [sortField, setSortField] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Preview Modal details state
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // Excel File Upload State
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [importError, setImportError] = useState('');

  // Action alerts
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setActionError('');
      setActionSuccess('');

      const params = {
        page: currentPage,
        limit: PAGE_SIZE,
        sort: sortField,
        order: sortOrder,
        search,
        status,
        location,
        minExp,
        maxExp,
        skills,
        name,
        email,
        phone,
        company,
        dateFrom,
        dateTo
      };

      let res;
      if (viewDeleted) {
        res = await candidateService.getRecycleBin(params);
      } else {
        res = await candidateService.getCandidates(params);
      }

      setCandidates(res.data.candidates);
      setTotalCandidates(res.data.pagination.total);
    } catch (err) {
      if (err.message === 'Session expired') {
        logout();
      } else {
        setActionError(err.message || 'Failed to fetch candidate directory');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [currentPage, viewDeleted, sortField, sortOrder, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCandidates();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setLocation('');
    setMinExp('');
    setMaxExp('');
    setSkills('');
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    // Trigger list fetch
    setTimeout(() => fetchCandidates(), 50);
  };

  // Sorting Handler
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortField(field);
    setSortOrder(isAsc ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  // Open candidate details preview modal
  const handleViewCandidate = async (candidateId) => {
    try {
      const res = await candidateService.getCandidate(candidateId, viewDeleted);
      setSelectedCandidate(res.data);
    } catch (err) {
      alert(`Error loading candidate profile: ${err.message}`);
    }
  };

  // Soft Delete candidate
  const handleSoftDelete = async (candidateId, name) => {
    if (!confirm(`Move "${name}" to the Recycle Bin?`)) return;
    try {
      await candidateService.softDeleteCandidate(candidateId);
      setActionSuccess(`Candidate "${name}" moved to Recycle Bin.`);
      fetchCandidates();
    } catch (err) {
      setActionError(err.message || 'Soft delete failed.');
    }
  };

  // Restore candidate from Recycle Bin
  const handleRestore = async (candidateId, name) => {
    try {
      await candidateService.restoreCandidate(candidateId);
      setActionSuccess(`Candidate "${name}" successfully restored.`);
      fetchCandidates();
    } catch (err) {
      setActionError(err.message || 'Restore failed.');
    }
  };

  // Hard Delete candidate permanently
  const handleHardDelete = async (candidateId, name) => {
    if (!confirm(`PERMANENT ACTION!\nAre you sure you want to permanently delete candidate "${name}"? This will delete all associated resumes and timeline logs. This action CANNOT be undone.`)) return;
    try {
      await candidateService.hardDeleteCandidate(candidateId);
      setActionSuccess(`Candidate "${name}" permanently deleted.`);
      fetchCandidates();
    } catch (err) {
      setActionError(err.message || 'Permanent deletion failed.');
    }
  };

  // Excel Import Handler
  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportSummary(null);
    setImportError('');

    try {
      const res = await candidateService.importCandidates(file);
      setImportSummary(res.data);
      fetchCandidates();
    } catch (err) {
      setImportError(err.message || 'Failed to process Excel sheet.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Pagination Render helpers
  const totalPages = Math.ceil(totalCandidates / PAGE_SIZE);

  return (
    <div>
      {/* Title Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">{viewDeleted ? 'Recycle Bin / Soft Deleted' : 'Candidate Talent Pool'}</h1>
          <p className="page-subtitle">
            {viewDeleted 
              ? 'Restore candidate profiles or permanently delete them from the database.' 
              : 'Browse, search, import sheets, and manage candidates in your recruitment pipelines.'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {/* Recycle Bin toggle */}
          {hasRole(['Admin', 'HR Manager']) && (
            <button
              onClick={() => { setViewDeleted(!viewDeleted); setCurrentPage(1); }}
              className={`btn ${viewDeleted ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FolderLock size={16} />
              <span>{viewDeleted ? 'View Active Pool' : 'Recycle Bin'}</span>
            </button>
          )}

          {!viewDeleted && hasRole(['Admin', 'HR Manager', 'Recruiter']) && (
            <>
              {/* Import Excel */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportExcel} 
                accept=".xlsx, .xls" 
                style={{ display: 'none' }} 
              />
              <button 
                className="btn btn-secondary" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={importing}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Upload size={16} />
                <span>{importing ? 'Importing...' : 'Import sheet'}</span>
              </button>

              {/* Add Candidate */}
              <Link href="/candidates/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} />
                <span>Add Candidate</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Action notifications */}
      {actionError && (
        <div style={{ 
          background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
          borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--danger)', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem'
        }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div style={{ 
          background: 'var(--success-dim)', border: '1px solid var(--success-border)',
          borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--success)', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Search and Filters container */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search term */}
            <div style={{ position: 'relative', flexGrow: 1, minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search name, email, phone, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            {/* Status filter */}
            <select
              className="form-input"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); }}
              style={{ width: '150px', appearance: 'none' }}
            >
              <option value="">Status: All</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offered">Offered</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
              <option value="Selected">Selected</option>
              <option value="Joining">Joining</option>
              <option value="Pending">Pending</option>
            </select>

            {/* Location filter */}
            <input 
              type="text" 
              className="form-input" 
              placeholder="Loc: e.g. Mumbai" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '130px' }}
            />

            {/* Experience Bounds */}
            <input 
              type="number" 
              step="0.5" 
              className="form-input" 
              placeholder="Min Exp" 
              value={minExp}
              onChange={(e) => setMinExp(e.target.value)}
              style={{ width: '90px' }}
            />
            <input 
              type="number" 
              step="0.5" 
              className="form-input" 
              placeholder="Max Exp" 
              value={maxExp}
              onChange={(e) => setMaxExp(e.target.value)}
              style={{ width: '90px' }}
            />

            {/* Skills */}
            <input 
              type="text" 
              className="form-input" 
              placeholder="Skills: e.g. React, Node" 
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              style={{ width: '160px' }}
            />

            <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 1rem' }}>
              Search
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleClearFilters} style={{ padding: '0.45rem 1rem' }}>
              Clear
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowAdvanced(!showAdvanced)} 
              style={{ padding: '0.45rem 1rem' }}
            >
              {showAdvanced ? 'Hide Advanced' : 'Advanced Filters'}
            </button>
          </div>

          {/* Advanced Search Panel (Phase 6 - Advanced Search) */}
          {showAdvanced && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Filter by Name</label>
                <input type="text" className="form-input" placeholder="e.g. John" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Filter by Email</label>
                <input type="text" className="form-input" placeholder="e.g. gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Filter by Phone</label>
                <input type="text" className="form-input" placeholder="e.g. +91" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Filter by Company</label>
                <input type="text" className="form-input" placeholder="e.g. Infosys" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Added Date From</label>
                <input type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Added Date To</label>
                <input type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Directory Table list */}
      <div className="glass-card" style={{ padding: '0.5rem 1.25rem 1.25rem 1.25rem' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>Retrieving candidate database roster...</p>
        ) : candidates.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>No matching candidates found.</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th className="sortable-header" onClick={() => handleSort('name')}>
                      Name {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>LinkedIn</th>
                    <th>Location</th>
                    <th>Pref. Location</th>
                    <th>Experience</th>
                    <th>Company</th>
                    <th>Current CTC</th>
                    <th>Expected CTC</th>
                    <th>Status</th>
                    <th>Notice Period</th>
                    <th>Skills Inventory</th>
                    <th>Remarks</th>
                    <th>Comment</th>
                    <th style={{ textAlign: 'right', width: '130px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, index) => {
                    const rowNum = (currentPage - 1) * PAGE_SIZE + index + 1;
                    const badgeStyle = STATUS_STYLE_MAP[c.status] || { bg: '#e5e7eb', color: '#1f2937' };

                    return (
                      <tr key={c.id}>
                        <td style={{ color: 'var(--text-muted)' }}>#{rowNum}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              background: getAvatarColor(c.name).bg,
                              border: getAvatarColor(c.name).border,
                              color: getAvatarColor(c.name).fg,
                              width: '28px', height: '28px', borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: '700', fontSize: '0.75rem'
                            }}>
                              {getInitials(c.name)}
                            </div>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{c.name}</div>
                          </div>
                        </td>
                        <td>
                          {c.email ? (
                            <a href={`mailto:${c.email}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{c.email}</a>
                          ) : 'N/A'}
                        </td>
                        <td>{c.phone || 'N/A'}</td>
                        <td>
                          {c.linkedin_url ? (
                            <a 
                              href={c.linkedin_url.startsWith('http') ? c.linkedin_url : `https://${c.linkedin_url}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                            >
                              <LinkedInIcon size={12} /> Profile
                            </a>
                          ) : 'N/A'}
                        </td>
                        <td>{c.location}</td>
                        <td>{c.preferred_location || 'N/A'}</td>
                        <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>{c.experience_years} Years</td>
                        <td>{c.company || 'N/A'}</td>
                        <td>{formatCurrency(c.current_ctc)}</td>
                        <td>{formatCurrency(c.expected_ctc)}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            background: badgeStyle.bg,
                            border: badgeStyle.border,
                            color: badgeStyle.color
                          }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatNoticePeriod(c.notice_period_days)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', maxWidth: '200px' }}>
                            {c.skills.split(',').slice(0, 3).map(s => (
                              <span key={s} className="skill-badge">
                                {s.trim().toUpperCase()}
                              </span>
                            ))}
                            {c.skills.split(',').length > 3 && (
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                +{c.skills.split(',').length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span title={c.remarks} style={{ display: 'inline-block', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {c.remarks || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span title={c.comment} style={{ display: 'inline-block', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {c.comment || 'N/A'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            {/* Preview */}
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem 0.6rem' }} 
                              onClick={() => handleViewCandidate(c.id)}
                              title="Preview Profile Details"
                            >
                              <Eye size={14} />
                            </button>

                            {viewDeleted ? (
                              <>
                                {/* Restore */}
                                {hasRole(['Admin', 'HR Manager']) && (
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.4rem 0.6rem', color: 'var(--success)' }} 
                                    onClick={() => handleRestore(c.id, c.name)}
                                    title="Restore Candidate"
                                  >
                                    <RefreshCw size={14} />
                                  </button>
                                )}
                                {/* Hard Delete */}
                                {hasRole(['Admin']) && (
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.4rem 0.6rem', color: 'var(--danger)' }} 
                                    onClick={() => handleHardDelete(c.id, c.name)}
                                    title="Permanently Delete Candidate"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                {/* Edit */}
                                {hasRole(['Admin', 'HR Manager', 'Recruiter', 'Data Entry']) && (
                                  <Link 
                                    href={`/candidates/new?edit=${c.id}`} 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.4rem 0.6rem' }}
                                    title="Edit Candidate Details"
                                  >
                                    <Edit3 size={14} />
                                  </Link>
                                )}
                                {/* Soft Delete */}
                                {hasRole(['Admin', 'HR Manager']) && (
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.4rem 0.6rem', color: 'var(--danger)' }} 
                                    onClick={() => handleSoftDelete(c.id, c.name)}
                                    title="Move to Recycle Bin"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCandidates)}–{Math.min(currentPage * PAGE_SIZE, totalCandidates)} of {totalCandidates} candidates
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span style={{ fontSize: '0.85rem', fontWeight: '700', padding: '0 0.5rem' }}>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Candidate Preview Modal (Phase 7 - Documents & Timeline Widget) */}
      <ModalWrapper
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      >
        {selectedCandidate && (
          <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '720px', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setSelectedCandidate(null)}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            {/* Profile Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                background: getAvatarColor(selectedCandidate.name).bg, 
                border: getAvatarColor(selectedCandidate.name).border,
                color: getAvatarColor(selectedCandidate.name).fg,
                width: '60px', height: '60px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '1.5rem'
              }}>
                {getInitials(selectedCandidate.name)}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>{selectedCandidate.name}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                  <span style={{
                    display: 'inline-flex', padding: '0.2rem 0.55rem', borderRadius: '4px',
                    fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
                    background: (STATUS_STYLE_MAP[selectedCandidate.status] || { bg: '#e5e7eb', color: '#1f2937' }).bg,
                    border: (STATUS_STYLE_MAP[selectedCandidate.status] || { bg: '#e5e7eb', color: '#1f2937' }).border,
                    color: (STATUS_STYLE_MAP[selectedCandidate.status] || { bg: '#e5e7eb', color: '#1f2937' }).color
                  }}>
                    {selectedCandidate.status}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <MapPin size={12} /> {selectedCandidate.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.5rem 0', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} style={{ color: 'var(--accent)' }} /> {selectedCandidate.email}
                  </span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} style={{ color: 'var(--accent)' }} /> {selectedCandidate.phone || 'N/A'}
                  </span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preferred Location</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedCandidate.preferred_location || 'N/A'}</span>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LinkedIn Profile</label>
                  {selectedCandidate.linkedin_url ? (
                    <a 
                      href={selectedCandidate.linkedin_url.startsWith('http') ? selectedCandidate.linkedin_url : `https://${selectedCandidate.linkedin_url}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.9rem', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                    >
                      <LinkedInIcon size={14} /> View LinkedIn Profile
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>N/A</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Experience & Current Employer</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Briefcase size={14} style={{ color: 'var(--accent)' }} /> {selectedCandidate.experience_years} Years at <strong>{selectedCandidate.company || 'N/A'}</strong>
                  </span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CTC Expectations</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Current: <strong>{formatCurrency(selectedCandidate.current_ctc)}</strong> / Expected: <strong>{formatCurrency(selectedCandidate.expected_ctc)}</strong>
                  </span>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notice Period</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {formatNoticePeriod(selectedCandidate.notice_period_days)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Remarks</label>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', background: 'var(--bg-surface-dim)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', minHeight: '40px', whiteSpace: 'pre-wrap' }}>
                  {selectedCandidate.remarks || 'N/A'}
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Comment</label>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', background: 'var(--bg-surface-dim)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', minHeight: '40px', whiteSpace: 'pre-wrap' }}>
                  {selectedCandidate.comment || 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Skills Inventory</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                {selectedCandidate.skills ? selectedCandidate.skills.split(',').map((skill) => (
                  <span key={skill} className="skill-badge">
                    {skill.trim().toUpperCase()}
                  </span>
                )) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>N/A</span>}
              </div>
            </div>

            {/* Split Documents & Timeline tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              
              {/* Documents tab */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Documents & Resumes</label>
                {selectedCandidate.documents && selectedCandidate.documents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedCandidate.documents.map((doc) => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-dim)', border: '1px solid var(--border)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</span>
                        {/* Direct Secure Download Link */}
                        <a 
                          href={`${API_URL}/uploads/download/${doc.id}?token=${token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px' }}
                        >
                          <Download size={12} />
                          <span>Get file</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>No resumes uploaded.</p>
                )}
              </div>

              {/* Timeline tab (Phase 7 - Timeline History widget) */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Candidate Tracking Timeline</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', pr: '0.5rem' }}>
                  <TimelineWidget timeline={selectedCandidate.timeline} />
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <button onClick={() => setSelectedCandidate(null)} className="btn btn-secondary" style={{ borderRadius: '6px' }}>Close</button>
              {!viewDeleted && hasRole(['Admin', 'HR Manager', 'Recruiter', 'Data Entry']) && (
                <Link href={`/candidates/new?edit=${selectedCandidate.id}`} className="btn btn-primary" style={{ borderRadius: '6px' }}>
                  <Edit3 size={16} />
                  <span>Edit Profile</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </ModalWrapper>

      {/* Import Loading Overlay */}
      <ModalWrapper
        isOpen={importing}
        onClose={() => {}}
        closeOnOutsideClick={false}
        closeOnEsc={false}
      >
        <div className="glass-card modal-content" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '360px' }}>
          <div className="spin-loader" />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '600' }}>Importing Candidates...</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Please wait while the Excel sheet data is parsed, validated, and imported.</p>
        </div>
      </ModalWrapper>

      {/* Import Summary Modal */}
      <ModalWrapper
        isOpen={!!importSummary}
        onClose={() => setImportSummary(null)}
      >
        {importSummary && (
          <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '480px', padding: '2rem', position: 'relative', textAlign: 'center' }}>
            <button 
              onClick={() => setImportSummary(null)}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
            <div style={{ 
              background: 'var(--success-dim)', border: '1px solid var(--success-border)',
              width: '56px', height: '56px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifycontent: 'center',
              color: 'var(--success)', margin: '0 auto 1.5rem auto', alignSelf: 'center',
              justifyContent: 'center'
            }}>
              <Download size={24} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Import Completed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              The Excel talent pool sheet has been processed successfully.
            </p>

            <div style={{ 
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', 
              background: 'var(--bg-surface-dim)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Rows</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{importSummary.total}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Imported</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent)' }}>{importSummary.imported}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duplicates Skipped</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)' }}>{importSummary.duplicates}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Invalid/Failed</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--danger)' }}>{importSummary.invalid}</div>
              </div>
            </div>

            <button onClick={() => setImportSummary(null)} className="btn btn-primary" style={{ width: '100%', borderRadius: '6px' }}>
              Done
            </button>
          </div>
        )}
      </ModalWrapper>

      {/* Import Error Modal */}
      <ModalWrapper
        isOpen={!!importError}
        onClose={() => setImportError('')}
      >
        {importError && (
          <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', textAlign: 'center' }}>
            <button 
              onClick={() => setImportError('')}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
            <div style={{ 
              background: 'var(--danger-dim)', border: '1px solid var(--danger-border)',
              width: '56px', height: '56px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--danger)', margin: '0 auto 1.5rem auto'
            }}>
              <X size={24} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--danger)' }}>Import Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {importError}
            </p>

            <button onClick={() => setImportError('')} className="btn" style={{ width: '100%', background: 'var(--danger)', borderColor: 'var(--danger)', color: '#ffffff', borderRadius: '6px' }}>
              Close
            </button>
          </div>
        )}
      </ModalWrapper>

    </div>
  );
}
