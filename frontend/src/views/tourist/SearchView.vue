<template>
  <div class="search-view">
    <div class="search-header">
      <div class="search-input-wrapper">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Buscar destino..."
          @input="debouncedSearch"
        />
      </div>

      <div class="filters-row">
        <button class="filter-btn" :class="{ active: filters.checkIn || filters.checkOut }" @click="showDatePicker = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>{{ dateLabel }}</span>
        </button>
        <button class="filter-btn" :class="{ active: filters.guests > 1 }" @click="showGuestsPicker = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>{{ filters.guests }} huésped{{ filters.guests > 1 ? 'es' : '' }}</span>
        </button>
        <button class="filter-btn" :class="{ active: hasActiveFilters }" @click="showMoreFilters = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          <span>Filtros</span>
        </button>
      </div>

      <div class="categories-scroll">
        <button
          v-for="cat in amenityOptions"
          :key="cat.value"
          class="btn-pill"
          :class="{ active: filters.amenities.includes(cat.value) }"
          @click="toggleAmenity(cat.value)"
        >
          {{ cat.label }}
        </button>
      </div>
    </div>

    <div v-if="listingsStore.loading && results.length === 0" class="loading-state">
      <span>Buscando alojamientos...</span>
    </div>

    <div v-else-if="results.length === 0" class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <p>No se encontraron resultados</p>
      <span>Intenta con otros filtros o ubicación</span>
      <button class="btn-reset" @click="clearFilters">Limpiar filtros</button>
    </div>

    <div v-else class="results-list">
      <ListingCard
        v-for="listing in results"
        :key="listing.id"
        :listing="mapListing(listing)"
        variant="horizontal"
        @click="goToDetail(listing.id)"
      />
    </div>

    <div v-if="showMoreFilters" class="modal-overlay" @click.self="showMoreFilters = false">
      <div class="filters-modal">
        <div class="modal-header">
          <h3>Filtros</h3>
          <button class="close-btn" @click="showMoreFilters = false">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="filter-group">
          <label>Precio por noche</label>
          <div class="price-inputs">
            <input type="number" v-model.number="filters.minPrice" placeholder="Mín" />
            <span>-</span>
            <input type="number" v-model.number="filters.maxPrice" placeholder="Máx" />
          </div>
        </div>

        <div class="filter-group">
          <label>Calificación mínima</label>
          <div class="rating-options">
            <button
              v-for="r in [1, 2, 3, 4, 5]"
              :key="r"
              class="rating-btn"
              :class="{ active: filters.minRating >= r }"
              @click="filters.minRating = filters.minRating === r ? 0 : r"
            >
              {{ r }}+ ⭐
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label>Amenidades</label>
          <div class="amenity-options">
            <label
              v-for="a in amenityOptions"
              :key="a.value"
              class="amenity-checkbox"
              :class="{ active: filters.amenities.includes(a.value) }"
            >
              <input type="checkbox" :value="a.value" v-model="filters.amenities" />
              <span>{{ a.label }}</span>
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-clear" @click="resetFilters">Limpiar todo</button>
          <button class="btn-apply" @click="applyFilters">Aplicar</button>
        </div>
      </div>
    </div>

    <div v-if="showDatePicker" class="modal-overlay" @click.self="showDatePicker = false">
      <div class="date-modal">
        <div class="modal-header">
          <h3>Seleccionar fechas</h3>
          <button class="close-btn" @click="showDatePicker = false">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="date-inputs">
          <div class="date-field">
            <label>Check-in</label>
            <input type="date" v-model="filters.checkIn" :min="today" />
          </div>
          <div class="date-field">
            <label>Check-out</label>
            <input type="date" v-model="filters.checkOut" :min="filters.checkIn || today" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-clear" @click="clearDates">Limpiar</button>
          <button class="btn-apply" @click="showDatePicker = false">Aplicar</button>
        </div>
      </div>
    </div>

    <div v-if="showGuestsPicker" class="modal-overlay" @click.self="showGuestsPicker = false">
      <div class="guests-modal">
        <div class="modal-header">
          <h3>Huéspedes</h3>
          <button class="close-btn" @click="showGuestsPicker = false">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="guest-counter">
          <button @click="filters.guests = Math.max(1, filters.guests - 1)">-</button>
          <span>{{ filters.guests }}</span>
          <button @click="filters.guests = filters.guests + 1">+</button>
        </div>
        <div class="modal-actions">
          <button class="btn-apply" @click="showGuestsPicker = false">Aceptar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useListingsStore } from '@/stores/listings.store'
import ListingCard from '@/components/listing/ListingCard.vue'

const router = useRouter()
const listingsStore = useListingsStore()

const searchQuery = ref('')
const showDatePicker = ref(false)
const showGuestsPicker = ref(false)
const showMoreFilters = ref(false)

const today = new Date().toISOString().split('T')[0]

const filters = ref({
  amenities: [],
  checkIn: '',
  checkOut: '',
  guests: 1,
  minPrice: null,
  maxPrice: null,
  minRating: 0
})

const amenityOptions = [
  { label: 'WiFi', value: 'WiFi' },
  { label: 'Piscina', value: 'Piscina' },
  { label: 'Estacionamiento', value: 'Estacionamiento' },
  { label: 'Cocina', value: 'Cocina' },
  { label: 'Aire acondicionado', value: 'Aire acondicionado' },
  { label: 'Terraza', value: 'Terraza' },
  { label: 'Chimenea', value: 'Chimenea' },
  { label: 'Lavadora', value: 'Lavadora' },
  { label: 'TV', value: 'TV' },
  { label: 'Parrilla', value: 'Parrilla' },
  { label: 'Jardín', value: 'Jardín' },
  { label: 'Mascotas', value: 'Mascotas' },
  { label: 'Desayuno', value: 'Desayuno' }
]

const results = computed(() => listingsStore.listings)

const dateLabel = computed(() => {
  if (filters.value.checkIn && filters.value.checkOut) {
    return `${formatDateShort(filters.value.checkIn)} - ${formatDateShort(filters.value.checkOut)}`
  }
  if (filters.value.checkIn) {
    return `Desde ${formatDateShort(filters.value.checkIn)}`
  }
  return 'Fechas'
})

const hasActiveFilters = computed(() => {
  return filters.value.minPrice || filters.value.maxPrice || 
         filters.value.minRating > 0 || filters.value.amenities.length > 0
})

let searchTimeout = null
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

function performSearch() {
  const searchParams = {
    type: 'accommodation'
  }

  if (searchQuery.value) {
    searchParams.q = searchQuery.value
  }

  if (filters.value.amenities.length > 0) {
    searchParams.category = filters.value.amenities
  }

  if (filters.value.minPrice) {
    searchParams.price_min = filters.value.minPrice
  }

  if (filters.value.maxPrice) {
    searchParams.price_max = filters.value.maxPrice
  }

  if (filters.value.minRating) {
    searchParams.min_rating = filters.value.minRating
  }

  if (filters.value.checkIn) {
    searchParams.check_in = filters.value.checkIn
  }

  if (filters.value.checkOut) {
    searchParams.check_out = filters.value.checkOut
  }

  if (filters.value.guests > 1) {
    searchParams.capacity = filters.value.guests
  }

  listingsStore.setFilters(filters.value)
  listingsStore.searchListings(searchParams)
}

function toggleAmenity(value) {
  const idx = filters.value.amenities.indexOf(value)
  if (idx === -1) {
    filters.value.amenities.push(value)
  } else {
    filters.value.amenities.splice(idx, 1)
  }
  performSearch()
}

function applyFilters() {
  showMoreFilters.value = false
  performSearch()
}

function resetFilters() {
  filters.value = {
    amenities: [],
    checkIn: '',
    checkOut: '',
    guests: 1,
    minPrice: null,
    maxPrice: null,
    minRating: 0
  }
  performSearch()
}

function clearFilters() {
  searchQuery.value = ''
  resetFilters()
}

function clearDates() {
  filters.value.checkIn = ''
  filters.value.checkOut = ''
  showDatePicker.value = false
  performSearch()
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(date)
}

function mapListing(listing) {
  return {
    id: listing.id,
    name: listing.title,
    location: listing.municipality || listing.department || 'Ubicación no especificada',
    price: listing.price_per_unit,
    rating: parseFloat(listing.average_rating) || 0,
    reviews: listing.review_count || 0,
    images: listing.photos?.map(p => p.url) || []
  }
}

function goToDetail(id) {
  router.push(`/tourist/listing/${id}`)
}

onMounted(() => {
  listingsStore.clearFilters()
  performSearch()
})
</script>

<style scoped>
.search-view {
  min-height: 100vh;
  background: var(--color-background);
}

.search-header {
  padding: var(--spacing-lg);
  background: var(--color-white);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: var(--header-height);
  z-index: 10;
}

.search-input-wrapper {
  position: relative;
  margin-bottom: var(--spacing-md);
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 10px 14px 10px 44px;
  background: var(--color-surface);
  border: 1.7px solid var(--color-border);
  border-radius: var(--radius-small);
  font-size: 16px;
}

.filters-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.filter-btn {
  flex: 1;
  height: 40px;
  background: var(--color-white);
  border: 1.7px solid var(--color-border);
  border-radius: var(--radius-small);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  font-size: 14px;
  color: var(--color-text-primary);
}

.filter-btn.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.categories-scroll {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.categories-scroll::-webkit-scrollbar {
  display: none;
}

.results-list {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.empty-state, .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-secondary);
  text-align: center;
}

.empty-state svg, .loading-state svg {
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

.empty-state p {
  font-size: 18px;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.btn-reset {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-small);
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.filters-modal, .date-modal, .guests-modal {
  background: var(--color-white);
  width: 100%;
  max-width: 500px;
  border-radius: var(--radius-medium) var(--radius-medium) 0 0;
  padding: var(--spacing-lg);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.modal-header h3 {
  font-size: 18px;
  color: var(--color-text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
}

.filter-group {
  margin-bottom: var(--spacing-lg);
}

.filter-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.price-inputs {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.price-inputs input {
  flex: 1;
  height: 40px;
  padding: 0 var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  font-size: 14px;
}

.rating-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.amenity-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.amenity-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  font-size: 14px;
  cursor: pointer;
}

.amenity-checkbox.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.amenity-checkbox input {
  width: auto;
}

.rating-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  font-size: 14px;
}

.rating-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.date-inputs {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.date-field {
  flex: 1;
}

.date-field label {
  display: block;
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.date-field input {
  width: 100%;
  height: 40px;
  padding: 0 var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
}

.guest-counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.guest-counter button {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  font-size: 20px;
  background: var(--color-white);
}

.guest-counter span {
  font-size: 24px;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

.btn-clear {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  font-size: 14px;
  color: var(--color-text-primary);
}

.btn-apply {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-small);
  font-size: 14px;
  color: var(--color-white);
}
</style>