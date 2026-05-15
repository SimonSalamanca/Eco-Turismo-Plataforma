import api from './api'

export default {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials)
    return data.data || data
  },

  async register(userData) {
    const { data } = await api.post('/auth/register', userData)
    return data.data || data
  },

  async verifyEmail(token) {
    const { data } = await api.get(`/auth/verify-email/${token}`)
    return data.data || data
  },

  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },

  async resetPassword(token, password) {
    const { data } = await api.post(`/auth/reset-password/${token}`, { password, confirm_password: password })
    return data
  },

  async getProfile() {
    const { data } = await api.get('/users/me')
    return data.data || data
  },

  async updateProfile(userData) {
    const { data } = await api.put('/users/me', userData)
    return data.data || data
  },

  async logout() {
    const { data } = await api.post('/auth/logout')
    return data
  },

  async refreshToken() {
    const { data } = await api.post('/auth/refresh-token')
    return data.data || data
  }
}