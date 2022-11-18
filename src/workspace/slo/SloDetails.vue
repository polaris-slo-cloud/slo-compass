<template>
  <div>
    <EditableField
      label="Target"
      class="q-mt-lg"
      v-model="targetEditModel"
      :oldValue="oldTarget"
      :resettable="sloExistsInPolaris"
    >
      <span v-if="targetChanged" class="chip-strike-through-container">
        <span class="chip-strike-through"></span>
        <q-chip :icon="oldTargetComponentIcon">
          {{ oldTarget.name }}
        </q-chip>
      </span>
      <q-icon v-if="targetChanged" name="mdi-arrow-right-thin" />
      <q-chip v-if="target" :icon="targetComponentIcon">
        {{ target.name }}
      </q-chip>
      <template #edit="scope">
        <TargetSelection v-model="scope.value" />
      </template>
    </EditableField>
    <MetricsOverview :slo="item" class="q-mt-lg" />
    <EditableField v-if="item.config" label="Config" class="q-mt-lg" v-model="configEditModel">
      <div class="row q-col-gutter-md q-mt-none">
        <ConfigItemView
          v-for="configKey of configKeys"
          :key="configKey"
          class="col-12 col-lg-6"
          :title="configKey"
          :value="item.config[configKey]"
          :oldValue="item.deployedSloMapping?.sloMapping?.config[configKey]"
          :showConfigChange="sloExistsInPolaris"
          @resetValue="resetSloConfig(configKey)"
        />
      </div>
      <template #edit="scope">
        <div class="row q-col-gutter-md q-mt-none">
          <div v-for="configKey of configKeys" :key="'edit-' + configKey" class="col-12 col-lg-6">
            <div class="field-item-label">{{ configKey }}</div>
            <ConfigTemplateInput v-model="scope.value[configKey]" :template="configTemplate[configKey]" />
          </div>
        </div>
      </template>
    </EditableField>
    <EditableField
      label="Elasticity Strategy"
      class="q-mt-lg"
      v-model="elasticityStrategy"
      :resettable="sloExistsInPolaris"
      :oldValue="oldElasticityStrategy"
    >
      <span v-if="elasticityStrategyChanged" class="old-value">
        {{ oldElasticityStrategy.name }}
      </span>
      <q-icon v-if="elasticityStrategyChanged" name="mdi-arrow-right-thin" />
      <span>
        {{ elasticityStrategyName }}
      </span>
      <template #edit="scope">
        <ElasticityStrategySelection v-model="scope.value" />
      </template>
    </EditableField>
    <EditableField
      v-if="elasticityStrategy"
      label="Config"
      class="q-mt-md q-ml-md"
      v-model="elasticityStrategyConfigEditModel"
    >
      <div class="row q-col-gutter-md q-mt-none">
        <ConfigItemView
          v-for="configKey of elasticityStrategyConfigKeys"
          :key="configKey"
          class="col-12 col-lg-6"
          :title="configKey"
          :value="item.elasticityStrategy.config[configKey]"
          :oldValue="item.deployedSloMapping?.sloMapping?.elasticityStrategyConfig[configKey]"
          :showConfigChange="sloExistsInPolaris"
          @resetValue="resetElasticityStrategyConfig(configKey)"
        />
      </div>
      <template #edit="scope">
        <div class="row q-col-gutter-md q-mt-none">
          <div v-for="configKey of elasticityStrategyConfigKeys" :key="'edit-' + configKey" class="col-12 col-lg-6">
            <div class="field-item-label">{{ configKey }}</div>
            <ConfigTemplateInput
              v-model="scope.value[configKey]"
              :template="elasticityStrategyConfigTemplate[configKey]"
            />
          </div>
        </div>
      </template>
    </EditableField>
    <div class="flex justify-end q-mt-lg" v-if="canBeDeployed">
      <q-btn label="Deploy" color="primary" @click="deploy" />
    </div>
    <div class="flex justify-end q-mt-lg q-gutter-x-md" v-else-if="item.configChanged">
      <q-btn label="Reset" color="negative" outline @click="resetConfiguration" v-if="item.sloMapping" />
      <q-btn label="Apply" color="primary" @click="applyConfiguration" />
    </div>
  </div>
</template>

<script setup>
import TargetSelection from '@/workspace/targets/TargetSelection.vue';
import EditableField from '@/crosscutting/components/EditableField.vue';
import ConfigTemplateInput from '@/workspace/ConfigTemplateInput.vue';
import ElasticityStrategySelection from '@/workspace/elasticity-strategy/ElasticityStrategySelection.vue';
import MetricsOverview from '@/workspace/slo/MetricsOverview.vue';
import { useSloStore } from '@/store/slo';
import { computed } from 'vue';
import componentIcon from '@/workspace/targets/component-icon';
import _ from 'lodash';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { useTargetStore } from '@/store/target';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import { useTemplateStore } from '@/store/template';
import ConfigItemView from '@/workspace/slo/ConfigItemView.vue';

const orchestratorApi = useOrchestratorApi();
const sloStore = useSloStore();
const elasticityStrategyStore = useElasticityStrategyStore();
const targetStore = useTargetStore();
const templateStore = useTemplateStore();

const props = defineProps({
  item: Object,
});

const sloExistsInPolaris = computed(() => props.item.deployedSloMapping && !props.item.deployedSloMapping.deleted);

const formatIfEmpty = (value) => value || '-';
function mergeDistinct(...lists) {
  return lists.flatMap((x) => x).filter((val, index, array) => array.indexOf(val) === index);
}

const configKeys = computed(() => {
  const templateKeys = configTemplate.value ? Object.keys(configTemplate.value) : [];
  const itemConfigKeys = props.item?.config ? Object.keys(props.item.config) : [];

  return mergeDistinct(templateKeys, itemConfigKeys);
});
const configTemplate = computed(() => {
  const template = templateStore.getSloTemplate(props.item.template);
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
    if (!_.isEqual(props.item.config, v)) {
      save({ config: v });
    }
  },
});

function sloMappingChanged(slo) {
  const configChanged = !_.isEqual(slo.config, slo.deployedSloMapping?.sloMapping?.config);
  const elasticityStrategyConfigChanged = !_.isEqual(
    slo.elasticityStrategy.config,
    slo.deployedSloMapping?.sloMapping?.elasticityStrategyConfig
  );
  const sloTarget = slo.target ? targetStore.getSloTarget(slo.target) : null;
  const targetChanged = !_.isEqual(sloTarget.deployment.connectionMetadata, slo.deployedSloMapping?.sloMapping?.target);
  const elasticityStrategyChanged =
    slo.elasticityStrategy.kind !== slo.deployedSloMapping?.sloMapping?.elasticityStrategy.kind;

  return configChanged || elasticityStrategyConfigChanged || targetChanged || elasticityStrategyChanged;
}

function resetSloConfig(configKey) {
  const update = { ...props.item };
  update.config[configKey] = props.item.deployedSloMapping?.sloMapping?.config[configKey];
  updateSloWithResettedConfig(update);
}
const target = computed(() => (props.item.target ? targetStore.getSloTarget(props.item.target) : null));
const targetComponentIcon = computed(() => (target.value ? componentIcon(target.value) : null));
const targetEditModel = computed({
  get() {
    return target.value;
  },
  set(v) {
    if (v.id !== props.item.target) {
      save({ target: v.id });
    }
  },
});
const oldTarget = computed(() =>
  props.item.deployedSloMapping?.sloMapping?.target
    ? targetStore.findTargetByReference(props.item.deployedSloMapping.sloMapping.target)
    : null
);
const oldTargetComponentIcon = computed(() => (oldTarget.value ? componentIcon(oldTarget.value) : null));
const targetChanged = computed(() => !!oldTarget?.value && oldTarget.value.id !== target.value?.id);

function resetElasticityStrategyConfig(configKey) {
  const update = { ...props.item };
  update.elasticityStrategy.config[configKey] =
    props.item.deployedSloMapping?.sloMapping?.elasticityStrategyConfig[configKey];
  updateSloWithResettedConfig(update);
}

function updateSloWithResettedConfig(update) {
  const configChanged = sloMappingChanged(update);
  if (!configChanged) {
    update.polarisConflict = null;
  }
  sloStore.saveSlo({
    ...update,
    configChanged,
  });
}
const elasticityStrategy = computed({
  get() {
    return props.item.elasticityStrategy
      ? elasticityStrategyStore.getElasticityStrategy(props.item.elasticityStrategy.id)
      : null;
  },
  set(v) {
    let config = props.item.elasticityStrategy?.template === v.template ? props.item.elasticityStrategy.config : {};
    if (v.id === oldElasticityStrategy.value?.id) {
      config = props.item.deployedSloMapping.sloMapping.elasticityStrategyConfig;
    }
    const template = templateStore.getElasticityStrategyTemplate(v.template);

    if (v.id !== props.item.elasticityStrategy?.id) {
      save({
        elasticityStrategy: { id: v.id, kind: template.elasticityStrategyKind, config },
      });
    }
  },
});

const oldElasticityStrategy = computed(() =>
  props.item.deployedSloMapping?.sloMapping?.elasticityStrategy
    ? elasticityStrategyStore.elasticityStrategies.find(
        (x) => x.template === props.item.deployedSloMapping.sloMapping.elasticityStrategy.kind
      )
    : null
);
const elasticityStrategyChanged = computed(
  () => !!oldElasticityStrategy.value && oldElasticityStrategy.value.id !== elasticityStrategy.value?.id
);
const elasticityStrategyName = computed(() => formatIfEmpty(elasticityStrategy.value?.name));
const elasticityStrategyConfigKeys = computed(() => {
  const templateKeys = elasticityStrategyConfigTemplate.value
    ? Object.keys(elasticityStrategyConfigTemplate.value)
    : [];
  const itemConfigKeys = props.item?.elasticityStrategy?.config
    ? Object.keys(props.item.elasticityStrategy.config)
    : [];

  return mergeDistinct(templateKeys, itemConfigKeys);
});
const elasticityStrategyConfigTemplate = computed(() => {
  if (!elasticityStrategy.value) {
    return {};
  }
  const template = templateStore.getElasticityStrategyTemplate(elasticityStrategy.value.template);
  return template
    ? template.sloSpecificConfig.reduce((map, curr) => {
        map[curr.parameter] = curr;
        return map;
      }, {})
    : {};
});
const elasticityStrategyConfigEditModel = computed({
  get() {
    return props.item.elasticityStrategy?.config;
  },
  set(v) {
    if (!_.isEqual(v, props.item.elasticityStrategy.config)) {
      save({
        elasticityStrategy: { ...props.item.elasticityStrategy, config: v },
      });
    }
  },
});

function save(changes) {
  sloStore.saveSlo({
    ...props.item,
    ...changes,
    configChanged: true,
  });
}
const canBeDeployed = computed(
  () =>
    !orchestratorApi.hasRunningDeployment.value(props.item.id) &&
    props.item.polarisControllers.some((x) => !x.deployment)
);

function deploy() {
  sloStore.deploySlo(props.item.id);
}

function applyConfiguration() {
  sloStore.applySloMapping(props.item.id);
}

function resetConfiguration() {
  sloStore.resetSloMapping(props.item.id);
}
</script>

<style scoped lang="scss">
.old-value {
  text-decoration: line-through;
  color: $text-muted-color;
}
.chip-strike-through-container {
  position: relative;
  .chip-strike-through {
    border-top: 1px solid $text-muted-color;
    position: absolute;
    top: 60%;
    left: 10px;
    right: 10px;
    z-index: 1000;
  }
  .q-chip {
    background: $grey-3;
    color: $text-muted-color;
    :deep(.q-icon) {
      color: $text-muted-color;
    }
  }
}
</style>
