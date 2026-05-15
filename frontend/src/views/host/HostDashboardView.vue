<template>
  <div class="dashboard-view">
    <section class="welcome-section">
      <h1>Bienvenido, {{ user?.full_name || user?.name || 'Anfitrión' }}</h1>
      <p>Panel de Anfitrión</p>
    </section>

    <section class="stats-grid" v-if="!loading">
      <div class="stat-card">
        <span class="stat-value">{{ stats.activeReservations }}</span>
        <span class="stat-label">Reservas activas</span>
        <svg class="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
        </svg>
      </div>
      <div class="stat-card">
        <span class="stat-value">${{ formatPrice(stats.monthlyIncome) }}</span>
        <span class="stat-label">Ingresos del mes</span>
        <svg class="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.rating }}</span>
        <span class="stat-label">Calificación</span>
        <svg class="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ stats.properties }}</span>
        <span class="stat-label">Propiedades</span>
        <svg class="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    </section>

    <div v-if="loading" class="loading-stats">Cargando estadísticas...</div>

    <section class="section">
      <h2>Próximas Reservas</h2>
      <div v-if="upcomingReservations.length === 0" class="empty">No hay reservas próximas</div>
      <div v-else class="reservations-list">
        <div v-for="res in upcomingReservations" :key="res.id" class="reservation-item" @click="goToDetail(res.id)">
          <div class="res-avatar">{{ getInitials(res.tourist) }}</div>
          <div class="res-info">
            <h4>{{ res.tourist?.full_name || 'Huésped' }}</h4>
            <p>{{ res.listing?.title || 'Listing' }}</p>
            <span>{{ formatDates(res.check_in_date, res.check_out_date) }}</span>
          </div>
          <span class="badge" :class="res.status">{{ getStatusLabel(res.status) }}</span>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Mis Publicaciones</h2>
      <div v-if="myListings.length === 0" class="empty">No tienes publicaciones</div>
      <div v-else class="listings-list">
        <div v-for="listing in myListings" :key="listing.id" class="listing-item">
          <img :src="getListingImage(listing)" alt="" />
          <div class="listing-info">
            <h4>{{ listing.title }}</h4>
            <p>{{ listing.address || listing.municipality }}</p>
          </div>
          <button class="toggle-btn" :class="{ active: listing.status === 'active' }">
            {{ listing.status === 'active' ? 'Activo' : listing.status === 'paused' ? 'Pausado' : 'Inactivo' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import listingsService from '@/services/listings.service'
import reservationsService from '@/services/reservations.service'

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const loading = ref(true)
const stats = ref({
  activeReservations: 0,
  monthlyIncome: 0,
  rating: 0,
  properties: 0
})
const upcomingReservations = ref([])
const myListings = ref([])

async function loadDashboardData() {
  try {
    loading.value = true

    const [statsRes, reservationsRes, listingsRes] = await Promise.all([
      listingsService.getHostDashboardStats(),
      reservationsService.getHostReservations(),
      listingsService.getMyListings()
    ])

    stats.value = statsRes.data

    const allReservations = reservationsRes.data || reservationsRes
    const today = new Date().toISOString().split('T')[0]
    upcomingReservations.value = allReservations
      .filter(r => r.status === 'confirmed' && r.check_in_date >= today)
      .slice(0, 5)

    const listingsData = listingsRes.data || listingsRes
    myListings.value = Array.isArray(listingsData) ? listingsData : []
  } catch (err) {
    console.error('Error loading dashboard:', err)
  } finally {
    loading.value = false
  }
}

function getInitials(tourist) {
  if (!tourist?.full_name) return 'H'
  return tourist.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
}

function formatDates(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 'Fechas no disponibles'
  const inDate = new Date(checkIn)
  const outDate = new Date(checkOut)
  const options = { day: 'numeric', month: 'short' }
  return `${inDate.toLocaleDateString('es-CO', options)} - ${outDate.toLocaleDateString('es-CO', options)}`
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price || 0)
}

function getStatusLabel(status) {
  const labels = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada'
  }
  return labels[status] || status
}

function getListingImage(listing) {
  if (listing.photos?.length > 0) {
    return listing.photos[0].url
  }
  return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200'
}

function goToDetail(id) {
  router.push(`/host/reservation/${id}`)
}

onMounted(loadDashboardData)
</script>

<style scoped>
.dashboard-view { padding: var(--spacing-lg); }
.welcome-section { margin-bottom: var(--spacing-xl); }
.welcome-section h1 { font-size: 20px; margin-bottom: var(--spacing-xs); }
.welcome-section p { font-size: 14px; color: var(--color-text-secondary); }
.loading-stats { text-align: center; padding: var(--spacing-lg); color: var(--color-text-secondary); }
.empty { text-align: center; padding: var(--spacing-lg); color: var(--color-text-secondary); }

.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-xl); }
.stat-card { padding: var(--spacing-lg); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); position: relative; }
.stat-value { display: block; font-size: 24px; font-weight: 600; color: var(--color-primary); margin-bottom: 4px; }
.stat-label { font-size: 12px; color: var(--color-text-secondary); }
.stat-icon { position: absolute; top: var(--spacing-md); right: var(--spacing-md); color: var(--color-text-secondary); opacity: 0.5; }

.section { margin-bottom: var(--spacing-xl); }
.section h2 { font-size: 18px; margin-bottom: var(--spacing-md); }

.reservations-list, .listings-list { display: flex; flex-direction: column; gap: var(--spacing-md); }

.reservation-item { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); cursor: pointer; }
.res-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; color: var(--color-white); font-weight: 600; flex-shrink: 0; }
.res-info { flex: 1; min-width: 0; }
.res-info h4 { font-size: 14px; margin-bottom: 2px; }
.res-info p { font-size: 12px; color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.res-info span { font-size: 12px; color: var(--color-text-secondary); }
.badge { padding: 4px 8px; font-size: 11px; border-radius: 4px; white-space: nowrap; }
.badge.confirmed { background: var(--color-success); color: var(--color-white); }
.badge.pending { background: var(--color-warning); color: var(--color-white); }

.listing-item { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--color-white); border-radius: var(--radius-small); box-shadow: var(--shadow-card); }
.listing-item img { width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius-small); flex-shrink: 0; }
.listing-info { flex: 1; min-width: 0; }
.listing-info h4 { font-size: 14px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.listing-info p { font-size: 12px; color: var(--color-text-secondary); }
.toggle-btn { padding: 4px 12px; font-size: 12px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px; }
.toggle-btn.active { background: var(--color-primary); color: var(--color-white); border-color: var(--color-primary); }
</style>