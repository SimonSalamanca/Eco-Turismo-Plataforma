import api from './api'

export default {
  async getByListing(listingId, params = {}) {
    const { data } = await api.get(`/reviews/listing/${listingId}`, { params: { ...params, _t: Date.now() } })
    return data
  },

  async getUserReviews() {
    const { data } = await api.get('/reviews/my-reviews')
    return data
  },

  async create(reviewData) {
    const { data } = await api.post('/reviews', reviewData)
    return data
  },

  async update(id, reviewData) {
    const { data } = await api.put(`/reviews/${id}`, reviewData)
    return data
  },

  async delete(id) {
    const { data } = await api.delete(`/reviews/${id}`)
    return data
  },

  async respond(id, responseText) {
    const { data } = await api.post(`/reviews/${id}/respond`, { response: responseText })
    return data
  },

  async report(id, reason) {
    const { data } = await api.post(`/reviews/${id}/report`, { reason })
    return data
  }
}