import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: ''
  });
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await api.getAdminDashboard();
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

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setRegistrationError('');
    setRegistrationSuccess('');
    
    // Specific field validation
    if (!newUser.username.trim()) {
      setRegistrationError('Username is required');
      return;
    }

    if (!newUser.email.trim()) {
      setRegistrationError('Email is required');
      return;
    }

    if (!newUser.password.trim()) {
      setRegistrationError('Password is required');
      return;
    }

    if (!newUser.password_confirm.trim()) {
      setRegistrationError('Password confirmation is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setRegistrationError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (newUser.password.length < 6) {
      setRegistrationError('Password must be at least 6 characters long');
      return;
    }

    // Password confirmation validation
    if (newUser.password !== newUser.password_confirm) {
      setRegistrationError('Passwords do not match');
      return;
    }

    try {
      console.log('📤 Sending user data:', newUser);
      const response = await api.registerUser(newUser);
      console.log('✅ Registration successful:', response);
      
      setShowRegisterForm(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        password_confirm: ''
      });
      fetchDashboardData(); // Refresh data
      setRegistrationSuccess('User registered successfully!');
    } catch (error) {
      console.error('Registration error details:', error);
      
      // Handle specific error messages from backend
      if (error.message.includes('HTTP error! status: 400')) {
        setRegistrationError('Invalid data provided. Please check all fields and try again.');
      } else if (error.message.includes('username')) {
        setRegistrationError('Username already exists or is invalid');
      } else if (error.message.includes('email')) {
        setRegistrationError('Email already exists or is invalid');
      } else if (error.message.includes('password')) {
        setRegistrationError('Password requirements not met');
      } else {
        setRegistrationError(error.message || 'Registration failed. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard - Welcome, {user.first_name || user.username}!</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>
      
      <div className="dashboard-content">
        <div className="stats">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p>{dashboardData?.total_users || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <p>{dashboardData?.active_users || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Admin Users</h3>
            <p>{dashboardData?.admin_users || 0}</p>
          </div>
        </div>

        <div className="actions">
          <button 
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            className="register-btn"
          >
            {showRegisterForm ? 'Cancel' : 'Register New User'}
          </button>
        </div>

        {showRegisterForm && (
          <form onSubmit={handleRegisterUser} className="register-form">
            <h3>Register New User</h3>
            
            {registrationError && (
              <div className="error-message" style={{
                background: '#fee', 
                color: '#c33', 
                padding: '10px', 
                borderRadius: '5px', 
                marginBottom: '15px'
              }}>
                {registrationError}
              </div>
            )}

            <input
              type="text"
              placeholder="Username *"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Email *"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Password *"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password *"
              value={newUser.password_confirm}
              onChange={(e) => setNewUser({...newUser, password_confirm: e.target.value})}
              required
            />
            <button type="submit">Register User</button>
          </form>
        )}

        {registrationSuccess && (
          <div className="success-message" style={{
            background: '#efe', 
            color: '#363', 
            padding: '15px', 
            borderRadius: '5px', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {registrationSuccess}
          </div>
        )}

        <div className="users-list">
          <h3>All Users</h3>
          {dashboardData?.users?.map(user => (
            <div key={user.id} className="user-item">
              <span>{user.username} - {user.email}</span>
              <span className={user.is_active ? 'active' : 'inactive'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
