<script setup>
import SloDiagramm from '@/components/SloDiagramm.vue';
import workspace from '@/assets/polaris-workspace.json';
import { computed, ref } from '@vue/runtime-core';

const selection = ref(null);
const showDrawer = computed(() => {
  return !!selection.value;
});
</script>

<template>
<q-page class="column">
    <SloDiagramm :workspace="workspace" v-model:selectedComponent="selection" class="col"/>
    <teleport to="#main-layout">
      <q-drawer 
        side="right"
        :model-value="showDrawer"
        bordered
        id="drawer-right">
        <div v-if="selection" class="q-pa-sm">
          <h4>{{ selection.name }}</h4>
          <q-list v-if="selection.config">
            <q-item-label header>Config</q-item-label>
            <q-item v-for="configKey of Object.keys(selection.config)" :key="configKey">
              <q-item-section>{{ configKey }}</q-item-section>
              <q-item-section>{{ selection.config[configKey] }}</q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-drawer>
    </teleport>
</q-page>
</template>