<template>
  <div class="home-view">
    <section class="premium-section">
      <div class="section-header">
        <h2>Anfitriones Premium</h2>
        <button class="see-more" @click="goToSearch">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      
      <div v-if="listingsStore.loading && featuredListings.length === 0" class="loading-state">
        <span>Cargando alojamientos...</span>
      </div>
      
      <div v-else-if="featuredListings.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <p>No hay alojamientos premium disponibles</p>
        <span>Pronto tendremos anfitriones destacados para ti</span>
      </div>
      
      <div v-else class="premium-scroll">
        <ListingCard
          v-for="listing in featuredListings"
          :key="listing.id"
          :listing="mapListing(listing)"
          variant="vertical"
          :premium="isHostPremium(listing)"
          @click="goToDetail(listing.id)"
        />
      </div>
    </section>

    <section class="categories-section">
      <div class="categories-scroll">
        <button
          v-for="cat in categories"
          :key="cat.value"
          class="btn-pill"
          :class="{ active: selectedCategory === cat.value }"
          @click="selectCategory(cat.value)"
        >
          {{ cat.label }}
        </button>
      </div>
    </section>

    <section class="top-rated-section">
      <div class="section-header">
        <h2>Mejor Valoradas</h2>
        <button class="see-more" @click="goToSearch">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      
      <div v-if="listingsStore.loading && topRatedListings.length === 0" class="loading-state">
        <span>Cargando...</span>
      </div>
      
      <div v-else-if="topRatedListings.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
        <p>Aún no hay alojamientos valorados</p>
        <span>Sé el primero en reservar y dejar una reseña</span>
      </div>
      
      <div v-else class="listings-list">
        <ListingCard
          v-for="listing in topRatedListings"
          :key="listing.id"
          :listing="mapListing(listing)"
          variant="horizontal"
          @click="goToDetail(listing.id)"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useListingsStore } from '@/stores/listings.store'
import ListingCard from '@/components/listing/ListingCard.vue'

const router = useRouter()
const listingsStore = useListingsStore()

const selectedCategory = ref('all')

const categories = [
  { label: 'Todo', value: 'all' },
  { label: 'WiFi', value: 'WiFi' },
  { label: 'Piscina', value: 'Piscina' },
  { label: 'Estacionamiento', value: 'Estacionamiento' },
  { label: 'Cocina', value: 'Cocina' },
  { label: 'Aire acondicionado', value: 'Aire acondicionado' },
  { label: 'Terraza', value: 'Terraza' },
  { label: 'Mascotas', value: 'Mascotas' }
]

const featuredListings = computed(() => listingsStore.featuredListings)
const topRatedListings = computed(() => listingsStore.topRatedListings)

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

function isHostPremium(listing) {
  const hostProfile = listing.host?.hostProfile
  return hostProfile && 
         ['premium', 'pro'].includes(hostProfile.subscription_plan) && 
         hostProfile.subscription_status === 'active'
}

function selectCategory(value) {
  selectedCategory.value = value
  if (value !== 'all') {
    listingsStore.setFilters({ amenities: [value] })
    router.push('/tourist/search')
  }
}

function goToSearch() {
  router.push('/tourist/search')
}

function goToDetail(id) {
  router.push(`/tourist/listing/${id}`)
}

onMounted(async () => {
  await Promise.all([
    listingsStore.fetchFeatured(),
    listingsStore.fetchTopRated()
  ])
})
</script>

<style scoped>
.home-view {
  padding: var(--spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-header h2 {
  font-size: 20px;
  color: var(--color-text-primary);
}

.see-more {
  background: transparent;
  color: var(--color-primary);
  padding: var(--spacing-xs);
}

.premium-section {
  margin-bottom: var(--spacing-xl);
}

.premium-scroll {
  display: flex;
  gap: var(--spacing-md);
  overflow-x: auto;
  padding-bottom: var(--spacing-sm);
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.premium-scroll::-webkit-scrollbar {
  display: none;
}

.categories-section {
  margin-bottom: var(--spacing-xl);
}

.categories-scroll {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
  padding-bottom: var(--spacing-sm);
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.categories-scroll::-webkit-scrollbar {
  display: none;
}

.top-rated-section {
  margin-bottom: var(--spacing-xl);
}

.listings-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
}

.empty-state svg {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.empty-state span {
  font-size: 14px;
  color: var(--color-text-secondary);
}

@media (min-width: 1024px) {
  .home-view {
    padding: var(--spacing-xl);
  }

  .premium-scroll {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    overflow-x: visible;
    gap: var(--spacing-lg);
  }

  .categories-scroll {
    justify-content: flex-start;
    flex-wrap: wrap;
    overflow-x: visible;
  }

  .listings-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
  }

  .section-header h2 {
    font-size: 24px;
  }
}
</style>