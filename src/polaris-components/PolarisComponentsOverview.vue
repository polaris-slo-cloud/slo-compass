<template>
  <div>
    <h3>Elasticity Strategies</h3>
    <div class="row q-col-gutter-md">
      <div class="col-6 col-md-3 col-lg-2" v-for="strategy of elasticityStrategies" :key="strategy.kind">
        <q-card class="cursor-pointer" @click="openElasticityStrategy(strategy)" flat bordered>
          <q-card-section>
            <div class="text-h4">{{ strategy.name }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <h3>SLO Controllers</h3>
    <div class="row q-col-gutter-md">
      <div class="col-6 col-md-3 col-lg-2" v-for="controller of sloControllers" :key="controller.handlesKind">
        <q-card class="cursor-pointer" @click="openSloController(controller)" flat bordered>
          <q-card-section>
            <div class="text-h4">{{ controllerName(controller) }}</div>
          </q-card-section>
          <q-card-section>
            <div class="text-right text-muted">Handles {{ controller.handlesKind }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <h3>Composed Metric Controllers</h3>
    <div class="row q-col-gutter-md">
      <div class="col-6 col-md-3 col-lg-2" v-for="controller of metricControllers" :key="controller.handlesKind">
        <q-card class="cursor-pointer" @click="openComposedMetricController(controller)" flat bordered>
          <q-card-section>
            <div class="text-h4">{{ controllerName(controller) }}</div>
          </q-card-section>
          <q-card-section>
            <div class="text-right text-muted">Handles {{ controller.handlesKind }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { usePolarisComponentStore } from '@/store/polaris-component';

const router = useRouter();
const elasticityStrategyStore = useElasticityStrategyStore();
const polarisComponentStore = usePolarisComponentStore();

const { sloControllers, elasticityStrategyControllers, metricControllers } = storeToRefs(polarisComponentStore);
const elasticityStrategies = computed(() =>
  elasticityStrategyStore.elasticityStrategies.map((x) => {
    const controller = elasticityStrategyControllers.value.find((c) => c.handlesKind === x.kind);
    return {
      ...x,
      controller,
    };
  })
);

function controllerName(controller) {
  return controller.deployment ? controller.deployment.name : controller.deploymentMetadata.name;
}

function openElasticityStrategy(strategy) {
  router.push({ name: 'elasticity-strategy', params: { kind: strategy.kind } });
}

function openSloController(controller) {
  // router.push({ name: 'slo-controller', params: { kind: controller.handlesKind } });
}

function openComposedMetricController(controller) {
  // router.push({ name: 'composed-metric-controller', params: { kind: controller.handlesKind } });
}
</script>

<style scoped lang="scss"></style>
