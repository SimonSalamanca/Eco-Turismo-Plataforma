<template>
  <div class="host-reviews-view">
    <div class="page-header">
      <h1>Reseñas</h1>
      <div class="filter-group">
        <label>Alojamiento</label>
        <select v-model="selectedListing" @change="onFilterChange">
          <option value="">Todas las publicaciones</option>
          <option v-for="l in listings" :key="l.id" :value="l.id">{{ l.title }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <span>Cargando reseñas...</span>
    </div>

    <div v-else-if="reviews.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <p>No hay reseñas todavía</p>
      <span v-if="selectedListing">Para este alojamiento</span>
      <span v-else>Cuando tus huéspedes dejen reseñas, aparecerán aquí</span>
    </div>

    <div v-else class="reviews-list">
      <div v-for="review in reviews" :key="review.id" class="review-card">
        <div class="review-main">
          <ReviewCard :review="review" />
          <div v-if="review.listing" class="listing-badge">
            <span>{{ review.listing.title }}</span>
          </div>
        </div>

        <div v-if="!review.has_response" class="reply-section">
          <textarea
            v-model="replyTexts[review.id]"
            placeholder="Escribe tu respuesta..."
            rows="3"
          ></textarea>
          <button
            class="btn btn-primary btn-sm"
            :disabled="!replyTexts[review.id]?.trim() || replying[review.id]"
            @click="submitReply(review.id)"
          >
            {{ replying[review.id] ? 'Enviando...' : 'Responder' }}
          </button>
        </div>
      </div>

      <div v-if="pagination.total_pages > 1" class="pagination">
        <button :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">Anterior</button>
        <span>Página {{ pagination.page }} de {{ pagination.total_pages }}</span>
        <button :disabled="pagination.page >= pagination.total_pages" @click="changePage(pagination.page + 1)">Siguiente</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useReviewsStore } from '@/stores/reviews.store'
import listingsService from '@/services/listings.service'
import ReviewCard from '@/components/reviews/ReviewCard.vue'

const reviewsStore = useReviewsStore()

const reviews = ref([])
const listings = ref([])
const selectedListing = ref('')
const loading = ref(true)
const pagination = ref({ page: 1, limit: 10, total_pages: 0, total: 0 })
const replyTexts = ref({})
const replying = ref({})

async function loadReviews() {
  loading.value = true
  try {
    const params = { page: pagination.value.page, limit: pagination.value.limit }
    if (selectedListing.value) {
      params.listing_id = selectedListing.value
    }
    const response = await reviewsStore.fetchHostReviews(params)
    reviews.value = response.data || []
    pagination.value = response.pagination || { page: 1, limit: 10, total_pages: 0, total: 0 }
  } catch (err) {
    console.error('Error loading reviews:', err)
    reviews.value = []
  } finally {
    loading.value = false
  }
}

async function loadListings() {
  try {
    const response = await listingsService.getMyListings()
    listings.value = Array.isArray(response) ? response : (response.data || response.listings || [])
  } catch (err) {
    console.error('Error loading listings:', err)
    listings.value = []
  }
}

function onFilterChange() {
  pagination.value.page = 1
  loadReviews()
}

function changePage(page) {
  pagination.value.page = page
  loadReviews()
}

async function submitReply(reviewId) {
  const text = replyTexts.value[reviewId]?.trim()
  if (!text) return
  replying.value[reviewId] = true
  try {
    await reviewsStore.respondToReview(reviewId, text)
    replyTexts.value[reviewId] = ''
    await loadReviews()
  } catch (err) {
    console.error('Error submitting reply:', err)
  } finally {
    replying.value[reviewId] = false
  }
}

onMounted(async () => {
  await Promise.all([loadReviews(), loadListings()])
})
</script>

<style scoped>
.host-reviews-view {
  padding: var(--spacing-lg);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}
.page-header h1 {
  font-size: 20px;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.filter-group label {
  font-size: 14px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.filter-group select {
  padding: 8px 12px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  font-size: 14px;
  min-width: 180px;
}
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.review-card {
  background: var(--color-white);
  border-radius: var(--radius-small);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.review-main {
  padding: var(--spacing-md);
}
.listing-badge {
  margin-top: var(--spacing-sm);
  font-size: 12px;
  color: var(--color-primary);
}
.reply-section {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}
.reply-section textarea {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  resize: none;
  font-family: inherit;
  margin-bottom: var(--spacing-sm);
}
.reply-section textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}
.btn-sm {
  padding: 8px 20px;
  font-size: 14px;
}
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}
.pagination button {
  padding: 8px 16px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  cursor: pointer;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination span {
  font-size: 14px;
  color: var(--color-text-secondary);
}
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xxl);
  color: var(--color-text-secondary);
  text-align: center;
}
.empty-state p {
  color: var(--color-text-primary);
  font-size: 16px;
}
</style>
