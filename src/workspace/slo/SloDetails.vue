<template>
  <div>
    <EditableField label="Targets" class="q-mt-lg" v-model="targetEditModel">
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
import TargetSelection from '@/workspace/targets/TargetSelection.vue';
import EditableField from '@/workspace/EditableField.vue';
import ConfigTemplateInput from '@/workspace/ConfigTemplateInput.vue';
import { useWorkspaceStore } from '@/store';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { computed } from 'vue';
import { getTemplate } from '@/polaris-templates/slo-template';
import componentIcon from '@/workspace/targets/component-icon';

const store = useWorkspaceStore();
const orchestratorApi = useOrchestratorApi();

const props = defineProps({
  item: Object,
});

const configKeys = computed(() => (props.item?.config ? Object.keys(props.item.config) : []));
const configTemplate = computed(() => {
  const template = getTemplate(props.item.template);
  return template
    ? template.config.reduce((map, curr) => {
        map[curr.parameter] = curr;
        return map;
      }, {})
    : {};
});
const configEditModel = computed({
  get() {
    return props.item.config;
  },
  set(v) {
    store.save({ ...props.item, config: v });
  },
});

const targets = computed(() =>
  props.item.targets ? props.item.targets.map((x) => store.getItem(x)) : null
);
const targetEditModel = computed({
  get() {
    return targets.value;
  },
  set(v) {
    store.save({ ...props.item, targets: v.map((x) => x.id) });
  },
});

const canBeDeployed = computed(
  () =>
    !store.hasRunningDeployment(props.item.id) &&
    (!props.item.deploymentStatus || props.item.deploymentStatus.some((x) => !x.success))
);

function deploy() {
  store.deploySlo(props.item);
}
</script>

<style scoped></style>
