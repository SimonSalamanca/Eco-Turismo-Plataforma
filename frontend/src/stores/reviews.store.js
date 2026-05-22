import { defineStore } from 'pinia'
import { ref } from 'vue'
import reviewsService from '@/services/reviews.service'

export const useReviewsStore = defineStore('reviews', () => {
  const reviews = ref([])
  const listingReviews = ref([])
  const hostReviews = ref([])
  const loading = ref(false)
  const error = ref(null)
  const stats = ref({
    average: 0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })

  async function fetchReviewsByListing(listingId) {
    loading.value = true
    try {
      const response = await reviewsService.getByListing(listingId)
      listingReviews.value = response.reviews
      stats.value = { average: response.summary?.average_rating || 0, total: response.summary?.total_reviews || 0 }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchUserReviews() {
    loading.value = true
    try {
      const response = await reviewsService.getMyReviews()
      reviews.value = Array.isArray(response) ? response : []
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchHostReviews(params = {}) {
    loading.value = true
    try {
      const response = await reviewsService.getHostReviews(params)
      hostReviews.value = response.data || []
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createReview(reviewData) {
    loading.value = true
    error.value = null
    try {
      const response = await reviewsService.create(reviewData)
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function respondToReview(id, reply) {
    loading.value = true
    try {
      const response = await reviewsService.respond(id, reply)
      const idx = listingReviews.value.findIndex(r => r.id === id)
      if (idx !== -1) {
        listingReviews.value[idx] = response.data || response
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
    reviews,
    listingReviews,
    hostReviews,
    loading,
    error,
    stats,
    fetchReviewsByListing,
    fetchUserReviews,
    fetchHostReviews,
    createReview,
    respondToReview
  }
})