import { createRouter, createWebHistory } from 'vue-router'
import { requireAuth, requireGuest, requireRole } from './guards'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { guest: true }
  },
  {
    path: '/verify-2fa',
    name: 'Verify2FA',
    component: () => import('@/views/auth/Verify2FAView.vue'),
    meta: { guest: true }
  },
  {
    path: '/tourist',
    component: () => import('@/layouts/TouristLayout.vue'),
    meta: { requiresAuth: true, role: 'tourist' },
    children: [
      {
        path: 'home',
        name: 'TouristHome',
        component: () => import('@/views/tourist/HomeView.vue')
      },
      {
        path: 'search',
        name: 'TouristSearch',
        component: () => import('@/views/tourist/SearchView.vue')
      },
      {
        path: 'listing/:id',
        name: 'ListingDetail',
        component: () => import('@/views/tourist/ListingDetailView.vue')
      },
      {
        path: 'booking/:listingId',
        name: 'Booking',
        component: () => import('@/views/tourist/BookingView.vue')
      },
      {
        path: 'payment/:reservationId',
        name: 'Payment',
        component: () => import('@/views/tourist/PaymentView.vue')
      },
      {
        path: 'bookings',
        name: 'MyBookings',
        component: () => import('@/views/tourist/MyBookingsView.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/tourist/ProfileView.vue')
      },
      {
        path: 'review/:reservationId',
        name: 'Review',
        component: () => import('@/views/tourist/ReviewView.vue')
      }
    ]
  },
  {
    path: '/host',
    component: () => import('@/layouts/HostLayout.vue'),
    meta: { requiresAuth: true, role: 'host' },
    children: [
      {
        path: 'dashboard',
        name: 'HostDashboard',
        component: () => import('@/views/host/HostDashboardView.vue')
      },
      {
        path: 'listings',
        name: 'ManageListings',
        component: () => import('@/views/host/ManageListingsView.vue')
      },
      {
        path: 'listing/create',
        name: 'CreateListing',
        component: () => import('@/views/host/ListingFormView.vue')
      },
      {
        path: 'listing/:id/edit',
        name: 'EditListing',
        component: () => import('@/views/host/ListingFormView.vue')
      },
      {
        path: 'listing/:id',
        name: 'HostListingDetail',
        component: () => import('@/views/host/HostListingDetailView.vue')
      },
      {
        path: 'calendar',
        name: 'Calendar',
        component: () => import('@/views/host/CalendarView.vue')
      },
      {
        path: 'reservations',
        name: 'HostReservations',
        component: () => import('@/views/host/ReservationsView.vue')
      },
      {
        path: 'reservation/:id',
        name: 'ReservationDetail',
        component: () => import('@/views/host/ReservationDetailView.vue')
      },
      {
        path: 'subscription',
        name: 'Subscription',
        component: () => import('@/views/host/SubscriptionView.vue')
      },
      {
        path: 'profile',
        name: 'HostProfile',
        component: () => import('@/views/host/HostProfileView.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/AdminDashboardView.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UsersView.vue')
      },
      {
        path: 'moderation',
        name: 'Moderation',
        component: () => import('@/views/admin/ModerationView.vue')
      },
      {
        path: 'metrics',
        name: 'Metrics',
        component: () => import('@/views/admin/MetricsView.vue')
      }
    ]
  },
  {
    path: '/booking/confirmation/:id',
    name: 'BookingConfirmation',
    component: () => import('@/views/tourist/BookingConfirmationView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  if (to.meta.guest) {
    requireGuest(to, from, next)
  } else if (to.meta.requiresAuth) {
    requireAuth(to, from, next)
  } else if (to.meta.role) {
    requireRole(to, from, next)
  } else {
    next()
  }
})

export default router