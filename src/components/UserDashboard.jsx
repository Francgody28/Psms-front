import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './UserDashboard.css';
import { useNavigate } from 'react-router-dom';
import zafiriLogo from '../assets/zafiri.png';

const SimpleUserDashboard = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('update');

  // keep profile in state so we can update it after login/profile fetch
  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  const [profileState, setProfileState] = useState(stored);

  // derived role from profile state or props/localStorage fallback
  const role = profileState?.role || localStorage.getItem('role') || (user && user.role) || '';

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    // ensure profile is loaded; fetch if not present
    if (!profileState) {
      (async () => {
        try {
          const pf = await api.getProfile();
          localStorage.setItem('user', JSON.stringify(pf));
          localStorage.setItem('role', pf.role || '');
          setProfileState(pf);
          console.log('Profile loaded:', pf);
        } catch (err) {
          console.warn('Failed to load profile on mount', err);
        }
      })();
    }
  });

  const fetchDashboardData = async () => {
    try {
      const data = await api.getUserDashboard();
      console.log('fetched dashboardData:', data);
      setDashboardData(data);

      // If profileState has no role, try to take role from dashboard response
      const dataRole = data?.user_info?.role;
      if (dataRole && (!profileState || !profileState.role)) {
        const updatedProfile = { ...(profileState || {}), role: dataRole, username: data.user_info.username || (profileState && profileState.username) };
        setProfileState(updatedProfile);
        localStorage.setItem('user', JSON.stringify(updatedProfile));
        localStorage.setItem('role', dataRole);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // debug: show role and whether approvals will be shown
  useEffect(() => {
    console.log('Current role:', role);
    console.log('Will show approvals?:', (role === 'head_of_department' || role === 'head_of_division'));
  }, [role, dashboardData]);

  const handleLogout = async () => {
    try {
      await api.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout();
    }
  };

  const handleAddStatistics = () => {
    navigate('/statistics-dashboard');
  };

  const handleAddPlan = () => {
    // Navigate to planning dashboard
    navigate('/planning-dashboard');
  };

  // simple toast popup (auto-dismiss)
  const Popup = ({ message, type='update', onClose }) => {
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


  const handleApproveStatistic = async (statId) => {
    try {
      const res = await api.approveStatistic(statId);
      setPopupMessage(res.message || 'Statistic approved');
      setPopupType('update');
      fetchDashboardData();
    } catch (err) {
      setPopupMessage(err.message || 'Failed to approve statistic');
      setPopupType('delete');
    }
  };

  const [plans, setPlans] = useState([]);
  // Add state for modal view
  const [viewPlan, setViewPlan] = useState(null);

  // Fetch pending plans for approval if head_of_division or head_of_department
  useEffect(() => {
    if (role === 'head_of_division' || role === 'head_of_department') {
      fetch('http://localhost:2800/api/auth/pending-plans/', {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          setPlans(Array.isArray(data) ? data.filter(p => p.file) : []);
        });
    }
  }, [role, popupMessage]);

  // Approve and reject handlers for modal
  const handleApprovePlanModal = async (planId) => {
    try {
      const res = await api.approvePlan(planId);
      setPopupMessage(res.message || 'Plan approved');
      setPopupType('update');
      setViewPlan(null);
      fetchDashboardData();
    } catch (err) {
      setPopupMessage(err.message || 'Failed to approve plan');
      setPopupType('delete');
    }
  };

  const handleRejectPlanModal = async () => {
    // Implement your reject logic here (e.g., call an API endpoint to reject)
    setPopupMessage('Plan rejected (implement backend logic)');
    setPopupType('delete');
    setViewPlan(null);
    fetchDashboardData();
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-logo">
          {/* Add Zafiri logo image */}
          <img
            src={zafiriLogo}
            alt="Zafiri Logo"
            style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 8 }}
          />
          <h2>PSMS</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>Dashboard</li>
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
            <p>Welcome employee. Here you can manage your tasks, view statistics, and access planning tools.</p>
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

          {/* approvals panel shown only for head_of_department or head_of_division */}
          {(role === 'head_of_department' || role === 'head_of_division') ? (
            <div className="approvals-section" style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 10 }}>Approvals</h3>
              {/* quick info when no plans/statistics exist */}
              {((!plans || plans.length === 0) && (!dashboardData?.statistics || dashboardData.statistics.length === 0)) && (
                <div style={{ color: '#666', marginBottom: 8 }}>No plans or statistics available for approval.</div>
              )}

              {/* Plans to approve (fetched from backend) */}
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ marginBottom: 8 }}>Plans</h4>
                {plans && plans.length ? plans.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      {p.file.split('/').pop()} (by {p.uploader_name})
                    </div>
                    <button
                      style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                      onClick={() => setViewPlan(p)}
                    >
                      View
                    </button>
                  </div>
                )) : <div style={{ color: '#666' }}>No plans to approve</div>}
              </div>

              {/* Statistics to approve (backend should supply dashboardData.statistics) */}
              <div>
                <h4 style={{ marginBottom: 8 }}>Statistics</h4>
                {dashboardData?.statistics?.length ? dashboardData.statistics.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>{s.title}</div>
                    <button onClick={() => handleApproveStatistic(s.id)} style={{
                      background: '#28a745', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer'
                    }}>
                      Approve
                    </button>
                  </div>
                )) : <div style={{ color: '#666' }}>No statistics to approve</div>}
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
                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
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
            </div>
          ) : (
            <div style={{ marginTop: 20, color: '#666' }}>
              Approvals are available only for Heads of Division / Department.
            </div>
          )}

          {popupMessage && <Popup message={popupMessage} type={popupType} onClose={() => setPopupMessage('')} />}
        </div>
      </div>
    </div>
  );
};

export default SimpleUserDashboard;