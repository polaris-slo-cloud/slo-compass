<script setup>
import WorkspaceDiagramm from '@/workspace/WorkspaceDiagramm.vue';
import NewWorkspaceItemSelector from '@/workspace/NewWorkspaceItemSelector.vue';
import WorkspaceItemDetails from '@/workspace/WorkspaceItemDetails.vue';
import { computed, ref, watch } from 'vue';
import { useWorkspaceStore } from '@/store';
import useWindowSize from '@/crosscutting/composables/window-size';

const windowSize = useWindowSize();
const store = useWorkspaceStore();
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

const hasUndismissedDeploymentAction = computed(() => store.hasUndismissedDeploymentActions);
const deploymentNames = computed(() => store.runningDeploymentNames);
function dismissDeploymentNotification() {
  store.dismissRunningDeploymentActions();
}

watch(selection, (value) => {
  if (value) {
    showNewItemSelection.value = false;
  }
});
function createWorkspace() {
  store.createWorkspace();
}
async function openWorkspace() {
  await store.openWorkspace();
}

function openNewItemSelection() {
  selection.value = null;
  showNewItemSelection.value = true;
}
</script>

<template>
  <q-page v-if="store.isOpened" class="column">
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>Workspace</q-toolbar-title>
      <q-btn flat label="Add" icon="mdi-plus" @click="openNewItemSelection" />
    </q-toolbar>
    <q-banner inline-actions class="bg-secondary text-white" v-if="hasUndismissedDeploymentAction">
      <q-spinner-gears size="2em" />
      <span class="q-ml-md">A Deployment for {{ deploymentNames }} is currently running</span>
      <template #action
        ><q-btn flat label="Dismiss" @click="dismissDeploymentNotification"
      /></template>
    </q-banner>
    <WorkspaceDiagramm
      v-model:selectedComponent="selection"
      class="col"
      @click="showNewItemSelection = false"
    />
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
  <q-page v-else class="flex flex-center">
    <div class="column">
      <q-btn flat label="New Workspace" icon="mdi-file" no-caps @click="createWorkspace"></q-btn>
      <q-btn
        flat
        class="q-mt-md"
        label="Open Workspace"
        icon="mdi-folder-open"
        no-caps
        @click="openWorkspace"
      ></q-btn>
    </div>
  </q-page>
</template>
