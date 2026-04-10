import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  // Set up axios interceptor for token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/auth/me')
          setUser(response.data.user)
        } catch (error) {
          console.error('Auth check failed:', error)
          logout()
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [token])

  const login = async (credentials) => {
    try {
      setLoading(true)
      const response = await axios.post('/auth/login', credentials)
      const { token: newToken, user: userData } = response.data

      setToken(newToken)
      setUser(userData)
      localStorage.setItem('token', newToken)
      
      toast.success(`Welcome back, ${userData.fullName}!`)
      return { success: true, user: userData }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    toast.success('Logged out successfully')
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/auth/profile', profileData)
      setUser(response.data.user)
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const changePassword = async (passwordData) => {
    try {
      await axios.post('/auth/change-password', passwordData)
      toast.success('Password changed successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Fetch all users (Admin only)
  const fetchUsers = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (res.ok) return data;
    else return { users: [], message: data.message };
  } catch (err) {
    console.error("Fetch users error:", err);
    return { users: [], message: "Failed to fetch users" };
  }
};


  // Update user
const updateUser = async (id, updatedData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });
    const data = await res.json();
    if (res.ok) return data;
    else return { message: data.message };
  } catch (err) {
    console.error("Update user error:", err);
    return { message: "Failed to update user" };
  }
};

// Delete user
const deleteUser = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (res.ok) return { success: true };
    else return { success: false, message: data.message };
  } catch (err) {
    console.error("Delete user error:", err);
    return { success: false, message: "Failed to delete user" };
  }
};

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateProfile,
    changePassword,
    fetchUsers,
    updateUser,
    deleteUser,
    isAuthenticated: !!user,
    isStaff: user?.role && ['admin', 'staff', 'doctor', 'nurse'].includes(user.role),
    isAdmin: user?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

