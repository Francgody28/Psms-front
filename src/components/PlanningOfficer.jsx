import './UserDashboard.css';
import { useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import zafiriLogo from '../assets/zafiri.png';

const PlanningDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingPlans, setPendingPlans] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key
  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState('');

  // Example static values; replace with real data as needed
  const receivedBudget = 100000000;
  const usedBudget = 32000000;
  const projection = 200000000;

  // Fetch pending plans for head_of_division
  useEffect(() => {
    if (user && user.role === 'head_of_division') {
      fetch('http://localhost:2800/api/pending-plans/', {
        headers: {
          Authorization: `Token ${localStorage.getItem('token')}`,
        },
      })
        .then(res => res.json())
        .then(data => setPendingPlans(data));
    }
  }, [user]);

  // Fetch recent activities (uploaded plans by this user)
  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Fetching recent activities with token:', token ? 'Present' : 'Missing');
        console.log('Current user:', user);
        
        const res = await fetch('http://localhost:2800/api/auth/my-plans/', {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Response status:', res.status);
        console.log('Response ok:', res.ok);
        console.log('Response headers:', Object.fromEntries(res.headers.entries()));
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Response not OK:', res.status, res.statusText);
          console.error('Error response body:', errorText);
          
          // Try to parse as JSON if possible
          try {
            const errorJson = JSON.parse(errorText);
            console.error('Parsed error:', errorJson);
          } catch {
            console.error('Could not parse error as JSON');
          }
          
          setRecentActivities([]);
          return;
        }
        
        const data = await res.json();
        console.log('Fetched activities data:', data);
        
        // Map to activity format
        if (Array.isArray(data)) {
          const mappedActivities = data
            .sort((a, b) => new Date(b.uploaded_at || b.created_at) - new Date(a.uploaded_at || a.created_at))  // Changed to use uploaded_at first
            .slice(0, 10)
            .map(plan => ({
              title: plan.file ? plan.file.split('/').pop() : 'Plan',
              date: plan.uploaded_at || plan.created_at || '',  // Changed to use uploaded_at first
              status: plan.status || 'pending',
            }));
          
          console.log('Mapped activities:', mappedActivities);
          setRecentActivities(mappedActivities);
        } else {
          console.error('Data is not an array:', data);
          setRecentActivities([]);
        }
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        console.error('Error stack:', error.stack);
        setRecentActivities([]);
      }
    };
    
    if (user) {
      fetchRecentActivities();
    }
  }, [user, refreshKey]); // Add refreshKey to dependencies

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
    navigate('/login');
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

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_date', new Date().toISOString());

    try {
      const token = localStorage.getItem('token');
      const apiUrl = 'http://localhost:2800/api/auth/upload-plan/';
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
  };

  // Approve plan handler (now handles both approve and reject)
  // (Removed unused handleApprovePlan function to fix unused variable error)

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

  // Sidebar navigation handlers
  const handleSidebarNav = (route) => {
    navigate(route);
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
            <li onClick={() => handleSidebarNav('/dashboard')}>Dashboard</li>
            <li onClick={() => handleSidebarNav('/statistics-dashboard')}>Statistics</li>
            <li className="active" onClick={() => handleSidebarNav('/planning-dashboard')}>Plans</li>
            <li onClick={handleLogout} style={{ cursor: 'pointer', color: '#fff' }}>Logout</li>
          </ul>
        </nav>
      </div>
      <div className="dashboard-main">
        <header className="dashboard-header">
          <h1>Planning Dashboard</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </header>
        <div className="dashboard-content">
          <div className="welcome-card">
            <h2>Welcome to the Planning Dashboard</h2>
            <p>Here you can manage and review your plans.</p>
          </div>
          {/* Budget Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1.2rem',
            marginBottom: '2.0rem'
          }}>
            {/* Received Budget */}
            <div className="stat-card" style={{ minHeight: 120 }}>
              <h3>Received Budget</h3>
              <p style={{ fontSize: '2.2rem', marginBottom: 0 }}>
                {receivedBudget.toLocaleString()}Tsh/=
              </p>
            </div>
            {/* Used Budget */}
            <div className="stat-card" style={{ minHeight: 120 }}>
              <h3>Used Budget</h3>
              <p style={{ fontSize: '2.2rem', marginBottom: 0 }}>
                {usedBudget.toLocaleString()}Tsh/=
              </p>
            </div>
            {/* Projection */}
            <div className="stat-card" style={{ minHeight: 120 }}>
              <h3>Projection</h3>
              <p style={{ fontSize: '1.9rem', marginBottom: 0 }}>
                {projection.toLocaleString()}Tsh/=
              </p>
            </div>
          </div>
          {/* Action Buttons */}
          <div style={{ marginTop: '1.5rem' }}>
            <button style={blueBtn}>Create Plan</button>
            <button style={blueBtn} onClick={handleUploadClick}>Upload Plan</button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".xlsx,.xls,.doc,.docx,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              onChange={handleFileChange}
            />
            {/* Modal for preview with increased min-height */}
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
          </div>
          {/* Recent Activity Section */}
          <div className="recent-activity" style={{ marginTop: '2rem' }}>
            <h3>Recent Activity</h3>
            {recentActivities.length > 0 ? (
              <div style={{ 
                background: '#fff', 
                borderRadius: '8px', 
                padding: '1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
              }}>
                {recentActivities.map((activity, idx) => {
                  // Show actual status (no remapping)
                  const displayStatus = activity.status || 'pending';

                  // Determine color based on status
                  let statusColor = '#6b7280'; // default gray
                  if (displayStatus === 'pending') statusColor = '#f59e0b'; // yellow
                  else if (displayStatus === 'reviewed') statusColor = '#2563eb'; // blue (approved by HoDvn, awaiting HoDept)
                  else if (displayStatus === 'approved') statusColor = '#10b981'; // green (fully approved)
                  else if (displayStatus === 'rejected') statusColor = '#ef4444'; // red
                  
                  return (
                    <div 
                      key={idx} 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: idx < recentActivities.length - 1 ? '1px solid #e5e7eb' : 'none'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '0.25rem' }}>
                          {activity.title}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {activity.date ? new Date(activity.date).toLocaleString() : ''}
                        </div>
                      </div>
                      <span 
                        style={{ 
                          color: statusColor, 
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          textTransform: 'capitalize'
                        }}
                      >
                        {displayStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No recent activity to display.</p>
            )}
          </div>
          {/* Pending Plans Section (for head of division) */}
          {user && user.role === 'head_of_division' && (
            <div style={{ marginTop: 32 }}>
              <h3>Pending Plans</h3>
              {pendingPlans.length === 0 ? (
                <div>No pending plans.</div>
              ) : (
                <ul>
                  {pendingPlans.map(plan => (
                    <li key={plan.id} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                      <span style={{ flex: 1 }}>
                        {plan.file.split('/').pop()} (by {plan.uploader_name})
                      </span>
                    <span 
                      style={{
                        marginRight: 12,
                        fontWeight: 'bold',
                        color: (plan.status || 'pending') === 'pending' ? '#f59e0b'
                          : plan.status === 'reviewed' ? '#2563eb'   // added: reviewed => blue
                          : plan.status === 'approved' ? '#10b981'
                          : plan.status === 'rejected' ? '#ef4444'
                          : '#6b7280'
                      }}
                    >
                      {plan.status || 'pending'}
                    </span>
                  </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanningDashboard;