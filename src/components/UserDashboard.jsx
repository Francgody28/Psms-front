import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './UserDashboard.css';

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
    // TODO: Navigate to add statistics page or open modal
    console.log('Add Statistics clicked');
  };

  const handleAddPlan = () => {
    // TODO: Navigate to add plan page or open modal
    console.log('Add Plan clicked');
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

  const handleApprovePlan = async (planId) => {
    try {
      const res = await api.approvePlan(planId);
      setPopupMessage(res.message || 'Plan approved');
      setPopupType('update');
      fetchDashboardData();
    } catch (err) {
      setPopupMessage(err.message || 'Failed to approve plan');
      setPopupType('delete');
    }
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

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="user-dashboard">
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
          <div className="action-card">
            <h4>Create Task</h4>
            <p>Add new tasks to your planning schedule</p>
          </div>
          <div className="action-card">
            <h4>Reports</h4>
            <p>Generate and view your progress reports</p>
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
            {(!dashboardData?.plans || dashboardData.plans.length === 0) && (!dashboardData?.statistics || dashboardData.statistics.length === 0) && (
              <div style={{ color: '#666', marginBottom: 8 }}>No plans or statistics available for approval.</div>
            )}

            {/* Plans to approve (backend should supply dashboardData.plans) */}
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ marginBottom: 8 }}>Plans</h4>
              {dashboardData?.plans?.length ? dashboardData.plans.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>{p.title}</div>
                  <button onClick={() => handleApprovePlan(p.id)} style={{
                    background: '#28a745', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer'
                  }}>
                    Approve
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
          </div>
        ) : (
          <div style={{ marginTop: 20, color: '#666' }}>
            Approvals are available only for Heads of Division / Department.
          </div>
        )}

        {popupMessage && <Popup message={popupMessage} type={popupType} onClose={() => setPopupMessage('')} />}
      </div>
    </div>
  );
};

export default SimpleUserDashboard;
