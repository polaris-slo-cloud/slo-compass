<template>
  <div>
    <div class="flex justify-between">
      <InlineEdit v-model="name" display-type="h1">
        <template #edit="scope">
          <q-input outlined label="Name" v-model="scope.value" />
        </template>
      </InlineEdit>
      <q-btn v-if="canBeDeleted" @click="confirmDelete = true" icon="mdi-delete" outline color="negative" />
      <q-dialog v-model="confirmDelete" persistent>
        <q-card>
          <q-card-section class="row items-center">
            <q-avatar icon="mdi-delete" color="negative" text-color="white" />
            <span class="q-ml-sm">Are you sure that you want to delete the {{ name }} {{ displayType }}?</span>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn label="Delete" color="negative" v-close-popup @click="deleteItem" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
    <div class="text-subtitle1 text-muted">{{ displayType }}</div>
    <q-banner v-if="hasMissingDeployment" class="bg-warning">
      <template #avatar>
        <q-icon name="mdi-alert" />
      </template>
      Not all required Polaris controllers have been deployed for this {{ displayType }}!
      <template #action>
        <q-btn flat label="Details" @click="showMissingDeploymentDetails = true" />
      </template>
    </q-banner>
    <q-banner v-if="failedResourceDeployments.length > 0" class="bg-negative text-white">
      <template #avatar>
        <q-icon name="mdi-alert-circle" />
      </template>
      <div>
        The deployment failed for the following resouces:
        <ul>
          <li v-for="(resource, idx) of failedResourceDeployments" :key="idx">
            {{ resource.displayName }}
          </li>
        </ul>
      </div>
      <template #action>
        <q-btn flat label="retry" @click="retryDeployment" />
      </template>
    </q-banner>
    <q-banner v-if="item.deployedSloMapping?.deleted" class="bg-negative text-white">
      <template #avatar>
        <q-icon name="mdi-alert-circle" />
      </template>
      This {{ displayType }} has unsaved local changes and has been deleted inside the Polaris Cluster. You can either
      deploy your local changes as a new {{ displayType }} or delete it. If you delete this {{ displayType }} all
      changes will be lost.
      <template #action>
        <q-btn flat label="Delete" @click="deleteItem" />
        <q-btn flat label="Apply Changes" @click="applySloMapping" />
      </template>
    </q-banner>
    <q-banner v-else-if="item.configChanged" class="bg-info text-white">
      <template #avatar>
        <q-icon name="mdi-information" />
      </template>
      The configuration for this {{ displayType }} has been changed! Please apply the configuration in order for the
      changes to become visible.
    </q-banner>
    <MissingDeploymentDetailsDialog :item="item" v-model:show="showMissingDeploymentDetails" />
    <EditableField label="Description" class="q-mt-lg" v-model="description">
      {{ formatIfEmpty(description) }}
      <template #edit="scope">
        <q-input outlined type="textarea" v-model="scope.value" />
      </template>
    </EditableField>
    <component :is="detailsComponent" :item="item" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '@/store/workspace';
import { workspaceItemTypes } from '@/workspace/constants';
import EditableField from '@/crosscutting/components/EditableField.vue';
import TargetDetails from '@/workspace/targets/TargetDetails.vue';
import SloDetails from '@/workspace/slo/SloDetails.vue';
import ElasticityStrategyDetails from '@/workspace/elasticity-strategy/ElasticityStrategyDetails.vue';
import MissingDeploymentDetailsDialog from '@/workspace/MissingDeploymentDetailsDialog.vue';
import { useSloStore } from '@/store/slo';

const store = useWorkspaceStore();
const sloStore = useSloStore();

const props = defineProps({
  itemId: String,
});

const item = computed(() => store.getItem(props.itemId));
const name = computed({
  get() {
    return item.value?.name;
  },
  set(v) {
    store.save({ ...item.value, name: v });
  },
});
const displayType = computed(() =>
  item.value?.type === workspaceItemTypes.elasticityStrategy ? 'Elasticity Strategy' : item.value?.type
);

const confirmDelete = ref(false);
const canBeDeleted = computed(() => item.value?.type === workspaceItemTypes.slo);
async function deleteItem() {
  await store.deleteItem(props.itemId);
}

const hasMissingDeployment = computed(
  () => item.value.polarisControllers && item.value.polarisControllers.some((x) => !x.deployment)
);
const showMissingDeploymentDetails = ref(false);
const failedResourceDeployments = computed(() => (item.value.failedDeployments ? item.value.failedDeployments : []));

const description = computed({
  get() {
    return item.value.description;
  },
  set(v) {
    store.save({ ...item.value, description: v });
  },
});

const formatIfEmpty = (value) => value || '-';

const detailsComponent = computed(() => {
  switch (item.value?.type) {
    case workspaceItemTypes.targets.application:
    case workspaceItemTypes.targets.component:
      return TargetDetails;
    case workspaceItemTypes.slo:
      return SloDetails;
    case workspaceItemTypes.elasticityStrategy:
      return ElasticityStrategyDetails;
  }
  return 'div';
});

async function retryDeployment() {
  await store.retryDeployment(item.value);
}

async function applySloMapping() {
  await sloStore.applySloMapping(props.itemId);
}
</script>
