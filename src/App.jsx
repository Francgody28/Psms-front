import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import SimpleUserDashboard from './components/UserDashboard'
import AdminDashboard from './components/AdminDashboard'
import PlanningDashboard from './components/PlanningOfficer'
import StatisticsDashboard from './components/StatisticsDashboard'
import HeadOfDivisionDashboard from './components/HeadOfDivisionDashboard'
import HeadOfDepartmentDashboard from './components/HeadOfDepartmentDashboard'
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

  // Helper function to get dashboard route based on role
  const getDashboardRoute = (role) => {
    switch (role) {
      case 'admin':
        return '/admin-dashboard'
      case 'head_of_division':
        return '/head-of-division-dashboard'
      case 'head_of_department':
        return '/head-of-department-dashboard'
      case 'planning_officer':
        return '/planning-dashboard'
      case 'statistics_officer':
        return '/statistics-dashboard'
      default:
        return '/dashboard'
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute(userRole)} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute(userRole)} replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/admin-dashboard"
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
          path="/head-of-division-dashboard"
          element={
            isAuthenticated && userRole === 'head_of_division' ? (
              <HeadOfDivisionDashboard 
                user={userData || { username: user }}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/head-of-department-dashboard"
          element={
            isAuthenticated && userRole === 'head_of_department' ? (
              <HeadOfDepartmentDashboard 
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
            isAuthenticated && (userRole === 'planning_officer' || userRole === 'head_of_department' || userRole === 'head_of_division') ? (
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
            isAuthenticated && (userRole === 'statistics_officer' || userRole === 'head_of_department' || userRole === 'head_of_division') ? (
              <StatisticsDashboard
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
      </Routes>
    </BrowserRouter>
  )
}
export default App;