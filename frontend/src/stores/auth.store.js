import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isTourist = computed(() => user.value?.role === 'tourist')
  const isHost = computed(() => user.value?.role === 'host')
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(credentials) {
    loading.value = true
    error.value = null
    try {
      const response = await authService.login(credentials)
      token.value = response.access_token || response.token
      user.value = response.user
      localStorage.setItem('token', response.access_token || response.token)
      return response
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(userData) {
    loading.value = true
    error.value = null
    try {
      const response = await authService.register(userData)
      return response
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function verify2FA(code) {
    loading.value = true
    error.value = null
    try {
      const response = await authService.verifyEmail(code)
      return response
    } catch (err) {
      error.value = err.response?.data?.error?.message || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function forgotPassword(email) {
    loading.value = true
    error.value = null
    try {
      const response = await authService.forgotPassword(email)
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function checkAuth() {
    if (token.value) {
      authService.getProfile()
        .then(res => {
          user.value = res
        })
        .catch(() => {
          logout()
        })
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  async function updateProfile(data) {
    loading.value = true
    error.value = null
    try {
      const response = await authService.updateProfile(data)
      user.value = response.user
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isTourist,
    isHost,
    isAdmin,
    login,
    register,
    verify2FA,
    forgotPassword,
    checkAuth,
    logout,
    updateProfile
  }
})