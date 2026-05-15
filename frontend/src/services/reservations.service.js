import api from './api'

export default {
  async getTouristReservations(status = null) {
    const params = { _t: Date.now(), ...(status && status !== 'all' ? { status } : {}) }
    const { data } = await api.get('/reservations/my', { params })
    return data.data || data
  },

  async getAll(params = {}) {
    const { data } = await api.get('/reservations', { params: { ...params, _t: Date.now() } })
    return data
  },

  async getById(id) {
    const { data } = await api.get(`/reservations/${id}`, { params: { _t: Date.now() } })
    return data.data || data
  },

  async create(reservationData) {
    const { data } = await api.post('/reservations', reservationData)
    return data
  },

  async update(id, data) {
    const { data: response } = await api.put(`/reservations/${id}`, data)
    return response
  },

  async cancel(id, reason = '') {
    const { data } = await api.post(`/reservations/${id}/cancel`, { reason })
    return data
  },

  async confirm(id) {
    const { data } = await api.post(`/reservations/${id}/confirm`)
    return data
  },

  async reject(id, reason = '') {
    const { data } = await api.post(`/reservations/${id}/reject`, { reason })
    return data
  },

  async getByListing(listingId) {
    const { data } = await api.get(`/reservations/listing/${listingId}`)
    return data
  },

  async checkAvailability(listingId, dates) {
    const { data } = await api.post(`/reservations/check-availability`, {
      listingId,
      ...dates
    })
    return data
  },

  async calculatePrice(listingId, dates, guests) {
    const { data } = await api.post('/reservations/calculate-price', {
      listingId,
      ...dates,
      guests
    })
    return data
  },

  async getHostReservations(status = null) {
    const params = status ? { status } : {}
    const { data } = await api.get('/reservations/host', { params })
    return data
  },

  async confirmReservation(id) {
    const { data } = await api.post(`/reservations/${id}/confirm`)
    return data
  },

  async rejectReservation(id, reason = '') {
    const { data } = await api.post(`/reservations/${id}/reject`, { reason })
    return data
  },

  async getByListing(listingId) {
    const { data } = await api.get(`/reservations/host/listing/${listingId}`)
    return data
  }
}