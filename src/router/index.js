import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import { Platform } from 'quasar';
import DashboardView from '@/views/DashboardView.vue';
import WelcomeView from '@/views/WelcomeView.vue';
import ConnectionsView from '@/views/ConnectionsView.vue';
import { useWorkspaceStore } from '@/store';

const router = createRouter({
  history: Platform.is.electron
    ? createWebHashHistory()
    : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: WelcomeView,
      beforeEnter: (to, from, next) => {
        const store = useWorkspaceStore();
        if (store.isOpened) {
          next({ name: 'workspace' });
        } else {
          next();
        }
      },
    },
    {
      path: '/workspace',
      name: 'workspace',
      component: DashboardView,
      beforeEnter: (to, from, next) => {
        const store = useWorkspaceStore();
        if (!store.isOpened) {
          next(from.name ? false : { name: 'home' });
        } else {
          next();
        }
      },
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
