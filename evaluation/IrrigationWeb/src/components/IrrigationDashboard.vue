<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="auto">
        <v-card v-if="weather">
          <v-card-item title="Current Weather" />
          <v-card-text>
            <v-row align="center" no-gutters>
              <v-col cols="6" class="text-h2">
                {{ weather.temperature }} °C
              </v-col>
              <v-col cols="6" class="text-right">
                <v-icon :icon="weatherIcon" size="88" />
              </v-col>
            </v-row>
          </v-card-text>
          <div class="d-flex py-3 justify-space-between">
            <v-list-item density="compact" prepend-icon="mdi-cloud-percent">
              <v-list-item-subtitle>
                {{ weather.humidity }} %
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item density="compact" prepend-icon="mdi-water-percent">
              <v-list-item-subtitle>
                {{ weather.soilHumidity }} %
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item density="compact" prepend-icon="mdi-weather-pouring">
              <v-list-item-subtitle>
                {{ weather.precipitation }} mm
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item density="compact" prepend-icon="mdi-gauge">
              <v-list-item-subtitle>
                {{ weather.pressureKpa }} kPa
              </v-list-item-subtitle>
            </v-list-item>
          </div>
        </v-card>
      </v-col>
      <v-col cols="auto">
        <v-card v-if="irrigationRecommendation">
          <v-card-item title="Irrigation" />
          <v-card-text>
            Recommended on: {{ irrigationRecommendedDate }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import dayjs from "dayjs";
import axios from "axios";

const weather = ref(null);
const irrigationRecommendation = ref(null);

const irrigationRecommendedDate = computed(() =>
  irrigationRecommendation.value?.recommendedOn
    ? dayjs(irrigationRecommendation.value.recommendedOn).format("MMMM D, YYYY")
    : "-"
);

const weatherIcon = computed(() => {
  switch (weather.value?.condition) {
    case "Sunny":
      return "mdi-weather-sunny";
    case "Cloudy":
      return "mdi-weather-cloudy";
    case "Snow":
      return "mdi-weather-snowy-heavy";
    case "Rain":
      return "mdi-weather-pouring";
  }
  return "mdi-cloud-question";
});

async function loadData() {
  const currentWeatherResponse = await axios.get("weather/current");
  weather.value = currentWeatherResponse.data;
  const irrigationRecommendationResponse = await axios.get("irrigation/recommendation");
  irrigationRecommendation.value = irrigationRecommendationResponse.data;
}

onMounted(loadData);
</script>

<style scoped lang="scss"></style>
