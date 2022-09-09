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
                <q-badge v-if="props.row.active" color="green" label="Active" />
              </q-td>
              <q-td key="name" :props="props">
                {{ props.row.name }}
              </q-td>
              <q-td key="connectionSettings" :props="props">
                {{ props.row.connectionSettings }}
              </q-td>
              <q-td key="actions" :props="props">
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
    <AddOrchestratorConnectionDialog
      v-model:show="showOrchestratorDialog"
      @added="connectionAdded"
    />
  </q-page>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import AddOrchestratorConnectionDialog from '@/connections/AddOrchestratorConnectionDialog.vue';
import connectionsStorage from '@/connections/storage';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useQuasar } from 'quasar';

const orchestratorApi = useOrchestratorApi();
const $q = useQuasar();

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
const orchestratorConnected = ref(false);
const currentOrchestratorName = computed(() => orchestratorApi.orchestratorName.value);

function openAddOrchestratorDialog() {
  showOrchestratorDialog.value = true;
}

async function connectionAdded(conn) {
  orchestratorConnections.value.push(conn);
  orchestratorConnected.value = await orchestratorApi.test();
}

function loadConnections() {
  orchestratorConnections.value = connectionsStorage.getConnectionSettings();
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
