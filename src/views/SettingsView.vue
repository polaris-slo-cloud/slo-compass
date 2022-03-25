<template>
  <q-page padding>
    <h3>Settings</h3>
    <q-list>
      <q-item tag="label">
        <q-item-section>
          <q-item-label>Theme</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-select v-model="theme" :options="themeOptions"/>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>
<script setup>
import { computed } from '@vue/runtime-core';
import { useQuasar } from 'quasar';
const $q = useQuasar();
const theme = computed({
  get() {
    return $q.dark.isActive ? 'Dark' : 'Light';
  },
  set(val) {
    $q.dark.set(val === 'Dark');
  }
});

const themeOptions = [
  'Dark',
  'Light'
];
</script>