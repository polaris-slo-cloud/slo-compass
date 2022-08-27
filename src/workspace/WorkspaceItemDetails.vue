<template>
  <div>
    <div v-if="isEditingName">
      <q-input v-model="editModel" label="Name" outlined />
      <div class="flex justify-end q-mt-xs q-gutter-sm">
        <q-btn outline icon="mdi-close" @click="cancelEditName" />
        <q-btn outline icon="mdi-check" @click="saveName" />
      </div>
    </div>
    <h1 v-else class="q-ma-none flex items-start no-wrap">
      <span>{{ item.name }}</span>
      <IconButton icon="mdi-pencil" class="q-ml-sm" @click="startEditName" size=".5em" />
    </h1>
    <div class="text-subtitle1 text-muted">{{ item.type }}</div>
    <EditableField label="Deployment" v-model="deployment" v-if="canHaveDeployment">
      <div v-if="deployment" class="flex items-center">
        <q-icon v-bind="orchestratorIcon" size="sm" class="q-mr-xs" />
        <span class="text-italic q-mr-md">{{ deployment.name }}</span>
        <q-icon name="mdi-circle q-mr-xs" :color="deploymentStatusColor" />
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
    <EditableField label="Description" class="q-mt-lg" v-model="description">
      {{ formatIfEmpty(description) }}
      <template #edit="scope">
        <q-input outlined type="textarea" v-model="scope.value" />
      </template>
    </EditableField>
    <EditableField
      v-if="canHaveComponents"
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
    <EditableField v-if="canHaveTargets" label="Targets" class="q-mt-lg" v-model="targetEditModel">
      <q-chip v-for="target in targets" :key="target.id" :icon="componentIcon(target)">
        {{ target.name }}
      </q-chip>
      <template #edit="scope">
        <TargetSelection v-model="scope.value" multiple />
      </template>
    </EditableField>
    <EditableField v-if="item.config" label="Config" class="q-mt-lg" v-model="configEditModel">
      <div class="row q-col-gutter-md q-mt-none">
        <div v-for="configKey of configKeys" :key="configKey" class="col-12 col-lg-6">
          <div class="config-label">{{ configKey }}</div>
          <div>{{ item.config[configKey] }}</div>
        </div>
      </div>
      <template #edit="scope">
        <div class="row q-col-gutter-md q-mt-none">
          <div v-for="configKey of configKeys" :key="'edit-' + configKey" class="col-12 col-lg-6">
            <div class="config-label">{{ configKey }}</div>
            <ConfigTemplateInput
              v-model="scope.value[configKey]"
              :template="configTemplate[configKey]"
            />
          </div>
        </div>
      </template>
    </EditableField>
    <div class="flex justify-end q-mt-lg">
      <q-btn v-if="canBeDeployed" label="Deploy" color="primary" @click="deploy" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '@/store';
import TargetSelection from '@/components/TargetSelection.vue';
import EditableField from '@/workspace/EditableField.vue';
import ConfigTemplateInput from '@/workspace/ConfigTemplateInput.vue';
import DeploymentSelection from '@/workspace/DeploymentSelection.vue';
import orchestratorIconMap from '@/orchestrator/orchestrator-icon-map';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { getTemplate } from '@/polaris-templates/slo-template';

const store = useWorkspaceStore();
const orchestratorApi = useOrchestratorApi();

const props = defineProps({
  itemId: String,
});

const item = computed(() => store.getItem(props.itemId));

const canHaveDeployment = computed(() =>
  ['application', 'component'].includes(item.value?.type.toLowerCase())
);
const deployment = computed({
  get() {
    return item.value.deployment;
  },
  set(v) {
    store.save({ ...item.value, deployment: v });
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

const description = computed({
  get() {
    return item.value.description;
  },
  set(v) {
    store.save({ ...item.value, description: v });
  },
});

const configKeys = computed(() => (item.value?.config ? Object.keys(item.value.config) : []));
const configTemplate = computed(() => {
  if (!item.value?.template) {
    return {};
  }

  const template = getTemplate(item.value.template);
  return template
    ? template.config.reduce((map, curr) => {
        map[curr.parameter] = curr;
        return map;
      }, {})
    : {};
});
const configEditModel = computed({
  get() {
    return item.value.config;
  },
  set(v) {
    store.save({ ...item.value, config: v });
  },
});
const components = computed(() => (item.value?.id ? store.getComponents(item.value.id) : []));
const canHaveComponents = computed(() =>
  ['application', 'component'].includes(item.value?.type.toLowerCase())
);
const componentsEditModel = computed({
  get() {
    return components.value;
  },
  set(v) {
    store.save({ ...item.value, components: v.map((x) => x.id) });
  },
});

const formatIfEmpty = (value) => value || '-';

const componentIcon = (component) => {
  switch (component.type.toLowerCase()) {
    case 'application':
      return 'mdi-application';
    case 'component':
      return 'mdi-puzzle';
  }
  return undefined;
};

const canHaveTargets = computed(() => ['strategy', 'slo'].includes(item.value?.type.toLowerCase()));
const targets = computed(() =>
  item.value?.targets ? item.value.targets.map((x) => store.getItem(x)) : null
);
const targetEditModel = computed({
  get() {
    return targets.value.map((target) => ({
      value: target.id,
      label: target.name,
      type: target.type,
    }));
  },
  set(v) {
    store.save({ ...item.value, targets: v.map((x) => x.value) });
  },
});

const canBeDeployed = computed(
  () =>
    ['strategy', 'slo'].includes(item.value?.type.toLowerCase()) &&
    !store.hasRunningDeployment(item.value.id) &&
    (!item.value.deploymentStatus || item.value.deploymentStatus.some((x) => !x.success))
);

const isEditingName = ref(false);
const editModel = ref(null);

function startEditName() {
  isEditingName.value = true;
  editModel.value = item.value.name;
}
function cancelEditName() {
  isEditingName.value = false;
  editModel.value = null;
}
function saveName() {
  store.save({ ...item.value, name: editModel.value });
  isEditingName.value = false;
  editModel.value = null;
}

function deploy() {
  store.deploy(item.value);
}
</script>

<style lang="scss" scoped>
.config-label {
  font-weight: 600;
  font-size: 1em;
  color: $text-label-color;
  display: flex;
  align-items: center;
}
</style>