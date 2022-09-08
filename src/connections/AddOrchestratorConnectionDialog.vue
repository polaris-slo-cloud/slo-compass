<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">New Orchestrator Connection</div>
        <q-input autofocus label="Name" v-model="model.name" />
        <q-select
          label="Orchestrator"
          v-model="model.orchestrator"
          :options="availableOrchestrators"
        />
        <component :is="orchestratorSettingsComponent" v-model="model.connectionSettings" />
        <div class="q-mt-md flex items-center">
          <q-btn flat label="Test Connection" no-caps @click="testConnection" />
          <span class="q-mx-sm">{{ model.orchestrator }} </span>
          <q-icon v-if="statusIcon" v-bind="statusIcon" size="sm" />
          <q-spinner v-if="showStatusLoading" size="sm" />
        </div>
      </q-card-section>
      <q-card-actions>
        <q-space />
        <q-btn flat label="Cancel" @click="closeDialog" />
        <q-btn color="primary" label="Add" icon="mdi-plus" @click="add" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { v4 as uuidv4 } from 'uuid';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { availableOrchestrators, getOrchestrator } from '@/orchestrator/orchestrators';
import connectionsStorage from '@/connections/storage';

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['update:show', 'added']);
const orchestratorApi = useOrchestratorApi();
const model = ref({});
const $q = useQuasar();
const isElectron = computed(() => $q.platform.is.electron);

function resetModel() {
  model.value = {
    orchestrator: availableOrchestrators[0],
  };
}

const showDialog = computed({
  get() {
    return props.show;
  },
  set(value) {
    emit('update:show', value);
  },
});

const orchestratorSettingsComponent = computed(() => {
  const config = getOrchestrator(model.value.orchestrator);
  const component = isElectron.value
    ? config?.connectionSettingsComponent?.native
    : config?.connectionSettingsComponent?.web;
  return component || 'div';
});

const connectionStatus = ref('not-checked');
const showStatusLoading = computed(() => connectionStatus.value === 'checking');
const statusIcon = computed(() => {
  switch (connectionStatus.value) {
    case 'success':
      return {
        name: 'mdi-check-circle',
        color: 'green',
      };
    case 'error':
      return {
        name: 'mdi-alert-circle',
        color: 'red',
      };
  }
  return null;
});
function closeDialog() {
  resetModel();
  showDialog.value = false;
}

async function testConnection() {
  connectionStatus.value = 'checking';
  const settings = {
    orchestrator: model.value.orchestrator,
    connectionSettings: model.value.connectionSettings,
  };
  const success = await orchestratorApi.testConnection(settings);
  connectionStatus.value = success ? 'success' : 'error';
  return success;
}
async function add() {
  const settings = {
    id: uuidv4(),
    ...model.value,
  };
  connectionsStorage.addConnectionSetting(settings);
  emit('added', settings);
  closeDialog();
}
onMounted(resetModel);
</script>
