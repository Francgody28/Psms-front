import { useState } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import SimpleUserDashboard from './components/UserDashboard'
import AdminDashboard from './components/AdminDashboard'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  console.log('App render state:', { isAuthenticated, userRole, user, userData });

  const handleLogin = (username, role, fullUserData, dashboardUrl) => {
    console.log('App handleLogin called with:', { username, role, fullUserData, dashboardUrl });
    setUser(username)
    setUserRole(role)
    setUserData(fullUserData)
    setIsAuthenticated(true)
    
    console.log(' Login successful, role set to:', role);
  }

  const handleRegister = () => {
    // Reset register form after successful registration
    setShowRegister(false)
    // Show success message or return to login
  }

  const handleLogout = () => {
    setUser(null)
    setUserRole(null)
    setUserData(null)
    setIsAuthenticated(false)
    setShowRegister(false)
    // Clear local storage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const showRegisterForm = () => {
    setShowRegister(true)
  }

  const hideRegisterForm = () => {
    setShowRegister(false)
  }

  // If showing register form (public registration)
  if (showRegister) {
    console.log('Showing public register form');
    return (
      <Register 
        onRegisterSuccess={handleRegister}
        onBackToLogin={hideRegisterForm}
      />
    )
  }

  // If not authenticated, show login
  if (!isAuthenticated) {
    console.log('Not authenticated - showing login');
    return <Login onLogin={handleLogin} onShowRegister={showRegisterForm} />
  }

  // Role-based dashboard routing
  if (userRole === 'admin') {
    console.log('Rendering AdminDashboard for admin user');
    return (
      <AdminDashboard 
        user={userData || { username: user }}
        onLogout={handleLogout}
      />
    )
  } else if (userRole === 'user') {
    console.log('👤 Rendering SimpleUserDashboard for normal user');
    return (
      <SimpleUserDashboard 
        user={userData || { username: user }}
        onLogout={handleLogout}
      />
    )
  }

  // Fallback (should not reach here normally)
  console.log(' No matching role, showing login');
  return <Login onLogin={handleLogin} />
}

export default App
