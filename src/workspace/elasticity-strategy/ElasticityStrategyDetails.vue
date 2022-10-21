<template>
  <div class="flex justify-end q-mt-lg">
    <q-btn v-if="canBeDeployed" label="Deploy" color="primary" @click="deploy" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';

const props = defineProps({
  item: Object,
});

const store = useElasticityStrategyStore();
const orchestratorApi = useOrchestratorApi();

const canBeDeployed = computed(
  () =>
    !orchestratorApi.hasRunningDeployment.value(props.item.id) &&
    props.item.polarisControllers.some((x) => !x.deployment)
);

function deploy() {
  store.deployElasticityStrategy(props.item.id);
}
</script>

<style scoped></style>
