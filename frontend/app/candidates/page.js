'use client';

import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ModalWrapper from '@/components/ModalWrapper';
import { API_URL } from '@/config';
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
  RotateCw,
  Download,
  ChevronUp,
  ChevronDown,
  Save,
  Upload,
  File,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

// ==========================================
// UTILITY HELPERS
// ==========================================

const STATUS_STYLE_MAP = {
  Applied: { bg: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.2)', color: '#60a5fa' },
  Screening: { bg: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', color: '#fbbf24' },
  Interview: { bg: 'rgba(192, 132, 252, 0.05)', border: '1px solid rgba(192, 132, 252, 0.2)', color: '#c084fc' },
  Interviewing: { bg: 'rgba(192, 132, 252, 0.05)', border: '1px solid rgba(192, 132, 252, 0.2)', color: '#c084fc' },
  Offered: { bg: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', color: 'var(--success)' }, // Aligned offered green badge
  Hired: { bg: 'var(--accent-dim)', border: '1px solid var(--accent-border-soft)', color: 'var(--status-hired)' },
  Rejected: { bg: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#f87171' }
};

const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = [
    { bg: 'rgba(96, 165, 250, 0.08)', border: '1px solid rgba(96, 165, 250, 0.15)', fg: '#60a5fa' },
    { bg: 'rgba(192, 132, 252, 0.08)', border: '1px solid rgba(192, 132, 252, 0.15)', fg: '#c084fc' },
    { bg: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.15)', fg: '#34d399' },
    { bg: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.15)', fg: '#fbbf24' },
    { bg: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.15)', fg: '#f87171' },
    { bg: 'rgba(245, 166, 35, 0.08)', border: '1px solid rgba(245, 166, 35, 0.15)', fg: '#F5A623' }
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'N/A';
  const normalized = dateStr.replace(' ', 'T');
  const date = new Date(normalized);
  if (isNaN(date.getTime())) {
    const fallbackDate = new Date(dateStr);
    if (isNaN(fallbackDate.getTime())) return dateStr;
    return formatRelative(fallbackDate);
  }
  return formatRelative(date);
};

const formatRelative = (date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffTimeHr = Math.floor(diffMin / 60);
  if (diffTimeHr < 24) return `${diffTimeHr}h ago`;
  const diffDays = Math.floor(diffTimeHr / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
};

// ==========================================
// MEMOIZED ROW COMPONENT
// ==========================================

const CandidateRow = memo(function CandidateRow({ c, index, hasRole, onView, onDelete, onSelect, isSelected }) {
  const handleView = () => {
    onView(c.id);
  };

  const handleDelete = () => {
    onDelete(c.id, c.name);
  };

  const handleSelect = (e) => {
    onSelect(c.id, e.target.checked);
  };

  const skillsArr = c.skills ? c.skills.split(',').map(s => s.trim()) : [];
  const visibleSkills = skillsArr.slice(0, 3);
  const extraCount = skillsArr.length - 3;
  const statusStyle = STATUS_STYLE_MAP[c.status] || STATUS_STYLE_MAP.Applied;
  const avatarStyle = getAvatarColor(c.name);
  const initials = getInitials(c.name);
  const formattedEmail = c.email ? c.email.toUpperCase() : '';

  // Pay formattings
  const formatPay = (val) => {
    if (val === undefined || val === null) return 'N/A';
    if (val >= 100000) {
      return (val / 100000) + ' Lakhs';
    }
    return val.toLocaleString();
  };

  // Notice Period Formatting
  const formatNotice = (val) => {
    if (val === undefined || val === null) return 'N/A';
    if (val === 0) return 'Immediate';
    if (val >= 30) {
      const mos = Math.round(val / 30);
      return `${mos} month${mos > 1 ? 's' : ''}`;
    }
    return `${val} days`;
  };

  return (
    <tr className="table-row-hover">
      <td style={{ width: '40px' }}>
        <input 
          type="checkbox" 
          className="custom-checkbox" 
          checked={isSelected}
          onChange={handleSelect}
        />
      </td>
      <td style={{ color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}>
        {index}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: '700',
            background: avatarStyle.bg,
            border: avatarStyle.border,
            color: avatarStyle.fg
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{c.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formattedEmail}</div>
          </div>
        </div>
      </td>
      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
        {c.location || 'N/A'}
      </td>
      <td style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
        {c.company || 'N/A'}
      </td>
      <td style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
        {c.experience_years} Yrs
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {c.linkedin_url ? (
          <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            Link
          </a>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>N/A</span>
        )}
      </td>
      <td>
        <span 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.68rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            background: statusStyle.bg,
            border: statusStyle.border,
            color: statusStyle.color
          }}
        >
          {c.status.toUpperCase()}
        </span>
      </td>
      <td style={{ color: 'var(--text-secondary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.remarks}>
        {c.remarks || 'N/A'}
      </td>
      <td style={{ color: 'var(--text-secondary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.comment}>
        {c.comment || 'N/A'}
      </td>
      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
        {c.phone || 'N/A'}
      </td>
      <td style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
        {formatPay(c.current_ctc)}
      </td>
      <td style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
        {formatPay(c.expected_ctc)}
      </td>
      <td>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', whiteSpace: 'nowrap' }}>
          {visibleSkills.map((s) => (
            <span key={s} className="skill-badge">
              {s.toUpperCase()}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="skill-badge-extra">
              +{extraCount}
            </span>
          )}
        </div>
      </td>
      <td style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
        {formatNotice(c.notice_period_days)}
      </td>
      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
        {c.preferred_location || 'N/A'}
      </td>
      <td>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleView}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            className="action-icon-btn"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          
          {hasRole(['Admin', 'Recruitment Team']) && (
            <Link
              href={`/candidates/new?edit=${c.id}`}
              style={{ display: 'inline-flex' }}
              className="action-icon-btn"
              title="Edit Candidate"
            >
              <Edit3 size={16} />
            </Link>
          )}

          {hasRole(['Admin']) && (
            <button
              onClick={handleDelete}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              className="action-icon-btn action-delete-btn"
              title="Delete Candidate"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// ==========================================
// MAIN CANDIDATES PAGE
// ==========================================

export default function CandidatesPage() {
  const { token, hasRole, logout } = useAuth();
  
  // Add Candidate Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState('personal'); // 'personal' | 'compensation' | 'resume'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [status, setStatus] = useState('Applied');
  const [currentCtc, setCurrentCtc] = useState('');
  const [expectedCtc, setExpectedCtc] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [company, setCompany] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [comment, setComment] = useState('');

  // Upload States
  const [resumeFile, setResumeFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form action status states
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const resetForm = () => {
    setActiveFormTab('personal');
    setName('');
    setEmail('');
    setPhone('');
    setSkills('');
    setLocation('');
    setExperienceYears('');
    setStatus('Applied');
    setCurrentCtc('');
    setExpectedCtc('');
    setNoticePeriod('');
    setCompany('');
    setLinkedinUrl('');
    setPreferredLocation('');
    setRemarks('');
    setComment('');
    setResumeFile(null);
    setIsDragActive(false);
    setUploadSuccess(false);
    setFormError('');
    setFormSuccess('');
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      resetForm();
    }
  }, [isAddModalOpen]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
      setUploadSuccess(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      setUploadSuccess(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!name || !email || !skills || !location || experienceYears === undefined || experienceYears === '') {
      setFormError('Please fill in all required fields.');
      return;
    }

    setFormLoading(true);

    try {
      const payload = {
        name,
        email,
        phone,
        skills,
        location,
        experience_years: parseFloat(experienceYears),
        status,
        current_ctc: currentCtc ? parseFloat(currentCtc) : null,
        expected_ctc: expectedCtc ? parseFloat(expectedCtc) : null,
        notice_period_days: noticePeriod ? parseInt(noticePeriod) : null,
        company,
        linkedin_url: linkedinUrl,
        preferred_location: preferredLocation,
        remarks,
        comment
      };

      const response = await fetch(`${API_URL}/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit candidate profile');
      }

      const activeCandidateId = data.id;

      // Handle resume file upload if selected
      if (resumeFile && !uploadSuccess) {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        formData.append('candidate_id', activeCandidateId);

        const uploadRes = await fetch(`${API_URL}/uploads`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (uploadRes.status === 401 || uploadRes.status === 403) {
          logout();
          return;
        }

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json();
          throw new Error(`Profile saved, but upload failed: ${uploadData.error || 'Upload error'}`);
        }
        setUploadSuccess(true);
      }

      setFormSuccess('Candidate profile successfully created!');
      
      // Dynamic refresh
      fetchCandidates();

      // Close modal after delay
      setTimeout(() => {
        setIsAddModalOpen(false);
      }, 1500);

    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minExp, setMinExp] = useState('');
  const [maxExp, setMaxExp] = useState('');
  const [skillsFilter, setSkillsFilter] = useState('');

  // Experience visual select mapping
  const [experienceFilter, setExperienceFilter] = useState('');

  // Fast local inputs to completely eliminate typing lag
  const [searchInput, setSearchInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // Candidates Data State
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown Unique Options
  const [allSkills, setAllSkills] = useState([]);
  const [allLocations, setAllLocations] = useState([]);

  // Sorting State
  const [sortBy, setSortBy] = useState('updated'); // 'name', 'experience', 'updated'
  const [order, setOrder] = useState('desc'); // 'asc', 'desc'

  // Multi-select Row State
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Pagination State
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  // Details Modal State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Import State & Ref
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  // Fetch Candidates List
  const fetchCandidates = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('q', searchQuery);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (locationFilter) queryParams.append('location', locationFilter);
      if (minExp) queryParams.append('minExp', minExp);
      if (maxExp) queryParams.append('maxExp', maxExp);
      if (skillsFilter) queryParams.append('skills', skillsFilter);

      const response = await fetch(`${API_URL}/candidates?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to retrieve candidates list');
      }

      const data = await response.json();
      setCandidates(data);
      setCurrentPage(1); // Reset page on query updates
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading profiles.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic filter lists loaded once on mount
  useEffect(() => {
    if (!token) return;
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`${API_URL}/candidates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401 || response.status === 403) {
          logout();
          return;
        }
        if (response.ok) {
          const data = await response.json();
          const skillsSet = new Set();
          const locationSet = new Set();
          data.forEach(c => {
            if (c.skills) {
              c.skills.split(',').forEach(s => {
                const trimmed = s.trim();
                if (trimmed) skillsSet.add(trimmed);
              });
            }
            if (c.location) {
              const trimmed = c.location.trim();
              if (trimmed) locationSet.add(trimmed);
            }
          });
          setAllSkills(Array.from(skillsSet).sort());
          setAllLocations(Array.from(locationSet).sort());
        }
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMetadata();
  }, [token]);

  // Debounce fast local typing states into search query filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setSkillsFilter(skillsInput);
      setLocationFilter(locationInput);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchInput, skillsInput, locationInput]);

  // Debounced search trigger logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCandidates();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, statusFilter, locationFilter, minExp, maxExp, skillsFilter, token]);

  // Import Excel File Handler
  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const formData = new FormData();
    formData.append('file', file);

    try {
      setImporting(true);
      setImportError('');
      
      const response = await fetch(`${API_URL}/candidates/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import candidates');
      }

      setImportSummary(data);
      fetchCandidates();
    } catch (err) {
      console.error(err);
      setImportError(err.message || 'An error occurred during import.');
    } finally {
      setImporting(false);
    }
  };

  // Load detailed profile modal
  const handleViewDetails = useCallback(async (candidateId) => {
    try {
      setModalLoading(true);
      const response = await fetch(`${API_URL}/candidates/${candidateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }
      if (!response.ok) throw new Error('Could not get candidate details');
      
      const data = await response.json();
      setSelectedCandidate(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  }, [token]);

  // Delete Candidate profile
  const handleDeleteCandidate = useCallback(async (candidateId, name) => {
    if (!confirm(`Are you sure you want to permanently delete candidate profile "${name}"?`)) return;

    try {
      const response = await fetch(`${API_URL}/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete candidate');
      }

      fetchCandidates();
      setSelectedCandidate(prev => (prev && prev.id === candidateId ? null : prev));
    } catch (err) {
      alert(err.message);
    }
  }, [token]);

  // Checkbox row toggler
  const handleSelectRow = useCallback((id, checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // Checkbox select all page candidates
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    const pageCandidates = sortedCandidates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      pageCandidates.forEach(c => {
        if (checked) {
          next.add(c.id);
        } else {
          next.delete(c.id);
        }
      });
      return next;
    });
  };

  // Sorting Trigger
  const handleSort = (key) => {
    if (sortBy === key) {
      setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setOrder('desc');
    }
  };

  // Dynamic experience filter selector mapper
  const handleExperienceChange = (val) => {
    setExperienceFilter(val);
    if (val === '0-2') {
      setMinExp('0');
      setMaxExp('2');
    } else if (val === '3-5') {
      setMinExp('3');
      setMaxExp('5');
    } else if (val === '6-8') {
      setMinExp('6');
      setMaxExp('8');
    } else if (val === '9+') {
      setMinExp('9');
      setMaxExp('');
    } else {
      setMinExp('');
      setMaxExp('');
    }
  };

  // Clear filters
  const handleClearAll = () => {
    setSearchInput('');
    setSkillsInput('');
    setLocationInput('');
    setExperienceFilter('');
    setMinExp('');
    setMaxExp('');
    setStatusFilter('');
  };

  // 1. Filtered + 2. Sorted computed layer
  const sortedCandidates = useMemo(() => {
    let list = [...candidates];
    
    list.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'name') {
        aVal = a.name ? a.name.toLowerCase() : '';
        bVal = b.name ? b.name.toLowerCase() : '';
      } else if (sortBy === 'experience') {
        aVal = parseFloat(a.experience_years) || 0;
        bVal = parseFloat(b.experience_years) || 0;
      } else {
        // Updated sorting field
        aVal = a.updated_at ? new Date(a.updated_at.replace(' ', 'T')).getTime() : 0;
        bVal = b.updated_at ? new Date(b.updated_at.replace(' ', 'T')).getTime() : 0;
      }

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [candidates, sortBy, order]);

  // Paginated selection helper for checkboxes
  const pageCandidates = useMemo(() => {
    return sortedCandidates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [sortedCandidates, currentPage]);

  const isAllPageSelected = useMemo(() => {
    return pageCandidates.length > 0 && pageCandidates.every(c => selectedIds.has(c.id));
  }, [pageCandidates, selectedIds]);

  // Headers sort icon utility
  const getSortIcon = (key, forceActive = false) => {
    if (sortBy === key) {
      if (key === 'updated' && order === 'desc') {
        return <span style={{ color: 'var(--accent)', marginLeft: '4px', fontWeight: 'bold' }}>↓</span>;
      }
      return order === 'asc' 
        ? <ChevronUp size={14} style={{ color: 'var(--accent)', marginLeft: '4px', verticalAlign: 'middle' }} />
        : <ChevronDown size={14} style={{ color: 'var(--accent)', marginLeft: '4px', verticalAlign: 'middle' }} />;
    }
    // Default inactive caret
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '4px', verticalAlign: 'middle', opacity: 0.35 }}>
        <ChevronUp size={10} style={{ marginBottom: '-3px' }} />
        <ChevronDown size={10} style={{ marginTop: '-3px' }} />
      </span>
    );
  };

  // Render smart pagination page list
  const renderPageNumbers = () => {
    const totalPages = Math.ceil(sortedCandidates.length / PAGE_SIZE);
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages.map((page, idx) => {
      if (page === '...') {
        return (
          <span key={`dots-${idx}`} style={{ color: 'var(--text-muted)', padding: '0 0.25rem', userSelect: 'none' }}>
            ...
          </span>
        );
      }
      const isPageActive = currentPage === page;
      return (
        <button
          key={page}
          className={`pagination-btn ${isPageActive ? 'pagination-btn-active' : ''}`}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Candidates Directory</h1>
          <p className="page-subtitle">Search, filter, and review loaded candidate information database.</p>
        </div>
        {hasRole(['Admin', 'Recruitment Team']) && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
              <Download size={16} />
              <span>{importing ? 'Importing...' : 'Import'}</span>
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Add Candidate</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Banner Alert Message */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        background: 'var(--accent-dim)',
        border: '1px solid var(--accent-border-soft)',
        borderRadius: '8px',
        padding: '0.65rem 1rem',
        marginBottom: '1.25rem',
        color: 'var(--accent)',
        fontSize: '0.85rem',
        fontWeight: '500'
      }}>
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>ⓘ</span>
        <span>CRDMS is ready for login, search, candidate updates, uploads, activity review, and report export.</span>
      </div>

      {/* Full Width Search Container */}
      <div style={{ position: 'relative', width: '100%', marginBottom: '1.25rem' }}>
        <Search 
          size={16} 
          style={{ 
            position: 'absolute', 
            left: '14px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: 'var(--text-muted)' 
          }} 
        />
        <input 
          type="text" 
          className="custom-search-input" 
          placeholder="Search by full name, email, or position" 
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {/* Filters Row Container */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: '700', 
            color: 'var(--text-muted)', 
            letterSpacing: '0.05em' 
          }}>
            FILTERS:
          </span>
          
          <select
            className="custom-filter-select"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
          >
            <option value="">Skills: Any</option>
            {allSkills.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>

          <select
            className="custom-filter-select"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
          >
            <option value="">Loc: Any</option>
            {allLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          <select
            className="custom-filter-select"
            value={experienceFilter}
            onChange={(e) => handleExperienceChange(e.target.value)}
          >
            <option value="">Exp: Any</option>
            <option value="0-2">0–2 years</option>
            <option value="3-5">3–5 years</option>
            <option value="6-8">6–8 years</option>
            <option value="9+">9+ years</option>
          </select>

          <select
            className="custom-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '135px' }} // narrow width to force "Stat us: All" wrapping styling if needed
          >
            <option value="">Stat us: All</option>
            <option value="Applied">Applied</option>
            <option value="Screening">Screening</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Offered">Offered</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <button className="clear-all-btn" onClick={handleClearAll}>
          Clear All
        </button>
      </div>

      {/* Candidates Table List Card */}
      <div className="glass-card" style={{ padding: '0.5rem 1.25rem 1.25rem 1.25rem' }}>
        {loading && candidates.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>Loading candidate directory details...</p>
        ) : error ? (
          <p style={{ textAlign: 'center', color: 'var(--danger)', padding: '3rem 0' }}>{error}</p>
        ) : candidates.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>No matching candidates found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table" style={{ background: 'transparent' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', background: 'transparent' }}>
                    <input 
                      type="checkbox" 
                      className="custom-checkbox" 
                      checked={isAllPageSelected}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>
                    SR. NO.
                  </th>
                  <th className="sortable-header" onClick={() => handleSort('name')} style={{ background: 'transparent', whiteSpace: 'nowrap' }}>
                    NAME {getSortIcon('name')}
                  </th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>CURRENT LOCATION</th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>COMPANY</th>
                  <th className="sortable-header" onClick={() => handleSort('experience')} style={{ background: 'transparent', whiteSpace: 'nowrap' }}>
                    EXPRIENCE {getSortIcon('experience')}
                  </th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>LINK</th>
                  <th className="sortable-header" onClick={() => handleSort('status')} style={{ background: 'transparent', whiteSpace: 'nowrap' }}>
                    STATUS {getSortIcon('status')}
                  </th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>REMARKS</th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>COMMENT</th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>MOBILE NUMBER</th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>CURRENT PAY</th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>EXPECTED PAY</th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>SKILLS</th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>NOTICE PERIOD</th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>PREFERRED LOCATION</th>
                  <th style={{ background: 'transparent', whiteSpace: 'nowrap' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pageCandidates.map((c, index) => (
                  <CandidateRow
                    key={c.id}
                    c={c}
                    index={(currentPage - 1) * PAGE_SIZE + index + 1}
                    hasRole={hasRole}
                    onView={handleViewDetails}
                    onDelete={handleDeleteCandidate}
                    onSelect={handleSelectRow}
                    isSelected={selectedIds.has(c.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Container */}
        {sortedCandidates.length > PAGE_SIZE && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 0 0.5rem',
            borderTop: '1px solid var(--border)',
            marginTop: '1rem'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, sortedCandidates.length)}–{Math.min(currentPage * PAGE_SIZE, sortedCandidates.length)} of {sortedCandidates.length} candidates
            </span>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              
              {renderPageNumbers()}

              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedCandidates.length / PAGE_SIZE), p + 1))}
                disabled={currentPage === Math.ceil(sortedCandidates.length / PAGE_SIZE)}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Profile Details Modal */}
      <ModalWrapper
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      >
        {selectedCandidate && (
          <div className="glass-card modal-content" style={{ width: '100%', maxWidth: '640px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setSelectedCandidate(null)}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                background: getAvatarColor(selectedCandidate.name).bg, 
                border: getAvatarColor(selectedCandidate.name).border,
                color: getAvatarColor(selectedCandidate.name).fg,
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1.5rem'
              }}>
                {getInitials(selectedCandidate.name)}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{selectedCandidate.name}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      background: (STATUS_STYLE_MAP[selectedCandidate.status] || STATUS_STYLE_MAP.Applied).bg,
                      border: (STATUS_STYLE_MAP[selectedCandidate.status] || STATUS_STYLE_MAP.Applied).border,
                      color: (STATUS_STYLE_MAP[selectedCandidate.status] || STATUS_STYLE_MAP.Applied).color
                    }}
                  >
                    {selectedCandidate.status}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <MapPin size={12} /> {selectedCandidate.location}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.5rem 0', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Email Address</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} style={{ color: 'var(--accent)' }} /> {selectedCandidate.email}
                  </span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Phone / Mobile Number</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} style={{ color: 'var(--accent)' }} /> {selectedCandidate.phone || 'N/A'}
                  </span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Current Location</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={14} style={{ color: 'var(--accent)' }} /> {selectedCandidate.location || 'N/A'}
                  </span>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Preferred Location</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {selectedCandidate.preferred_location || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Experience & Company</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Briefcase size={14} style={{ color: 'var(--accent)' }} /> {selectedCandidate.experience_years} Years at <strong>{selectedCandidate.company || 'N/A'}</strong>
                  </span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>CTC Expectations</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Current: <strong>{selectedCandidate.current_ctc ? (selectedCandidate.current_ctc >= 100000 ? (selectedCandidate.current_ctc / 100000) + ' Lakhs' : selectedCandidate.current_ctc.toLocaleString()) : 'N/A'}</strong> / Expected: <strong>{selectedCandidate.expected_ctc ? (selectedCandidate.expected_ctc >= 100000 ? (selectedCandidate.expected_ctc / 100000) + ' Lakhs' : selectedCandidate.expected_ctc.toLocaleString()) : 'N/A'}</strong>
                  </span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Notice Period</label>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {selectedCandidate.notice_period_days !== null ? (selectedCandidate.notice_period_days === 0 ? 'Immediate' : (selectedCandidate.notice_period_days >= 30 ? (Math.round(selectedCandidate.notice_period_days / 30)) + ' month' + (selectedCandidate.notice_period_days > 30 ? 's' : '') : selectedCandidate.notice_period_days + ' days')) : 'N/A'}
                  </span>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>LinkedIn Link</label>
                  {selectedCandidate.linkedin_url ? (
                    <a 
                      href={selectedCandidate.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ fontSize: '0.9rem', color: 'var(--accent)', textDecoration: 'underline' }}
                    >
                      View Profile
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>N/A</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Remarks</label>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', background: 'var(--bg-surface-dim)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', minHeight: '40px', whiteSpace: 'pre-wrap' }}>
                  {selectedCandidate.remarks || 'N/A'}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Comment</label>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', background: 'var(--bg-surface-dim)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', minHeight: '40px', whiteSpace: 'pre-wrap' }}>
                  {selectedCandidate.comment || 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>Skills Inventory</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedCandidate.skills ? selectedCandidate.skills.split(',').map((skill) => (
                  <span key={skill} className="skill-badge">
                    {skill.trim().toUpperCase()}
                  </span>
                )) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>N/A</span>}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: '600' }}>Documents & Resumes</label>
              {selectedCandidate.documents && selectedCandidate.documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedCandidate.documents.map((doc) => (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-dim)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{doc.file_name}</span>
                      <a 
                        href={`${API_URL}/uploads/${doc.file_path.split('\\').pop()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>No resume uploaded for this candidate.</p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setSelectedCandidate(null)} className="btn btn-secondary" style={{ borderRadius: '6px' }}>Close</button>
              {hasRole(['Admin', 'Recruitment Team']) && (
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
              background: 'var(--success-dim)',
              border: '1px solid var(--success-border)',
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--success)',
              margin: '0 auto 1.5rem auto'
            }}>
              <Download size={24} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Import Completed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              The Excel talent pool sheet has been processed successfully.
            </p>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem', 
              background: 'var(--bg-surface-dim)', 
              border: '1px solid var(--border)',
              borderRadius: '8px', 
              padding: '1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
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
              background: 'var(--danger-dim)',
              border: '1px solid var(--danger-border)',
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--danger)',
              margin: '0 auto 1.5rem auto'
            }}>
              <X size={24} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--danger)' }}>Import Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {importError === 'Failed to fetch' 
                ? `Could not connect to the backend server. Please verify that the backend API server is running at ${API_URL}.` 
                : importError}
            </p>

            <button onClick={() => setImportError('')} className="btn" style={{ width: '100%', background: 'var(--danger)', borderColor: 'var(--danger)', color: '#ffffff', borderRadius: '6px' }}>
              Close
            </button>
          </div>
        )}
      </ModalWrapper>

      {/* Add Candidate Modal Overlay */}
      <ModalWrapper
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      >
        <div 
          className="modal-content"
          style={{ 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-lg)', 
            width: '100%', 
            maxWidth: '800px', 
            maxHeight: '90vh', 
            overflowY: 'auto', 
            boxShadow: 'var(--shadow)',
            padding: '1.5rem 2rem', 
            position: 'relative',
          }}
        >
            {/* Close Button */}
            <button 
              onClick={() => setIsAddModalOpen(false)}
              style={{ 
                position: 'absolute', 
                right: '1.5rem', 
                top: '1.5rem', 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'var(--text-secondary)',
                transition: 'var(--ease)'
              }}
              className="action-icon-btn action-delete-btn"
              title="Close modal"
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Add New Candidate</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Enter details to update the recruitment tracking database.</p>
            </div>

            {formError && (
              <div style={{ 
                background: 'var(--danger-dim)', 
                border: '1px solid var(--danger-border)',
                borderRadius: '8px', 
                padding: '0.75rem 1rem', 
                color: 'var(--danger)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div style={{ 
                background: 'var(--success-dim)', 
                border: '1px solid var(--success-border)',
                borderRadius: '8px', 
                padding: '0.75rem 1rem', 
                color: 'var(--success)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem'
              }}>
                <CheckCircle2 size={18} />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              {/* Tab Pill Selectors */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bg-surface-dim)', padding: '4px', borderRadius: '9999px', border: '1px solid var(--border)', width: 'fit-content' }}>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('personal')}
                  style={{
                    padding: '0.4rem 1.25rem',
                    border: 'none',
                    background: activeFormTab === 'personal' ? 'var(--accent-dim)' : 'transparent',
                    border: activeFormTab === 'personal' ? '1px solid var(--accent-border-soft)' : '1px solid transparent',
                    color: activeFormTab === 'personal' ? 'var(--accent)' : 'var(--text-secondary)',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'var(--ease)'
                  }}
                >
                  1. Personal Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('compensation')}
                  style={{
                    padding: '0.4rem 1.25rem',
                    border: 'none',
                    background: activeFormTab === 'compensation' ? 'var(--accent-dim)' : 'transparent',
                    border: activeFormTab === 'compensation' ? '1px solid var(--accent-border-soft)' : '1px solid transparent',
                    color: activeFormTab === 'compensation' ? 'var(--accent)' : 'var(--text-secondary)',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'var(--ease)'
                  }}
                >
                  2. Status & CTC
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('resume')}
                  style={{
                    padding: '0.4rem 1.25rem',
                    border: 'none',
                    background: activeFormTab === 'resume' ? 'var(--accent-dim)' : 'transparent',
                    border: activeFormTab === 'resume' ? '1px solid var(--accent-border-soft)' : '1px solid transparent',
                    color: activeFormTab === 'resume' ? 'var(--accent)' : 'var(--text-secondary)',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'var(--ease)'
                  }}
                >
                  3. Resume & Notes
                </button>
              </div>

              {/* Tab 1: Personal Details */}
              <div style={{ display: activeFormTab === 'personal' ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="john.doe@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Current Location *</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="Mumbai"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Company</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="Infosys"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>LinkedIn Link / URL</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.4rem', gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Skills (Comma separated) *</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="React, Node.js, SQL"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Experience * (Years)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="3.5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>
              </div>

              {/* Tab 2: Status & CTC */}
              <div style={{ display: activeFormTab === 'compensation' ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Current Status *</label>
                  <select
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', appearance: 'none' }}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Applied" style={{ background: 'var(--bg-panel-solid)' }}>Applied</option>
                    <option value="Screening" style={{ background: 'var(--bg-panel-solid)' }}>Screening</option>
                    <option value="Interviewing" style={{ background: 'var(--bg-panel-solid)' }}>Interviewing</option>
                    <option value="Offered" style={{ background: 'var(--bg-panel-solid)' }}>Offered</option>
                    <option value="Hired" style={{ background: 'var(--bg-panel-solid)' }}>Hired</option>
                    <option value="Rejected" style={{ background: 'var(--bg-panel-solid)' }}>Rejected</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Preferred Location</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="Pune"
                    value={preferredLocation}
                    onChange={(e) => setPreferredLocation(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Notice Period (Days)</label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="30"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Current CTC (Annualized)</label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="1200000"
                    value={currentCtc}
                    onChange={(e) => setCurrentCtc(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Expected CTC (Annualized)</label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    placeholder="1500000"
                    value={expectedCtc}
                    onChange={(e) => setExpectedCtc(e.target.value)}
                  />
                </div>
              </div>

              {/* Tab 3: Resume & Notes */}
              <div style={{ display: activeFormTab === 'resume' ? 'block' : 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.25rem', alignItems: 'start' }}>
                  <div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Remarks</label>
                      <textarea
                        className="form-input"
                        placeholder="Enter remarks..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        style={{ minHeight: '75px', maxHeight: '110px', fontSize: '0.8rem', padding: '0.5rem', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>Comment</label>
                      <textarea
                        className="form-input"
                        placeholder="Enter comments..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        style={{ minHeight: '75px', maxHeight: '110px', fontSize: '0.8rem', padding: '0.5rem', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label className="form-label" style={{ marginBottom: '0.3rem', fontSize: '0.7rem' }}>Resume Document (PDF/DOCX/TXT)</label>
                      <div 
                        className={`dropzone ${isDragActive ? 'active' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('modal-file-upload-input').click()}
                        style={{ padding: '1.25rem', border: '1px dashed var(--border)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}
                      >
                        <input
                          id="modal-file-upload-input"
                          type="file"
                          style={{ display: 'none' }}
                          accept=".pdf,.docx,.doc,.txt"
                          onChange={handleFileChange}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <Upload size={24} style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }} />
                          {resumeFile ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-primary)', fontSize: '0.75rem' }}>
                              <File size={14} className="kpi-cyan" />
                              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resumeFile.name}</span>
                            </div>
                          ) : (
                            <>
                              <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.8rem' }}>Drag or click to upload</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max 10MB</p>
                            </>
                          )}
                          {uploadSuccess && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                              ✓ Uploaded.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem', marginTop: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {activeFormTab !== 'personal' && (
                    <button
                      type="button"
                      onClick={() => setActiveFormTab(activeFormTab === 'resume' ? 'compensation' : 'personal')}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '9999px', border: '1px solid var(--border)' }}
                    >
                      Back
                    </button>
                  )}
                  {activeFormTab !== 'resume' && (
                    <button
                      type="button"
                      onClick={() => setActiveFormTab(activeFormTab === 'personal' ? 'compensation' : 'resume')}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '9999px' }}
                    >
                      Next Step
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)} 
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '9999px', border: '1px solid var(--border)' }}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 1.25rem', fontSize: '0.8rem', borderRadius: '9999px' }}
                    disabled={formLoading}
                  >
                    <Save size={14} />
                    <span>{formLoading ? 'Saving...' : 'Save Profile'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
      </ModalWrapper>

      {/* Embedded UI Style System overrides */}
      <style>{`
        /* Capsule/Pill dropdown styling matching screen */
        .custom-filter-select {
          background-color: var(--bg-surface-dim);
          border: 1px solid var(--border);
          border-radius: 9999px;
          color: var(--text-secondary);
          padding: 0.5rem 2.25rem 0.5rem 1.25rem;
          font-size: 0.85rem;
          font-weight: 500;
          appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23a0a0a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 0.85rem;
          cursor: pointer;
          transition: var(--ease);
          outline: none;
          max-width: 180px;
          white-space: pre-line;
        }
        .custom-filter-select:hover {
          border-color: #3e3e3e;
          color: var(--text-primary);
        }
        .custom-filter-select:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-glow);
        }

        /* Clear All button styling */
        .clear-all-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--accent);
          display: flex;
          align-items: center;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          transition: var(--ease);
        }
        .clear-all-btn:hover {
          color: #b5f033;
        }

        /* Search Input */
        .custom-search-input {
          width: 100%;
          background-color: var(--bg-surface-dim);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          color: var(--text-primary);
          font-size: 0.9rem;
          outline: none;
          transition: var(--ease);
        }
        .custom-search-input::placeholder {
          color: var(--text-muted);
        }
        .custom-search-input:focus {
          border-color: var(--accent);
          background-color: var(--bg-surface);
          box-shadow: 0 0 0 2px var(--accent-glow);
        }

        /* Custom Checkbox */
        .custom-checkbox {
          width: 16px;
          height: 16px;
          background-color: var(--bg-surface-dim);
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          appearance: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: var(--ease);
          position: relative;
        }
        .custom-checkbox:checked {
          background-color: var(--accent);
          border-color: var(--accent);
        }
        .custom-checkbox:checked::after {
          content: "";
          display: block;
          width: 4px;
          height: 8px;
          border: solid var(--text-inverse);
          border-width: 0 2px 2px 0;
          transform: rotate(45deg) translate(-0.5px, -1px);
        }
        .custom-checkbox:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--accent-glow);
        }

        /* Skill Badge capsule custom styles matching screen */
        .skill-badge {
          background-color: var(--accent-dim);
          border: 1px solid var(--accent-border-soft);
          border-radius: 9999px; /* Pill layout */
          color: var(--accent);
          padding: 0.2rem 0.65rem;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .skill-badge-extra {
          background-color: var(--bg-surface-hi);
          border: 1px solid var(--border);
          border-radius: 9999px;
          color: var(--text-muted);
          padding: 0.2rem 0.65rem;
          font-size: 0.68rem;
          font-weight: 700;
        }

        /* Hover row and Action Icon Buttons */
        .table-row-hover:hover td {
          background-color: var(--bg-surface-up) !important;
        }
        .action-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: var(--ease);
          color: var(--text-secondary) !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .action-icon-btn:hover {
          color: var(--text-primary) !important;
        }
        .action-delete-btn:hover {
          color: var(--danger) !important;
        }

        /* Headers sorting button */
        .sortable-header {
          cursor: pointer;
          user-select: none;
          transition: var(--ease);
        }
        .sortable-header:hover {
          color: var(--text-primary) !important;
        }

        /* Pagination custom wrapper */
        .pagination-btn {
          background-color: var(--bg-surface-dim);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: var(--ease);
        }
        .pagination-btn:hover:not(:disabled) {
          border-color: #3e3e3e;
          color: var(--text-primary);
          background-color: var(--bg-surface-hi);
        }
        .pagination-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .pagination-btn-active {
          border-color: var(--accent) !important;
          color: var(--accent) !important;
          background-color: var(--accent-dim) !important;
        }

        /* Spin animation */
        .spin-loader {
          margin: 0 auto 1.5rem auto;
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-subtle);
          border-top: 4px solid var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
