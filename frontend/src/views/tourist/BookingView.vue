<template>
  <div class="booking-view">
    <div v-if="loading" class="loading-state">
      <span>Cargando...</span>
    </div>

    <template v-else-if="listing">
      <header class="secondary-header">
        <button class="back-button" @click="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span class="header-title">Reservar</span>
        <div class="steps">
          <span :class="{ active: step >= 1 }">1</span>
          <span :class="{ active: step >= 2 }">2</span>
          <span :class="{ active: step >= 3 }">3</span>
        </div>
      </header>

      <div class="content" v-if="step === 1">
        <div class="summary-card">
          <img :src="listingImage" alt="" class="summary-image" />
          <div class="summary-info">
            <h3>{{ listing.title }}</h3>
            <p>{{ fullLocation }}</p>
            <span class="price">${{ formatPrice(listing.price_per_unit) }} / noche</span>
          </div>
        </div>

        <div class="form-section">
          <h2>Selecciona fechas</h2>
          <div class="date-inputs">
            <div class="input-group">
              <label>Check-in</label>
              <input type="date" v-model="booking.checkIn" :min="today" />
            </div>
            <div class="input-group">
              <label>Check-out</label>
              <input type="date" v-model="booking.checkOut" :min="booking.checkIn || today" />
            </div>
          </div>
          <p v-if="dateError" class="error-text">{{ dateError }}</p>

          <div class="guest-input">
            <label>Huéspedes (capacidad: {{ listing.capacity }})</label>
            <div class="counter">
              <button @click="booking.guests > 1 && booking.guests--">-</button>
              <span>{{ booking.guests }}</span>
              <button @click="booking.guests < listing.capacity && booking.guests++">+</button>
            </div>
          </div>
        </div>

        <div v-if="nights > 0" class="price-summary">
          <div class="price-row">
            <span>${{ formatPrice(listing.price_per_unit) }} x {{ nights }} noches</span>
            <span>${{ formatPrice(subtotal) }}</span>
          </div>
          <div class="price-row">
            <span>Impuestos (19%)</span>
            <span>${{ formatPrice(taxes) }}</span>
          </div>
          <div class="price-row total">
            <span>Total</span>
            <span>${{ formatPrice(total) }}</span>
          </div>
        </div>

        <button 
          class="btn btn-primary" 
          @click="step = 2"
          :disabled="!canContinueStep1"
        >
          Continuar
        </button>
      </div>

      <div class="content" v-if="step === 2">
        <div class="form-section">
          <h2>Datos del viajero</h2>
          <div class="input-wrapper">
            <input v-model="userData.full_name" type="text" class="input-field" placeholder="Nombre completo" />
          </div>
          <div class="input-wrapper">
            <input v-model="userData.email" type="email" class="input-field" placeholder="Correo electrónico" />
          </div>
          <div class="input-wrapper">
            <input v-model="userData.phone" type="tel" class="input-field" placeholder="Teléfono" />
          </div>
          <div class="input-wrapper">
            <textarea v-model="booking.specialRequests" class="input-field" placeholder="Solicitudes especiales" rows="3"></textarea>
          </div>
        </div>
        <button class="btn btn-primary" @click="step = 3" :disabled="!canContinueStep2">Continuar</button>
      </div>

      <div class="content" v-if="step === 3">
        <div class="form-section">
          <h2>Confirmar reservación</h2>
          <div class="confirmation-details">
            <p><strong>Alojamiento:</strong> {{ listing.title }}</p>
            <p><strong>Fechas:</strong> {{ formatDateDisplay(booking.checkIn) }} - {{ formatDateDisplay(booking.checkOut) }}</p>
            <p><strong>Huéspedes:</strong> {{ booking.guests }}</p>
            <p><strong>Viajero:</strong> {{ userData.full_name }}</p>
          </div>
          <div class="price-summary">
            <div class="price-row total">
              <span>Total a pagar</span>
              <span>${{ formatPrice(total) }}</span>
            </div>
          </div>
          <p class="policy">Al confirmar, aceptas las políticas de cancelación</p>
        </div>
        <button class="btn btn-primary" @click="confirmBooking" :disabled="creating">
          {{ creating ? 'Creando reserva...' : 'Confirmar Reserva' }}
        </button>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      </div>
    </template>

    <div v-else class="empty-state">
      <p>Alojamiento no encontrado</p>
      <button class="btn btn-primary" @click="router.push('/tourist')">Volver al inicio</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useListingsStore } from '@/stores/listings.store'
import { useAuthStore } from '@/stores/auth.store'
import reservationsService from '@/services/reservations.service'

const route = useRoute()
const router = useRouter()
const listingsStore = useListingsStore()
const authStore = useAuthStore()

const loading = ref(true)
const listing = ref(null)
const step = ref(1)
const creating = ref(false)
const errorMessage = ref('')
const reservation = ref(null)

const today = new Date().toISOString().split('T')[0]

const booking = reactive({
  checkIn: route.query.checkIn || '',
  checkOut: route.query.checkOut || '',
  guests: parseInt(route.query.guests) || 1,
  specialRequests: ''
})

const userData = reactive({
  full_name: '',
  email: '',
  phone: ''
})

const listingImage = computed(() => {
  if (listing.value?.photos?.length > 0) {
    return listing.value.photos[0].url || listing.value.photos[0]
  }
  return 'https://via.placeholder.com/400x400?text=Sin+imagen'
})

const fullLocation = computed(() => {
  const loc = []
  if (listing.value?.municipality) loc.push(listing.value.municipality)
  if (listing.value?.department) loc.push(listing.value.department)
  return loc.length > 0 ? loc.join(', ') : 'Ubicación no disponible'
})

const nights = computed(() => {
  if (!booking.checkIn || !booking.checkOut) return 0
  const start = new Date(booking.checkIn)
  const end = new Date(booking.checkOut)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 0
})

const dateError = computed(() => {
  if (booking.checkIn && booking.checkOut && nights.value <= 0) {
    return 'La fecha de check-out debe ser posterior a check-in'
  }
  return ''
})

const subtotal = computed(() => (listing.value?.price_per_unit || 0) * nights.value)
const taxes = computed(() => Math.round(subtotal.value * 0.19))
const total = computed(() => subtotal.value + taxes.value)

const canContinueStep1 = computed(() => {
  return booking.checkIn && booking.checkOut && nights.value > 0 && booking.guests > 0
})

const canContinueStep2 = computed(() => {
  return userData.full_name.trim() && userData.email.trim()
})

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price)
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function goBack() {
  if (step.value > 1) {
    step.value--
  } else {
    router.back()
  }
}

async function confirmBooking() {
  if (creating.value) return
  
  creating.value = true
  errorMessage.value = ''
  
  try {
    const response = await reservationsService.create({
      listing_id: listing.value.id,
      check_in_date: booking.checkIn,
      check_out_date: booking.checkOut,
      guests_count: booking.guests
    })
    
    reservation.value = response.data
    
    router.push(`/booking/confirmation/${reservation.value.id}`)
  } catch (err) {
    errorMessage.value = err.response?.data?.message || err.message || 'Error al crear la reserva'
    console.error('Error creating reservation:', err)
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  try {
    const id = route.params.listingId
    listing.value = await listingsStore.fetchListing(id)
    
    if (authStore.user) {
      userData.full_name = authStore.user.full_name || ''
      userData.email = authStore.user.email || ''
      userData.phone = authStore.user.phone || ''
    }
  } catch (err) {
    console.error('Error loading listing:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.booking-view {
  min-height: 100vh;
  background: var(--color-background);
}

.secondary-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  border-bottom: 1.7px solid var(--color-border);
  background: var(--color-white);
}

.back-button {
  background: transparent;
  padding: var(--spacing-xs);
}

.header-title {
  font-size: 18px;
  font-weight: 500;
}

.steps {
  display: flex;
  gap: var(--spacing-xs);
}

.steps span {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.steps span.active {
  background: var(--color-primary);
  color: var(--color-white);
}

.content {
  padding: var(--spacing-lg);
}

.summary-card {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-surface);
  border-radius: var(--radius-small);
  margin-bottom: var(--spacing-xl);
}

.summary-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-small);
}

.summary-info h3 {
  font-size: 16px;
  margin-bottom: 4px;
}

.summary-info p {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.summary-info .price {
  font-size: 14px;
  font-weight: 600;
}

.form-section {
  margin-bottom: var(--spacing-xl);
}

.form-section h2 {
  font-size: 18px;
  margin-bottom: var(--spacing-md);
}

.date-inputs {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.input-group {
  flex: 1;
}

.input-group label, .guest-input label {
  display: block;
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.input-group input, .input-wrapper input, .input-wrapper textarea {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
}

.guest-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.counter {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.counter button {
  width: 32px;
  height: 32px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
}

.price-summary {
  padding: var(--spacing-md);
  background: var(--color-surface);
  border-radius: var(--radius-small);
  margin-bottom: var(--spacing-lg);
}

.price-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  font-size: 14px;
}

.price-row.total {
  font-weight: 600;
  font-size: 16px;
  color: var(--color-primary);
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.input-wrapper {
  margin-bottom: var(--spacing-md);
}

.policy {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.confirmation-details {
  padding: var(--spacing-md);
  background: var(--color-surface);
  border-radius: var(--radius-small);
  margin-bottom: var(--spacing-lg);
}

.confirmation-details p {
  font-size: 14px;
  margin-bottom: var(--spacing-xs);
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.error-text {
  color: var(--color-danger);
  font-size: 14px;
  margin-top: var(--spacing-sm);
  text-align: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>