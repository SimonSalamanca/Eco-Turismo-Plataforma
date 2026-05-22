import api from './api'

export default {
  async getFeatured() {
    const { data } = await api.get('/listings/featured', { params: { _t: Date.now() } })
    return data.data || data
  },

  async getTopRated(limit = 3) {
    const { data } = await api.get(`/listings/top-rated?limit=${limit}`, { params: { _t: Date.now() } })
    return data.data || data
  },

  async getById(id) {
    const { data } = await api.get(`/listings/${id}`, { params: { _t: Date.now() } })
    return data.data || data
  },

  async getAll(params = {}) {
    const { data } = await api.get('/listings', { params })
    return data
  },

  async create(listingData) {
    const { data } = await api.post('/listings', listingData)
    return data
  },

  async update(id, listingData) {
    const { data } = await api.put(`/listings/${id}`, listingData)
    return data
  },

  async deleteListing(id) {
    const { data } = await api.delete(`/listings/${id}`)
    return data
  },

  async uploadPhotos(listingId, photos) {
    const formData = new FormData()
    photos.forEach(photo => formData.append('photos', photo))
    const { data } = await api.post(`/listings/${listingId}/photos`, formData)
    return data
  },

  async deletePhoto(listingId, photoId) {
    const { data } = await api.delete(`/listings/${listingId}/photos/${photoId}`)
    return data
  },

  async toggleStatus(id) {
    const { data } = await api.patch(`/listings/${id}/toggle-status`)
    return data
  },

  async getMyListings() {
    const { data } = await api.get('/listings/my')
    return data.data || data
  },

  async getHostDashboardStats() {
    const { data } = await api.get('/listings/host/dashboard-stats')
    return data
  },

  async getHostCalendarAvailability() {
    const { data } = await api.get('/listings/host/calendar-availability')
    return data
  }
}