import './UserDashboard.css';
import { useNavigate } from 'react-router-dom';

const StatisticsDashboard = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
    navigate('/login');
  };

  // Sidebar navigation handlers
  const handleSidebarNav = (route) => {
    navigate(route);
  };

  // Example statistics data (replace with real data as needed)
  const statistics = [
    { title: 'Total Reports', value: 0 },
    { title: 'Pending Statistics', value: 0},
    { title: 'Approved Statistics', value: 0 },
  ];

  return (
    <div className="user-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-logo">
          <h2>PSMS</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li onClick={() => handleSidebarNav('/dashboard')}>Dashboard</li>
            <li className="active" onClick={() => handleSidebarNav('/statistics-dashboard')}>Statistics</li>
            <li onClick={() => handleSidebarNav('/planning-dashboard')}>Plans</li>
            <li onClick={handleLogout} style={{ cursor: 'pointer', color: '#fff' }}>Logout</li>
          </ul>
        </nav>
      </div>
      <div className="dashboard-main">
        <header className="dashboard-header">
          <h1>Statistics Dashboard</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </header>
        <div className="dashboard-content">
          <div className="welcome-card">
            <h2>Welcome to the Statistics Dashboard</h2>
            <p>Here you can view, manage, and analyze your statistics.</p>
          </div>
          <div className="stats">
            {statistics.map((stat, idx) => (
              <div className="stat-card" key={idx}>
                <h3>{stat.title}</h3>
                <p>{stat.value}</p>
              </div>
            ))}
          </div>
          {/* Add more statistics-related content here as needed */}
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
