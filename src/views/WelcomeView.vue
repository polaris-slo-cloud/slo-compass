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
        @click="openWorkspace"
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
import { useWorkspaceStore } from '@/store';
import { useRouter } from 'vue-router';
import NewWorkspace from '@/workspace/NewWorkspace.vue';
import { getRecentWorkspaces } from '@/workspace/store-helper';
import dayjs from 'dayjs';

const store = useWorkspaceStore();
const router = useRouter();

const isCreatingWorkspace = ref(false);
const recentWorkspaces = getRecentWorkspaces();

const formatDate = (date) => dayjs(date).format('DD.MM.YYYY HH:mm');

async function openWorkspace() {
  await store.openWorkspace();
}
async function loadWorkspace(id) {
  await store.loadWorkspace(id);
  await router.replace({ name: 'workspace' });
}
</script>

<style scoped></style>
