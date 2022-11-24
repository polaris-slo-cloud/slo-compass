<template>
  <q-banner v-if="item.deployedSloMapping?.deleted" class="bg-negative text-white">
    <template #avatar>
      <q-icon name="mdi-alert-circle" />
    </template>
    This {{ displayType }} has unsaved local changes and has been deleted inside the Polaris Cluster. You can either
    deploy your local changes as a new {{ displayType }} or delete it. If you delete this {{ displayType }} all changes
    will be lost.
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
</template>

<script setup>
import { useSloStore } from '@/store/slo';

const store = useSloStore();

const props = defineProps({
  item: Object,
  displayType: String,
});

async function deleteItem() {
  await store.deleteSlo(props.itemId);
}

async function applySloMapping() {
  await store.applySloMapping(props.itemId);
}
</script>

<style scoped lang="scss"></style>
