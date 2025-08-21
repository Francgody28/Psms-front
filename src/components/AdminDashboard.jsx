import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import './AdminDashboard.css';

// Toast popup for success/error
const Popup = ({ message, onClose, type, position = 'top-right' }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  const style = {
    position: 'fixed',
    zIndex: 9999,
    background: type === 'delete' ? '#dc3545' : '#28a745',
    color: '#fff',
    padding: '18px 32px',
    borderRadius: '8px',
    fontSize: '1.1em',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    minWidth: '220px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    animation: 'fadeIn 0.3s'
  };
  if (position === 'center') {
    style.top = '50%';
    style.left = '50%';
    style.transform = 'translate(-50%, -50%)';
  } else {
    style.top = '30px';
    style.right = '30px';
  }
  return (
    <div style={style}>
      <div>{message}</div>
    </div>
  );
};

// Custom confirmation modal for delete
const ConfirmModal = ({ username, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.25)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{
      background: '#88f3edff',
      color: '#040303ff',
      top: '30px',
      right: '30px',
      padding: '32px 36px',
      borderRadius: '12px',
      minWidth: '340px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '1.15em', marginBottom: 24 }}>
        Are you sure you want to delete user <b>"{username}"</b>?<br />
        <span style={{ fontWeight: 400 }}>This action cannot be undone.</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        <button
          onClick={onCancel}
          style={{
            background: '#fff',
            color: '#28a745',
            border: 'none',
            borderRadius: '5px',
            padding: '8px 22px',
            fontWeight: 'bold',
            fontSize: '1em',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            background: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            padding: '8px 22px',
            fontWeight: 'bold',
            fontSize: '1em',
            cursor: 'pointer'
          }}
        >
          OK
        </button>
      </div>
    </div>
  </div>
);

const AdminDashboard = ({ user, onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    role: '' // Add this line
  });
  const [editUser, setEditUser] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    role: ''
  });
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('update');
  const [confirmDelete, setConfirmDelete] = useState(null); // user object to delete

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
    if (newUser.password.length < 8) {
      setRegistrationError('Password must be at least 8 characters long');
      return;
    }

    // Password confirmation validation
    if (newUser.password !== newUser.password_confirm) {
      setRegistrationError('Passwords do not match');
      return;
    }

    try {
      console.log('Sending user data:', newUser);
      const response = await api.registerUser(newUser);
      console.log('Registration successful:', response);
      
      setShowRegisterForm(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        role: '' // Reset role
      });
      fetchDashboardData(); // Refresh data
      setRegistrationSuccess('User registered successfully!');
      setPopupMessage('User registered successfully!');
      setPopupType('register');
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

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setEditUser({
      username: userToEdit.username,
      email: userToEdit.email,
      password: '',
      password_confirm: '',
      role: userToEdit.role || ''
    });
    setShowEditForm(true);
    setEditError('');
    setEditSuccess('');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    
    // Basic validation
    if (!editUser.username.trim()) {
      setEditError('Username is required');
      return;
    }

    if (!editUser.email.trim()) {
      setEditError('Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editUser.email)) {
      setEditError('Please enter a valid email address');
      return;
    }

    // Password validation (only if password is provided)
    if (editUser.password.trim()) {
      if (editUser.password.length < 8) {
        setEditError('Password must be at least 8 characters long');
        return;
      }

      if (editUser.password !== editUser.password_confirm) {
        setEditError('Passwords do not match');
        return;
      }
    }

    try {
      const updateData = {
        username: editUser.username,
        email: editUser.email,
        role: editUser.role
      };
      if (editUser.password.trim()) {
        updateData.password = editUser.password;
      }

      console.log('Sending update data:', updateData);
      const response = await api.updateUser(editingUser.id, updateData);
      console.log('Update successful:', response);
      
      setShowEditForm(false);
      setEditingUser(null);
      setEditUser({
        username: '',
        email: '',
        password: '',
        password_confirm: ''
      });
      fetchDashboardData(); // Refresh data
      setEditSuccess('User updated successfully!');
      setPopupMessage(response.message || 'User updated successfully!');
      setPopupType('update');
      
      // Clear success message after 3 seconds
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (error) {
      console.error('Update error details:', error);
      
      if (error.message.includes('Username already exists')) {
        setEditError('Username already exists');
      } else if (error.message.includes('Email already exists')) {
        setEditError('Email already exists');
      } else if (error.message.includes('Invalid email')) {
        setEditError('Invalid email format');
      } else if (error.message.includes('Password must be')) {
        setEditError('Password must be at least 8 characters long');
      } else {
        setEditError(error.message || 'Update failed. Please try again.');
      }
    }
  };

  const handleDeleteUser = (userToDelete) => {
    if (userToDelete.id === user.id) {
      alert('You cannot delete your own account!');
      return;
    }
    setConfirmDelete(userToDelete);
  };

  const confirmDeleteUser = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteUser(confirmDelete.id);
      fetchDashboardData();
      setEditSuccess('User deleted successfully!');
      setPopupMessage('User deleted successfully!');
      setPopupType('delete');
      setConfirmDelete(null);
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (error) {
      setEditError(error.message || 'Failed to delete user. Please try again.');
      setConfirmDelete(null);
    }
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setEditingUser(null);
    setEditUser({
      username: '',
      email: '',
      password: '',
      password_confirm: ''
    });
    setEditError('');
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
            {showRegisterForm ? 'Cancel' : 'Register New Employee'}
          </button>
        </div>

        {showRegisterForm && (
          <form onSubmit={handleRegisterUser} className="register-form">
            <h3>Register New Employee</h3>

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
            <select
              value={newUser.role}
              onChange={e => setNewUser({ ...newUser, role: e.target.value })}
              required
              style={{
                marginBottom: '18px',
                padding: '12px',
                borderRadius: '6px',
                border: '2px solid #28a745',
                background: '#f8fffa',
                color: '#222',
                fontWeight: 'bold',
                fontSize: '1em',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(40,167,69,0.05)'
              }}
            >
              <option value="" style={{ color: '#888', fontWeight: 'normal' }}>Select Role</option>
              <option value="planning_officer">Planning Officer</option>
              <option value="statistics_officer">Statistics Officer</option>
              <option value="head_of_division">Head of Division</option>
              <option value="head_of_department">Head of Department</option>
            </select>
            <button type="submit">Register Employee</button>
          </form>
        )}

        {showEditForm && editingUser && (
          <form onSubmit={handleUpdateUser} className="edit-form">
            <h3>Edit User: {editingUser.username}</h3>

            {editError && (
              <div className="error-message" style={{
                background: '#fee', 
                color: '#c33', 
                padding: '10px', 
                borderRadius: '5px', 
                marginBottom: '15px'
              }}>
                {editError}
              </div>
            )}

            <input
              type="text"
              placeholder="Username *"
              value={editUser.username}
              onChange={(e) => setEditUser({...editUser, username: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Email *"
              value={editUser.email}
              onChange={(e) => setEditUser({...editUser, email: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="New Password (leave blank to keep current)"
              value={editUser.password}
              onChange={(e) => setEditUser({...editUser, password: e.target.value})}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={editUser.password_confirm}
              onChange={(e) => setEditUser({...editUser, password_confirm: e.target.value})}
            />
            <select
              value={editUser.role}
              onChange={e => setEditUser({ ...editUser, role: e.target.value })}
              required
              style={{
                marginBottom: '15px',
                padding: '10px',
                borderRadius: '5px',
                border: '2px solid #28a745',
                background: '#f8fffa',
                color: '#222',
                fontWeight: 'bold'
              }}
            >
              <option value="">Select Role *</option>
              <option value="planning_officer">Planning Officer</option>
              <option value="statistics_officer">Statistics Officer</option>
              <option value="head_of_division">Head of Division</option>
              <option value="head_of_department">Head of Department</option>
            </select>
            <div className="form-buttons">
              <button type="submit">Update User</button>
              <button type="button" onClick={cancelEdit} className="cancel-btn">Cancel</button>
            </div>
          </form>
        )}

        {(registrationSuccess || editSuccess) && (
          <div className="success-message" style={{
            background: '#efe', 
            color: '#363', 
            padding: '15px', 
            borderRadius: '5px', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
          </div>
        )}

        <div className="users-list">
          <h3>All Users</h3>
          {dashboardData?.users?.map(userItem => (
            <div key={userItem.id} className="user-item">
              <div className="user-info">
                <span>{userItem.username} - {userItem.email}</span>
                <span className={userItem.is_active ? 'active' : 'inactive'}>
                  {userItem.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="user-actions">
                <button 
                  onClick={() => handleEditUser(userItem)}
                  className="edit-btn"
                  style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '3px',
                    marginRight: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteUser(userItem)}
                  className="delete-btn"
                  disabled={userItem.id === user.id}
                  style={{
                    background: userItem.id === user.id ? '#ccc' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '3px',
                    cursor: userItem.id === user.id ? 'not-allowed' : 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popup notification */}
      {popupMessage && (
        <Popup
          message={popupMessage}
          onClose={() => setPopupMessage('')}
          type={popupType}
          position={popupType === 'register' ? 'center' : 'top-right'}
        />
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <ConfirmModal
          username={confirmDelete.username}
          onConfirm={confirmDeleteUser}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
