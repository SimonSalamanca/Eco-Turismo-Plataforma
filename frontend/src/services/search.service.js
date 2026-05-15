import api from './api'

export default {
  async search(params = {}) {
    const { data } = await api.get('/search', { params })
    return data
  },

  async getSuggestions(query) {
    const { data } = await api.get('/search/suggestions', { params: { q: query } })
    return data
  },

  async getFilters() {
    const { data } = await api.get('/search/filters')
    return data
  },

  async getMapBounds(bounds) {
    const { data } = await api.get('/search/map', { params: bounds })
    return data
  }
}