import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Department API
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
  getStats: (id) => api.get(`/departments/${id}/stats`),
}

// Bed API
export const bedAPI = {
  getAll: (params) => api.get('/beds', { params }),
  getById: (id) => api.get(`/beds/${id}`),
  getGrid: (departmentId) => api.get(`/beds/department/${departmentId}/grid`),
  create: (data) => api.post('/beds', data),
  updateStatus: (id, data) => api.put(`/beds/${id}/status`, data),
  occupy: (id, data) => api.put(`/beds/${id}/occupy`, data),
  release: (id) => api.put(`/beds/${id}/release`),
  delete: (id) => api.delete(`/beds/${id}`),
}

// Patient API
export const patientAPI = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  admit: (data) => api.post('/patients/admit', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  discharge: (id, data) => api.put(`/patients/${id}/discharge`, data),
  getHistory: (id) => api.get(`/patients/${id}/history`),
  getStats: () => api.get('/patients/stats/summary'),
}

// Billing API
export const billingAPI = {
  getAll: (params) => api.get('/billing', { params }),
  getById: (id) => api.get(`/billing/${id}`),
  addMedicalCharge: (id, data) => api.post(`/billing/${id}/charges/medical`, data),
  addAdditionalCharge: (id, data) => api.post(`/billing/${id}/charges/additional`, data),
  addPayment: (id, data) => api.post(`/billing/${id}/payments`, data),
  applyDiscounts: (id, data) => api.put(`/billing/${id}/discounts`, data),
  updateStatus: (id, data) => api.put(`/billing/${id}/status`, data),
  getStats: () => api.get('/billing/stats/summary'),
  getOverdue: () => api.get('/billing/overdue'),
}

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  getUsers: () => api.get('/auth/users'),
}

export default api

