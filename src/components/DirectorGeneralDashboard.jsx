import React from 'react';

const dashboardStyle = {
  maxWidth: '800px',
  margin: '40px auto',
  padding: '32px',
  borderRadius: '12px',
  background: '#fff',
  boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  fontFamily: 'sans-serif'
};

export default function DirectorGeneralDashboard({ user, onLogout }) {
  return (
    <div style={dashboardStyle}>
      <h2>Director General Dashboard</h2>
      <p>Welcome, {user?.username || 'User'}!</p>
      {/* Add dashboard content here */}
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}
