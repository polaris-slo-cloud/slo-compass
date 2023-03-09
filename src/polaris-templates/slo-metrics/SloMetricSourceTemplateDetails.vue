<template>
  <div class="flex column" v-if="template">
    <div class="flex justify-between items-start">
      <InlineEdit v-model="templateName" display-type="h1" style="min-width: 25%">
        <template #edit="scope">
          <q-input outlined label="Display Name" v-model="scope.value" />
        </template>
      </InlineEdit>
      <q-btn @click="confirmDelete = true" icon="mdi-delete" outline color="negative" />
      <q-dialog v-model="confirmDelete" persistent>
        <q-card>
          <q-card-section class="row items-center">
            <q-avatar icon="mdi-delete" color="negative" text-color="white" />
            <span class="q-ml-sm">
              Are you sure that you want to delete the {{ templateName }} metric source template?
            </span>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn label="Delete" color="negative" v-close-popup @click="deleteTemplate" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
    <span class="text-subtitle1 text-muted">{{ template.type }}</span>
    <EditableField label="Description" class="q-mt-lg" v-model="description">
      {{ formatIfEmpty(description) }}
      <template #edit="scope">
        <q-input outlined type="textarea" v-model="scope.value" />
      </template>
    </EditableField>
    <EditableField label="How are the query results interpreted?" class="q-mt-lg self-start" v-model="queryResultType">
      <span>
        {{ queryResultType.type }} <span>({{ queryResultType.unit }})</span>
      </span>
      <template #edit="scope">
        <div class="flex q-gutter-x-md">
          <q-select
            label="Type"
            v-model="scope.value.type"
            :options="queryResultValueTypes"
            style="min-width: 15em"
            @update:model-value="setUnitDefault(scope.value)"
          />
          <q-input
            label="Unit"
            v-model="scope.value.unit"
            :error="!scope.value.unit"
            error-message="You need to specify a unit for the metrics query"
          />
        </div>
      </template>
    </EditableField>
    <EditableField label="Metric Query Definition" class="q-mt-lg" v-model="queryDefinition">
      <div v-if="template.isSimpleQuery">
        <span class="field-item-label">Metric Name</span>
        <span>{{ metricName }}</span>
        <q-icon
          name="mdi-information"
          color="primary"
          v-if="availableProvidersWithLabelFilters.length > 0"
          size="2em"
          class="q-ml-md"
        >
          <q-tooltip anchor="center right" self="center left" class="bg-transparent text-black">
            <q-card>
              <q-card-section>
                <MetricQueryLabelDefinitions />
              </q-card-section>
            </q-card>
          </q-tooltip>
        </q-icon>
        <div
          class="q-col"
          v-for="provider of availableProvidersWithLabelFilters"
          :key="provider.metricSourceTemplateKey"
        >
          <span class="field-item-label">{{ provider.name }} Label Filters</span>
          <div v-for="{ label, filterValue } of labelFilters(provider.metricSourceTemplateKey)" :key="label">
            {{ label }}: {{ filterValue }}
          </div>
        </div>
      </div>
      <div v-else-if="template.providerQueries" class="row q-col-gutter-md">
        <div class="q-col" v-for="provider of availableProviders" :key="provider.metricSourceTemplateKey">
          <span class="field-item-label">{{ provider.name }}</span>
          <span>{{ template.providerQueries[provider.metricSourceTemplateKey].rawQuery }}</span>
        </div>
      </div>
      <template #edit="{ value }">
        <q-btn-toggle v-model="value.metricQueryType" :options="metricQueryTypes" />
        <div v-if="value.metricQueryType === 'simple'">
          <q-input
            :prefix="metricNamePrefix"
            label="Metric Name*"
            v-model="value.metricName"
            :error="!value.metricName"
            error-message="You need to define a metric name"
          />
          <div>
            <span class="text-subtitle1">Label Filters</span>
            <span class="q-ml-xs text-muted text-italic">(Optional)</span>
          </div>
          <MetricLabelFilterConfigForm v-model="value.labelFilters" />
        </div>
        <div v-else>
          <q-input
            v-for="provider of availableProviders"
            :key="provider.metricSourceTemplateKey"
            :label="`${provider.name} Metric Query*`"
            v-model="value.rawMetricQueries[provider.metricSourceTemplateKey]"
            :error="!value.rawMetricQueries[provider.metricSourceTemplateKey]"
            error-message="You need to define a metric query"
          />
        </div>
      </template>
    </EditableField>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { useTemplateStore } from '@/store/template';
import { computed, onMounted, ref, watch } from 'vue';
import EditableField from '@/crosscutting/components/EditableField.vue';
import { MetricQueryResultValueType, SloMetricSourceType } from '@/polaris-templates/slo-metrics/metrics-template';
import { availableProviders } from '@/metrics-provider/providers';
import MetricQueryLabelDefinitions from '@/polaris-templates/slo-metrics/MetricQueryLabelDefinitions.vue';
import MetricLabelFilterConfigForm from '@/polaris-templates/slo-metrics/MetricLabelFilterConfigForm.vue';

const route = useRoute();
const store = useTemplateStore();

const template = ref({});
const templateName = computed({
  get: () => template.value.displayName,
  set(v) {
    save({ displayName: v });
  },
});
const description = computed({
  get: () => template.value.description,
  set(v) {
    save({ description: v });
  },
});
const queryResultType = computed({
  get: () => template.value.queryResultType ?? {},
  set(v) {
    save({ queryResultType: v });
  },
});
const queryResultValueTypes = Object.values(MetricQueryResultValueType);
function setUnitDefault(queryResultType) {
  if (queryResultType.type === MetricQueryResultValueType.Percentage) {
    queryResultType.unit = '%';
  }
}

const metricNamePrefix = computed(() =>
  template.value.type === SloMetricSourceType.Composed ? 'metrics_polaris_slo_cloud_github_io_v1_' : ''
);
const metricName = computed(() => `${metricNamePrefix.value}${template.value.metricName}`);

const metricQueryTypes = [
  { label: 'Metric Name', value: 'simple' },
  { label: 'Raw Query', value: 'raw' },
];
function mapProviderRawQueries(providerQueries) {
  const result = {};
  for (const provider in providerQueries) {
    result[provider] = providerQueries[provider].rawQuery;
  }
  return result;
}

const queryDefinition = computed({
  get: () => ({
    metricQueryType: template.value.isSimpleQuery ? 'simple' : 'raw',
    metricName: template.value.metricName,
    labelFilters: template.value.labelFilters
      ? Object.entries(template.value.labelFilters).map(([label, filterValue]) => ({
          label,
          filterValue,
        }))
      : [],
    rawMetricQueries:
      template.value.isSimpleQuery && template.value.providerQueries
        ? {}
        : mapProviderRawQueries(template.value.providerQueries),
  }),
  set(v) {
    const labelFiltersRecord = v.labelFilters.reduce((filters, filter) => {
      filters[filter.label] = filter.filterValue;
      return filters;
    }, {});
    const isSimpleQuery = v.metricQueryType === 'simple';
    const newTemplate = {
      ...template.value,
      isSimpleQuery,
      metricName: isSimpleQuery ? v.metricName : undefined,
      labelFilters: labelFiltersRecord,
      providerQueries: {},
    };
    const rawQueries = isSimpleQuery.value ? undefined : v.rawMetricQueries;
    availableProviders.forEach((provider) => provider.addProviderMetricsSource(newTemplate, rawQueries));
    save(newTemplate);
  },
});

const labelFilters = (providerSource) =>
  Object.entries(template.value.providerQueries[providerSource].queryData.labelFilters).map(([label, filterValue]) => ({
    label,
    filterValue,
  }));

const availableProvidersWithLabelFilters = computed(() =>
  template.value.isSimpleQuery
    ? availableProviders
        .map((x) => (template.value.providerQueries[x.metricSourceTemplateKey].queryData.labelFilters ? x : null))
        .filter((x) => !!x)
    : []
);
const formatIfEmpty = (text) => text || '-';

const confirmDelete = ref(false);
function deleteTemplate() {
  store.removeSloMetricSourceTemplate(template.value.id);
}

function save(changes) {
  store.saveSloMetricSourceTemplate({ ...template.value, ...changes });
  loadTemplate(route.params.id);
}
watch(() => route.params.id, loadTemplate);
function loadTemplate(id) {
  template.value = store.getSloMetricTemplate(id);
}

onMounted(() => {
  loadTemplate(route.params.id);
});
</script>

<style scoped lang="scss"></style>
