import { createApp } from "vue";
import App from "./App.vue";

// Vuetify
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";
import axios from "axios";

const vuetify = createVuetify();

axios.defaults.baseURL = import.meta.env.VITE_API_BASE;

createApp(App).use(vuetify).mount("#app");
