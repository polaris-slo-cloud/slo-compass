<template>
  <q-form @submit="createWorkspace" style="max-width: 800px" class="full-width">
    <h1>New Workspace</h1>
    <q-input
      label="Name *"
      :rules="[(val) => !!val || 'Workspace name is required']"
      v-model="model.name"
    />
    <DirectoryChooser
      v-if="canChooseDirectory"
      v-model="model.workspaceDirectory"
      label="Workspace Location"
    />
    <h2>Orchestrator</h2>
    <OrchestratorSelection v-model="model.orchestrator" />
    <div class="flex justify-end q-mt-xl q-gutter-md">
      <q-btn flat label="Cancel" @click="cancel" />
      <q-btn type="submit" color="primary" label="Create" icon="mdi-plus" />
    </div>
  </q-form>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import OrchestratorSelection from '@/orchestrator/OrchestratorSelection.vue';
import DirectoryChooser from '@/crosscutting/components/DirectoryChooser.vue';
import { useWorkspaceStore } from '@/store';

const store = useWorkspaceStore();
const router = useRouter();

const emit = defineEmits(['cancel']);

const model = ref({});
const canChooseDirectory = !!window.filesApi;

function cancel() {
  model.value = {};
  emit('cancel');
}

function createWorkspace() {
  store.createWorkspace(model.value);
  router.replace({ name: 'workspace' });
}
</script>

<style scoped></style>
