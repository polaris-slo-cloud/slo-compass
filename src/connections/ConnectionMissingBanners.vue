<template>
  <q-banner v-if="orchestratorNotConnected" inline-actions class="bg-negative text-white">
    <template #avatar>
      <q-icon name="mdi-alert" />
    </template>
    <span>
      Unable to connect to an orchestrator! You will not be able to apply SLOs or load an existing workspace until this
      has been resolved! Please check if an orchestrator connection has been set up and if the orchestrator is
      reachable!
    </span>
    <template #action>
      <q-btn flat label="Connect" :to="{ name: 'connections' }" />
    </template>
  </q-banner>
  <q-banner v-if="metricsProviderNotConnected" inline-actions class="bg-warning">
    <template #avatar>
      <q-icon name="mdi-alert" />
    </template>
    <span>
      Unable to connect to a metrics provider! You will not be able to see the current metric values of your SLOs until
      this has been resolved. Please check if a metrics provider has been set up and if it is reachable.
    </span>
    <template #action>
      <q-btn flat label="Connect" :to="{ name: 'connections' }" />
    </template>
  </q-banner>
</template>

<script setup>
import { computed } from 'vue';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useMetricsProvider } from '@/metrics-provider/api';

const orchestratorApi = useOrchestratorApi();
const metricsProvider = useMetricsProvider();

const orchestratorNotConnected = computed(() => !orchestratorApi.isConnected.value);
const metricsProviderNotConnected = computed(() => !metricsProvider.isConnected.value);
</script>

<style scoped lang="scss"></style>
