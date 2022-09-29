<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">New Metrics Provider</div>
        <q-input autofocus label="Name" v-model="model.name" />
        <q-select label="Provider" v-model="model.metricsProvider" :options="availableProviders" />
        <component :is="providerSettingsComponent" v-model="model.connectionSettings" />
        <div class="q-mt-md flex items-center">
          <q-btn flat label="Test Connection" no-caps @click="testConnection" />
          <span class="q-mx-sm">{{ model.metricsProvider }} </span>
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
import { v4 as uuidv4 } from 'uuid';
import { useMetricsProvider } from '@/metrics-provider/api';
import { availableProviders, getProvider } from '@/metrics-provider/providers';
import { metricsProviderStorage } from '@/connections/storage';

const metricsProvider = useMetricsProvider();

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['update:show', 'added']);

const model = ref({});

function resetModel() {
  model.value = {
    metricsProvider: availableProviders[0],
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

const providerSettingsComponent = computed(() => {
  const config = getProvider(model.value.metricsProvider);
  return config?.connectionSettingsComponent || 'div';
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
    metricsProvider: model.value.metricsProvider,
    connectionSettings: model.value.connectionSettings,
  };
  const success = await metricsProvider.testConnection(settings);
  connectionStatus.value = success ? 'success' : 'error';
  return success;
}
async function add() {
  const settings = {
    id: uuidv4(),
    ...model.value,
  };
  metricsProviderStorage.addConnectionSetting(settings);
  emit('added', settings);
  closeDialog();
}
onMounted(resetModel);
</script>
