import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import subscriptionsService from '@/services/subscriptions.service'

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const plans = ref([])
  const currentSubscription = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const billingPeriod = ref('monthly')

  const displayedPlans = computed(() => {
    return plans.value.map(plan => ({
      ...plan,
      price: billingPeriod.value === 'annual' && plan.annualPrice
        ? plan.annualPrice
        : plan.monthlyPrice,
      period: billingPeriod.value
    }))
  })

  async function fetchPlans() {
    loading.value = true
    try {
      const response = await subscriptionsService.getPlans()
      plans.value = response.plans
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentSubscription() {
    loading.value = true
    try {
      const response = await subscriptionsService.getCurrent()
      currentSubscription.value = response.subscription
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function subscribe(planId, paymentMethod) {
    loading.value = true
    error.value = null
    try {
      const response = await subscriptionsService.subscribe(planId, paymentMethod)
      currentSubscription.value = response.subscription
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelSubscription() {
    loading.value = true
    try {
      const response = await subscriptionsService.cancel()
      currentSubscription.value = null
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updatePaymentMethod(paymentMethod) {
    loading.value = true
    try {
      const response = await subscriptionsService.updatePaymentMethod(paymentMethod)
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function setBillingPeriod(period) {
    billingPeriod.value = period
  }

  return {
    plans,
    currentSubscription,
    loading,
    error,
    billingPeriod,
    displayedPlans,
    fetchPlans,
    fetchCurrentSubscription,
    subscribe,
    cancelSubscription,
    updatePaymentMethod,
    setBillingPeriod
  }
})