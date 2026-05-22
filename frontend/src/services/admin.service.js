import api from './api'

function cleanParams(params) {
  const cleaned = {}
  for (const [key, val] of Object.entries(params)) {
    if (val === null || val === undefined || val === '') continue
    cleaned[key] = val
  }
  return cleaned
}

export default {
  async getDashboard() {
    const { data } = await api.get('/admin/dashboard')
    return data.data || data
  },

  async getSubscriptionMetrics() {
    const { data } = await api.get('/admin/subscriptions/metrics')
    return data.data || data
  },

  async getUsers(params = {}) {
    const { data } = await api.get('/admin/users', { params: cleanParams(params) })
    return data
  },

  async getUserDetail(id) {
    const { data } = await api.get(`/admin/users/${id}`)
    return data.data || data
  },

  async updateUserStatus(id, status, reason) {
    const { data } = await api.patch(`/admin/users/${id}/status`, { status, reason })
    return data
  },

  async getListings(params = {}) {
    const { data } = await api.get('/admin/listings', { params: cleanParams(params) })
    return data
  },

  async updateListingStatus(id, status, reason) {
    const { data } = await api.patch(`/admin/listings/${id}/status`, { status, reason })
    return data
  },

  async getReports(params = {}) {
    const { data } = await api.get('/admin/reports', { params: cleanParams(params) })
    return data
  },

  async getReportDetail(id) {
    const { data } = await api.get(`/admin/reports/${id}`)
    return data.data || data
  },

  async resolveReport(id, action, notes) {
    const { data } = await api.patch(`/admin/reports/${id}/resolve`, { action, notes })
    return data
  },

  async getSubscriptions(params = {}) {
    const { data } = await api.get('/admin/subscriptions', { params: cleanParams(params) })
    return data
  },

  async getHostSubscriptionHistory(hostId) {
    const { data } = await api.get(`/admin/subscriptions/${hostId}`)
    return data.data || data
  },

  async applyDiscount(hostId, couponCode, discountPercent) {
    const { data } = await api.post(`/admin/subscriptions/${hostId}/discount`, { coupon_code: couponCode, discount_percent: discountPercent })
    return data
  },

  async exportSubscriptions() {
    const { data } = await api.get('/admin/subscriptions/export', { responseType: 'blob' })
    return data
  },

  async getAuditLogs(params = {}) {
    const { data } = await api.get('/admin/audit-logs', { params: cleanParams(params) })
    return data
  },

  async createReport(targetType, targetId, reason, description) {
    const { data } = await api.post('/reports', { target_type: targetType, target_id: targetId, reason, description })
    return data.data || data
  }
}
