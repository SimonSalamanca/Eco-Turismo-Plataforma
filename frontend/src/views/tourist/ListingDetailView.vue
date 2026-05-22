<template>
  <div class="listing-detail-view">
    <div v-if="loading" class="loading-state">
      <span>Cargando...</span>
    </div>

    <template v-else-if="listing">
      <div class="hero-image" :style="{ backgroundImage: `url(${heroImage})` }">
        <button class="back-btn" @click="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button class="favorite-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <div class="content">
        <div class="main-info">
          <h1 class="title">{{ listing.title }}</h1>
          <div class="location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{{ fullLocation }}</span>
          </div>
          <div class="rating">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span class="rating-value">{{ listing.average_rating || 0 }}</span>
            <span class="reviews">({{ listing.review_count || 0 }} reseñas)</span>
          </div>
          <div class="price">
            <span class="price-value">${{ formatPrice(listing.price_per_unit) }}</span>
            <span class="price-period">por noche</span>
          </div>
        </div>

        <section class="section">
          <h2>Descripción</h2>
          <p class="description">{{ listing.description || 'Este alojamiento no tiene descripción disponible.' }}</p>
        </section>

        <section class="section">
          <h2>Amenidades</h2>
          <div v-if="listingCategories.length > 0" class="amenities-grid">
            <div v-for="cat in listingCategories" :key="cat" class="amenity-item">
              <span>{{ getCategoryLabel(cat) }}</span>
            </div>
          </div>
          <div v-else class="empty-text">
            <span>No hay amenidades especificadas</span>
          </div>
        </section>

        <section class="section">
          <h2>Anfitrión</h2>
          <div class="host-card">
            <div class="host-avatar">{{ hostInitials }}</div>
            <div class="host-info">
              <h3>{{ hostName }}</h3>
              <p>Anfitrión en Ecoturismo</p>
            </div>
            <button class="btn btn-outline">Contactar</button>
          </div>
        </section>

        <section class="section">
          <h2>Selecciona fechas</h2>
          <div class="date-pickers">
            <div class="date-input">
              <label>Check-in</label>
              <input type="date" v-model="checkIn" :min="today" />
            </div>
            <div class="date-input">
              <label>Check-out</label>
              <input type="date" v-model="checkOut" :min="checkIn || today" />
            </div>
          </div>
          <div class="guest-input">
            <label>Huéspedes (capacidad: {{ listing.capacity }})</label>
            <div class="guest-counter">
              <button @click="guests > 1 && guests--">-</button>
              <span>{{ guests }}</span>
              <button @click="guests < listing.capacity && guests++">+</button>
            </div>
          </div>
        </section>

        <section class="section">
          <h2>Ubicación</h2>
          <div class="map-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{{ listing.address || fullLocation }}</span>
          </div>
        </section>

        <section v-if="listingReviews.length > 0" class="section">
          <h2>Reseñas</h2>
          <div class="reviews-summary">
            <div class="rating-large">
              <span class="rating-num">{{ listing.average_rating || 0 }}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <span class="reviews-count">{{ listing.review_count || 0 }} reseñas</span>
          </div>
          <div class="reviews-list">
            <ReviewCard v-for="review in listingReviews" :key="review.id" :review="review" />
          </div>
        </section>

        <section v-else class="section">
          <h2>Reseñas</h2>
          <div class="empty-text">
            <span>Aún no hay reseñas para este alojamiento</span>
          </div>
        </section>
      </div>

      <div class="sticky-footer">
        <div class="footer-price">
          <span class="price-value">${{ formatPrice(listing.price_per_unit) }}</span>
          <span class="price-period">por noche</span>
        </div>
        <button class="btn btn-primary" @click="goToBooking" :disabled="!canBook">Reservar</button>
      </div>
    </template>

    <div v-else class="empty-state">
      <p>Alojamiento no encontrado</p>
      <button class="btn btn-primary" @click="goBack">Volver</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useListingsStore } from '@/stores/listings.store'
import { useReviewsStore } from '@/stores/reviews.store'
import ReviewCard from '@/components/reviews/ReviewCard.vue'

const route = useRoute()
const router = useRouter()
const listingsStore = useListingsStore()
const reviewsStore = useReviewsStore()

const listing = ref(null)
const listingReviews = ref([])
const loading = ref(true)
const checkIn = ref('')
const checkOut = ref('')
const guests = ref(1)

const today = new Date().toISOString().split('T')[0]

const heroImage = computed(() => {
  if (listing.value?.photos?.length > 0) {
    return listing.value.photos[0].url || listing.value.photos[0]
  }
  return 'https://via.placeholder.com/800x400?text=Sin+imagen'
})

const fullLocation = computed(() => {
  const loc = []
  if (listing.value?.municipality) loc.push(listing.value.municipality)
  if (listing.value?.department) loc.push(listing.value.department)
  return loc.length > 0 ? loc.join(', ') : 'Ubicación no disponible'
})

const hostName = computed(() => {
  return listing.value?.host?.full_name || 'Anfitrión'
})

const hostInitials = computed(() => {
  const name = listing.value?.host?.full_name || 'A'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const listingCategories = computed(() => {
  return listing.value?.categories || []
})

const canBook = computed(() => {
  return checkIn.value && checkOut.value && guests.value > 0
})

function getCategoryLabel(cat) {
  return cat
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price)
}

function goBack() {
  router.back()
}

function goToBooking() {
  if (!canBook.value) return
  router.push({
    path: `/tourist/booking/${route.params.id}`,
    query: {
      checkIn: checkIn.value,
      checkOut: checkOut.value,
      guests: guests.value
    }
  })
}

onMounted(async () => {
  try {
    const id = route.params.id
    listing.value = await listingsStore.fetchListing(id)

    const res = await reviewsStore.fetchReviewsByListing(id)
    listingReviews.value = res.reviews || []
  } catch (err) {
    console.error('Error loading listing:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.listing-detail-view {
  min-height: 100vh;
  padding-bottom: 80px;
  background: var(--color-background);
}

.hero-image {
  height: 240px;
  background-size: cover;
  background-position: center;
  position: relative;
  background-color: var(--color-surface);
}

.back-btn, .favorite-btn {
  position: absolute;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-primary);
}

.back-btn {
  top: var(--spacing-lg);
  left: var(--spacing-lg);
}

.favorite-btn {
  top: var(--spacing-lg);
  right: var(--spacing-lg);
}

.content {
  padding: var(--spacing-lg);
}

.main-info {
  margin-bottom: var(--spacing-xl);
}

.title {
  font-size: 20px;
  line-height: 28px;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.location {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-bottom: var(--spacing-sm);
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  margin-bottom: var(--spacing-sm);
}

.rating-value {
  font-weight: 600;
}

.reviews {
  color: var(--color-text-secondary);
}

.price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-tertiary);
}

.price-period {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.section {
  margin-bottom: var(--spacing-xl);
}

.section h2 {
  font-size: 18px;
  margin-bottom: var(--spacing-md);
}

.description {
  font-size: 14px;
  color: var(--color-text-primary);
  line-height: 20px;
}

.amenities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.amenity-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.amenity-icon {
  color: var(--color-text-secondary);
}

.host-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-surface);
  border-radius: var(--radius-small);
}

.host-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  font-weight: 600;
}

.host-info {
  flex: 1;
}

.host-info h3 {
  font-size: 16px;
}

.host-info p {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.date-pickers {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.date-input {
  flex: 1;
}

.date-input label, .guest-input label {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.date-input input {
  width: 100%;
  height: 44px;
  padding: 0 var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
}

.guest-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.guest-counter {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.guest-counter button {
  width: 32px;
  height: 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guest-counter span {
  font-size: 16px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.map-placeholder {
  height: 150px;
  background: var(--color-surface);
  border-radius: var(--radius-small);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.reviews-summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.rating-large {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-num {
  font-size: 24px;
  font-weight: 600;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.review-item {
  padding: var(--spacing-md);
  background: var(--color-surface);
  border-radius: var(--radius-small);
}

.review-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.review-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.review-info {
  flex: 1;
}

.review-info h4 {
  font-size: 14px;
}

.review-info span {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.review-rating {
  display: flex;
  gap: 2px;
}

.review-text {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.sticky-footer {
  position: fixed;
  bottom: var(--bottom-nav-height);
  left: 0;
  right: 0;
  height: 72px;
  background: var(--color-white);
  border-top: 1px solid var(--color-border);
  box-shadow: 0px -4px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  z-index: 50;
}

.footer-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.sticky-footer .btn-primary {
  width: auto;
  padding: 0 var(--spacing-xl);
}

.sticky-footer .btn-primary:disabled {
  background: var(--color-text-secondary);
  cursor: not-allowed;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: var(--color-text-secondary);
}

.empty-text {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>