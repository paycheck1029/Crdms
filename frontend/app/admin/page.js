'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/config';
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  UserPlus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Edit3,
  X
} from 'lucide-react';

export default function AdminPanelPage() {
  const { token, user, hasRole, logout } = useAuth();
  
  // Navigation Tabs: 'users' or 'logs'
  // Default to 'logs' if user is IT Team (since they don't have user CRUD permission)
  const defaultTab = hasRole(['Admin']) ? 'users' : 'logs';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // User Management States
  const [usersList, setUsersList] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Recruitment Team');
  
  // Editing state
  const [editingUser, setEditingUser] = useState(null);

  // Logs States
  const [logsList, setLogsList] = useState([]);
  const [searchLogUser, setSearchLogUser] = useState('');
  const [searchLogAction, setSearchLogAction] = useState('');

  // Status/Alert States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch Users
  const fetchUsers = async () => {
    if (!token || !hasRole(['Admin'])) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      if (!res.ok) throw new Error('Failed to retrieve user accounts');
      const data = await res.json();
      setUsersList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Logs
  const fetchLogs = async () => {
    if (!token || !hasRole(['Admin', 'IT Team'])) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      if (!res.ok) throw new Error('Failed to retrieve system audit logs');
      const data = await res.json();
      setLogsList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError('');
    setSuccess('');
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchLogs();
    }
  }, [activeTab, token]);

  // Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!newUsername || !newEmail || !newPassword || !newRole) {
      setError('Please fill in all user profile details.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          password: newPassword,
          role: newRole
        })
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setSuccess(`User account "${newUsername}" successfully created.`);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('Recruitment Team');
      
      // Reload list
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Start Editing User
  const handleStartEdit = (u) => {
    setEditingUser(u);
    setNewUsername(u.username);
    setNewEmail(u.email);
    setNewRole(u.role);
    setNewPassword(''); // Password blank unless updating
    setError('');
    setSuccess('');
  };

  // Cancel Editing User
  const handleCancelEdit = () => {
    setEditingUser(null);
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('Recruitment Team');
    setError('');
    setSuccess('');
  };

  // Handle Update User (PUT)
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newEmail || !newRole) {
      setError('Email and role are required fields.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmail,
          role: newRole,
          password: newPassword || null // Send null to leave current password intact
        })
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user details');

      setSuccess(`User account "${editingUser.username}" successfully updated.`);
      handleCancelEdit();
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (targetUserId, targetUsername) => {
    if (targetUserId === user.id) {
      setError('Action blocked: You cannot delete your own session admin account.');
      return;
    }
    
    if (!confirm(`Are you sure you want to permanently delete user account "${targetUsername}"?`)) return;

    setError('');
    setSuccess('');
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/${targetUserId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccess(`User "${targetUsername}" deleted.`);
      if (editingUser && editingUser.id === targetUserId) {
        handleCancelEdit();
      }
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logs locally
  const filteredLogs = logsList.filter(log => {
    const matchUser = log.username.toLowerCase().includes(searchLogUser.toLowerCase());
    const matchAction = log.action.toLowerCase().includes(searchLogAction.toLowerCase());
    return matchUser && matchAction;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Operations Panel</h1>
        <p className="page-subtitle">Configure directory user authorization roles and review global system audit logs.</p>
      </div>

      {error && (
        <div style={{ 
          background: 'var(--danger-dim)', 
          border: '1px solid var(--danger-border)',
          borderRadius: '8px', 
          padding: '1rem', 
          color: 'var(--danger)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ 
          background: 'var(--success-dim)', 
          border: '1px solid var(--success-border)',
          borderRadius: '8px', 
          padding: '1rem', 
          color: 'var(--success)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs Header */}
      <div className="tabs-header">
        {hasRole(['Admin']) && (
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} /> User Management
            </span>
          </button>
        )}
        <button 
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} /> System Audit Logs
          </span>
        </button>
      </div>

      {/* View Content */}
      {activeTab === 'users' && hasRole(['Admin']) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
          
          {/* Users List */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} className="kpi-cyan" />
              <span>Registered Accounts</span>
            </h2>
            
            {loading ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Retrieving account roster...</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>System Role</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id} style={{ 
                        background: editingUser && editingUser.id === u.id ? 'var(--accent-dim)' : 'transparent',
                        transition: 'background 0.3s'
                      }}>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>@{u.username}</td>
                        <td>{u.email}</td>
                        <td>
                          <span 
                            style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: '700', 
                              color: u.role === 'Admin' ? 'var(--accent)' : 'var(--text-secondary)'
                            }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ 
                                padding: '0.4rem 0.6rem', 
                                borderColor: editingUser && editingUser.id === u.id ? 'var(--accent-border-soft)' : 'var(--border)' 
                              }}
                              disabled={actionLoading}
                              title="Edit Details"
                              onClick={() => handleStartEdit(u)}
                            >
                              <Edit3 size={14} style={{ color: editingUser && editingUser.id === u.id ? 'var(--accent)' : 'inherit' }} />
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem 0.6rem', color: 'var(--danger)' }}
                              disabled={u.id === user.id || actionLoading}
                              title={u.id === user.id ? 'Self deletion blocked' : 'Delete Account'}
                              onClick={() => handleDeleteUser(u.id, u.username)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User Form (Create / Edit Mode) */}
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} className="kpi-purple" />
              <span>{editingUser ? `Modify Account: @${editingUser.username}` : 'Provision Account'}</span>
            </h2>

            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="recruiter_jane" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  disabled={actionLoading || !!editingUser}
                  style={{ opacity: editingUser ? 0.6 : 1 }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="jane@crdms.com" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={actionLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {editingUser ? 'Reset Password (Leave blank to keep current)' : 'Temporary Password'}
                </label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder={editingUser ? '•••••••• (Optional)' : '••••••••'} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={actionLoading}
                  required={!editingUser}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Authorization Role</label>
                <select 
                  className="form-input"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  disabled={actionLoading}
                  style={{ appearance: 'none' }}
                >
                  <option value="Admin" style={{ background: 'var(--bg-panel-solid)' }}>Admin</option>
                  <option value="Recruitment Team" style={{ background: 'var(--bg-panel-solid)' }}>Recruitment Team</option>
                  <option value="Management" style={{ background: 'var(--bg-panel-solid)' }}>Management</option>
                  <option value="IT Team" style={{ background: 'var(--bg-panel-solid)' }}>IT Team</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {editingUser && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flexGrow: 1 }}
                    onClick={handleCancelEdit}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flexGrow: 2 }}
                  disabled={actionLoading}
                >
                  {editingUser ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {activeTab === 'logs' && (
        <div className="glass-card">
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} className="kpi-rose" />
            <span>Audit Trail Log Stream</span>
          </h2>

          {/* Filters for Logs */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Filter logs by username (e.g. 'admin')..."
                value={searchLogUser}
                onChange={(e) => setSearchLogUser(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            
            <input 
              type="text" 
              className="form-input" 
              placeholder="Filter by action (e.g. 'Login')..."
              value={searchLogAction}
              onChange={(e) => setSearchLogAction(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Polling logs stream...</p>
          ) : filteredLogs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No logs match the current search filters.</p>
          ) : (
            <div className="table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>User</th>
                    <th style={{ width: '140px' }}>Action</th>
                    <th>Audit Details</th>
                    <th style={{ width: '180px' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: '600', color: 'var(--accent)' }}>@{l.username}</td>
                      <td style={{ fontWeight: '700' }}>{l.action}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{l.details}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
