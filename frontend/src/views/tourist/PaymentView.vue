<template>
  <div class="payment-view">
    <header class="secondary-header">
      <button class="back-button" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <span class="header-title">Método de Pago</span>
      <div></div>
    </header>

    <div class="content">
      <div class="payment-methods">
        <button
          v-for="method in methods"
          :key="method.id"
          class="method-btn"
          :class="{ active: selectedMethod === method.id }"
          @click="selectedMethod = method.id"
        >
          <component :is="method.icon" />
          <span>{{ method.name }}</span>
        </button>
      </div>

      <div class="card-form" v-if="selectedMethod === 'card'">
        <div class="input-wrapper">
          <input v-model="payment.cardNumber" type="text" class="input-field" placeholder="Número de tarjeta" />
        </div>
        <div class="input-wrapper">
          <input v-model="payment.cardHolder" type="text" class="input-field" placeholder="Nombre del titular" />
        </div>
        <div class="input-row">
          <div class="input-wrapper">
            <input v-model="payment.expiry" type="text" class="input-field" placeholder="MM/AA" />
          </div>
          <div class="input-wrapper">
            <input v-model="payment.cvv" type="text" class="input-field" placeholder="CVV" />
          </div>
        </div>
      </div>

      <div class="summary">
        <div class="summary-row total">
          <span>Total a pagar</span>
          <span>$350.000</span>
        </div>
      </div>

      <div class="security-badges">
        <svg width="40" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <span>Pago seguro SSL</span>
      </div>

      <button class="btn btn-primary" @click="processPayment">Pagar Ahora</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const selectedMethod = ref('card')

const methods = [
  { id: 'card', name: 'Tarjeta de Crédito', icon: () => h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [h('rect', { x: 1, y: 4, width: 22, height: 16, rx: 2, ry: 2 }), h('line', { x1: 1, y1: 10, x2: 23, y2: 10 })]) },
  { id: 'debit', name: 'Tarjeta Débito', icon: () => h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [h('rect', { x: 1, y: 4, width: 22, height: 16, rx: 2, ry: 2 }), h('line', { x1: 1, y1: 10, x2: 23, y2: 10 })]) },
  { id: 'pse', name: 'PSE', icon: () => h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }), h('path', { d: 'M8 12h8' })]) },
  { id: 'nequi', name: 'Nequi', icon: () => h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [h('circle', { cx: 12, cy: 12, r: 10 }), h('path', { d: 'M12 8v8' }), h('path', { d: 'M8 12h8' })]) }
]

const payment = reactive({
  cardNumber: '',
  cardHolder: '',
  expiry: '',
  cvv: ''
})

function goBack() {
  router.back()
}

function processPayment() {
  router.push(`/booking/confirmation/${route.params.reservationId}`)
}
</script>

<style scoped>
.payment-view { min-height: 100vh; background: var(--color-background); }
.secondary-header { height: var(--header-height); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--spacing-lg); border-bottom: 1.7px solid var(--color-border); background: var(--color-white); }
.back-button { background: transparent; padding: var(--spacing-xs); }
.header-title { font-size: 18px; font-weight: 500; }
.content { padding: var(--spacing-lg); }
.payment-methods { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-xl); }
.method-btn { padding: var(--spacing-md); background: var(--color-white); border: 1.7px solid var(--color-border); border-radius: var(--radius-small); display: flex; align-items: center; gap: var(--spacing-sm); font-size: 14px; cursor: pointer; }
.method-btn.active { border-color: var(--color-primary); background: rgba(76, 175, 80, 0.05); }
.card-form { margin-bottom: var(--spacing-xl); }
.input-wrapper { margin-bottom: var(--spacing-md); }
.input-wrapper input { width: 100%; padding: var(--spacing-md); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-small); }
.input-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
.summary { padding: var(--spacing-md); background: var(--color-surface); border-radius: var(--radius-small); margin-bottom: var(--spacing-lg); }
.summary-row { display: flex; justify-content: space-between; padding: var(--spacing-xs) 0; }
.summary-row.total { font-weight: 600; font-size: 18px; color: var(--color-primary); }
.security-badges { display: flex; align-items: center; gap: var(--spacing-sm); color: var(--color-text-secondary); font-size: 14px; margin-bottom: var(--spacing-lg); justify-content: center; }
</style>