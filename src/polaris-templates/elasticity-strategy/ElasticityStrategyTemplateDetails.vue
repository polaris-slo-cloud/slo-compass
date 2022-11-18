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
          <span class="q-ml-sm">
            Are you sure that you want to delete the {{ templateName }} elasticity strategy template?
          </span>
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
  <span class="text-subtitle1 text-muted">
    {{ template.elasticityStrategyKind }} ({{ template.elasticityStrategyKindPlural }})
  </span>
  <EditableField label="Description" class="q-mt-lg" v-model="description">
    {{ formatIfEmpty(description) }}
    <template #edit="scope">
      <q-input outlined type="textarea" v-model="scope.value" />
    </template>
  </EditableField>
  <EditableField label="Configuration" class="q-mt-lg" v-model="sloSpecificConfig">
    <q-table
      class="q-mt-xs"
      :rows="sloSpecificConfig"
      :columns="sloSpecificConfigColumns"
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
      <template #body-cell-required="{ value }">
        <q-td>
          <q-icon v-if="value" name="mdi-check-circle" color="positive" size="1.5em" />
          <q-icon v-else name="mdi-close-circle" color="negative" size="1.5em" />
        </q-td>
      </template>
    </q-table>
    <template #edit="scope">
      <SloSpecificParametersConfigForm v-model="scope.value" class="q-mt-sm" review-only />
    </template>
  </EditableField>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useTemplateStore } from '@/store/template';
import EditableField from '@/crosscutting/components/EditableField.vue';
import SloSpecificParametersConfigForm from '@/polaris-templates/elasticity-strategy/SloSpecificParametersConfigForm.vue';

const route = useRoute();
const store = useTemplateStore();

const template = ref({});
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

const sloSpecificConfig = computed({
  get: () => template.value?.sloSpecificConfig,
  set(v) {
    save({ sloSpecificConfig: v });
  },
});
const sloSpecificConfigColumns = [
  { name: 'displayName', align: 'left', label: 'Display Name', field: 'displayName' },
  { name: 'type', align: 'left', label: 'Type', field: 'type' },
  { name: 'parameter', align: 'left', label: 'Parameter Key', field: 'parameter' },
  { name: 'required', align: 'left', label: 'Required', field: 'required' },
];

const formatIfEmpty = (text) => text || '-';

const confirmDelete = ref(false);
function deleteTemplate() {
  store.removeElasticityStrategyTemplate(template.value.elasticityStrategyKind);
}

function save(changes) {
  store.saveElasticityStrategyTemplate({ ...template.value, ...changes });
  loadTemplate(route.params.kind);
}
watch(() => route.params.kind, loadTemplate);
function loadTemplate(kind) {
  template.value = store.getElasticityStrategyTemplate(kind);
}

onMounted(() => {
  loadTemplate(route.params.kind);
});
</script>

<style scoped lang="scss"></style>
