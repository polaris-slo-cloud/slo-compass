<template>
  <q-page>
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>Connections</q-toolbar-title>
    </q-toolbar>
    <div class="q-layout-padding">
      <div>
        <div class="text-h4">Orchestrator</div>
        <span class="q-mr-sm">{{ currentOrchestratorName }} -</span>
        <span v-if="orchestratorConnected" class="text-green text-italic connection-status">
          <q-badge rounded color="green" class="q-mr-sm" /> Connected
        </span>
        <span class="text-red connection-status" v-else>
          <q-badge rounded color="red" class="q-mr-sm" /> Not Connected
        </span>
        <q-table
          class="q-mt-md"
          title="Saved Connections"
          :columns="orchestratorConnectionColumns"
          :rows="orchestratorConnections"
          hide-pagination
          hide-selected-banner
        >
          <template v-slot:header-cell-active="props">
            <q-th :props="props" auto-width>
              {{ props.col.label }}
            </q-th>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="active" :props="props">
                <q-badge v-if="props.row.active" color="cyan" label="Active" />
              </q-td>
              <q-td key="name" :props="props">
                {{ props.row.name }}
              </q-td>
              <q-td key="connectionSettings" :props="props">
                {{ props.row.connectionSettings }}
              </q-td>
              <q-td key="actions" :props="props">
                <q-btn
                  v-if="!props.row.active && workspaceOpen"
                  flat
                  icon="mdi-connection"
                  label="connect"
                  color="primary"
                  @click="connectToOrchestrator(props.row)"
                />
                <q-btn flat icon="mdi-delete" color="red" @click="deleteOrchestrator(props.row)" />
              </q-td>
            </q-tr>
          </template>
          <template #top-right>
            <q-btn flat label="Add" icon="mdi-plus" @click="openAddOrchestratorDialog" />
          </template>
        </q-table>
      </div>
      <div class="q-mt-xl">
        <div class="text-h4">Metrics Provider</div>
        <span class="q-mr-sm">{{ currentMetricsProviderName }} -</span>
        <span v-if="metricsProviderConnected" class="text-green text-italic connection-status">
          <q-badge rounded color="green" class="q-mr-sm" /> Connected
        </span>
        <span class="text-red connection-status" v-else>
          <q-badge rounded color="red" class="q-mr-sm" /> Not Connected
        </span>
        <q-table
          class="q-mt-md"
          title="Saved Providers"
          :columns="metricsProviderColumns"
          :rows="metricsProviders"
          hide-pagination
          hide-selected-banner
        >
          <template v-slot:header-cell-active="props">
            <q-th :props="props" auto-width>
              {{ props.col.label }}
            </q-th>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="active" :props="props">
                <q-badge v-if="props.row.active" color="cyan" label="Active" />
              </q-td>
              <q-td key="name" :props="props">
                {{ props.row.name }}
              </q-td>
              <q-td key="connectionSettings" :props="props">
                {{ props.row.connectionSettings }}
              </q-td>
              <q-td key="actions" :props="props">
                <q-btn
                  v-if="!props.row.active && workspaceOpen"
                  flat
                  icon="mdi-connection"
                  label="connect"
                  color="primary"
                  @click="connectToMetricsProvider(props.row)"
                />
                <q-btn flat icon="mdi-delete" color="red" @click="deleteMetricsProvider(props.row)" />
              </q-td>
            </q-tr>
          </template>
          <template #top-right>
            <q-btn flat label="Add" icon="mdi-plus" @click="openAddMetricsProviderDialog" />
          </template>
        </q-table>
      </div>
      <div class="q-mt-xl">
        <div class="text-h4">Polaris Workspace</div>
        <span class="text-muted">Not Connected</span>
      </div>
    </div>
    <AddOrchestratorConnectionDialog v-model:show="showOrchestratorDialog" @added="orchestratorAdded" />
    <AddMetricsProviderDialog v-model:show="showMetricsProviderDialog" @added="metricsProviderAdded" />
    <q-dialog v-model="showConfirmConnectOrchestratorDialog">
      <q-card>
        <q-card-section>
          <div class="text-h2">Warning</div>
        </q-card-section>
        <q-card-section>
          <div>Changing the orchestrator of a workspace may lead to undefined behaviour!</div>
          <div class="q-mt-sm">Do you want to continue?</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showConfirmConnectOrchestratorDialog = false" />
          <q-btn icon="mdi-connection" label="Connect" color="primary" @click="confirmConnectToOrchestrator" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import AddOrchestratorConnectionDialog from '@/connections/AddOrchestratorConnectionDialog.vue';
import AddMetricsProviderDialog from '@/connections/AddMetricsProviderDialog.vue';
import { orchestratorStorage, metricsProviderStorage, workspaceConnectionStorage } from '@/connections/storage';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useQuasar } from 'quasar';
import { useMetricsProvider } from '@/metrics-provider/api';
import { useWorkspaceStore } from '@/store/workspace';

const workspaceStore = useWorkspaceStore();
const orchestratorApi = useOrchestratorApi();
const metricsProvider = useMetricsProvider();
const $q = useQuasar();
const workspaceOpen = computed(() => workspaceStore.isOpened);

const orchestratorConnectionColumns = [
  { name: 'active', field: 'active' },
  { name: 'name', required: true, label: 'Name', align: 'left', field: 'name' },
  {
    name: 'connectionSettings',
    required: true,
    label: 'Connection Settings',
    align: 'left',
    field: 'connectionSettings',
  },
  { name: 'actions' },
];
const orchestratorConnections = ref([]);
const showOrchestratorDialog = ref(false);
const orchestratorConnected = computed(() => orchestratorApi.isConnected.value);
const currentOrchestratorName = computed(() => orchestratorApi.orchestratorName.value);

function openAddOrchestratorDialog() {
  showOrchestratorDialog.value = true;
}
function orchestratorAdded(conn) {
  orchestratorConnections.value.push(conn);
}
function deleteOrchestrator(conn) {
  orchestratorConnections.value = orchestratorConnections.value.filter((x) => x.id !== conn.id);
  orchestratorStorage.saveConnectionSettings(orchestratorConnections.value);
}

const confirmOrchestrator = ref(null);
const showConfirmConnectOrchestratorDialog = computed({
  get: () => !!confirmOrchestrator.value,
  set(v) {
    if (v === false) {
      confirmOrchestrator.value = null;
    }
  },
});

function connectToOrchestrator(orchestratorConnection) {
  confirmOrchestrator.value = orchestratorConnection;
}

function confirmConnectToOrchestrator() {
  orchestratorApi.connect(confirmOrchestrator.value, workspaceStore.polarisOptions);
  setConnections({ orchestrator: confirmOrchestrator.value });
  orchestratorConnections.value.forEach((conn) => (conn.active = conn.id === confirmOrchestrator.value.id));
  showConfirmConnectOrchestratorDialog.value = false;
}

function connectToMetricsProvider(metricsConnection) {
  metricsProvider.connect(metricsConnection);
  setConnections({ metrics: metricsConnection });
  metricsProviders.value.forEach((conn) => (conn.active = conn.id === metricsConnection.value.id));
}

function setConnections(connections) {
  const saved = workspaceConnectionStorage.getConnectionsForWorkspace(workspaceStore.workspaceId);
  const newConnections = {
    ...saved,
    ...connections,
  };
  delete newConnections.orchestrator.active;
  delete newConnections.metrics.active;
  workspaceConnectionStorage.setConnectionsForWorkspace(workspaceStore.workspaceId, newConnections);
}
const metricsProviderColumns = [
  { name: 'active', field: 'active' },
  { name: 'name', required: true, label: 'Name', align: 'left', field: 'name' },
  {
    name: 'connectionSettings',
    required: true,
    label: 'Connection Settings',
    align: 'left',
    field: 'connectionSettings',
  },
  { name: 'actions' },
];
const metricsProviders = ref([]);
const showMetricsProviderDialog = ref(false);
const metricsProviderConnected = computed(() => metricsProvider.isConnected.value);
const currentMetricsProviderName = computed(() => metricsProvider.name);

function openAddMetricsProviderDialog() {
  showMetricsProviderDialog.value = true;
}
function metricsProviderAdded(conn) {
  metricsProviders.value.push(conn);
}
function deleteMetricsProvider(conn) {
  metricsProviders.value = metricsProviders.value.filter((x) => x.id !== conn.id);
  metricsProviderStorage.saveConnectionSettings(metricsProviders.value);
}

function loadConnections() {
  const workspaceConnections = workspaceStore.isOpened
    ? workspaceConnectionStorage.getConnectionsForWorkspace(workspaceStore.workspaceId)
    : {};
  orchestratorConnections.value = orchestratorStorage.getConnectionSettings().map((x) => ({
    ...x,
    active: workspaceConnections.orchestrator?.id === x.id,
  }));
  metricsProviders.value = metricsProviderStorage.getConnectionSettings().map((x) => ({
    ...x,
    active: workspaceConnections.metrics?.id === x.id,
  }));
}

onMounted(async () => {
  loadConnections();
});
</script>
<style lang="scss">
.connection-status {
  font-style: italic;
  display: inline-flex;
  align-items: center;
}
</style>
