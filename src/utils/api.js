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
    console.log('Calling register API with data:', userData);
    
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
          console.log(' Register error response:', errorData);
          
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
      console.log(' Register successful:', result);
      return result;
      
    } catch (fetchError) {
      console.error(' Fetch error:', fetchError);
      throw fetchError;
    }
  },

  updateUser: async (userId, userData) => {
    console.log('Calling update user API with data:', userData);
    console.log('URL being called:', `${API_BASE_URL}/auth/users/${userId}/update/`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/update/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(userData)
      });
      
      console.log(' Update user response status:', response.status);
      console.log('Update user response URL:', response.url);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log(' Update user error response:', errorData);
          
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
      console.log('Update user successful:', result);
      return result;
      
    } catch (fetchError) {
      console.error('Update user fetch error:', fetchError);
      throw fetchError;
    }
  },

  deleteUser: async (userId) => {
    console.log('Calling delete user API for user ID:', userId);
    console.log('URL being called:', `${API_BASE_URL}/auth/users/${userId}/delete/`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/delete/`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      console.log('Delete user response status:', response.status);
      console.log('Delete user response URL:', response.url);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('Delete user error response:', errorData);
          
          if (errorData.error) {
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
      console.log('Delete user successful:', result);
      return result;
      
    } catch (fetchError) {
      console.error('Delete user fetch error:', fetchError);
      throw fetchError;
    }
  },

  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/users/`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  updateUserStatus: async (userId, statusData) => {
    const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/status/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(statusData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
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

  // fetch current user's profile (expects backend at /auth/profile/)
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  // approve endpoints (adjust backend urls if needed)
  approvePlan: async (planId) => {
    const response = await fetch(`${API_BASE_URL}/auth/plans/${planId}/approve/`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) {
      const err = await response.json().catch(()=>({ error: 'Approve plan failed' }));
      throw new Error(err.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  approveStatistic: async (statId) => {
    const response = await fetch(`${API_BASE_URL}/auth/statistics/${statId}/approve/`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) {
      const err = await response.json().catch(()=>({ error: 'Approve statistic failed' }));
      throw new Error(err.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};

export default api;
