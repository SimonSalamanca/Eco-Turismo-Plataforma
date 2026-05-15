<template>
  <div class="subscription-view">
    <header class="page-header">
      <h1>Planes de Suscripción</h1>
    </header>
    <p class="subtitle">Elige el plan que mejor se adapte a ti</p>

    <div class="billing-toggle">
      <button :class="{ active: billingPeriod === 'monthly' }" @click="billingPeriod = 'monthly'">Mensual</button>
      <button :class="{ active: billingPeriod === 'annual' }" @click="billingPeriod = 'annual'">
        Anual <span class="discount">-20%</span>
      </button>
    </div>

    <div class="plans-list">
      <div v-for="plan in plans" :key="plan.id" class="plan-card" :class="{ popular: plan.popular }">
        <span v-if="plan.popular" class="popular-badge">Más popular</span>
        <h3>{{ plan.name }}</h3>
        <div class="plan-price">
          <span class="price">${{ plan.price }}</span>
          <span class="period">/{{ billingPeriod === 'monthly' ? 'mes' : 'año' }}</span>
        </div>
        <ul class="plan-features">
          <li v-for="feature in plan.features" :key="feature" :class="{ included: feature.included }">
            <svg v-if="feature.included" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            {{ feature.name }}
          </li>
        </ul>
        <button class="btn" :class="plan.popular ? 'btn-primary' : 'btn-secondary'">
          {{ plan.current ? 'Plan actual' : 'Seleccionar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const billingPeriod = ref('monthly')

const plans = ref([
  {
    id: 1,
    name: 'Básico',
    price: 0,
    popular: false,
    current: true,
    features: [
      { name: 'Hasta 3 propiedades', included: true },
      { name: 'Gestión de reservas', included: true },
      { name: 'Soporte básico', included: true },
      { name: 'Análisis avanzados', included: false },
      { name: 'Promociones destacadas', included: false }
    ]
  },
  {
    id: 2,
    name: 'Premium',
    price: billingPeriod.value === 'monthly' ? 49000 : 470000,
    popular: true,
    current: false,
    features: [
      { name: 'Hasta 10 propiedades', included: true },
      { name: 'Gestión de reservas', included: true },
      { name: 'Soporte prioritario', included: true },
      { name: 'Análisis avanzados', included: true },
      { name: 'Promociones destacadas', included: true }
    ]
  },
  {
    id: 3,
    name: 'Business',
    price: billingPeriod.value === 'monthly' ? 99000 : 950000,
    popular: false,
    current: false,
    features: [
      { name: 'Propiedades ilimitadas', included: true },
      { name: 'Gestión de reservas', included: true },
      { name: 'Soporte dedicado', included: true },
      { name: 'Análisis avanzados', included: true },
      { name: 'Promociones destacadas', included: true }
    ]
  }
])
</script>

<style scoped>
.subscription-view { padding: var(--spacing-lg); }
.page-header h1 { font-size: 20px; margin-bottom: var(--spacing-xs); }
.subtitle { color: var(--color-text-secondary); margin-bottom: var(--spacing-lg); }
.billing-toggle { display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-xl); }
.billing-toggle button { flex: 1; padding: var(--spacing-md); background: var(--color-white); border: 1.7px solid var(--color-border); border-radius: var(--radius-medium); font-size: 14px; display: flex; align-items: center; justify-content: center; gap: var(--spacing-sm); }
.billing-toggle button.active { border-color: var(--color-primary); background: rgba(76, 175, 80, 0.1); }
.discount { background: var(--color-primary-light); color: var(--color-white); padding: 2px 6px; border-radius: 4px; font-size: 11px; }
.plans-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.plan-card { padding: var(--spacing-lg); background: var(--color-white); border: 1.7px solid var(--color-border); border-radius: var(--radius-small); position: relative; }
.plan-card.popular { border-color: var(--color-primary); }
.popular-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--color-primary); color: var(--color-white); padding: 4px 12px; border-radius: 4px; font-size: 12px; }
.plan-card h3 { font-size: 18px; margin-bottom: var(--spacing-sm); }
.plan-price { margin-bottom: var(--spacing-md); }
.plan-price .price { font-size: 24px; font-weight: 600; color: var(--color-primary); }
.plan-price .period { font-size: 14px; color: var(--color-text-secondary); }
.plan-features { list-style: none; margin-bottom: var(--spacing-lg); }
.plan-features li { display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-xs) 0; font-size: 14px; color: var(--color-text-secondary); }
.plan-features li.included { color: var(--color-text-primary); }
.plan-features li svg { color: var(--color-primary); }
.plan-features li:not(.included) svg { color: var(--color-text-secondary); }
.plan-card .btn { width: 100%; }
</style>