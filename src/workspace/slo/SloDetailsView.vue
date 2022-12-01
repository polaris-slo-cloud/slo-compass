<template>
  <q-page>
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>SLO Details</q-toolbar-title>
    </q-toolbar>
    <div v-if="slo" class="q-layout-padding">
      <div class="flex justify-between">
        <InlineEdit v-model="name" display-type="h1">
          <template #edit="scope">
            <q-input outlined label="Name" v-model="scope.value" />
          </template>
        </InlineEdit>
        <q-btn @click="confirmDelete = true" icon="mdi-delete" outline color="negative" />
        <q-dialog v-model="confirmDelete" persistent>
          <q-card>
            <q-card-section class="row items-center">
              <q-avatar icon="mdi-delete" color="negative" text-color="white" />
              <span class="q-ml-sm">Are you sure that you want to delete the {{ name }} SLO?</span>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Cancel" color="primary" v-close-popup />
              <q-btn label="Delete" color="negative" v-close-popup @click="deleteSlo" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>
      <WorkspaceItemDetailsBanners :item="slo" display-type="SLO" class="q-mt-xs" />
      <EditableField label="Description" class="q-mt-lg" v-model="description">
        {{ formatIfEmpty(description) }}
        <template #edit="scope">
          <q-input outlined type="textarea" v-model="scope.value" />
        </template>
      </EditableField>
      <TargetStatus class="q-mt-lg" :slo="slo" />
      <MetricsDashboard :slo="slo" class="q-mt-lg" />
      <SloConfig :slo="slo" class="q-mt-lg" config-item-class="col-6 col-sm-4 col-md-3 col-lg-2" />
      <ElasticityStrategyConfig :slo="slo" class="q-mt-lg" config-item-class="col-6 col-sm-4 col-md-3 col-lg-2" />
      <div class="flex justify-end q-mt-lg" v-if="canBeDeployed">
        <q-btn label="Deploy" color="primary" @click="deploy" />
      </div>
      <div class="flex justify-end q-mt-lg q-gutter-x-md" v-else-if="slo.configChanged">
        <q-btn label="Reset" color="negative" outline @click="resetConfiguration" v-if="sloExistsInPolaris" />
        <q-btn label="Apply" color="primary" @click="applyConfiguration" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useSloStore } from '@/store/slo';
import EditableField from '@/crosscutting/components/EditableField.vue';
import WorkspaceItemDetailsBanners from '@/workspace/WorkspaceItemDetailsBanners.vue';
import TargetStatus from '@/workspace/slo/TargetStatus.vue';
import MetricsDashboard from '@/workspace/slo/MetricsDashboard.vue';
import SloConfig from '@/workspace/slo/SloConfig.vue';
import ElasticityStrategyConfig from '@/workspace/slo/ElasticityStrategyConfig.vue';

const route = useRoute();
const orchestratorApi = useOrchestratorApi();
const store = useSloStore();

const slo = computed(() => store.getSlo(route.params.id));
const name = computed({
  get() {
    return slo.value.name;
  },
  set(v) {
    store.saveSlo({ ...slo.value, name: v });
  },
});

const confirmDelete = ref(false);
async function deleteSlo() {
  await store.deleteSlo(slo.value?.id);
}

const description = computed({
  get() {
    return slo.value.description;
  },
  set(v) {
    store.saveSlo({ ...slo.value, description: v });
  },
});

const formatIfEmpty = (value) => value || '-';

const sloExistsInPolaris = computed(() => slo.value.deployedSloMapping && !slo.value.deployedSloMapping.deleted);
const canBeDeployed = computed(
  () =>
      //TODO: Fix
    !orchestratorApi.hasRunningDeployment.value(slo.value.id) && slo.value.polarisControllers.some((x) => !x.deployment)
);

function deploy() {
  // TODO: Perform deployment action for SLO Controller
}

function applyConfiguration() {
  store.applySloMapping(slo.value.id);
}

function resetConfiguration() {
  store.resetSloMapping(slo.value.id);
}
</script>

<style scoped lang="scss"></style>
