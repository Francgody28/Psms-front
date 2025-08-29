import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import SimpleUserDashboard from './components/UserDashboard'
import AdminDashboard from './components/AdminDashboard'
import PlanningDashboard from './components/Planning'
import StatisticsDashboard from './components/StatisticsDashboard';
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  console.log('App render state:', { isAuthenticated, userRole, user, userData });

  const handleLogin = (username, role, fullUserData, dashboardUrl) => {
    console.log('App handleLogin called with:', { username, role, fullUserData, dashboardUrl });
    setUser(username)
    setUserRole(role)
    setUserData(fullUserData)
    setIsAuthenticated(true)
    
    console.log(' Login successful, role set to:', role);
  }

  const handleLogout = () => {
    setUser(null)
    setUserRole(null)
    setUserData(null)
    setIsAuthenticated(false)
    // Clear local storage
    localStorage.removeItem('token')
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              userRole === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              userRole === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isAuthenticated && userRole === 'admin' ? (
              <AdminDashboard 
                user={userData || { username: user }}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated && userRole === 'user' ? (
              <SimpleUserDashboard 
                user={userData || { username: user }}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/planning-dashboard"
          element={
            isAuthenticated && userRole === 'user' ? (
              <PlanningDashboard 
                user={userData || { username: user }}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/statistics-dashboard"
          element={
            isAuthenticated && userRole === 'user' ? (
              <StatisticsDashboard
                user={userData || { username: user }}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
export default App;