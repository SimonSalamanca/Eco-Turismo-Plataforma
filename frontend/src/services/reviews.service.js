import api from './api'

export default {
  async getByListing(listingId, params = {}) {
    const { data } = await api.get(`/reviews/listing/${listingId}`, { params: { ...params, _t: Date.now() } })
    return data.data || data
  },

  async getMyReviews() {
    const { data } = await api.get('/reviews/my')
    return data.data || data
  },

  async getHostReviews(params = {}) {
    const { data } = await api.get('/reviews/host', { params })
    return data.data || data
  },

  async create(reviewData) {
    const { data } = await api.post('/reviews', reviewData)
    return data
  },

  async respond(id, reply) {
    const { data } = await api.post(`/reviews/${id}/reply`, { reply })
    return data
  },

  async report(id, reason) {
    const { data } = await api.post(`/reviews/${id}/report`, { reason })
    return data
  }
}