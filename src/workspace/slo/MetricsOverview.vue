<template>
  <div>
    <div class="flex justify-between items-center">
      <span class="field-label">Metrics</span>
      <q-btn icon="mdi-reload" flat padding="sm" @click="pollMetrics" />
    </div>
    <div class="row q-col-gutter-md q-mt-none">
      <q-card v-for="metric of slo.metrics" :key="metric.source.displayName" class="col-12 col-lg-6 col-xl-4 q-pa-none">
        <q-card-section>
          <div class="field-item-label">{{ metric.source.displayName }}</div>
          <div class="metric-value-text text-right">
            {{ metricValue(metric) }} {{ metric.source.queryResultType.unit }}
          </div>
          <div class="text-negative text-caption" v-if="isOutOfDate(metric)">
            Last update {{ metricLastUpdateTime(metric) }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import * as _ from 'lodash';
import { useSloStore } from '@/store/slo';
import { MetricQueryResultValueType } from '@/polaris-templates/slo-metrics/metrics-template';

const store = useSloStore();

const props = defineProps({
  slo: Object,
});

const now = ref(dayjs());
const isOutOfDate = (metric) => !metric.lastUpdated || dayjs(metric.lastUpdated).isAfter(now.value.add(5, 'minute'));

const metricLastUpdateTime = (metric) => (metric.lastUpdated ? dayjs(metric.lastUpdated).from(now.value) : 'NEVER');

function formatMetricValue(metric) {
  if (metric.source.queryResultType.type === MetricQueryResultValueType.Decimal)  {
    return _.round(metric.value, 2);
  }
  return metric.value;
}
const metricValue = (metric) => metric.value ? formatMetricValue(metric) : '-';

async function pollMetrics() {
  await store.pollMetrics(props.slo.id);
}

let nowUpdate;
onMounted(() => {
  nowUpdate = setInterval(() => (now.value = dayjs()), 1000);
});
onUnmounted(() => {
  clearInterval(nowUpdate);
});
</script>

<style scoped>
.metric-value-text {
  font-size: 1.5rem;
}
</style>
