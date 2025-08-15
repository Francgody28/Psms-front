const API_BASE_URL = 'http://localhost:8000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Create headers with authentication
const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` })
  };
};

// API functions
export const api = {
  // Authentication
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // User management (Admin only)
  registerUser: async (userData) => {
    console.log('🚀 Calling register API with data:', userData);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData)
      });
      
      console.log('📡 Register response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('❌ Register error response:', errorData);
          
          // Extract specific error messages
          if (errorData.username) {
            errorMessage = `Username: ${errorData.username[0] || errorData.username}`;
          } else if (errorData.email) {
            errorMessage = `Email: ${errorData.email[0] || errorData.email}`;
          } else if (errorData.password) {
            errorMessage = `Password: ${errorData.password[0] || errorData.password}`;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          console.log('Could not parse error response as JSON');
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ Register successful:', result);
      return result;
      
    } catch (fetchError) {
      console.error('🔥 Fetch error:', fetchError);
      throw fetchError;
    }
  },

  // Dashboard
  getUserDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/user-dashboard/`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  getAdminDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/admin-dashboard/`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};

export default api;
