<template>
  <div>
    <q-list>
      <q-item-label header>SLO Metrics</q-item-label>
      <q-item-label caption v-if="metrics.length === 0">No Metrics configured</q-item-label>
      <q-item v-for="(metric, idx) of metrics" :key="metric.id">
        <q-item-section>
          <q-item-label>{{ metric.displayName }}</q-item-label>
          <q-item-label caption>{{ metric.type }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-btn @click="removeMetric(idx)" icon="mdi-delete" color="negative" flat />
        </q-item-section>
      </q-item>
    </q-list>
    <div class="q-mt-lg q-mb-md">
      <div class="row q-gutter-x-md">
        <q-input v-model="metricsFilterQuery" outlined dense class="col">
          <template #prepend>
            <q-icon name="mdi-magnify" />
          </template>
        </q-input>
        <q-btn
          @click="showCreateMetricDefinition = true"
          icon="mdi-plus"
          label="New Metric"
          class="col-auto"
          color="primary"
          flat
        />
      </div>
    </div>
    <q-list>
      <q-item v-for="metric of filteredMetricDefinitions" :key="metric.id">
        <q-item-section>
          <q-item-label>{{ metric.displayName }}</q-item-label>
          <q-item-label caption>{{ metric.type }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-btn @click="addMetric(metric)" label="Add" outline color="primary" />
        </q-item-section>
      </q-item>
    </q-list>
    <q-dialog v-model="showCreateMetricDefinition" persistent>
      <q-card class="medium-dialog">
        <q-card-section>
          <MetricDefinitionForm @created="metricDefinitionCreated" @cancel="showCreateMetricDefinition = false" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useTemplateStore } from '@/store/template';
import MetricDefinitionForm from '@/polaris-templates/slo-metrics/MetricDefinitionForm.vue';

const store = useTemplateStore();

const props = defineProps({
  modelValue: Array,
});
const emit = defineEmits(['update:modelValue']);

const metrics = computed({
  get: () => props.modelValue,
  set(v) {
    emit('update:modelValue', v);
  },
});
function removeMetric(index) {
  metrics.value.splice(index, 1);
}

function addMetric(metric) {
  metrics.value.push(metric);
}

const metricsFilterQuery = ref('');
const metricDefinitions = computed(() => {
  const metricIds = metrics.value.map((x) => x.id);
  return store.sloMetricSourceTemplates.filter((x) => !metricIds.includes(x.id));
});
const filteredMetricDefinitions = computed(() => {
  const filter = new RegExp(metricsFilterQuery.value, 'i');
  return metricDefinitions.value.filter((x) => filter.test(x.displayName));
});

const showCreateMetricDefinition = ref(false);
function metricDefinitionCreated(metric) {
  addMetric(metric);
  showCreateMetricDefinition.value = false;
}
</script>

<style scoped lang="scss"></style>
