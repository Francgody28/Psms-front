import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';
import zafiriLogo from '../assets/zafiri.png';


export default function DirectorGeneralDashboard({ user, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState([]);
  const [approvedPlans, setApprovedPlans] = useState([]);
  const [approvedStats, setApprovedStats] = useState([]);
  const [viewPlan, setViewPlan] = useState(null);
  const [viewStat, setViewStat] = useState(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('update');

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, sRes] = await Promise.all([
          fetch('http://localhost:2800/api/auth/pending-plans/', { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }),
          fetch('http://localhost:2800/api/auth/pending-statistics/', { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }),
        ]);
        const [pData, sData] = await Promise.all([pRes.json(), sRes.json()]);
        setPlans(Array.isArray(pData) ? pData.filter(p => p.file) : []);
        setStats(Array.isArray(sData) ? sData.filter(s => s.file) : []);
        try {
          const aRes = await fetch('http://localhost:2800/api/auth/approved-plans/', { headers: { Authorization: `Token ${localStorage.getItem('token')}` } });
          if (aRes.ok) {
            const aData = await aRes.json();
            setApprovedPlans(Array.isArray(aData) ? aData.filter(p => p.file) : []);
          } else {
            setApprovedPlans([]);
          }
        } catch {
          setApprovedPlans([]);
        }
        try {
          const asRes = await fetch('http://localhost:2800/api/auth/approved-statistics/', { headers: { Authorization: `Token ${localStorage.getItem('token')}` } });
          if (asRes.ok) {
            const asData = await asRes.json();
            setApprovedStats(Array.isArray(asData) ? asData.filter(s => s.file) : []);
          } else {
            setApprovedStats([]);
          }
        } catch {
          setApprovedStats([]);
        }
      } catch {
        setPlans([]); setStats([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [popupMessage]);

  const Popup = ({ message, type = 'update', onClose }) => {
    useEffect(() => {
      const t = setTimeout(onClose, 2500);
      return () => clearTimeout(t);
    }, [onClose]);
    const bg = type === 'delete' ? '#dc3545' : '#28a745';
    return (
      <div style={{
        position: 'fixed', top: '30px', right: '30px',
        background: bg, color: '#fff', padding: '12px 20px',
        borderRadius: 8, zIndex: 9999, boxShadow: '0 6px 24px rgba(0,0,0,0.15)'
      }}>
        {message}
      </div>
    );
  };

  const doReviewPlan = async (planId, action) => {
    try {
      const res = await fetch(`http://localhost:2800/api/auth/review-plan/${planId}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} plan`);
      setPopupMessage(data.message || `Plan ${action}d`);
      setPopupType(action === 'approve' ? 'update' : 'delete');
      setViewPlan(null);
      if (action === 'approve' && viewPlan) {
        setApprovedPlans(prev => [...prev, { ...viewPlan, status: 'approved' }]);
        setPlans(prev => prev.filter(p => p.id !== planId));
      }
    } catch (err) {
      setPopupMessage(err.message || `Failed to ${action} plan`);
      setPopupType('delete');
    }
  };

  const doReviewStat = async (statId, action) => {
    try {
      const res = await fetch(`http://localhost:2800/api/auth/review-statistic/${statId}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} statistic`);
      setPopupMessage(data.message || `Statistic ${action}d`);
      setPopupType(action === 'approve' ? 'update' : 'delete');
      setViewStat(null);
    } catch (err) {
      setPopupMessage(err.message || `Failed to ${action} statistic`);
      setPopupType('delete');
    }
  };

  if (loading) return <div className="dashboard-loading">Loading dashboard...</div>;

  return (
    <div className="user-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-logo">
          <img src={zafiriLogo} alt="Zafiri Logo" style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 8 }} />
          <h2>PSMS</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li onClick={() => navigate('/')} style={{ cursor: 'pointer' }} className="active">Dashboard</li>
            <li onClick={() => navigate('/statistics-dashboard')} style={{ cursor: 'pointer' }}>Statistics</li>
            <li onClick={() => navigate('/planning-dashboard')} style={{ cursor: 'pointer' }}>Plans</li>
            <li onClick={onLogout} style={{ cursor: 'pointer', color: '#fff' }}>Logout</li>
          </ul>
        </nav>
      </div>
      <div className="dashboard-main">
        <header className="dashboard-header">
          <h1>Welcome, {user?.first_name || user?.username || 'Director General'}!</h1>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </header>

        <div className="dashboard-content">
          <div className="welcome-card">
            <h2>Director General Dashboard</h2>
            <p>Approve organization plans and statistics. Items stay "reviewed" until you approve.</p>
          </div>

          <div className="stats">
            <div className="stat-card">
              <h3>Pending Plans</h3>
              <p>{plans.length}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Statistics</h3>
              <p>{stats.length}</p>
            </div>
            <div className="stat-card">
              <h3>Approvals Today</h3>
              <p>0</p>
            </div>
          </div>

          <div className="recent-activity">
            <h3>Plans Awaiting Approval</h3>
            {plans.length ? plans.map(p => {
              const name = p.file.split('/').pop();
              return (
                <div key={p.id} className="activity-item">
                  <div className="activity-info">
                    <div className="activity-title">{name}</div>
                    <div className="activity-date">{p.upload_date || p.uploaded_at || ''}</div>
                  </div>
                  <span className="activity-status reviewed">reviewed</span>
                  <button style={{ marginLeft: 10 }} onClick={() => setViewPlan(p)}>View</button>
                </div>
              );
            }) : <p>No plans to approve.</p>}
          </div>

          <div className="recent-activity">
            <h3>Statistics Awaiting Approval</h3>
            {stats.length ? stats.map(s => {
              const name = s.file.split('/').pop();
              return (
                <div key={s.id} className="activity-item">
                  <div className="activity-info">
                    <div className="activity-title">{name}</div>
                    <div className="activity-date">{s.upload_date || s.uploaded_at || ''}</div>
                  </div>
                  <span className="activity-status reviewed">reviewed</span>
                  <button style={{ marginLeft: 10 }} onClick={() => setViewStat(s)}>View</button>
                </div>
              );
            }) : <p>No statistics to approve.</p>}
          </div>

          <div className="recent-activity">
            <h3>Approved Plans</h3>
            {approvedPlans.length ? approvedPlans.map(p => {
              const name = p.file.split('/').pop();
              return (
                <div key={p.id} className="activity-item">
                  <div className="activity-info">
                    <div className="activity-title">{name}</div>
                    <div className="activity-date">{p.upload_date || p.uploaded_at || ''}</div>
                  </div>
                  <span className="activity-status approved">approved</span>
                  <button style={{ marginLeft: 10 }} onClick={() => setViewPlan(p)}>View</button>
                </div>
              );
            }) : <p>No approved plans.</p>}
          </div>

          <div className="recent-activity">
            <h3>Approved Statistics</h3>
            {approvedStats.length ? approvedStats.map(s => {
              const name = s.file.split('/').pop();
              return (
                <div key={s.id} className="activity-item">
                  <div className="activity-info">
                    <div className="activity-title">{name}</div>
                    <div className="activity-date">{s.upload_date || s.uploaded_at || ''}</div>
                  </div>
                  <span className="activity-status approved">approved</span>
                  <button style={{ marginLeft: 10 }} onClick={() => setViewStat(s)}>View</button>
                </div>
              );
            }) : <p>No approved statistics.</p>}
          </div>

          {viewPlan && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                background: '#fff', borderRadius: 12, padding: 32, minWidth: '60vw', maxWidth: '60vw', minHeight: '60vh',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: 18 }}>
                  {viewPlan.file.split('/').pop()} (by {viewPlan.uploader_name})
                </h3>
                <iframe
                  src={`http://localhost:2800/media/${viewPlan.file}`}
                  title="Plan Document"
                  style={{ width: '100%', height: '50vh', border: 'none', marginBottom: 16, background: '#f8f9fc' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    style={{ background: '#28a745', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => doReviewPlan(viewPlan.id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => doReviewPlan(viewPlan.id, 'reject')}
                  >
                    Reject
                  </button>
                  <button
                    style={{ background: '#888', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setViewPlan(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {viewStat && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                background: '#fff', borderRadius: 12, padding: 32, minWidth: '60vw', maxWidth: '60vw', minHeight: '60vh',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
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
                    style={{ background: '#28a745', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => doReviewStat(viewStat.id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => doReviewStat(viewStat.id, 'reject')}
                  >
                    Reject
                  </button>
                  <button
                    style={{ background: '#888', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setViewStat(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {popupMessage && <Popup message={popupMessage} type={popupType} onClose={() => setPopupMessage('')} />}
        </div>
      </div>
    </div>
  );
}
