<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card class="medium-dialog">
      <q-card-section>
        <q-input
          label="Name*"
          v-model="v.displayName.$model"
          :error="v.displayName.$error"
          error-message="You need to define a  display name"
          @blur="v.displayName.$touch"
        />
        <q-input label="Description" v-model="description" autogrow />
        <div class="text-subtitle1">How are the query results interpreted?</div>
        <div class="row q-col-gutter-x-md">
          <q-select
            label="Type"
            class="col-8"
            v-model="v.queryResultType.type.$model"
            :options="queryResultValueTypes"
            :error="v.queryResultType.type.$error"
            error-message="You need to specify a result type for the metrics query"
            @blur="v.queryResultType.type.$touch"
          />
          <q-input
            label="Unit"
            class="col-4"
            v-model="v.queryResultType.unit.$model"
            :error="v.queryResultType.unit.$error"
            error-message="You need to specify a unit for the metrics query"
            @blur="v.queryResultType.unit.$touch"
          />
        </div>
        <q-select
          label="Type*"
          v-model="v.metricType.$model"
          :options="metricTypes"
          :error="v.metricType.$error"
          error-message="You need to select a metric type"
          @blur="v.metricType.$touch"
        />
        <div v-if="!isComposedMetric" class="q-mt-md">
          <div class="text-subtitle1">How do you want to define this metric?</div>
          <q-btn-toggle v-model="metricQueryType" :options="metricQueryTypes" />
          <q-icon name="mdi-information" color="primary" v-if="!isSimpleQuery" size="2em" class="q-ml-md">
            <q-tooltip anchor="center right" self="center left" class="bg-transparent text-black">
              <q-card>
                <q-card-section>
                  <MetricQueryLabelDefinitions />
                </q-card-section>
              </q-card>
            </q-tooltip>
          </q-icon>
        </div>
        <q-input
          v-if="isSimpleQuery"
          :prefix="metricNamePrefix"
          label="Metric Name*"
          v-model="v.metricName.$model"
          :error="v.metricName.$error"
          error-message="You need to define a metric name"
          @blur="v.metricName.$touch"
        />
        <div v-else>
          <q-input
            v-for="provider of availableProviders"
            :key="provider.metricSourceTemplateKey"
            :label="`${provider.name} Metric Query*`"
            v-model="v.rawMetricQueries[provider.metricSourceTemplateKey].$model"
            :error="v.rawMetricQueries[provider.metricSourceTemplateKey].$error"
            error-message="You need to define a metric query"
            @blur="v.rawMetricQueries[provider.metricSourceTemplateKey].$touch"
          />
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="Cancel" flat @click="cancel" />
        <q-btn label="Create" color="primary" @click="createMetricDefinition" :disable="v.$invalid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { MetricQueryResultValueType, SloMetricSourceType } from '@/polaris-templates/slo-metrics/metrics-template';
import { v4 as uuidV4 } from 'uuid';
import { availableProviders } from '@/metrics-provider/providers';
import { useTemplateStore } from '@/store/template';
import { useVuelidate } from '@vuelidate/core';
import { required, requiredIf } from '@vuelidate/validators';
import MetricQueryLabelDefinitions from '@/polaris-templates/slo-metrics/MetricQueryLabelDefinitions.vue';

const store = useTemplateStore();

const props = defineProps({ show: Boolean });
const emit = defineEmits(['update:show', 'created']);

const showDialog = computed({
  get: () => props.show,
  set(v) {
    emit('update:show', v);
  },
});

const displayName = ref('');
const description = ref('');
const metricType = ref(SloMetricSourceType.Composed);
const metricTypes = Object.values(SloMetricSourceType);

const queryResultType = ref({
  type: MetricQueryResultValueType.Integer,
  unit: '',
});
watch(
  () => queryResultType.value.type,
  (value, oldValue) => {
    if (value !== oldValue && value === MetricQueryResultValueType.Percentage) {
      queryResultType.value.unit = '%';
    }
  }
);
const queryResultValueTypes = Object.values(MetricQueryResultValueType);

const metricName = ref('');
const isComposedMetric = computed(() => metricType.value === SloMetricSourceType.Composed);
const metricNamePrefix = computed(() => (isComposedMetric.value ? 'metrics_polaris_slo_cloud_github_io_v1_' : ''));

const metricQueryType = ref('simple');
const metricQueryTypes = [
  { label: 'Metric Name', value: 'simple' },
  { label: 'Raw Query', value: 'raw' },
];
const isSimpleQuery = computed(() => metricQueryType.value === 'simple');
const rawMetricQueries = ref({});

function resetModel() {
  displayName.value = '';
  description.value = '';
  metricType.value = SloMetricSourceType.Composed;
  metricName.value = '';
  metricQueryType.value = 'simple';
  rawMetricQueries.value = {};
  queryResultType.value = {
    type: MetricQueryResultValueType.Integer,
    unit: '',
  };
}
function cancel() {
  resetModel();
  showDialog.value = false;
}

function createMetricDefinition() {
  const metricTemplate = {
    id: uuidV4(),
    displayName: displayName.value,
    description: description.value,
    type: metricType.value,
    queryResultType: queryResultType.value,
    isSimpleQuery: isSimpleQuery.value,
    providerQueries: {},
  };
  if (isSimpleQuery.value) {
    metricTemplate.metricName = metricName.value;
  }
  const rawQueries = isSimpleQuery.value ? undefined : rawMetricQueries.value;
  availableProviders.forEach((provider) => provider.addProviderMetricsSource(metricTemplate, rawQueries));
  store.addSloMetricSourceTemplate(metricTemplate);
  emit('created', metricTemplate);
  resetModel();
  showDialog.value = false;
}

const v = useVuelidate(
  {
    displayName: { required },
    metricType: { required },
    queryResultType: {
      type: { required },
      unit: { required },
    },
    metricName: {
      requiredIf: requiredIf(isSimpleQuery),
    },
    rawMetricQueries: availableProviders.reduce((validators, provider) => {
      validators[provider.metricSourceTemplateKey] = {
        requiredIf: requiredIf(computed(() => !isSimpleQuery.value)),
      };
      return validators;
    }, {}),
  },
  { metricType, metricName, displayName, rawMetricQueries, queryResultType }
);
</script>

<style scoped lang="scss"></style>
