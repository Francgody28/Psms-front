import { useState } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const handleLogin = (username) => {
    setUser(username)
    setIsAuthenticated(true)
  }

  const handleRegister = (userData) => {
    // For demo purposes, automatically log in the user after registration
    setUser(userData.username)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setShowRegister(false)
  }

  const switchToRegister = () => {
    setShowRegister(true)
  }

  const switchToLogin = () => {
    setShowRegister(false)
  }

  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <Register 
          onRegister={handleRegister} 
          onSwitchToLogin={switchToLogin} 
        />
      )
    }
    return (
      <Login 
        onLogin={handleLogin} 
        onSwitchToRegister={switchToRegister} 
      />
    )
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App
