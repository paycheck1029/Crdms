'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import jobService from '@/services/jobService';
import ModalWrapper from '@/components/ModalWrapper';
import { 
  Briefcase, 
  MapPin, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  DollarSign,
  Clock,
  User,
  X
} from 'lucide-react';

export default function JobsPage() {
  const { user, hasRole } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await jobService.getJobs();
      setJobs(res.data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const handlePostJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await jobService.createJob({
        title,
        description,
        requirements,
        location,
        salaryRange
      });
      
      setSuccessMsg('Job posting request submitted successfully and is pending approval.');
      setIsModalOpen(false);
      // Clear form
      setTitle('');
      setLocation('');
      setSalaryRange('');
      setDescription('');
      setRequirements('');
      
      // Refresh list
      fetchJobs();
    } catch (err) {
      setError(err.message || 'Failed to post job.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      setError('');
      await jobService.deleteJob(id);
      setSuccessMsg('Job posting deleted successfully.');
      fetchJobs();
    } catch (err) {
      setError(err.message || 'Failed to delete job.');
    }
  };

  const handleApproveJob = async (id) => {
    try {
      setError('');
      await jobService.approveJob(id);
      setSuccessMsg('Job posting approved successfully.');
      fetchJobs();
    } catch (err) {
      setError(err.message || 'Failed to approve job.');
    }
  };

  const handleRejectJob = async (id) => {
    try {
      setError('');
      await jobService.rejectJob(id);
      setSuccessMsg('Job posting marked as Rejected.');
      fetchJobs();
    } catch (err) {
      setError(err.message || 'Failed to reject job.');
    }
  };

  const isModerator = hasRole(['Admin', 'HR Manager']);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Job Postings</h1>
          <p className="page-subtitle">
            {isModerator 
              ? 'Review and moderate job postings submitted by recruiters.' 
              : 'Post new job openings and track their approval progress.'}
          </p>
        </div>
        {!isModerator && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} />
            <span>Post New Job</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.3)', 
          borderRadius: '8px', 
          padding: '0.75rem 1rem', 
          color: 'var(--status-hired)', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)', 
          borderRadius: '8px', 
          padding: '0.75rem 1rem', 
          color: 'var(--accent-rose)', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Briefcase size={48} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
          <h3>No Job Postings Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            {isModerator 
              ? 'There are currently no job posting requests to moderate.' 
              : 'You have not posted any jobs yet. Click "Post New Job" to get started.'}
          </p>
          {!isModerator && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              Post First Job
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card table-responsive" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Job Details</th>
                <th>Location</th>
                <th>Salary Range</th>
                <th>Posted Date</th>
                {isModerator && <th>Creator</th>}
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                let statusBadge = 'badge-applied';
                if (job.status === 'Active') statusBadge = 'badge-hired';
                if (job.status === 'Rejected') statusBadge = 'badge-rejected';

                return (
                  <tr key={job.id}>
                    <td>
                      <div>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{job.title}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.description}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <MapPin size={14} style={{ color: 'var(--accent)' }} />
                        {job.location}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {job.salary_range || 'Not specified'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    {isModerator && (
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <User size={14} />
                          @{job.creator_name || 'recruiter'}
                        </span>
                      </td>
                    )}
                    <td>
                      <span className={`badge ${statusBadge}`}>{job.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {isModerator && job.status === 'Pending' && (
                          <>
                            <button 
                              className="btn btn-sm" 
                              onClick={() => handleApproveJob(job.id)}
                              style={{ 
                                background: 'rgba(16, 185, 129, 0.1)', 
                                color: 'var(--status-hired)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <CheckCircle2 size={14} />
                              <span>Approve</span>
                            </button>
                            <button 
                              className="btn btn-sm" 
                              onClick={() => handleRejectJob(job.id)}
                              style={{ 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                color: 'var(--accent-rose)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <XCircle size={14} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        {(!isModerator || job.created_by === user?.id) && (
                          <button 
                            className="btn btn-sm btn-icon" 
                            onClick={() => handleDeleteJob(job.id)}
                            style={{ 
                              background: 'var(--danger-dim)', 
                              color: 'var(--danger)',
                              border: 'none',
                              padding: '0.35rem'
                            }}
                            title="Delete Job"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Post New Job Modal */}
      <ModalWrapper isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="glass-card" style={{ 
          maxWidth: '550px', 
          width: '90%', 
          margin: '2rem auto', 
          padding: '2rem',
          position: 'relative',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
          border: '1px solid var(--border)'
        }}>
          <button 
            type="button" 
            onClick={() => setIsModalOpen(false)} 
            style={{ 
              position: 'absolute', 
              right: '1.25rem', 
              top: '1.25rem', 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)',
              cursor: 'pointer' 
            }}
          >
            <X size={20} />
          </button>

          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={20} className="kpi-cyan" />
            <span>Post New Job Opening</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            Fill in the details to submit a job vacancy for approval. Once approved, it will be published to the public portal.
          </p>

          <form onSubmit={handlePostJob}>
            <div className="form-group">
              <label className="form-label" htmlFor="job-title">Job Title</label>
              <input
                id="job-title"
                type="text"
                className="form-input"
                placeholder="e.g. Senior Frontend Developer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="grid-equal-2">
              <div className="form-group">
                <label className="form-label" htmlFor="job-location">Location</label>
                <input
                  id="job-location"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bangalore, India"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="job-salary">Salary Range</label>
                <input
                  id="job-salary"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 12LPA - 15LPA"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="job-desc">Description</label>
              <textarea
                id="job-desc"
                className="form-input"
                rows={4}
                placeholder="Describe the job duties, role expectations, and company team details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={submitting}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" htmlFor="job-reqs">Requirements (Optional)</label>
              <textarea
                id="job-reqs"
                className="form-input"
                rows={3}
                placeholder="Specify preferred candidate skills, experience level, tools, certifications..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                disabled={submitting}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                style={{ background: 'var(--bg-surface-dim)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      </ModalWrapper>
    </div>
  );
}
