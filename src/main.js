import { createApp } from 'vue';
import { Quasar } from 'quasar';
import App from './App.vue';
import router from './router';

import ArrowTooltip from './components/ArrowTooltip.vue';

import './styles.scss';

const app = createApp(App);

app.use(router);
app.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
});

app.component('ArrowTooltip', ArrowTooltip);

app.mount('#app');
