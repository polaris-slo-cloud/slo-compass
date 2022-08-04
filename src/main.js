import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar } from 'quasar';
import iconSet from 'quasar/icon-set/mdi-v6';
import '@quasar/extras/mdi-v6/mdi-v6.css';
import App from './App.vue';

import router from './router';
import VNetworkGraph from 'v-network-graph';

import ArrowTooltip from './components/ArrowTooltip.vue';

import './styles.scss';

const app = createApp(App);

app.use(createPinia());

app.use(router);
app.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
  iconSet: iconSet,
});
app.use(VNetworkGraph);

app.component('ArrowTooltip', ArrowTooltip);

app.mount('#app');
