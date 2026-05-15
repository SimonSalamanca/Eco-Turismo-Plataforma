import { defineStore } from 'pinia'
import { ref } from 'vue'
import reviewsService from '@/services/reviews.service'

export const useReviewsStore = defineStore('reviews', () => {
  const reviews = ref([])
  const listingReviews = ref([])
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
      stats.value = response.stats
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
      const response = await reviewsService.getUserReviews()
      reviews.value = response.reviews
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
      listingReviews.value.unshift(response.review)
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateReview(id, reviewData) {
    loading.value = true
    try {
      const response = await reviewsService.update(id, reviewData)
      const index = reviews.value.findIndex(r => r.id === id)
      if (index !== -1) {
        reviews.value[index] = response.review
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function respondToReview(id, responseText) {
    loading.value = true
    try {
      const response = await reviewsService.respond(id, responseText)
      const index = listingReviews.value.findIndex(r => r.id === id)
      if (index !== -1) {
        listingReviews.value[index] = response.review
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
    loading,
    error,
    stats,
    fetchReviewsByListing,
    fetchUserReviews,
    createReview,
    updateReview,
    respondToReview
  }
})