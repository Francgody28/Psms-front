import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import './UserDashboard.css';
import { useNavigate } from 'react-router-dom';
import zafiriLogo from '../assets/zafiri.png';
import Chart from 'chart.js/auto'; // Add at the top
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StatisticsDashboard = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  const [profileState, setProfileState] = useState(stored);

  // Add upload + my stats state
  const [refreshKey, setRefreshKey] = useState(0);
  const [myStats, setMyStats] = useState([]);
  const fileInputRef = useRef(null);

  // Statistics approvals
  const [pendingStats, setPendingStats] = useState([]);
  const [approvedStats, setApprovedStats] = useState([]);

  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const navigate = useNavigate();

  // Add budget states
  const [receivedBudget, setReceivedBudget] = useState(0);
  const [usedBudget, setUsedBudget] = useState(0);
  const [projection, setProjection] = useState(0);

  const handleSidebarNav = (route) => {
    navigate(route);
  };

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

  // Remove localStorage budget loader and use backend instead
  // Load budgets from backend
  const loadBudget = async () => {
    try {
      const res = await fetch('http://localhost:2800/api/auth/budget/', {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setReceivedBudget(Number(data.received_budget || 0));
      setUsedBudget(Number(data.used_budget || 0));
      setProjection(Number(data.projection || 0));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadBudget();
    const onFocus = () => loadBudget();
    window.addEventListener('focus', onFocus);
    const t = setInterval(loadBudget, 5000);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, []);

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

  // Fetch pending statistics for approval (for heads)
  useEffect(() => {
    const loadPending = async () => {
      try {
        const res = await fetch('http://localhost:2800/api/auth/pending-statistics/', {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        });
        if (!res.ok) {
          console.log('Failed to load pending statistics:', res.status, res.statusText);
          return;
        }
        const data = await res.json();
        setPendingStats(Array.isArray(data) ? data.filter(s => s.file) : []);
      } catch (error) {
        console.log('Error loading pending statistics:', error);
        setPendingStats([]);
      }
    };
    loadPending();
  }, [refreshKey]);

  // Fetch approved statistics
  useEffect(() => {
    const loadApproved = async () => {
      try {
        const res = await fetch('http://localhost:2800/api/auth/approved-statistics/', {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error('Failed to load approved statistics');
        const data = await res.json();
        setApprovedStats(Array.isArray(data) ? data.filter(s => s.file) : []);
      } catch {
        setApprovedStats([]);
      }
    };
    loadApproved();
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
        console.log('Updated profile with role:', dataRole);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // reset so same file can be selected again
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);
      setFilePreview(URL.createObjectURL(file));
      setShowPreview(true);
      setShowPreview(true);
      setShowPreview(true);
    }
  };

  const handleCancelUpload = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setSelectedFile(null);
    setFilePreview(null);
    setFileName('');
    setShowPreview(false);
  };

  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [selectedStatType, setSelectedStatType] = useState('');

  // Add state for viewing statistics
  const [viewStat, setViewStat] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [selectedChartType, setSelectedChartType] = useState('');
  const [reportData, setReportData] = useState([]);
  const [reportSummary, setReportSummary] = useState('');
  const [reportCreated, setReportCreated] = useState(false);
  const chartRef = useRef(null);

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const handleReportTypeChange = (type) => {
    setSelectedReportType(type);
    // Filter statistics by period
    const filtered = myStats.filter(s => {
      const date = new Date(s.uploaded_at);
      if (type === 'first_quarter') return date.getMonth() < 3;
      if (type === 'third_quarter') return date.getMonth() >= 6 && date.getMonth() < 9;
      if (type === 'semi_annual') return date.getMonth() < 6;
      if (type === 'annual') return true;
      return true;
    });
    setReportData(filtered);
  };

  const handleChartTypeChange = (type) => {
    setSelectedChartType(type);
  };


  const handleCreateReport = async () => {
    // Calculate summary: rising/falling
    if (!reportData.length) return;
    // Use a dummy value field, replace with your actual value field
    const values = reportData.map(s => s.value || 1);
    let summary = '';
    if (values.length > 1) {
      const trend = values[values.length - 1] - values[0];
      if (trend > 0) summary = 'The statistics are rising over the selected period.';
      else if (trend < 0) summary = 'The statistics are falling over the selected period.';
      else summary = 'The statistics are stable over the selected period.';
    } else {
      summary = 'Not enough data to determine trend.';
    }
    setReportSummary(summary);
    setReportCreated(true);
  };

  const handleDownloadPDF = async () => {
    // Export chart and summary as PDF
    const input = document.getElementById('report-pdf-content');
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - 20;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.text(`Statistics Report: ${selectedReportType.replace('_', ' ')}`, 10, 10);
    pdf.addImage(imgData, 'PNG', 10, 20, pdfWidth, pdfHeight);
    pdf.text(reportSummary, 10, pdfHeight + 30);
    pdf.save('statistics_report.pdf');
  };

  // Render chart after selections
  useEffect(() => {
    if (selectedChartType && reportData.length && chartRef.current) {
      // Destroy previous chart instance if exists
      if (chartRef.current._chartInstance) {
        chartRef.current._chartInstance.destroy();
      }
      // Example: render a bar chart
      chartRef.current._chartInstance = new Chart(chartRef.current, {
        type: selectedChartType, // 'bar', 'line', 'pie'
        data: {
          labels: reportData.map(s => s.file ? s.file.split('/').pop() : 'Stat'),
          datasets: [{
            label: 'Statistics',
            data: reportData.map(s => s.value || 1), // Replace with actual value field
            backgroundColor: '#2563eb'
          }]
        }
      });
    }
  }, [selectedChartType, reportData]);

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_date', new Date().toISOString());
    if (selectedStatType) {
      formData.append('stat_type', selectedStatType);
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = 'http://localhost:2800/api/auth/upload-statistic/';
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });
      
      if (!res.ok) {
        let errMsg = '';
        try {
          const err = await res.json();
          errMsg = err.error || res.statusText;
        } catch {
          errMsg = res.statusText || 'Unknown error';
        }
        alert('Upload failed: ' + errMsg);
        return;
      }
      
      const uploadResult = await res.json();
      console.log('Upload result:', uploadResult);
      alert('File uploaded successfully!');
      
      // Trigger refresh of activities
      setRefreshKey(prev => prev + 1);
      
    } catch (e) {
      console.error('Upload error:', e);
      alert('Upload error: ' + e.message);
    }
    if (filePreview) URL.revokeObjectURL(filePreview);
    setSelectedFile(null);
    setFilePreview(null);
    setFileName('');
    setShowPreview(false);
    setSelectedStatType(''); // Reset after upload
  };

  // Approve statistic handler
  const handleApproveStatisticModal = async (statId) => {
    try {
      const res = await fetch(`http://localhost:2800/api/auth/review-statistic/${statId}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'approve' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve statistic');
      alert(data.message || 'Statistic approved successfully');
      setRefreshKey(k => k + 1);
    } catch (err) {
      alert(err.message || 'Failed to approve statistic');
    }
  };

  // Reject statistic handler
  const handleRejectStatisticModal = async (statId) => {
    try {
      const res = await fetch(`http://localhost:2800/api/auth/review-statistic/${statId}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reject' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject statistic');
      alert(data.message || 'Statistic rejected successfully');
      setRefreshKey(k => k + 1);
    } catch (err) {
      alert(err.message || 'Failed to reject statistic');
    }
  };

  // Enhanced renderFilePreview with better sizing
  const renderFilePreview = () => {
    if (!selectedFile || !filePreview) return null;
    const isImage = /\.(jpg|png)$/i.test(fileName);
    const isPDF = /\.pdf$/i.test(fileName);
    return (
      <div className="file-preview" style={{ width: '100%', height: 'auto' }}>
        <h4>File Preview:</h4>
        <div className="preview-container" style={{ width: '100%', height: 'auto' }}>
          {isImage && <img src={filePreview} alt="Preview" className="image-preview" style={{ maxWidth: '100%', height: 'auto', maxHeight: '60vh' }} />}
          {isPDF && <iframe src={filePreview} title="PDF Preview" className="pdf-preview" style={{ width: '100%', height: '70vh', border: 'none' }} />}
          {!isImage && !isPDF && (
            <div style={{ fontSize: 22, marginBottom: 16, background: '#f8f9fc', padding: '2rem 1rem', borderRadius: 10, minHeight: '30vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{fileName}</div>
              <div style={{ color: '#555', fontSize: 15 }}>Preview not supported for this file type.</div>
            </div>
          )}
          <button type="button" onClick={handleCancelUpload} className="remove-file-btn" style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', marginTop: 10 }}>
            Remove File
          </button>
        </div>
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

  useEffect(() => {
    console.log('User object:', user);
    console.log('User role:', user?.role);
    console.log('Profile state:', profileState);
    console.log('Profile state role:', profileState?.role);
  }, [user, profileState]);

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  // Statistics-specific data
  const statistics = [
    { title: 'Total Reports', value: dashboardData?.total_reports ?? (myStats.length + pendingStats.length + approvedStats.length) },
    { title: 'Pending Statistics', value: dashboardData?.pending_statistics ?? pendingStats.length },
    { title: 'Approved Statistics', value: dashboardData?.approved_statistics ?? approvedStats.length },
  ];

  // Button styles
  const blueBtn = {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    padding: '10px 24px',
    margin: '8px 8px 0 0',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
    boxShadow: '0 2px 8px rgba(37,99,235,0.08)'
  };

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

            <div className="stats-cards" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.2rem',
            marginBottom: '2.0rem'
          }}>
              {statistics.map((stat, idx) => (
                <div className="stat-card" key={idx}>
                  <h3>{stat.title}</h3>
                  <p>{stat.value}</p>
                </div>
              ))}
              {/* Budget Cards as labels */}
              <div className="stat-card" style={{ minHeight: 120 }}>
                <h3>Received Budget</h3>
              <p style={{fontSize: '1.6rem', marginBottom: 0, width: '100%', padding: '0.6rem', textAlign: 'center' }}>
                {receivedBudget.toLocaleString()}Tsh/=
              </p>
              </div>
              <div className="stat-card" style={{ minHeight: 120 }}>
                <h3>Used Budget</h3>
                <p style={{fontSize: '1.6rem', marginBottom: 0, width: '100%', padding: '0.6rem', textAlign: 'center'}}>
                  {usedBudget.toLocaleString()}Tsh/=
                </p>
              </div>
              <div className="stat-card" style={{ minHeight: 120 }}>
                <h3>Projection</h3>
                <p style={{ fontSize: '1.6rem', marginBottom: 0, width: '100%', padding: '0.6rem', textAlign: 'center'}}>
                  {projection.toLocaleString()}Tsh/=
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button style={blueBtn} onClick={() => setShowCreateDropdown(!showCreateDropdown)}>Create Statistics</button>
                {showCreateDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    zIndex: 10,
                    minWidth: '150px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div
                      onClick={() => { setSelectedStatType('monthly'); setShowCreateDropdown(false); handleUploadClick(); }}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                      onMouseLeave={(e) => e.target.style.background = '#fff'}
                    >
                      Monthly
                    </div>
                    <div
                      onClick={() => { setSelectedStatType('quarterly'); setShowCreateDropdown(false); handleUploadClick(); }}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                      onMouseLeave={(e) => e.target.style.background = '#fff'}
                    >
                      Quarterly
                    </div>
                    <div
                      onClick={() => { setSelectedStatType('semi-annually'); setShowCreateDropdown(false); handleUploadClick(); }}
                      style={{ padding: '8px 12px', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                      onMouseLeave={(e) => e.target.style.background = '#fff'}
                    >
                      Semi-Annually
                    </div>
                  </div>
                )}
              </div>
              <button style={blueBtn} onClick={handleUploadClick}>Upload Statistics</button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".xlsx,.xls,.doc,.docx,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                onChange={handleFileChange}
              />
            </div>

            <div className="quick-actions">
              <div className="action-card" onClick={handleGenerateReport}>
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
                    {status === 'pending' && (
                      <>
                        <button
                          style={{ background: '#28a745', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', marginLeft: 10 }}
                          onClick={() => handleApproveStatisticModal(s.id)}
                        >
                          Approve
                        </button>
                        <button
                          style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', marginLeft: 10 }}
                          onClick={() => handleRejectStatisticModal(s.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                );
              }) : <p>No uploads yet.</p>}
            </div>

            {/* Approvals section for heads */}
            {(user?.role === 'head_of_division' || user?.role === 'head_of_department' || user?.role === 'director_general' || profileState?.role === 'head_of_division' || profileState?.role === 'head_of_department' || profileState?.role === 'director_general') && (
              <div className="approvals-section" style={{ marginTop: 20 }}>
                <h3 style={{ marginBottom: 10 }}>Statistics Approvals</h3>
                {((!pendingStats || pendingStats.length === 0) && (!approvedStats || approvedStats.length === 0)) && (
                  <div style={{ color: '#666', marginBottom: 8 }}>No statistics available for approval.</div>
                )}

                {/* Pending Statistics to approve */}
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ marginBottom: 8 }}>Pending Statistics</h4>
                  {pendingStats && pendingStats.length ? pendingStats.map(s => {
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
                        <div style={{ flex: 1 }}>
                          {s.file.split('/').pop()} (by {s.uploader_name})
                        </div>
                        <span style={{ color: statusColor, fontWeight: 700, textTransform: 'capitalize' }}>{status}</span>
                        <button
                          style={{ background: viewBg, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                          onClick={() => setViewStat(s)}
                        >
                          View
                        </button>
                      </div>
                    );
                  }) : <div style={{ color: '#666' }}>No pending statistics</div>}
                </div>

                {/* Approved Statistics */}
                <div style={{ marginBottom: 12, marginTop: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>Approved Statistics</h4>
                  {approvedStats && approvedStats.length ? approvedStats.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        {s.file.split('/').pop()} (by {s.uploader_name})
                      </div>
                      <span style={{ color: '#10b981', fontWeight: 700, textTransform: 'capitalize' }}>approved</span>
                      <button
                        style={{ background: '#28a745', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                        onClick={() => setViewStat(s)}
                      >
                        View
                      </button>
                    </div>
                  )) : <div style={{ color: '#666' }}>No approved statistics</div>}
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

            {/* Preview Modal for Upload */}
            {showPreview && (
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
                  minHeight: '70vh', // Increased for better preview space
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: 18 }}>Preview Document</h3>
                  {renderFilePreview()}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      style={{ ...blueBtn, background: '#2563eb' }}
                      onClick={handleConfirmUpload}
                    >
                      Upload
                    </button>
                    <button
                      style={{ ...blueBtn, background: '#dc3545' }}
                      onClick={handleCancelUpload}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Report Generation Modal */}
            {showReportModal && (
              <div className="modal" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.35)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  background: '#fff', borderRadius: 12, padding: 32,
                  minWidth: '40vw', maxWidth: '60vw', minHeight: '40vh',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)', position: 'relative'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: 18 }}>Generate Report</h3>
                  <div style={{ marginBottom: 16 }}>
                    <label>Report Period:&nbsp;</label>
                    <select value={selectedReportType} onChange={e => handleReportTypeChange(e.target.value)}>
                      <option value="">Select period</option>
                      <option value="first_quarter">First Quarter</option>
                      <option value="third_quarter">Third Quarter</option>
                      <option value="semi_annual">Semi Annual</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label>Chart Type:&nbsp;</label>
                    <select value={selectedChartType} onChange={e => handleChartTypeChange(e.target.value)}>
                      <option value="">Select chart</option>
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Graph</option>
                      <option value="pie">Histogram</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <canvas ref={chartRef} width={600} height={400}></canvas>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button style={blueBtn} onClick={handleCreateReport}>Create Report</button>
                    <button style={{ ...blueBtn, background: '#dc3545' }} onClick={() => setShowReportModal(false)}>Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* Report PDF Modal */}
            {reportCreated && (
              <div id="report-pdf-content" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(255,255,255,0.9)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20, overflow: 'auto'
              }}>
                <div style={{
                  background: '#fff', borderRadius: 12, padding: 32,
                  minWidth: '40vw', maxWidth: '60vw', minHeight: '40vh',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)', position: 'relative'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: 18 }}>Statistics Report</h3>
                  <div style={{ marginBottom: 16 }}>
                    <strong>Period:</strong> {selectedReportType.replace('_', ' ')}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <strong>Summary:</strong> {reportSummary}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <canvas ref={chartRef} width={600} height={400}></canvas>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      style={{ ...blueBtn, background: '#28a745' }}
                      onClick={handleDownloadPDF}
                    >
                      Download PDF
                    </button>
                    <button
                      style={{ ...blueBtn, background: '#dc3545' }}
                      onClick={() => setReportCreated(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StatisticsDashboard;
