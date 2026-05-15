import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import listingsService from '@/services/listings.service'
import searchService from '@/services/search.service'

export const useListingsStore = defineStore('listings', () => {
  const listings = ref([])
  const featuredListings = ref([])
  const topRatedListings = ref([])
  const currentListing = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({
    category: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    minPrice: 0,
    maxPrice: 1000,
    location: ''
  })
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0
  })

  const hasMore = computed(() => {
    const totalPages = Math.ceil(pagination.value.total / pagination.value.limit)
    return pagination.value.page < totalPages
  })

  async function fetchFeatured() {
    loading.value = true
    try {
      const response = await listingsService.getFeatured()
      featuredListings.value = Array.isArray(response) ? response : []
    } catch (err) {
      error.value = err.message
      featuredListings.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchTopRated() {
    loading.value = true
    try {
      const response = await listingsService.getTopRated()
      topRatedListings.value = Array.isArray(response) ? response : []
    } catch (err) {
      error.value = err.message
      topRatedListings.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchListing(id) {
    loading.value = true
    try {
      const listing = await listingsService.getById(id)
      currentListing.value = listing
      return listing
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function searchListings(searchFilters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await listingsService.getAll({ ...filters.value, ...searchFilters })
      const data = response.data || response
      const list = Array.isArray(data) ? data : (data.listings || [])
      if (searchFilters.append) {
        listings.value = [...listings.value, ...list]
      } else {
        listings.value = list
      }
      pagination.value = {
        page: data.page || 1,
        limit: data.limit || 20,
        total: data.total || list.length
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loading.value) return
    await searchListings({ page: pagination.value.page + 1, append: true })
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
  }

  function clearFilters() {
    filters.value = {
      category: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
      minPrice: null,
      maxPrice: null,
      minRating: 0,
      location: '',
      propertyType: ''
    }
    pagination.value.page = 1
    listings.value = []
  }

  async function createListing(listingData) {
    loading.value = true
    try {
      const response = await listingsService.create(listingData)
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateListing(id, listingData) {
    loading.value = true
    try {
      const response = await listingsService.update(id, listingData)
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteListing(id) {
    loading.value = true
    try {
      await listingsService.delete(id)
      listings.value = listings.value.filter(l => l.id !== id)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function toggleListingStatus(id) {
    loading.value = true
    try {
      const response = await listingsService.toggleStatus(id)
      const index = listings.value.findIndex(l => l.id === id)
      if (index !== -1) {
        listings.value[index] = response.listing
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    listings,
    featuredListings,
    topRatedListings,
    currentListing,
    loading,
    error,
    filters,
    pagination,
    hasMore,
    fetchFeatured,
    fetchTopRated,
    fetchListing,
    searchListings,
    loadMore,
    setFilters,
    clearFilters,
    createListing,
    updateListing,
    deleteListing,
    toggleListingStatus
  }
})