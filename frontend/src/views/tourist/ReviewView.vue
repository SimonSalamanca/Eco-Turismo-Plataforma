<template>
  <div class="review-view">
    <header class="secondary-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <span class="header-title">Calificar Estadía</span>
      <div></div>
    </header>

    <div v-if="loading" class="loading-state">
      <span>Cargando...</span>
    </div>

    <div v-else-if="error" class="loading-state">
      <span class="error-text">{{ error }}</span>
      <button class="btn btn-primary" style="margin-top: 16px" @click="goBack">Volver</button>
    </div>

    <div v-else class="content">
      <div class="listing-card">
        <img :src="listingImage" alt="" />
        <div>
          <h3>{{ reservation?.listing?.title || 'Alojamiento' }}</h3>
          <p>{{ formatDate(reservation?.check_in_date) }} - {{ formatDate(reservation?.check_out_date) }}</p>
        </div>
      </div>

      <div class="rating-section">
        <h2>¿Cómo fue tu experiencia?</h2>
        <StarRatingInput v-model="rating" />
        <span v-if="ratingError" class="field-error">{{ ratingError }}</span>
      </div>

      <div class="review-form">
        <label>Escribe tu reseña <span class="optional">(opcional)</span></label>
        <textarea v-model="comment" placeholder="Comparte tu experiencia..." rows="5"></textarea>
      </div>

      <div v-if="submitError" class="submit-error">{{ submitError }}</div>

      <button class="btn btn-primary" :disabled="submitting" @click="submitReview">
        {{ submitting ? 'Publicando...' : 'Publicar Reseña' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReservationsStore } from '@/stores/reservations.store'
import { useReviewsStore } from '@/stores/reviews.store'
import StarRatingInput from '@/components/reviews/StarRatingInput.vue'

const route = useRoute()
const router = useRouter()
const reservationsStore = useReservationsStore()
const reviewsStore = useReviewsStore()

const reservation = ref(null)
const loading = ref(true)
const error = ref(null)
const rating = ref(0)
const comment = ref('')
const submitting = ref(false)
const submitError = ref(null)
const ratingError = ref(null)

const listingImage = computed(() => {
  const photos = reservation.value?.listing?.photos
  if (photos && photos.length > 0) {
    return photos[0].url || photos[0]
  }
  return 'https://via.placeholder.com/200x200?text=Sin+imagen'
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function goBack() {
  router.back()
}

async function submitReview() {
  ratingError.value = null
  submitError.value = null

  if (rating.value < 1) {
    ratingError.value = 'Selecciona una calificación'
    return
  }

  submitting.value = true
  try {
    await reviewsStore.createReview({
      reservation_id: reservation.value.id,
      rating: rating.value,
      comment: comment.value.trim() || undefined
    })
    router.push('/tourist/bookings')
  } catch (err) {
    submitError.value = err.response?.data?.message || err.message || 'Error al publicar la reseña'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const id = route.params.reservationId
    const res = await reservationsStore.fetchReservation(id)
    reservation.value = res
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'No se pudo cargar la reserva'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.review-view { min-height: 100vh; background: var(--color-background); }
.secondary-header { height: var(--header-height); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--spacing-lg); border-bottom: 1.7px solid var(--color-border); background: var(--color-white); }
.back-button { background: transparent; }
.header-title { font-size: 18px; font-weight: 500; }
.content { padding: var(--spacing-lg); }
.listing-card { display: flex; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-surface); border-radius: var(--radius-small); margin-bottom: var(--spacing-xl); }
.listing-card img { width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius-small); }
.listing-card h3 { font-size: 16px; }
.listing-card p { font-size: 14px; color: var(--color-text-secondary); }
.rating-section { text-align: center; margin-bottom: var(--spacing-xl); }
.rating-section h2 { font-size: 18px; margin-bottom: var(--spacing-md); }
.review-form { margin-bottom: var(--spacing-xl); }
.review-form label { display: block; font-size: 14px; color: var(--color-text-secondary); margin-bottom: var(--spacing-sm); }
.review-form .optional { font-size: 12px; color: var(--color-text-secondary); }
.review-form textarea { width: 100%; padding: var(--spacing-md); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-small); resize: none; font-family: inherit; }
.review-form textarea:focus { outline: none; border-color: var(--color-primary); }
.submit-error { color: var(--color-danger); font-size: 14px; margin-bottom: var(--spacing-md); text-align: center; }
.field-error { display: block; color: var(--color-danger); font-size: 12px; margin-top: var(--spacing-xs); }
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; color: var(--color-text-secondary); }
.error-text { color: var(--color-danger); }
</style>
