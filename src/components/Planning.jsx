import './UserDashboard.css';
import { useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';

const PlanningDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [textPreview, setTextPreview] = useState('');
  const [textLoaded, setTextLoaded] = useState(false);
  const [pendingPlans, setPendingPlans] = useState([]);

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
      setSelectedFile(e.target.files[0]);
      setShowPreview(true);
      setTextPreview('');
      setTextLoaded(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setShowPreview(false);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_date', new Date().toISOString());

    try {
      const token = localStorage.getItem('token');
      // Use the full backend URL with your backend port (2800)
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
      } else {
        alert('File uploaded successfully!');
      }
    } catch (e) {
      alert('Upload error: ' + e.message);
    }
    setSelectedFile(null);
    setShowPreview(false);
  };

  // Approve plan handler
  const handleApprovePlan = async (planId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:2800/api/auth/review-plan/${planId}/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      if (!res.ok) {
        let errMsg = '';
        try {
          const err = await res.json();
          errMsg = err.error || res.statusText;
        } catch {
          errMsg = res.statusText || 'Unknown error';
        }
        alert('Approve failed: ' + errMsg);
      } else {
        alert('Plan approved!');
        // Refresh pending plans
        setPendingPlans(pendingPlans.filter(plan => plan.id !== planId));
      }
    } catch (e) {
      alert('Approve error: ' + e.message);
    }
  };

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

  // Helper for preview
  const renderFilePreview = () => {
    if (!selectedFile) return null;
    const fileType = selectedFile.type;
    const ext = selectedFile.name.split('.').pop().toLowerCase();

    if (fileType === 'application/pdf') {
      const url = URL.createObjectURL(selectedFile);
      return (
        <iframe
          src={url}
          title="PDF Preview"
          style={{
            width: '100%',
            height: '50vh',
            border: 'none',
            marginBottom: 16,
            background: '#f8f9fc'
          }}
        />
      );
    }

    if (
      ext === 'doc' || ext === 'docx' ||
      ext === 'xls' || ext === 'xlsx'
    ) {
      if (fileType.startsWith('text/')) {
        if (!textLoaded) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setTextPreview(e.target.result);
            setTextLoaded(true);
          };
          reader.readAsText(selectedFile);
        }
        return (
          <pre style={{
            width: '100%',
            height: '40vh',
            overflow: 'auto',
            background: '#f8f9fc',
            borderRadius: 8,
            padding: 16,
            fontSize: 15,
            marginBottom: 16
          }}>{textPreview || "Loading..."}</pre>
        );
      }

      // Fallback: show file name and info
      let icon = ext === 'doc' || ext === 'docx' ? '📝' : '📊';
      let label = ext === 'doc' || ext === 'docx' ? 'Word Document' : 'Excel Spreadsheet';
      return (
        <div style={{
          fontSize: 22,
          marginBottom: 16,
          background: '#f8f9fc',
          padding: '2rem 1rem',
          borderRadius: 10,
          minHeight: '25vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{selectedFile.name}</div>
          <div style={{ color: '#555', fontSize: 15 }}>
            {label} preview is not supported for local files. Please upload to view content online.
          </div>
        </div>
      );
    }

    if (fileType.startsWith('text/')) {
      if (!textLoaded) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setTextPreview(e.target.result);
          setTextLoaded(true);
        };
        reader.readAsText(selectedFile);
      }
      return (
        <pre style={{
          width: '100%',
          height: '40vh',
          overflow: 'auto',
          background: '#f8f9fc',
          borderRadius: 8,
          padding: 16,
          fontSize: 15,
          marginBottom: 16
        }}>{textPreview || "Loading..."}</pre>
      );
    }

    // Fallback for other files
    return (
      <div style={{
        fontSize: 22,
        marginBottom: 16,
        background: '#f8f9fc',
        padding: '2rem 1rem',
        borderRadius: 10,
        minHeight: '25vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{selectedFile.name}</div>
        <div style={{ color: '#555', fontSize: 15 }}>Preview not supported for this file type.</div>
      </div>
    );
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-logo">
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
            {/* Modal for preview */}
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
                  minHeight: '60vh',
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
          {/* Pending Plans Section (for head of division) */}
          {user && user.role === 'head_of_division' && (
            <div style={{ marginTop: 32 }}>
              <h3>Pending Plans</h3>
              {pendingPlans.length === 0 ? (
                <div>No pending plans.</div>
              ) : (
                <ul>
                  {pendingPlans.map(plan => (
                    <li key={plan.id} style={{ marginBottom: 12 }}>
                      <span>{plan.file.split('/').pop()} (by {plan.uploader_name})</span>
                      <button
                        style={{ ...blueBtn, marginLeft: 16 }}
                        onClick={() => window.open(`http://localhost:2800/media/${plan.file}`, '_blank')}
                      >
                        View
                      </button>
                      <button
                        style={{ ...blueBtn, background: '#28a745', marginLeft: 8 }}
                        onClick={() => handleApprovePlan(plan.id)}
                      >
                        Approve
                      </button>
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