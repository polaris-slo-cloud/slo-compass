<script setup>
import SloDiagramm from '@/components/SloDiagramm.vue';
import { computed, ref } from '@vue/runtime-core';
import { useWorkspaceStore } from '@/store';

const store = useWorkspaceStore();
const selection = ref(null);
const showDrawer = computed(() => {
  return !!selection.value;
});

function createWorkspace() {
  store.createWorkspace();
}
async function openWorkspace() {
  await store.openWorkspace();
}
</script>

<template>
  <q-page v-if="store.isOpened">
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>Workspace</q-toolbar-title>
      <q-btn flat label="Add" icon="mdi-plus" />
    </q-toolbar>
    <SloDiagramm
      :workspace="store.workspace"
      v-model:selectedComponent="selection"
      class="col"
    />
    <teleport to="#main-layout">
      <q-drawer
        side="right"
        :model-value="showDrawer"
        bordered
        id="drawer-right"
      >
        <div v-if="selection" class="q-pa-sm">
          <h4>{{ selection.name }}</h4>
          <q-list v-if="selection.config">
            <q-item-label header>Config</q-item-label>
            <q-item
              v-for="configKey of Object.keys(selection.config)"
              :key="configKey"
            >
              <q-item-section>{{ configKey }}</q-item-section>
              <q-item-section>{{ selection.config[configKey] }}</q-item-section>
            </q-item>
          </q-list>
        </div>
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
