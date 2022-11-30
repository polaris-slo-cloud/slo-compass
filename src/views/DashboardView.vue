<script setup>
import WorkspaceDiagramm from '@/workspace/WorkspaceDiagramm.vue';
import NewWorkspaceItemSelector from '@/workspace/NewWorkspaceItemSelector.vue';
import WorkspaceItemDetails from '@/workspace/WorkspaceItemDetails.vue';
import { computed, ref, watch } from 'vue';
import useWindowSize from '@/crosscutting/composables/window-size';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useTemplateStore } from '@/store/template';
import ReviewSloTemplateDialog from '@/polaris-templates/slo/ReviewTemplateDialog.vue';
import ReviewStrategyConfigTemplateDialog from '@/polaris-templates/elasticity-strategy/ReviewStrategyConfigTemplateDialog.vue';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';

const orchestratorApi = useOrchestratorApi();
const templateStore = useTemplateStore();
const elasticityStrategyStore = useElasticityStrategyStore();

const windowSize = useWindowSize();
const selection = ref(null);
const showNewItemSelection = ref(false);
const showDrawer = computed(() => {
  return showNewItemSelection.value || !!selection.value;
});
const maxDrawerWidth = 650;
const drawerWidth = computed(() => {
  const width = windowSize.width.value / 3;
  return Math.min(width, maxDrawerWidth);
});

const hasUndismissedDeploymentAction = computed(() => orchestratorApi.undismissiedRunningDeployments.value.length > 0);
const deploymentNames = computed(() =>
  orchestratorApi.undismissiedRunningDeployments.value.map((x) => x.name).join(', ')
);
function dismissDeploymentNotification() {
  orchestratorApi.dismissRunningDeploymentActions();
}

const unconfirmedSloTemplates = computed(() => templateStore.sloTemplates.filter((x) => !x.confirmed));
const hasUnconfirmedSloTemplates = computed(() => unconfirmedSloTemplates.value.length > 0);
const unconfirmedSloTemplatesDisplay = computed(() =>
  unconfirmedSloTemplates.value.map((x) => `"${x.displayName}"`).join(', ')
);
const showReviewUnconfirmedSloTemplates = ref(false);

const unconfirmedStrategyConfigTemplates = computed(() =>
  elasticityStrategyStore.elasticityStrategies.filter((x) => !x.confirmed)
);
const hasUnconfirmedStrategyConfigTemplates = computed(() => unconfirmedStrategyConfigTemplates.value.length > 0);
const unconfirmedStrategyConfigTemplatesDisplay = computed(() =>
  unconfirmedStrategyConfigTemplates.value.map((x) => `"${x.name}"`).join(', ')
);
const showReviewUnconfirmedStrategyConfigTemplates = ref(false);

watch(selection, (value) => {
  if (value) {
    showNewItemSelection.value = false;
  }
});

function openNewItemSelection() {
  selection.value = null;
  showNewItemSelection.value = true;
}
</script>

<template>
  <q-page class="column">
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>Workspace</q-toolbar-title>
      <q-btn flat label="Add" icon="mdi-plus" @click="openNewItemSelection" />
    </q-toolbar>
    <q-banner inline-actions class="bg-secondary text-white" v-if="hasUndismissedDeploymentAction">
      <q-spinner-gears size="2em" />
      <span class="q-ml-md">A Deployment for {{ deploymentNames }} is currently running</span>
      <template #action><q-btn flat label="Dismiss" @click="dismissDeploymentNotification" /></template>
    </q-banner>
    <q-banner inline-actions class="bg-info text-white" v-if="hasUnconfirmedSloTemplates">
      <template #avatar>
        <q-icon name="mdi-information" />
      </template>
      <span>
        The slo template{{ unconfirmedSloTemplates.length > 1 ? 's' : '' }} {{ unconfirmedSloTemplatesDisplay }}
        {{ unconfirmedSloTemplates.length > 1 ? 'have' : 'has' }} been loaded from Polaris. Please review if the
        parameters have been configured correctly.
      </span>
      <template #action>
        <q-btn flat label="Review" @click="showReviewUnconfirmedSloTemplates = true" />
      </template>
    </q-banner>
    <q-banner inline-actions class="bg-info text-white" v-if="hasUnconfirmedStrategyConfigTemplates">
      <template #avatar>
        <q-icon name="mdi-information" />
      </template>
      <span>
        The elasticity strateg{{ unconfirmedStrategyConfigTemplates.length > 1 ? 'ies' : 'y' }}
        {{ unconfirmedStrategyConfigTemplatesDisplay }}
        {{ unconfirmedStrategyConfigTemplates.length > 1 ? 'have' : 'has' }} been loaded from Polaris. Please review if
        the parameters have been configured correctly.
      </span>
      <template #action>
        <q-btn flat label="Review" @click="showReviewUnconfirmedStrategyConfigTemplates = true" />
      </template>
    </q-banner>
    <WorkspaceDiagramm v-model:selectedComponent="selection" class="col" @click="showNewItemSelection = false" />
    <ReviewSloTemplateDialog v-model:show="showReviewUnconfirmedSloTemplates" />
    <ReviewStrategyConfigTemplateDialog v-model:show="showReviewUnconfirmedStrategyConfigTemplates" />
    <teleport to="#main-layout">
      <q-drawer
        side="right"
        :model-value="showDrawer"
        bordered
        id="drawer-right"
        :breakpoint="500"
        :width="drawerWidth"
        class="q-pa-md"
      >
        <WorkspaceItemDetails v-if="selection" class="q-pa-sm" :itemId="selection.id" />
        <NewWorkspaceItemSelector v-if="showNewItemSelection" />
      </q-drawer>
    </teleport>
  </q-page>
</template>
