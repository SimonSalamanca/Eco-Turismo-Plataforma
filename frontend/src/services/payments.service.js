import api from './api'

export default {
  async getPaymentMethods() {
    const { data } = await api.get('/payments/methods')
    return data
  },

  async addPaymentMethod(paymentData) {
    const { data } = await api.post('/payments/methods', paymentData)
    return data
  },

  async removePaymentMethod(id) {
    const { data } = await api.delete(`/payments/methods/${id}`)
    return data
  },

  async processPayment(reservationId, paymentData) {
    const { data } = await api.post(`/payments/process/${reservationId}`, paymentData)
    return data
  },

  async getPaymentHistory(params = {}) {
    const { data } = await api.get('/payments/history', { params })
    return data
  },

  async getPaymentById(id) {
    const { data } = await api.get(`/payments/${id}`)
    return data
  },

  async requestRefund(paymentId, reason) {
    const { data } = await api.post(`/payments/${paymentId}/refund`, { reason })
    return data
  },

  async downloadInvoice(paymentId) {
    const { data } = await api.get(`/payments/${paymentId}/invoice`, {
      responseType: 'blob'
    })
    return data
  }
}