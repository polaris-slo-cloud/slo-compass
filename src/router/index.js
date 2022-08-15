import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router';
import { Platform } from 'quasar';
import DashboardView from '@/views/DashboardView.vue';
import ConnectionsView from '@/views/ConnectionsView.vue';

console.log(import.meta.env);
const router = createRouter({
  history: Platform.is.electron
    ? createWebHashHistory()
    : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/connections',
      name: 'connections',
      component: ConnectionsView,
    },
    {
      path: '/settings',
      name: 'settings',
      // route level code-splitting
      // this generates a separate chunk (Settings.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/SettingsView.vue'),
    },
  ],
});

export default router;
