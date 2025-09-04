import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import zafiriLogo from '../assets/zafiri.png';
import '../components/UserDashboard.css';

const HeadOfDivisionDashboard = ({ user, onLogout }) => {
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

  const navigate = useNavigate();

  // Only allow head_of_division role

  // NEW: move above useEffect to avoid TDZ
  const fetchApprovedPlans = React.useCallback(async () => {
    try {
      const res = await fetch('http://localhost:2800/api/auth/approved-plans/', {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to load approved plans');
      const data = await res.json();
      setApprovedPlans(Array.isArray(data) ? data.filter(p => p.file) : []);
    } catch {
      setApprovedPlans(plans.filter?.(p => p.status === 'approved') || []);
    }
  }, [plans]);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingPlans();
    // fetch statistics pending for HoD
    (async () => {
      try {
        const res = await fetch('http://localhost:2800/api/auth/pending-statistics/', {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        setStats(Array.isArray(data) ? data.filter(s => s.file) : []);
      } catch {
        setStats([]);
      }
    })();
    fetchApprovedPlans();
  }, [popupMessage, fetchApprovedPlans]);

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
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      setPlans(Array.isArray(data) ? data.filter(p => p.file) : []);
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

  // simple toast popup (auto-dismiss)
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
      fetchDashboardData();
      fetchPendingPlans();
      // Optimistic update with duplicate guard
      setApprovedPlans(prev => {
        const approved = plans.find(p => p.id === planId) || viewPlan;
        if (!approved) return prev;
        const exists = prev.some(pp => pp.id === approved.id);
        return exists
          ? prev.map(pp => (pp.id === approved.id ? { ...pp, status: 'approved' } : pp))
          : [...prev, { ...approved, status: 'approved' }];
      });
      setPlans(prev => prev.filter(p => p.id !== planId));
      fetchApprovedPlans();
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
      // refresh lists
      (async () => {
        try {
          const r2 = await fetch('http://localhost:2800/api/auth/pending-statistics/', {
            headers: { Authorization: `Token ${localStorage.getItem('token')}` },
          });
          const d2 = await r2.json(); // FIX: read JSON once
          setStats(Array.isArray(d2) ? d2.filter(s => s.file) : []);
        } catch {
          // Ignore errors while fetching statistics
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
      // refresh
      (async () => {
        try {
          const r2 = await fetch('http://localhost:2800/api/auth/pending-statistics/', {
            headers: { Authorization: `Token ${localStorage.getItem('token')}` },
          });
          const d2 = await r2.json(); // FIX: read JSON once
          setStats(Array.isArray(d2) ? d2.filter(s => s.file) : []);
        } catch {
          // Ignore errors while fetching statistics
        }
      })();
    } catch (err) {
      setPopupMessage(err.message || 'Failed to reject statistic');
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
            <li onClick={() => navigate('/planning-dashboard')} style={{ cursor: 'pointer' }}>Plans</li>
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
            <p>Welcome Head of Division. Here you can manage your tasks, view statistics, approve plans/statistics, and access planning tools.</p>
          </div>

          <div className="stats">
            <div className="stat-card">
              <h3>My Tasks</h3>
              <p>{dashboardData?.my_tasks || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Completed</h3>
              <p>{dashboardData?.completed_tasks || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <p>{dashboardData?.pending_tasks || 0}</p>
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

          {/* Approvals section for head_of_division */}
          <div className="approvals-section" style={{ marginTop: 20 }}>
            <h3 style={{ marginBottom: 10 }}>Approvals</h3>
            {((!plans || plans.length === 0) && (!stats || stats.length === 0)) && (
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
                const viewBg = status === 'rejected' ? '#dc3545'
                  : status === 'reviewed' || status === 'approved' ? '#28a745'
                  : '#2563eb';
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      {p.file.split('/').pop()} (by {p.uploader_name})
                    </div>
                    <span className={`activity-status ${status}`} style={{ backgroundColor: '', color: '' }}>
                      <span style={{ color: statusColor, fontWeight: 700, textTransform: 'capitalize' }}>{status}</span>
                    </span>
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
              <h4 style={{ marginBottom: 8 }}>Approved Plans</h4>
              {approvedPlans && approvedPlans.length ? approvedPlans.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    {p.file.split('/').pop()} (by {p.uploader_name})
                  </div>
                  <span><span style={{ color: '#10b981', fontWeight: 700, textTransform: 'capitalize' }}>approved</span></span>
                  <button
                    style={{ background: '#28a745', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => setViewPlan(p)}
                  >
                    View
                  </button>
                </div>
              )) : <div style={{ color: '#666' }}>No approved plans</div>}
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
                  : status === 'reviewed' || status === 'approved' ? '#28a745'
                  : '#2563eb';
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>{s.file.split('/').pop()} (by {s.uploader_name})</div>
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
                    src={`http://localhost:2800/media/${viewPlan.file}`}
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
                    src={`http://localhost:2800/media/${viewStat.file}`}
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

export default HeadOfDivisionDashboard;
