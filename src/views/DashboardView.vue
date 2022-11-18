<script setup>
import WorkspaceDiagramm from '@/workspace/WorkspaceDiagramm.vue';
import NewWorkspaceItemSelector from '@/workspace/NewWorkspaceItemSelector.vue';
import WorkspaceItemDetails from '@/workspace/WorkspaceItemDetails.vue';
import { computed, ref, watch } from 'vue';
import useWindowSize from '@/crosscutting/composables/window-size';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useTemplateStore } from '@/store/template';
import ReviewSloTemplateDialog from '@/polaris-templates/slo/ReviewTemplateDialog.vue';
import ReviewStrategyTemplateDialog from '@/polaris-templates/elasticity-strategy/ReviewTemplateDialog.vue';

const orchestratorApi = useOrchestratorApi();
const templateStore = useTemplateStore();

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

const unconfirmedStrategyTemplates = computed(() =>
  templateStore.elasticityStrategyTemplates.filter((x) => !x.confirmed)
);
const hasUnconfirmedStrategyTemplates = computed(() => unconfirmedStrategyTemplates.value.length > 0);
const unconfirmedStrategyTemplatesDisplay = computed(() =>
  unconfirmedStrategyTemplates.value.map((x) => `"${x.displayName}"`).join(', ')
);
const showReviewUnconfirmedStrategyTemplates = ref(false);

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
    <q-banner inline-actions class="bg-info text-white" v-if="hasUnconfirmedStrategyTemplates">
      <template #avatar>
        <q-icon name="mdi-information" />
      </template>
      <span>
        The elasticity strategy template{{ unconfirmedStrategyTemplates.length > 1 ? 's' : '' }}
        {{ unconfirmedStrategyTemplatesDisplay }} {{ unconfirmedStrategyTemplates.length > 1 ? 'have' : 'has' }} been
        loaded from Polaris. Please review if the parameters have been configured correctly.
      </span>
      <template #action>
        <q-btn flat label="Review" @click="showReviewUnconfirmedStrategyTemplates = true" />
      </template>
    </q-banner>
    <WorkspaceDiagramm v-model:selectedComponent="selection" class="col" @click="showNewItemSelection = false" />
    <ReviewSloTemplateDialog v-model:show="showReviewUnconfirmedSloTemplates" />
    <ReviewStrategyTemplateDialog v-model:show="showReviewUnconfirmedStrategyTemplates" />
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
