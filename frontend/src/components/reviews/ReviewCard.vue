<template>
  <div class="review-item">
    <div class="review-header">
      <div class="review-avatar">{{ initials }}</div>
      <div class="review-info">
        <h4>{{ touristName }}</h4>
        <span>{{ formattedDate }}</span>
      </div>
      <div class="review-rating">
        <svg v-for="i in 5" :key="i" width="12" height="12" viewBox="0 0 24 24" :fill="i <= review.rating ? '#FFD700' : 'none'" stroke="#FFD700" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </div>
    </div>
    <p class="review-text">{{ review.comment }}</p>
    <div v-if="review.host_response" class="host-reply">
      <div class="reply-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Respuesta del anfitrión</span>
        <span class="reply-date">{{ formatDate(review.host_responded_at) }}</span>
      </div>
      <p class="reply-text">{{ review.host_response }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  review: { type: Object, required: true }
})

const initials = computed(() => {
  const name = props.review.tourist?.full_name || 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const touristName = computed(() => {
  return props.review.tourist?.full_name || 'Usuario'
})

const formattedDate = computed(() => {
  return formatDate(props.review.created_at)
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(date)
}
</script>

<style scoped>
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
  flex-shrink: 0;
}
.review-info {
  flex: 1;
  min-width: 0;
}
.review-info h4 {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.review-info span {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.review-rating {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
.review-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}
.host-reply {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-background);
  border-radius: var(--radius-small);
  border-left: 3px solid var(--color-primary);
}
.reply-header {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-primary);
  margin-bottom: 4px;
}
.reply-header svg {
  flex-shrink: 0;
}
.reply-date {
  margin-left: auto;
  color: var(--color-text-secondary);
}
.reply-text {
  font-size: 13px;
  color: var(--color-text-primary);
  line-height: 1.4;
}
</style>
