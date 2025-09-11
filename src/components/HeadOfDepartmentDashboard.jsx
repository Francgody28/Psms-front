import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import zafiriLogo from '../assets/zafiri.png';
import './UserDashboard.css';

const HeadOfDepartmentDashboard = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('update');
  const [plans, setPlans] = useState([]);
  const [viewPlan, setViewPlan] = useState(null);
  // Statistics approvals
  const [stats, setStats] = useState([]);
  const [viewStat, setViewStat] = useState(null);
  // NEW: approved plans
  const [approvedPlans, setApprovedPlans] = useState([]);
  // NEW: approved statistics
  const [approvedStats, setApprovedStats] = useState([]);
  const [reviewedForwardedPlans, setReviewedForwardedPlans] = useState([]); // reviewed by HoD awaiting DG
  const [rejectedPlans, setRejectedPlans] = useState([]);

  const navigate = useNavigate();

  // Add budget states
  const [receivedBudget, setReceivedBudget] = useState(0);
  const [usedBudget, setUsedBudget] = useState(0);
  const [projection, setProjection] = useState(0);
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingPlans();
    fetchPendingStatistics();
    fetchApprovedPlans();
    fetchApprovedStatistics();
    fetchProcessedPlans();
    loadBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popupMessage]);

  const authHeaders = () => ({
    Authorization: `Token ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const loadBudget = async () => {
    try {
      const res = await fetch('http://localhost:2800/api/auth/budget/', { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setReceivedBudget(Number(data.received_budget || 0));
      setUsedBudget(Number(data.used_budget || 0));
      setProjection(Number(data.projection || 0));
    } catch { /* ignore */ }
  };

  const saveBudget = async (field, value) => {
    setSavingBudget(true);
    try {
      const body = { [field]: value };
      const res = await fetch('http://localhost:2800/api/auth/budget/', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update budget');
      setPopupMessage('Budget updated');
      setPopupType('update');
      // refresh from server to avoid drift
      loadBudget();
    } catch (e) {
      setPopupMessage(e.message || 'Budget update failed');
      setPopupType('delete');
    } finally { setSavingBudget(false); }
  };

  const fetchApprovedPlans = async () => {
    try {
      const res = await fetch('http://localhost:2800/api/auth/approved-plans/', { headers: authHeaders() });
      if (!res.ok) { setApprovedPlans([]); return; }
      const data = await res.json();
      setApprovedPlans(Array.isArray(data) ? data.filter(p => p.file) : []);
    } catch { setApprovedPlans([]); }
  };

  const fetchApprovedStatistics = async () => {
    try {
      const res = await fetch('http://localhost:2800/api/auth/approved-statistics/', { headers: authHeaders() });
      if (!res.ok) { setApprovedStats([]); return; }
      const data = await res.json();
      setApprovedStats(Array.isArray(data) ? data.filter(s => s.file) : []);
    } catch { setApprovedStats([]); }
  };

  const fetchProcessedPlans = async () => {
    try {
      const res = await fetch('http://localhost:2800/api/auth/hod-processed-plans/', { headers: authHeaders() });
      if (!res.ok) { setReviewedForwardedPlans([]); setRejectedPlans([]); return; }
      const data = await res.json();
      setReviewedForwardedPlans(Array.isArray(data.reviewed_plans) ? data.reviewed_plans.filter(p => p.file) : []);
      setRejectedPlans(Array.isArray(data.rejected_plans) ? data.rejected_plans.filter(p => p.file) : []);
    } catch { setReviewedForwardedPlans([]); setRejectedPlans([]); }
  };

  const fetchPendingStatistics = async () => {
    try {
      const res = await fetch('http://localhost:2800/api/auth/pending-statistics/', { headers: authHeaders() });
      const data = await res.json();
      setStats(Array.isArray(data) ? data.filter(s => s.file) : []);
    } catch { setStats([]); }
  };

  const fetchDashboardData = async () => {
    try {
      const data = await api.getUserDashboard();
      setDashboardData(data);
    } catch {
      console.error('Error fetching dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPlans = async () => {
    try {
      const res = await fetch('http://localhost:2800/api/auth/pending-plans/', {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      const filteredPlans = Array.isArray(data) ? data.filter(p => p.file) : [];
      setPlans(filteredPlans); // do NOT overwrite approvedPlans here
    } catch {
      setPlans([]);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout();
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout();
    }
  };

  const handleAddStatistics = () => {
    navigate('/statistics-dashboard');
  };

  const handleAddPlan = () => {
    navigate('/planning-dashboard');
  };

  const Popup = ({ message, type = 'update', onClose }) => {
    useEffect(() => {
      const t = setTimeout(onClose, 2500);
      return () => clearTimeout(t);
    }, [onClose]);
    const bg = type === 'delete' ? '#dc3545' : '#28a745';
    return (
      <div style={{
        position: 'fixed',
        top: '30px',
        right: '30px',
        background: bg,
        color: '#fff',
        padding: '12px 20px',
        borderRadius: 8,
        zIndex: 9999,
        boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
      }}>
        {message}
      </div>
    );
  };


  const handleApprovePlanModal = async (planId) => {
    try {
      const res = await fetch(`http://localhost:2800/api/auth/review-plan/${planId}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve plan');
      setPopupMessage(data.message || 'Plan approved');
      setPopupType('update');
      setViewPlan(null);
      // Remove from pending list
      setPlans(prev => prev.filter(p => p.id !== planId));
      // Optimistic add to approvedPlans
      setApprovedPlans(prev => {
        const existing = prev.find(p => p.id === planId);
        if (existing) return prev;
        return prev; // HoD does not finalize approval, so no direct move to approved here
      });
      fetchProcessedPlans();
    } catch (err) {
      setPopupMessage(err.message || 'Failed to approve plan');
      setPopupType('delete');
    }
  };

  const handleRejectPlanModal = async (planId) => {
    try {
      const res = await fetch(`http://localhost:2800/api/auth/review-plan/${planId}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject plan');
      setPopupMessage(data.message || 'Plan rejected');
      setPopupType('delete');
      setViewPlan(null);
      fetchDashboardData();
      fetchPendingPlans();
    } catch (err) {
      setPopupMessage(err.message || 'Failed to reject plan');
      setPopupType('delete');
    }
  };

  const handleApproveStatisticModal = async (statId) => {
    try {
      const res = await fetch(`http://localhost:2800/api/auth/review-statistic/${statId}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve statistic');
      setPopupMessage(data.message || 'Statistic approved');
      setPopupType('update');
      setViewStat(null);
      fetchDashboardData();
      // refresh stats list
      (async () => {
        try {
          const r2 = await fetch('http://localhost:2800/api/auth/pending-statistics/', {
            headers: { Authorization: `Token ${localStorage.getItem('token')}` },
          });
          const d2 = await r2.json(); // FIX: read JSON once
          setStats(Array.isArray(d2) ? d2.filter(s => s.file) : []);
        } catch {
          // Error intentionally ignored
        }
      })();
    } catch (err) {
      setPopupMessage(err.message || 'Failed to approve statistic');
      setPopupType('delete');
    }
  };

  const handleRejectStatisticModal = async (statId) => {
    try {
      const res = await fetch(`http://localhost:2800/api/auth/review-statistic/${statId}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject statistic');
      setPopupMessage(data.message || 'Statistic rejected');
      setPopupType('delete');
      setViewStat(null);
      // refresh stats list
      (async () => {
        try {
          const r2 = await fetch('http://localhost:2800/api/auth/pending-statistics/', {
            headers: { Authorization: `Token ${localStorage.getItem('token')}` },
          });
          const d2 = await r2.json(); // FIX: read JSON once
          setStats(Array.isArray(d2) ? d2.filter(s => s.file) : []);
        } catch {
          // Error intentionally ignored
        }
      })();
    } catch (err) {
      setPopupMessage(err.message || 'Failed to reject statistic');
      setPopupType('delete');
    }
  };

  // Helper to normalize file URL (avoid double /media/ and ensure presence)
  const buildFileUrl = (filePath) => {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    let fp = filePath.trim();
    // remove leading duplicate slashes
    while (fp.startsWith('//')) fp = fp.slice(1);
    // strip one leading slash for easier checks
    if (fp.startsWith('/')) fp = fp.slice(1);
    // if already starts with media/ keep it, else prepend media/
    if (!fp.startsWith('media/')) fp = `media/${fp}`;
    // collapse accidental media/media/
    fp = fp.replace(/media\/media\//g, 'media/');
    return `http://localhost:2800/${fp}`;
  };

  // Helper to download file with auth (normalized path)
  const downloadFile = async (filePath, fileName, id, type='plan') => {
    try {
      const endpoint = type === 'plan' ? `download-plan/${id}/` : `download-statistic/${id}/`;
      const url = id ? `http://localhost:2800/api/auth/${endpoint}` : buildFileUrl(filePath);
      const res = await fetch(url, { headers: { Authorization: `Token ${localStorage.getItem('token')}` } });
      if (!res.ok) {
        let detail = '';
        try { detail = await res.json(); } catch { detail = await res.text(); }
        console.error('Download error', detail);
        setPopupMessage(detail.error || 'Download failed');
        setPopupType('delete');
        return;
      }
      const blob = await res.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = fileName || filePath.split('/').pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objUrl);
      setPopupMessage('Download started');
      setPopupType('update');
    } catch (e) {
      console.error(e);
      setPopupMessage('Download failed');
      setPopupType('delete');
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-logo">
          <img
            src={zafiriLogo}
            alt="Zafiri Logo"
            style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 8 }}
          />
          <h2>PSMS</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {/* Make Dashboard go home */}
            <li onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Dashboard</li>
            <li onClick={() => navigate('/statistics-dashboard')} style={{ cursor: 'pointer' }}>Statistics</li>
            <li onClick={() => navigate('/planning-dashboard')} style={{ cursor: 'pointer' }}>Planning</li>
            <li onClick={handleLogout} style={{ cursor: 'pointer', color: '#fff' }}>Logout</li>
          </ul>
        </nav>
      </div>
      <div className="dashboard-main">
        <header className="dashboard-header">
          <h1>Welcome, {user.first_name || user.username}!</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </header>
        <div className="dashboard-content">
          <div className="welcome-card">
            <h2>Planning & Statistics Management System</h2>
            <p>Welcome Head of Department. Here you can manage your tasks, view statistics, approve plans/statistics, and access planning tools.</p>
          </div>

         <div className="stats-cards" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.2rem',
            marginBottom: '2.0rem'
          }}>
            <div className="stat-card">
              <h3>Completed</h3>
              <p>{dashboardData?.completed_tasks || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <p>{dashboardData?.pending_tasks || 0}</p>
            </div>
            {/* Budget Cards as inputs */}
            <div className="stat-card" style={{ minHeight: 140 }}>
              <h3>Received Budget</h3>
              <input
                type="number"
                value={receivedBudget}
                onChange={(e) => setReceivedBudget(Number(e.target.value))}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ccc';
                  saveBudget('received_budget', Number(e.target.value));
                }}
                disabled={savingBudget}
                style={{
                  fontSize: '1.3rem',
                  marginBottom: '0.5rem',
                  width: '100%',
                  padding: '0.6rem',
                  textAlign: 'center',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  backgroundColor: savingBudget ? '#f5f5f5' : '#fff'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              />
              <small style={{ color: '#666', fontSize: '0.9rem' }}>Tsh/=</small>
            </div>
            <div className="stat-card" style={{ minHeight: 140 }}>
              <h3>Used Budget</h3>
              <input
                type="number"
                value={usedBudget}
                onChange={(e) => setUsedBudget(Number(e.target.value))}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ccc';
                  saveBudget('used_budget', Number(e.target.value));
                }}
                disabled={savingBudget}
                style={{
                  fontSize: '1.3rem',
                  marginBottom: '0.5rem',
                  width: '100%',
                  padding: '0.6rem',
                  textAlign: 'center',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  backgroundColor: savingBudget ? '#f5f5f5' : '#fff'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              />
              <small style={{ color: '#666', fontSize: '0.9rem' }}>Tsh/=</small>
            </div>
            <div className="stat-card" style={{ minHeight: 140 }}>
              <h3>Projection</h3>
              <input
                type="number"
                value={projection}
                onChange={(e) => setProjection(Number(e.target.value))}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ccc';
                  saveBudget('projection', Number(e.target.value));
                }}
                disabled={savingBudget}
                style={{
                  fontSize: '1.3rem',
                  marginBottom: '0.5rem',
                  width: '100%',
                  padding: '0.6rem',
                  textAlign: 'center',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  backgroundColor: savingBudget ? '#f5f5f5' : '#fff'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              />
              <small style={{ color: '#666', fontSize: '0.9rem' }}>Tsh/=</small>
            </div>
          </div>

          <div className="quick-actions">
            <div className="action-card" onClick={handleAddStatistics}>
              <h4>Add Statistics</h4>
              <p>Create and manage your statistical data</p>
            </div>
            <div className="action-card" onClick={handleAddPlan}>
              <h4>Add Plan</h4>
              <p>Create new planning schedules and goals</p>
            </div>
            <div className="action-card">
              <h4>View Statistics</h4>
              <p>Access your personal statistics and reports</p>
            </div>
          </div>

          <div className="recent-activity">
            <h3>Recent Activity</h3>
            {dashboardData?.recent_activities?.length > 0 ? (
              dashboardData.recent_activities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-info">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-date">{activity.date}</div>
                  </div>
                  <span className={`activity-status ${activity.status}`}>
                    {activity.status}
                  </span>
                </div>
              ))
            ) : (
              <p>No recent activity to display.</p>
            )}
          </div>

          {/* Approvals section for head_of_department */}
          <div className="approvals-section" style={{ marginTop: 20 }}>
            <h3 style={{ marginBottom: 10 }}>Approvals</h3>
            {((!plans || plans.length === 0) && (!dashboardData?.statistics || dashboardData.statistics.length === 0)) && (
              <div style={{ color: '#666', marginBottom: 8 }}>No plans or statistics available for approval.</div>
            )}

            {/* Plans to approve */}
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ marginBottom: 8 }}>Plans</h4>
              {plans && plans.length ? plans.map(p => {
                const status = p.status || 'pending';
                // status label colors: pending=yellow, reviewed=blue, approved=green, rejected=red
                const statusColor = status === 'rejected' ? '#ef4444'
                  : status === 'approved' ? '#10b981'
                  : status === 'reviewed' ? '#2563eb'
                  : '#f59e0b';
                // View button: blue when reviewed (awaiting HoD approval), green if already approved, red if rejected
                const viewBg = status === 'rejected' ? '#dc3545'
                  : status === 'approved' ? '#28a745'
                  : '#2563eb'; // blue for reviewed (and default)
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{p.file.split('/').pop()} (by {p.uploader_name})</div>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        <div>Uploaded: {p.upload_date ? new Date(p.upload_date).toLocaleString() : 'N/A'}</div>
                        {p.approved_at_hod && <div>Approved by HoD: {new Date(p.approved_at_hod).toLocaleString()} (by {p.approved_by_hod_username || 'Unknown'})</div>}
                        <div>Awaiting HoDept Approval</div>
                      </div>
                    </div>
                    <span
                      style={{
                        background: status === 'reviewed' ? '#fff' : '',
                        color: status === 'reviewed' ? '#2563eb' : statusColor,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        padding: status === 'reviewed' ? '2px 8px' : '',
                        borderRadius: status === 'reviewed' ? '4px' : ''
                      }}
                    >
                      {status}
                    </span>
                    <button
                      style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => downloadFile(p.file, p.file.split('/').pop(), p.id, 'plan')}
                    >
                      Download
                    </button>
                    <button
                      style={{ background: viewBg, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => setViewPlan(p)}
                    >
                      View
                    </button>
                  </div>
                );
              }) : <div style={{ color: '#666' }}>No plans to approve</div>}
            </div>

            {/* NEW: Approved Plans */}
            <div style={{ marginBottom: 12, marginTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Forwarded (Reviewed) Plans</h4>
              {reviewedForwardedPlans && reviewedForwardedPlans.length ? reviewedForwardedPlans.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{p.file.split('/').pop()} (by {p.uploader_name})</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      <div>Uploaded: {p.upload_date ? new Date(p.upload_date).toLocaleString() : 'N/A'}</div>
                      {p.approved_at_hod && <div>Approved by HoD: {new Date(p.approved_at_hod).toLocaleString()} (by {p.approved_by_hod_username || 'Unknown'})</div>}
                      {p.approved_at_hod_dept && <div>Approved by HoDept: {new Date(p.approved_at_hod_dept).toLocaleString()} (by {p.approved_by_hod_dept_username || 'Unknown'})</div>}
                      <div>Awaiting DG Approval</div>
                    </div>
                  </div>
                  <span><span style={{ color: '#2563eb', fontWeight: 700, textTransform: 'capitalize' }}>reviewed</span></span>
                  <button
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => downloadFile(p.file, p.file.split('/').pop(), p.id, 'plan')}
                  >
                    Download
                  </button>
                  <button
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => setViewPlan(p)}
                  >
                    View
                  </button>
                </div>
              )) : <div style={{ color: '#666' }}>No forwarded plans</div>}
            </div>

            <div style={{ marginBottom: 12, marginTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Rejected Plans</h4>
              {rejectedPlans && rejectedPlans.length ? rejectedPlans.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{p.file.split('/').pop()} (by {p.uploader_name})</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      <div>Uploaded: {p.upload_date ? new Date(p.upload_date).toLocaleString() : 'N/A'}</div>
                      {p.approved_at_hod && <div>Approved by HoD: {new Date(p.approved_at_hod).toLocaleString()} (by {p.approved_by_hod_username || 'Unknown'})</div>}
                      {p.approved_at_hod_dept && <div>Rejected by HoDept: {new Date(p.approved_at_hod_dept).toLocaleString()} (by {p.approved_by_hod_dept_username || 'Unknown'})</div>}
                    </div>
                  </div>
                  <span><span style={{ color: '#dc3545', fontWeight: 700, textTransform: 'capitalize' }}>rejected</span></span>
                  <button
                    style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => downloadFile(p.file, p.file.split('/').pop(), p.id, 'plan')}
                  >
                    Download
                  </button>
                  <button
                    style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => setViewPlan(p)}
                  >
                    View
                  </button>
                </div>
              )) : <div style={{ color: '#666' }}>No rejected plans</div>}
            </div>

            <div style={{ marginBottom: 12, marginTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Approved Plans (Final)</h4>
              {approvedPlans && approvedPlans.length ? approvedPlans.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{p.file.split('/').pop()} (by {p.uploader_name})</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      <div>Uploaded: {p.upload_date ? new Date(p.upload_date).toLocaleString() : 'N/A'}</div>
                      {p.approved_at_hod && <div>Approved by HoD: {new Date(p.approved_at_hod).toLocaleString()} (by {p.approved_by_hod_username || 'Unknown'})</div>}
                      {p.approved_at_hod_dept && <div>Approved by HoDept: {new Date(p.approved_at_hod_dept).toLocaleString()} (by {p.approved_by_hod_dept_username || 'Unknown'})</div>}
                      {p.approved_at_dg && <div>Approved by DG: {new Date(p.approved_at_dg).toLocaleString()} (by {p.approved_by_dg_username || 'Unknown'})</div>}
                    </div>
                  </div>
                  <span><span style={{ color: '#10b981', fontWeight: 700, textTransform: 'capitalize' }}>approved</span></span>
                  <button
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => downloadFile(p.file, p.file.split('/').pop(), p.id, 'plan')}
                  >
                    Download
                  </button>
                  <button
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => setViewPlan(p)}
                  >
                    View
                  </button>
                </div>
              )) : <div style={{ color: '#666' }}>No approved plans</div>}
            </div>

            {/* NEW: Approved Statistics */}
            <div style={{ marginBottom: 12, marginTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>Approved Statistics</h4>
              {approvedStats && approvedStats.length ? approvedStats.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{s.file.split('/').pop()} (by {s.uploader_name})</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      <div>Uploaded: {s.upload_date ? new Date(s.upload_date).toLocaleString() : 'N/A'}</div>
                      {s.approved_at_hod && <div>Approved by HoD: {new Date(s.approved_at_hod).toLocaleString()} (by {s.approved_by_hod_username || 'Unknown'})</div>}
                      {s.approved_at_hod_dept && <div>Approved by HoDept: {new Date(s.approved_at_hod_dept).toLocaleString()} (by {s.approved_by_hod_dept_username || 'Unknown'})</div>}
                      {s.approved_at_dg && <div>Approved by DG: {new Date(s.approved_at_dg).toLocaleString()} (by {s.approved_by_dg_username || 'Unknown'})</div>}
                    </div>
                  </div>
                  <span><span style={{ color: '#10b981', fontWeight: 700, textTransform: 'capitalize' }}>approved</span></span>
                  <button
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => downloadFile(s.file, s.file.split('/').pop(), s.id, 'stat')}
                  >
                    Download
                  </button>
                  <button
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => setViewStat(s)}
                  >
                    View
                  </button>
                </div>
              )) : <div style={{ color: '#666' }}>No approved statistics</div>}
            </div>

            {/* Statistics to approve */}
            <div>
              <h4 style={{ marginBottom: 8 }}>Statistics</h4>
              {stats && stats.length ? stats.map(s => {
                const status = s.status || 'pending';
                const statusColor = status === 'rejected' ? '#ef4444'
                  : status === 'approved' ? '#10b981'
                  : status === 'reviewed' ? '#2563eb'
                  : '#f59e0b';
                const viewBg = status === 'rejected' ? '#dc3545'
                  : status === 'approved' ? '#28a745'
                  : '#2563eb';
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{s.file.split('/').pop()} (by {s.uploader_name})</div>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        <div>Uploaded: {s.upload_date ? new Date(s.upload_date).toLocaleString() : 'N/A'}</div>
                        {s.approved_at_hod && <div>Approved by HoD: {new Date(s.approved_at_hod).toLocaleString()} (by {s.approved_by_hod_username || 'Unknown'})</div>}
                        <div>Awaiting HoDept Approval</div>
                      </div>
                    </div>
                    <span><span style={{ color: statusColor, fontWeight: 700, textTransform: 'capitalize' }}>{status}</span></span>
                    <button
                      style={{ background: viewBg, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => setViewStat(s)}
                    >
                      View
                    </button>
                  </div>
                );
              }) : <div style={{ color: '#666' }}>No statistics to approve</div>}
            </div>

            {/* Modal for plan view/approve/reject */}
            {viewPlan && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.35)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 32,
                  minWidth: '60vw',
                  maxWidth: '60vw',
                  minHeight: '60vh',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: 18 }}>
                    {viewPlan.file.split('/').pop()} (by {viewPlan.uploader_name})
                  </h3>
                  <iframe
                    src={buildFileUrl(viewPlan.file)}
                    title="Plan Document"
                    style={{
                      width: '100%',
                      height: '50vh',
                      border: 'none',
                      marginBottom: 16,
                      background: '#f8f9fc'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      style={{ background: '#28a745', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                      onClick={() => handleApprovePlanModal(viewPlan.id)}
                    >
                      Approve
                    </button>
                    <button
                      style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                      onClick={() => handleRejectPlanModal(viewPlan.id)}
                    >
                      Reject
                    </button>
                    <button
                      style={{ background: '#888', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                      onClick={() => setViewPlan(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal for statistic view/approve/reject */}
            {viewStat && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.35)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 32,
                  minWidth: '60vw',
                  maxWidth: '60vw',
                  minHeight: '60vh',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: 18 }}>
                    {viewStat.file.split('/').pop()} (by {viewStat.uploader_name})
                  </h3>
                  <iframe
                    src={buildFileUrl(viewStat.file)}
                    title="Statistic Document"
                    style={{ width: '100%', height: '50vh', border: 'none', marginBottom: 16, background: '#f8f9fc' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      style={{ background: '#28a745', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                      onClick={() => handleApproveStatisticModal(viewStat.id)}
                    >
                      Approve
                    </button>
                    <button
                      style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                      onClick={() => handleRejectStatisticModal(viewStat.id)}
                    >
                      Reject
                    </button>
                    <button
                      style={{ background: '#888', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                      onClick={() => setViewStat(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {popupMessage && <Popup message={popupMessage} type={popupType} onClose={() => setPopupMessage('')} />}
        </div>
      </div>
    </div>
  );
};

export default HeadOfDepartmentDashboard;
