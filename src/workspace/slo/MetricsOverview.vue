<template>
  <div>
    <div class="flex justify-between items-center">
      <span class="field-label">Metrics</span>
      <q-btn icon="mdi-reload" flat padding="sm" @click="pollMetrics" />
    </div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-lg-6 col-xl-4">
        <q-card v-for="metric of sloMetrics" :key="metric.source">
          <q-card-section>
            <div class="field-item-label">{{ metric.displayName }}</div>
            <div class="metric-value-text text-right">
              {{ metricValue(metric) }}
            </div>
            <div class="text-negative text-caption" v-if="isOutOfDate(metric)">
              Last update {{ metricLastUpdateTime(metric) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import * as _ from 'lodash';
import { useSloStore } from '@/store/slo';
import { useTemplateStore } from '@/store/template';
import { MetricQueryResultValueType } from '@/polaris-templates/slo-metrics/metrics-template';

const store = useSloStore();
const templateStore = useTemplateStore();

const props = defineProps({
  slo: Object,
});

const sloMetrics = computed(
  () =>
    props.slo?.metrics?.map((x) => {
      const source = templateStore.getSloMetricTemplate(x.source);
      return {
        ...x,
        displayName: source.displayName,
        queryResultType: source.queryResultType,
      };
    }) ?? []
);
const now = ref(dayjs());
const isOutOfDate = (metric) => !metric.lastUpdated || dayjs(metric.lastUpdated).isAfter(now.value.add(5, 'minute'));

const metricLastUpdateTime = (metric) => (metric.lastUpdated ? dayjs(metric.lastUpdated).from(now.value) : 'NEVER');

function formatMetricValue(metric) {
  let formatted = metric.value;
  if (metric.queryResultType.type === MetricQueryResultValueType.Decimal) {
    formatted = _.round(metric.value, 2);
  }

  return `${formatted} ${metric.queryResultType.unit}`;
}
const metricValue = (metric) => (metric.value !== null && metric.value !== undefined ? formatMetricValue(metric) : '-');

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
