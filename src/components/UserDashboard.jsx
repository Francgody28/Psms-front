import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './UserDashboard.css';

const SimpleUserDashboard = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await api.getUserDashboard();
      setDashboardData(data);
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

  const handleAddStatistics = () => {
    // TODO: Navigate to add statistics page or open modal
    console.log('Add Statistics clicked');
  };

  const handleAddPlan = () => {
    // TODO: Navigate to add plan page or open modal
    console.log('Add Plan clicked');
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
      </div>
    </div>
  );
};

export default SimpleUserDashboard;
