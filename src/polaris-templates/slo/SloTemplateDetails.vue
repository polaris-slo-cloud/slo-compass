<template>
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
          <span class="q-ml-sm">Are you sure that you want to delete the {{ templateName }} SLO template?</span>
          <div class="text-italic text-subtitle2 q-mt-sm">
            This operation only removes the template locally. If it still exists inside a connected Polaris Cluster, the
            template will be re-added after restarting the application.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn label="Delete" color="negative" v-close-popup @click="deleteTemplate" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
  <span class="text-subtitle1 text-muted">{{ template.sloMappingKind }} ({{ template.sloMappingKindPlural }})</span>
  <q-banner v-if="isNotDefinedInCluster" class="bg-info text-white">
    <template #avatar>
      <q-icon name="mdi-information" />
    </template>
    This template has only been defined locally! You can make it available to other people in the same workspace by
    publishing it to the cluster. This will also be done automatically when the first SLO gets published to the cluster.
  </q-banner>
  <EditableField label="Description" class="q-mt-lg" v-model="description">
    {{ formatIfEmpty(description) }}
    <template #edit="scope">
      <q-input outlined type="textarea" v-model="scope.value" />
    </template>
  </EditableField>
  <EditableField label="Configuration" class="q-mt-lg" v-model="config">
    <q-table
      class="q-mt-xs"
      :rows="config"
      :columns="configColumns"
      hide-selected-banner
      hide-pagination
      no-data-label="This SLO does not have any config fields"
    >
      <template #header="props">
        <q-tr :props="props">
          <q-th v-for="col in props.cols" :key="col.name" :props="props" style="font-weight: bold">
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template #body-cell-valueOptions="{ value }">
        <q-td v-if="value">
          <q-chip v-for="entry of value" :key="entry" :label="entry" />
        </q-td>
        <q-td v-else>All values possible</q-td>
      </template>
      <template #body-cell-required="{ value }">
        <q-td>
          <q-icon v-if="value" name="mdi-check-circle" color="positive" size="1.5em" />
          <q-icon v-else name="mdi-close-circle" color="negative" size="1.5em" />
        </q-td>
      </template>
    </q-table>
    <template #edit="scope">
      <SloParametersConfigForm v-model="scope.value" class="q-mt-sm" :review-only="!isNotDefinedInCluster" />
    </template>
  </EditableField>
  <EditableField label="Metrics" class="q-mt-lg" v-model="metrics">
    <q-list class="q-mt-xs">
      <q-item-label caption v-if="metrics.length === 0">No Metrics configured</q-item-label>
      <q-item v-for="metric of metrics" :key="metric.id">
        <q-item-section>
          <q-item-label>{{ metric.displayName }}</q-item-label>
          <q-item-label caption>{{ metric.type }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <template #edit="scope">
      <SloTemplateMetricsForm v-model="scope.value" hide-header class="q-mt-sm" />
    </template>
  </EditableField>
  <div class="q-mt-lg flex justify-end" v-if="isNotDefinedInCluster">
    <q-btn color="primary" label="Publish" @click="deployMapping" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useTemplateStore } from '@/store/template';
import { usePolarisComponentStore } from '@/store/polaris-component';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import EditableField from '@/crosscutting/components/EditableField.vue';
import SloParametersConfigForm from '@/polaris-templates/slo/SloParametersConfigForm.vue';
import SloTemplateMetricsForm from '@/polaris-templates/slo/SloTemplateMetricsForm.vue';

const route = useRoute();
const store = useTemplateStore();
const polarisComponentsStore = usePolarisComponentStore();
const orchestratorApi = useOrchestratorApi();

const template = ref({});
loadTemplate(route.params.kind);

const templateName = computed({
  get: () => (template.value ? template.value.displayName : ''),
  set(v) {
    save({ displayName: v });
  },
});
const description = computed({
  get: () => template.value?.description,
  set(v) {
    save({ description: v });
  },
});
const config = computed({
  get: () => template.value?.config,
  set(v) {
    save({ config: v });
  },
});
const configColumns = [
  { name: 'displayName', align: 'left', label: 'Display Name', field: 'displayName' },
  { name: 'type', align: 'left', label: 'Type', field: 'type' },
  { name: 'parameter', align: 'left', label: 'Parameter Key', field: 'parameter' },
  { name: 'valueOptions', align: 'left', label: 'Possible Values', field: 'valueOptions' },
  { name: 'required', align: 'left', label: 'Required', field: 'required' },
];

const metrics = computed({
  get: () => template.value?.metricTemplates?.map(store.getSloMetricTemplate) ?? [],
  set(v) {
    save({ metricTemplates: v.map((x) => x.id) });
  },
});
const formatIfEmpty = (text) => text || '-';

const confirmDelete = ref(false);
function deleteTemplate() {
  store.removeSloTemplate(template.value.sloMappingKind);
}

function save(changes) {
  store.saveSloTemplate({ ...template.value, ...changes });
  loadTemplate(route.params.kind);
}

const isNotDefinedInCluster = computed(
  () => !polarisComponentsStore.sloMappingHasBeenDeployed(template.value.sloMappingKind)
);
async function deployMapping() {
  await orchestratorApi.deploySloMappingCrd(template.value);
}

watch(() => route.params.kind, loadTemplate);
function loadTemplate(kind) {
  template.value = store.getSloTemplate(kind);
}
</script>

<style scoped lang="scss"></style>
