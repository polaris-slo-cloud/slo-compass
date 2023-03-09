<template>
  <div>
    <div class="flex justify-between items-center">
      <span class="field-label">Metrics</span>
      <q-btn icon="mdi-reload" flat padding="sm" @click="pollMetrics" />
    </div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-lg-6 col-xl-4" v-for="metric of metrics" :key="metric.metric">
        <q-card>
          <q-card-section>
            <div class="field-item-label">
              {{ metric.metric }}
              <span class="q-ml-xs text-weight-regular text-muted">- Last 24 hours</span>
            </div>
            <MetricHistoryChart :data="metric" />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useMetricsProvider } from '@/metrics-provider/api';
import { useTargetStore } from '@/store/target';
import { useTemplateStore } from '@/store/template';
import MetricHistoryChart from '@/workspace/slo/MetricHistoryChart.vue';

const metricsProvider = useMetricsProvider();
const targetStore = useTargetStore();
const templateStore = useTemplateStore();

const props = defineProps({
  slo: Object,
});

const metrics = ref([]);
async function pollMetrics() {
  const sloMetrics = props.slo.metrics.map((x) => templateStore.getSloMetricTemplate(x.source));
  metrics.value = await metricsProvider.pollSloMetricsHistory(sloMetrics, targetStore.getSloTarget(props.slo.target));
}

let pollingInterval;
onMounted(async () => {
  await pollMetrics();
  pollingInterval = setInterval(pollMetrics, 60 * 1000);
});
onUnmounted(() => {
  clearInterval(pollingInterval);
});
</script>

<style scoped>
.metric-value-text {
  font-size: 1.5rem;
}
</style>
