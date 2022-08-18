<script setup>
import SloDiagramm from '@/components/SloDiagramm.vue';
import NewWorkspaceItemSelector from '@/components/NewWorkspaceItemSelector.vue';
import { computed, ref, watch } from 'vue';
import { useWorkspaceStore } from '@/store';
import EditWorkspaceItemDialog from '@/workspace/dialogs/WorkspaceItemDialog.vue';

const store = useWorkspaceStore();
const selection = ref(null);
const showNewItemSelection = ref(false);
const showEditItemDialog = ref(false);
const showDrawer = computed(() => {
  return showNewItemSelection.value || !!selection.value;
});

watch(selection, (value) => {
  if (value) {
    showNewItemSelection.value = false;
  }
});
const selectionConfigKeys = computed(() =>
  selection.value?.config ? Object.keys(selection.value.config) : []
);
const selectionComponents = computed(() =>
  selection.value ? store.getComponents(selection.value.id) : []
);

function createWorkspace() {
  store.createWorkspace();
}
async function openWorkspace() {
  await store.openWorkspace();
}
</script>

<template>
  <q-page v-if="store.isOpened" class="column">
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>Workspace</q-toolbar-title>
      <q-btn
        flat
        label="Add"
        icon="mdi-plus"
        @click="showNewItemSelection = true"
      />
    </q-toolbar>
    <SloDiagramm v-model:selectedComponent="selection" class="col" />
    <EditWorkspaceItemDialog v-model:show="showEditItemDialog" :item="selection" />
    <teleport to="#main-layout">
      <q-drawer
        side="right"
        :model-value="showDrawer"
        bordered
        id="drawer-right"
      >
        <div v-if="selection" class="q-pa-sm">
          <div class="text-h4">{{ selection.name }}</div>
          <div class="text-subtitle2">{{ selection.type }}</div>
          <q-list>
            <q-item>
              <q-item-section>Description</q-item-section>
              <q-item-section>{{ selection.description }}</q-item-section>
            </q-item>
            <q-expansion-item v-if="selectionComponents.length > 0" label="Components" default-opened>
              <q-list>
                <q-item v-for="component in selectionComponents" :key="component.id">
                  <q-item-section>
                    <q-item-label>{{ component.name }}</q-item-label>
                    <q-item-label caption>{{ component.type }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
            <q-item-label header v-if="selection.config">Config</q-item-label>
            <q-item
              v-for="configKey of selectionConfigKeys"
              :key="configKey"
            >
              <q-item-section>{{ configKey }}</q-item-section>
              <q-item-section>{{ selection.config[configKey] }}</q-item-section>
            </q-item>
          </q-list>
          <div class="flex justify-end">
            <q-btn
              icon="mdi-pencil"
              label="Edit"
              flat
              @click="showEditItemDialog = true"
            />
          </div>
        </div>
        <NewWorkspaceItemSelector v-if="showNewItemSelection" />
      </q-drawer>
    </teleport>
  </q-page>
  <q-page v-else class="flex flex-center">
    <div class="column">
      <q-btn
        flat
        label="New Workspace"
        icon="mdi-file"
        no-caps
        @click="createWorkspace"
      ></q-btn>
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
