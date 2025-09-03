import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './UserDashboard.css';
import { useNavigate } from 'react-router-dom';
import zafiriLogo from '../assets/zafiri.png';

const StatisticsDashboard = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType] = useState('update');

  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  const [profileState, setProfileState] = useState(stored);

  // Add upload + my stats state
  const [refreshKey, setRefreshKey] = useState(0);
  const [myStats, setMyStats] = useState([]);
  const fileInputId = 'stat-upload-input';

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    if (!profileState) {
      (async () => {
        try {
          const pf = await api.getProfile();
          localStorage.setItem('user', JSON.stringify(pf));
          localStorage.setItem('role', pf.role || '');
          setProfileState(pf);
        } catch (err) {
          console.warn('Failed to load profile on mount', err);
        }
      })();
    }
    // eslint-disable-next-line
  }, [profileState, refreshKey]);

  // Fetch my statistics (for pending on statistics officer)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('http://localhost:2800/api/auth/my-statistics/', {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error('Failed to load my statistics');
        const data = await res.json();
        setMyStats(Array.isArray(data) ? data : []);
      } catch {
        setMyStats([]);
      }
    };
    load();
  }, [refreshKey]);

  const fetchDashboardData = async () => {
    try {
      const data = await api.getUserDashboard();
      setDashboardData(data);

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

  const handleUploadClick = () => {
    const input = document.getElementById(fileInputId);
    if (input) input.click();
  };

  const handleFileChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('http://localhost:2800/api/auth/upload-statistic/', {
        method: 'POST',
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setPopupMessage('Data uploaded successfully');
      setRefreshKey(k => k + 1);
    } catch (err) {
      setPopupMessage(err.message || 'Upload failed');
    } finally {
      e.target.value = '';
    }
  };

  // Sidebar navigation handlers
  const handleSidebarNav = (route) => {
    navigate(route);
  };

  // Simple toast popup (auto-dismiss)
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

  // Responsive CSS for dashboard
  const responsiveStyle = `
    @media (max-width: 900px) {
      .user-dashboard {
        flex-direction: column !important;
      }
      .dashboard-sidebar {
        width: 100% !important;
        min-width: 0 !important;
        flex-direction: row !important;
        align-items: center !important;
        padding: 10px 0 !important;
        height: auto !important;
      }
      .sidebar-logo {
        flex-direction: row !important;
        align-items: center !important;
        margin-bottom: 0 !important;
        margin-right: 16px !important;
      }
      .sidebar-logo img {
        margin-bottom: 0 !important;
        margin-right: 8px !important;
      }
      .sidebar-nav ul {
        flex-direction: row !important;
        gap: 16px !important;
      }
      .dashboard-main {
        width: 100% !important;
        padding: 12px !important;
      }
    }
    @media (max-width: 600px) {
      .dashboard-main {
        padding: 4px !important;
      }
      .welcome-card, .stat-card, .action-card, .recent-activity {
        min-width: 0 !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .stats, .quick-actions {
        flex-direction: column !important;
        gap: 8px !important;
      }
      .dashboard-header {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 8px !important;
      }
    }
  `;

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  // Statistics-specific data
  const statistics = [
    { title: 'Total Reports', value: dashboardData?.total_reports || 0 },
    { title: 'Pending Statistics', value: dashboardData?.pending_statistics || 0 },
    { title: 'Approved Statistics', value: dashboardData?.approved_statistics || 0 },
  ];

  return (
    <>
      <style>{responsiveStyle}</style>
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
              <li onClick={() => handleSidebarNav('/dashboard')}>Dashboard</li>
              <li className="active" onClick={() => handleSidebarNav('/statistics-dashboard')}>Statistics</li>
              <li onClick={handleLogout} style={{ cursor: 'pointer', color: '#fff' }}>Logout</li>
            </ul>
          </nav>
        </div>
        <div className="dashboard-main">
          <header className="dashboard-header">
            <h1>Welcome, {user?.first_name || user?.username || 'Statistics Officer'}!</h1>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </header>
          <div className="dashboard-content">
            <div className="welcome-card">
              <h2>Statistics Management System</h2>
              <p>Welcome Statistics Officer. Here you can manage your statistical data, create reports, and analyze trends.</p>
            </div>

            <div className="stats">
              {statistics.map((stat, idx) => (
                <div className="stat-card" key={idx}>
                  <h3>{stat.title}</h3>
                  <p>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="quick-actions">
              <div className="action-card">
                <h4>Create Statistics</h4>
                <p>Create and manage your statistical data</p>
              </div>
              <div className="action-card" onClick={handleUploadClick} style={{ cursor: 'pointer' }}>
                <h4>Upload Data</h4>
                <p>Upload statistical datasets and reports</p>
                <input
                  id={fileInputId}
                  type="file"
                  accept=".xlsx,.xls,.doc,.docx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="action-card">
                <h4>Generate Reports</h4>
                <p>Generate comprehensive statistical reports</p>
              </div>
            </div>

            <div className="recent-activity">
              <h3>Recent Statistical Activity</h3>
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
                <p>No recent statistical activity to display.</p>
              )}
            </div>

            {/* My Data (pending/reviewed/approved/rejected) */}
            <div className="recent-activity">
              <h3>My Data</h3>
              {myStats.length ? myStats.map((s, idx) => {
                const status = s.status || 'pending';
                let color = '#6b7280';
                if (status === 'pending') color = '#f59e0b';
                else if (status === 'reviewed') color = '#2563eb';
                else if (status === 'approved') color = '#10b981';
                else if (status === 'rejected') color = '#ef4444';
                return (
                  <div key={s.id || idx} className="activity-item">
                    <div className="activity-info">
                      <div className="activity-title">{s.file ? s.file.split('/').pop() : 'Data'}</div>
                      <div className="activity-date">{s.uploaded_at ? new Date(s.uploaded_at).toLocaleString() : ''}</div>
                    </div>
                    <span style={{ color, fontWeight: 700, textTransform: 'capitalize' }}>{status}</span>
                  </div>
                );
              }) : <p>No uploads yet.</p>}
            </div>

            {popupMessage && <Popup message={popupMessage} type={popupType} onClose={() => setPopupMessage('')} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default StatisticsDashboard;
