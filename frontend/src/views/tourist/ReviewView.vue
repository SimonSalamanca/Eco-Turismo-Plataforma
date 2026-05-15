<template>
  <div class="review-view">
    <header class="secondary-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <span class="header-title">Calificar Estadía</span>
      <div></div>
    </header>

    <div class="content">
      <div class="listing-card">
        <img :src="reservation?.listing?.image" alt="" />
        <div>
          <h3>{{ reservation?.listing?.name }}</h3>
          <p>{{ reservation?.checkIn }} - {{ reservation?.checkOut }}</p>
        </div>
      </div>

      <div class="rating-section">
        <h2>¿Cómo fue tu experiencia?</h2>
        <div class="stars">
          <button v-for="i in 5" :key="i" class="star-btn" :class="{ active: rating >= i }" @click="rating = i">
            <svg width="32" height="32" viewBox="0 0 24 24" :fill="rating >= i ? '#FFD700' : 'none'" stroke="#FFD700" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      <div class="categories">
        <div class="category-item" v-for="cat in categories" :key="cat.key">
          <span>{{ cat.label }}</span>
          <div class="category-stars">
            <button v-for="i in 5" :key="i" class="mini-star" :class="{ active: cat.value >= i }" @click="cat.value = i">
              <svg width="16" height="16" viewBox="0 0 24 24" :fill="cat.value >= i ? '#FFD700' : 'none'" stroke="#FFD700">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="review-form">
        <label>Escribe tu reseña</label>
        <textarea v-model="reviewText" placeholder="Comparte tu experiencia..." rows="5"></textarea>
      </div>

      <button class="btn btn-primary" @click="submitReview">Publicar Reseña</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const rating = ref(0)
const reviewText = ref('')

const categories = reactive([
  { key: 'cleanliness', label: 'Limpieza', value: 0 },
  { key: 'communication', label: 'Comunicación', value: 0 },
  { key: 'location', label: 'Ubicación', value: 0 },
  { key: 'value', label: 'Valor', value: 0 }
])

const reservation = ref({
  listing: { name: 'Cabaña Los Alpes', image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=200' },
  checkIn: '15 Feb 2025',
  checkOut: '18 Feb 2025'
})

function goBack() {
  router.back()
}

function submitReview() {
  router.push('/tourist/bookings')
}
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
.stars { display: flex; justify-content: center; gap: var(--spacing-sm); }
.star-btn { background: transparent; padding: 0; }
.categories { margin-bottom: var(--spacing-xl); }
.category-item { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md) 0; border-bottom: 1px solid var(--color-border); }
.category-stars { display: flex; gap: 2px; }
.mini-star { background: transparent; padding: 0; }
.review-form { margin-bottom: var(--spacing-xl); }
.review-form label { display: block; font-size: 14px; color: var(--color-text-secondary); margin-bottom: var(--spacing-sm); }
.review-form textarea { width: 100%; padding: var(--spacing-md); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-small); resize: none; }
</style>