<template>
  <div class="star-rating" :class="{ disabled }">
    <button
      v-for="i in 5"
      :key="i"
      type="button"
      class="star-btn"
      :class="{ active: i <= modelValue }"
      :disabled="disabled"
      @click="setRating(i)"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" :fill="i <= modelValue ? '#FFD700' : 'none'" stroke="#FFD700" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

function setRating(val) {
  if (props.disabled) return
  emit('update:modelValue', val)
}
</script>

<style scoped>
.star-rating {
  display: flex;
  gap: 4px;
}
.star-btn {
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition: transform 0.15s;
}
.star-btn:hover:not(:disabled) {
  transform: scale(1.2);
}
.star-rating.disabled .star-btn {
  cursor: default;
}
</style>
