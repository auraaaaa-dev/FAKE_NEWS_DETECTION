import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export const claimsAPI = {
  // Create a new claim
  createClaim: async (claimData) => {
    const formData = new FormData()
    
    if (claimData.text) formData.append('text', claimData.text)
    if (claimData.link) formData.append('link', claimData.link)
    if (claimData.media) formData.append('media', claimData.media)
    if (claimData.mediaType) formData.append('mediaType', claimData.mediaType)
    
    const response = await api.post('/api/claims', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Get all claims
  getAllClaims: async () => {
    const response = await api.get('/api/claims')
    return response.data
  },

  // Get single claim
  getClaimById: async (id) => {
    const response = await api.get(`/api/claims/${id}`)
    return response.data
  },

  // Flag a claim
  flagClaim: async (id, flagData) => {
    const response = await api.post(`/api/claims/${id}/flag`, flagData)
    return response.data
  },

  // Unflag a claim
  unflagClaim: async (id) => {
    const response = await api.delete(`/api/claims/${id}/flag`)
    return response.data
  },
}

export const statsAPI = {
  // Get statistics
  getStats: async () => {
    const response = await api.get('/api/stats')
    return response.data
  },
}

export const healthAPI = {
  // Health check
  checkHealth: async () => {
    const response = await api.get('/api/health')
    return response.data
  },
}

export default api
