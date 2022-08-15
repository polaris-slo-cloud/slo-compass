<template>
  <q-page>
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>Connections</q-toolbar-title>
    </q-toolbar>
    <div class="q-layout-padding">
      <div>
        <div class="text-h4">Orchestrator</div>
        <span>{{ currentOrchestratorName }} - </span>
        <span v-if="orchestratorConnected" class="text-green text-italic connection-status">
          <q-icon name="mdi-circle" /> Connected
        </span>
        <span class="text-red connection-status" v-else>
          <q-icon name="mdi-circle" /> Not Connected
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
                <q-badge v-if="props.row.active" color="green" label="Active" />
              </q-td>
              <q-td key="name" :props="props">
                {{ props.row.name }}
              </q-td>
              <q-td key="options" :props="props">
                {{ props.row.options }}
              </q-td>
              <q-td key="actions" :props="props">
                <q-btn v-if="!props.row.active" flat icon="mdi-connection" label="Connect"  @click="connect(props.row)"/>
                <q-btn flat icon="mdi-delete" color="red" @click="deleteConnection(props.row)" />
              </q-td>
            </q-tr>
          </template>
          <template #top-right>
            <q-btn flat label="Add" icon="mdi-plus" @click="openAddOrchestratorDialog" />
          </template>
        </q-table>
      </div>
      <div class="q-mt-xl">
        <div class="text-h4">Polaris Workspace</div>
        <span class="text-muted">Not Connected</span>
      </div>
    </div>
    <ConnectOrchestratorDialog v-model:show="showOrchestratorDialog" @added="saveConnection" />
  </q-page>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import ConnectOrchestratorDialog from '@/connections/ConnectOrchestratorDialog.vue';
import connectionsStorage from '@/connections/storage';
import { useOrchestratorApi } from '@/connections/orchestrator-api';
import { v4 as uuidv4 } from 'uuid';
import {useQuasar} from "quasar";

const orchestratorApi = useOrchestratorApi();
const $q = useQuasar();

const orchestratorConnectionColumns = [
  { name: 'active', field: 'active' },
  { name: 'name', required: true, label: 'Name', align: 'left', field: 'name' },
  { name: 'options', required: true, label: 'Location', align: 'left', field: 'options' },
  { name: 'actions' },
];
const orchestratorConnections = ref([]);
const showOrchestratorDialog = ref(false);
const orchestratorConnected = ref(false);
const currentOrchestratorName = computed(() => orchestratorApi.orchestratorName.value);

function openAddOrchestratorDialog() {
  showOrchestratorDialog.value = true;
}

async function saveConnection(conn) {
  orchestratorConnections.value = orchestratorConnections.value.map((x) => ({
    ...x,
    active: false,
  }));
  orchestratorConnections.value.push({ id: uuidv4(), ...conn, active: true });
  connectionsStorage.saveConnectionSettings(orchestratorConnections.value);
  orchestratorConnected.value = await orchestratorApi.test();
}

function loadConnections() {
  orchestratorConnections.value = connectionsStorage.getConnectionSettings();
}
async function connect(conn) {
  if (await orchestratorApi.testConnection(conn)) {
    orchestratorApi.connect(conn);
    orchestratorConnections.value = orchestratorConnections.value.map((x) => ({
      ...x,
      active: x.id === conn.id,
    }));
    connectionsStorage.saveConnectionSettings(orchestratorConnections.value);
  } else {
    $q.notify({
      color: 'negative',
      message: `Unable to connect to orchestrator ${conn.orchestrator} at ${conn.options}`,
      icon: 'report_problem',
    });
  }
}

function deleteConnection(conn) {
  orchestratorConnections.value = orchestratorConnections.value.filter((x) => x.id !== conn.id);
  connectionsStorage.saveConnectionSettings(orchestratorConnections.value);
}

onMounted(async () => {
  loadConnections();
  orchestratorConnected.value = await orchestratorApi.test();
});
</script>
<style lang="scss">
.connection-status {
  font-style: italic;
  display: inline-flex;
  align-items: center;
}
</style>
