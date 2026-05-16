<template>
  <div class="listing-card" @click="navigateToDetail">
    <div class="card-image">
      <img :src="listing.images?.[0] || '/placeholder.jpg'" :alt="listing.name" />
    </div>
    <div class="card-content">
      <h3>{{ listing.name }}</h3>
      <p class="location">{{ listing.location }}</p>
      <p class="price">${{ listing.price }}</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  listing: {
    type: Object,
    required: true
  }
})

const router = useRouter()

function navigateToDetail() {
  router.push(`/listings/${props.listing.id}`)
}
</script>

<style scoped>
.listing-card {
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
  background: var(--color-white);
  box-shadow: var(--shadow-card);
}
.listing-card:hover {
  transform: scale(1.02);
}
.card-image {
  width: 100%;
  overflow: hidden;
}
.card-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}
.card-content {
  padding: 12px;
}

@media (min-width: 1024px) {
  .listing-card {
    max-width: 320px;
  }

  .card-image img {
    height: 180px;
  }
}
</style>