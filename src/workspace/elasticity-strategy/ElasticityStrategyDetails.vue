<template>
  <div class="flex justify-end q-mt-lg">
    <q-btn v-if="canBeDeployed" label="Deploy" color="primary" @click="deploy" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useWorkspaceStore } from '@/store';

const props = defineProps({
  item: Object,
});

const store = useWorkspaceStore();
const canBeDeployed = computed(
  () =>
    !store.hasRunningDeployment(props.item.id) &&
    (!props.item.deploymentStatus || props.item.deploymentStatus.some((x) => !x.success))
);

function deploy() {
  store.deployElasticityStrategy(props.item);
}
</script>

<style scoped></style>
