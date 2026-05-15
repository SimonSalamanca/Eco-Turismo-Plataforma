<template>
  <div
    class="listing-card"
    :class="[variant, { premium: premium }]"
    @click="$emit('click')"
  >
    <div class="card-image">
      <img :src="listing.images?.[0] || 'https://via.placeholder.com/400'" :alt="listing.name" />
      <span v-if="premium" class="badge-premium">PREMIUM</span>
      <button class="favorite-btn" @click.stop="$emit('favorite')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
    </div>
    <div class="card-content">
      <h3 class="card-title">{{ listing.name }}</h3>
      <div class="card-location">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>{{ listing.location }}</span>
      </div>
      <div class="card-rating">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span class="rating-value">{{ listing.rating }}</span>
        <span class="reviews">({{ listing.reviews }} reseñas)</span>
      </div>
      <div class="card-price">
        <span class="price">${{ formatPrice(listing.price) }}</span>
        <span class="period">noche</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  listing: {
    type: Object,
    required: true
  },
  variant: {
    type: String,
    default: 'horizontal',
    validator: v => ['horizontal', 'vertical'].includes(v)
  },
  premium: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click', 'favorite'])

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(price)
}
</script>

<style scoped>
.listing-card {
  background: var(--color-white);
  border-radius: var(--radius-small);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.listing-card:active {
  transform: scale(0.98);
}

.listing-card.horizontal {
  display: flex;
  height: 128px;
  overflow: hidden;
}

.listing-card.vertical {
  width: 256px;
  height: 263px;
  display: flex;
  flex-direction: column;
}

.card-image {
  position: relative;
  overflow: hidden;
}

.horizontal .card-image {
  width: 128px;
  min-width: 128px;
  height: 100%;
}

.vertical .card-image {
  height: 160px;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-premium {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background: var(--color-primary-light);
  color: var(--color-white);
  font-size: 12px;
  font-weight: 600;
  border-radius: 2px;
}

.favorite-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.vertical .favorite-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.vertical:hover .favorite-btn {
  opacity: 1;
}

.card-content {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vertical .card-content {
  flex: 1;
}

.card-title {
  font-size: 18px;
  line-height: 27px;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-location {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.card-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.rating-value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: auto;
}

.price {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-tertiary);
}

.period {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>