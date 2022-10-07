<template>
  <div>
    <EditableField label="Deployment" v-model="deployment">
      <div v-if="deployment" class="flex items-center">
        <q-icon v-bind="orchestratorIcon" size="sm" class="q-mr-xs" />
        <span class="text-italic q-mr-md">{{ deployment.name }}</span>
        <q-badge rounded :color="deploymentStatusColor" class="q-mr-sm" />
        {{ deployment.status }}
      </div>
      <div v-else>
        <q-icon name="mdi-circle" color="grey" />
        Not Connected
      </div>
      <template #edit="scope">
        <DeploymentSelection v-model="scope.value" />
      </template>
    </EditableField>
    <EditableField
      label="Components"
      class="q-mt-lg"
      v-model="componentsEditModel"
    >
      <q-chip v-for="component in components" :key="component.id" :icon="componentIcon(component)">
        {{ component.name }}
      </q-chip>
      <template #edit="scope">
        <TargetSelection :hide-id="item.id" v-model="scope.value" multiple />
      </template>
    </EditableField>
  </div>
</template>

<script setup>
import TargetSelection from '@/workspace/targets/TargetSelection.vue';
import EditableField from '@/crosscutting/components/EditableField.vue';
import DeploymentSelection from '@/orchestrator/DeploymentSelection.vue';
import { computed } from 'vue';
import orchestratorIconMap from '@/orchestrator/orchestrator-icon-map';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import componentIcon from '@/workspace/targets/component-icon';
import { useTargetStore } from '@/store/target';

const store = useTargetStore();
const orchestratorApi = useOrchestratorApi();

const props = defineProps({
  item: Object,
});

const deployment = computed({
  get() {
    return props.item.deployment;
  },
  set(v) {
    store.saveTarget({ ...props.item, deployment: v });
  },
});
const orchestratorIcon = computed(
  () => orchestratorIconMap[orchestratorApi.orchestratorName.value]
);
const deploymentStatusColor = computed(() => {
  if (!deployment.value) {
    return 'grey';
  }
  const map = {
    Available: 'green',
    NotFound: 'red',
  };
  return map[deployment.value.status] ?? 'orange';
});

const components = computed(() => (props.item?.id ? store.getComponents(props.item.id) : []));
const componentsEditModel = computed({
  get() {
    return components.value;
  },
  set(v) {
    store.saveTarget({ ...props.item, components: v.map((x) => x.id) });
  },
});
</script>

<style scoped></style>
