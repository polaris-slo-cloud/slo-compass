<template>
  <div>
    <div class="flex items-center">
      <q-select
        v-model="connection"
        label="Orchestrator Connection"
        option-value="id"
        option-label="name"
        :options="connections"
        class="col-grow"
      />
      <q-btn flat label="New" icon="mdi-plus" class="q-ml-md" @click="showAddConnectionDialog = true" />
    </div>
    <component :is="orchestratorPolarisSettingsComponent" v-model="polarisOptions" />
    <AddOrchestratorConnectionDialog v-model:show="showAddConnectionDialog" @added="connectionAdded" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { orchestratorStorage } from '@/connections/storage';
import { getOrchestrator } from '@/orchestrator/orchestrators';
import AddOrchestratorConnectionDialog from '@/connections/AddOrchestratorConnectionDialog.vue';

const props = defineProps({
  modelValue: Object,
});
const emit = defineEmits(['update:modelValue']);

const connection = computed({
  get: () => props.modelValue?.connection,
  set(v) {
    const polarisOptionsModel =
      props.modelValue?.connection?.orchestrator === v.orchestrator ? props.modelValue?.polarisOptions : undefined;
    emit('update:modelValue', { connection: v, polarisOptions: polarisOptionsModel });
  },
});
const polarisOptions = computed({
  get: () => props.modelValue?.polarisOptions,
  set(v) {
    emit('update:modelValue', { connection: props.modelValue?.connection, polarisOptions: v });
  },
});

const orchestratorPolarisSettingsComponent = computed(() => {
  const config = getOrchestrator(connection.value?.orchestrator);
  return config?.polarisSettingsComponent || 'div';
});
const connections = ref([]);

const showAddConnectionDialog = ref(false);
function connectionAdded(conn) {
  connections.value = orchestratorStorage.getConnectionSettings();
  connection.value = conn;
}

onMounted(() => {
  connections.value = orchestratorStorage.getConnectionSettings();
});
</script>

<style scoped></style>
