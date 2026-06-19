'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/config';
import { ArrowLeft, Save, Upload, File, AlertCircle, CheckCircle2 } from 'lucide-react';

function CandidateFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { token, logout } = useAuth();

  // Form Field States
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

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load candidate details if in edit mode
  useEffect(() => {
    if (!editId || !token) return;

    const loadCandidate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/candidates/${editId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401 || response.status === 403) {
          logout();
          return;
        }
        if (!response.ok) throw new Error('Failed to retrieve candidate profile for editing');
        
        const data = await response.json();
        setName(data.name);
        setEmail(data.email);
        setPhone(data.phone || '');
        setSkills(data.skills);
        setLocation(data.location);
        setExperienceYears(data.experience_years);
        setStatus(data.status);
        setCurrentCtc(data.current_ctc || '');
        setExpectedCtc(data.expected_ctc || '');
        setNoticePeriod(data.notice_period_days || '');
        setCompany(data.company || '');
        setLinkedinUrl(data.linkedin_url || '');
        setPreferredLocation(data.preferred_location || '');
        setRemarks(data.remarks || '');
        setComment(data.comment || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCandidate();
  }, [editId, token]);

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

  // Main Submit Handler (Handles Profile CRUD + Resume Upload)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!name || !email || !skills || !location || experienceYears === undefined) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

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

      const url = editId 
        ? `${API_URL}/candidates/${editId}` 
        : `${API_URL}/candidates`;
      
      const method = editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
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

      const activeCandidateId = editId || data.id;

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

      setSuccess(`Candidate profile successfully ${editId ? 'updated' : 'created'}!`);
      
      // Redirect back after delay
      setTimeout(() => {
        router.push('/candidates');
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          type="button"
          onClick={() => router.push('/candidates')} 
          className="btn btn-secondary"
          style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.25rem' }}>{editId ? 'Edit Candidate Profile' : 'Add New Candidate'}</h1>
          <p className="page-subtitle" style={{ fontSize: '0.8rem' }}>Enter details to update the recruitment tracking database.</p>
        </div>
      </div>

      {error && (
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
          <span>{error}</span>
        </div>
      )}

      {success && (
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
          <span>{success}</span>
        </div>
      )}

      <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
        <form onSubmit={handleSubmit}>
          
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
                    onClick={() => document.getElementById('file-upload-input').click()}
                    style={{ padding: '1.25rem', border: '1px dashed var(--border)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}
                  >
                    <input
                      id="file-upload-input"
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

          {/* Action buttons bar & Tab navigation indicators */}
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
                onClick={() => router.push('/candidates')} 
                className="btn btn-secondary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '9999px', border: '1px solid var(--border)' }}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ padding: '0.4rem 1.25rem', fontSize: '0.8rem', borderRadius: '9999px' }}
                disabled={loading}
              >
                <Save size={14} />
                <span>{loading ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CandidateFormPage() {
  return (
    <Suspense fallback={<div>Loading candidate form context...</div>}>
      <CandidateFormContent />
    </Suspense>
  );
}
