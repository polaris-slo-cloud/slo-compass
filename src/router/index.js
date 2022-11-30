import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import { Platform } from 'quasar';
import DashboardView from '@/views/DashboardView.vue';
import SloDetailsView from '@/workspace/slo/SloDetailsView.vue';
import WelcomeView from '@/views/WelcomeView.vue';
import ConnectionsView from '@/views/ConnectionsView.vue';
import TemplatesView from '@/views/TemplatesView.vue';
import TemplatesOverview from '@/polaris-templates/TemplatesOverview.vue';
import SloTemplateDetails from '@/polaris-templates/slo/SloTemplateDetails.vue';
import SloMetricSourceTemplateDetails from '@/polaris-templates/slo-metrics/SloMetricSourceTemplateDetails.vue';
import ElasticityStrategyDetails from '@/polaris-templates/elasticity-strategy/ElasticityStrategyDetails.vue';
import { useWorkspaceStore } from '@/store/workspace';

const router = createRouter({
  history: Platform.is.electron ? createWebHashHistory() : createWebHistory(import.meta.env.BASE_URL),
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
      path: '/workspace/slo/:id',
      name: 'slo-details',
      component: SloDetailsView,
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
      path: '/templates',
      component: TemplatesView,
      children: [
        {
          path: '',
          name: 'templates',
          component: TemplatesOverview,
        },
        {
          path: 'slo-template/:kind',
          name: 'slo-template',
          component: SloTemplateDetails,
        },
        {
          path: 'slo-metric-source-template/:id',
          name: 'slo-metric-source-template',
          component: SloMetricSourceTemplateDetails,
        },
        {
          path: 'elasticity-strategy/:kind',
          name: 'elasticity-strategy',
          component: ElasticityStrategyDetails,
        },
      ],
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
