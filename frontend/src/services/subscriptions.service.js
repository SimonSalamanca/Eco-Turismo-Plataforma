import api from './api'

export default {
  async getPlans() {
    const { data } = await api.get('/subscriptions/plans')
    return data
  },

  async getCurrent() {
    const { data } = await api.get('/subscriptions/current')
    return data
  },

  async subscribe(planId, paymentMethod) {
    const { data } = await api.post('/subscriptions/subscribe', {
      planId,
      paymentMethod
    })
    return data
  },

  async cancel() {
    const { data } = await api.post('/subscriptions/cancel')
    return data
  },

  async updatePaymentMethod(paymentMethod) {
    const { data } = await api.put('/subscriptions/payment-method', paymentMethod)
    return data
  },

  async getInvoiceHistory() {
    const { data } = await api.get('/subscriptions/invoices')
    return data
  },

  async changePlan(planId) {
    const { data } = await api.post('/subscriptions/change-plan', { planId })
    return data
  }
}