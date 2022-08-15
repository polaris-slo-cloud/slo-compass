<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">New Orchestrator Connection</div>
        <q-input autofocus label="Name" v-model="model.name" />
        <q-select label="Orchestrator" v-model="model.orchestrator" :options="availableOrchestrators" />
        <component :is="orchestratorSettingsComponent" v-model="model.options" />
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
        <q-btn color="primary" label="Connect" icon="mdi-connection" @click="connect" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, defineEmits, computed, onMounted } from 'vue';
import { useQuasar } from "quasar";
import { useOrchestratorApi } from '@/connections/orchestrator-api';
import KubernetesApiSettings from '@/connections/orchestrator-settings/KubernetesApiSettings.vue';
import KubernetesClientSettings from '@/connections/orchestrator-settings/KubernetesClientSettings.vue';

const apiOptionsComponents = {
  Kubernetes: KubernetesApiSettings,
};
const nativeOptionsComponents = {
  Kubernetes: KubernetesClientSettings,
};

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['update:show', 'added']);
const orchestratorApi = useOrchestratorApi();
const availableOrchestrators = ['Kubernetes'];
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
  const key = model.value.orchestrator;
  return isElectron.value ?
    nativeOptionsComponents[key] :
    apiOptionsComponents[key];
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
    options: model.value.options,
  };
  const success = await orchestratorApi.testConnection(settings);
  connectionStatus.value = success ? 'success' : 'error';
  return success;
}
async function connect() {
  const success = await testConnection();
  if (!success) {
    return;
  }
  const settings = {
    orchestrator: model.value.orchestrator,
    options: model.value.options,
  };
  orchestratorApi.connect(settings);
  emit('added', model.value);
  closeDialog();
}
onMounted(resetModel);
</script>
