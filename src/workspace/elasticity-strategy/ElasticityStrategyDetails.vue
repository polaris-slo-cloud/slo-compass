<template>
  <div class="flex justify-end q-mt-lg">
    <q-btn v-if="canBeDeployed" label="Deploy" color="primary" @click="deploy" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';

const props = defineProps({
  item: Object,
});

const store = useElasticityStrategyStore();
const canBeDeployed = computed(
  () =>
    !store.hasRunningDeployment(props.item.id) &&
    props.item.polarisControllers.some((x) => !x.deployment)
);

function deploy() {
  store.deployElasticityStrategy(props.item);
}
</script>

<style scoped></style>
