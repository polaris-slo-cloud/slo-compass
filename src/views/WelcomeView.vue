<template>
  <q-page class="flex justify-center q-pa-lg">
    <NewWorkspace v-if="isCreatingWorkspace" @cancel="isCreatingWorkspace = false" />
    <div class="column" style="align-self: center" v-else>
      <q-btn
        flat
        label="New Workspace"
        icon="mdi-file"
        no-caps
        @click="isCreatingWorkspace = true"
      ></q-btn>
      <q-btn
        flat
        class="q-mt-md"
        label="Open Workspace"
        icon="mdi-folder-open"
        no-caps
        @click="openWorkspaceFile"
      ></q-btn>
      <div class="q-mt-lg" v-if="recentWorkspaces.length > 0">
        <q-separator />
        <h3>Recent Workspaces</h3>
        <q-list>
          <q-item
            v-for="workspace in recentWorkspaces"
            :key="workspace.id"
            clickable
            @click="loadWorkspace(workspace.id)"
          >
            <q-item-section>
              <q-item-label>{{ workspace.name }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label caption>{{ formatDate(workspace.date) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useWorkspaceStore } from '@/store/workspace';
import { useRouter } from 'vue-router';
import NewWorkspace from '@/workspace/NewWorkspace.vue';
import { getRecentWorkspaces, getWorkspace, markWorkspaceAsUsed } from '@/workspace/store-helper';
import workspaceFileService from '@/workspace/workspace-file-service';
import dayjs from 'dayjs';
import { workspaceConnectionStorage } from '@/connections/storage';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useMetricsProvider } from '@/metrics-provider/api';

const orchestratorApi = useOrchestratorApi();
const metricsProvider = useMetricsProvider();
const store = useWorkspaceStore();
const router = useRouter();

const isCreatingWorkspace = ref(false);
const recentWorkspaces = getRecentWorkspaces();

const formatDate = (date) => dayjs(date).format('DD.MM.YYYY HH:mm');

async function openWorkspaceFile() {
  const workspace = await workspaceFileService.openWorkspaceFile();
  await openWorkspace(workspace);
}
async function loadWorkspace(id) {
  const workspace = await getWorkspace(id);
  await openWorkspace(workspace);
}

async function openWorkspace(workspace) {
  store.loadWorkspace(workspace);
  markWorkspaceAsUsed(workspace);
  const connections = workspaceConnectionStorage.getConnectionsForWorkspace(workspace.workspaceId);
  if (connections?.orchestrator) {
    orchestratorApi.connect(connections.orchestrator, workspace.polarisOptions);
  }
  if (connections?.metrics) {
    metricsProvider.connect(connections.metrics);
  }
  await router.replace({ name: 'workspace' });
}
</script>

<style scoped></style>
