<template>
  <div>
    <EditableField
      label="Elasticity Strategy"
      v-model="elasticityStrategyKind"
      :resettable="sloExistsInPolaris"
      :oldValue="oldElasticityStrategy?.kind"
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
    <EditableField v-if="elasticityStrategy" label="Config" class="q-mt-md q-ml-md" v-model="configEditModel">
      <div class="row q-col-gutter-md q-mt-none">
        <ConfigItemView
          v-for="configKey of configKeys"
          :key="configKey"
          :class="configItemClass"
          :title="configTemplate[configKey].displayName"
          :value="slo.elasticityStrategy.config[configKey]"
          :oldValue="slo.deployedSloMapping?.sloMapping?.elasticityStrategyConfig[configKey]"
          :showConfigChange="sloExistsInPolaris"
          :valuePropertyDisplayNames="knownValuePropertyDisplayNames"
          @resetValue="resetElasticityStrategyConfig(configKey)"
        />
      </div>
      <template #edit="scope">
        <div class="row q-col-gutter-md q-mt-none">
          <div v-for="configKey of configKeys" :key="'edit-' + configKey" :class="configItemClass">
            <div class="field-item-label">{{ configKey }}</div>
            <ElasticityStrategyConfigTemplateInput
              v-model="scope.value[configKey]"
              :template="configTemplate[configKey]"
            />
          </div>
        </div>
      </template>
    </EditableField>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import * as _ from 'lodash';
import { useSloStore } from '@/store/slo';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { SloHelper } from '@/workspace/slo/SloHelper';
import EditableField from '@/crosscutting/components/EditableField.vue';
import ConfigItemView from '@/workspace/slo/ConfigItemView.vue';
import ElasticityStrategySelection from '@/workspace/elasticity-strategy/ElasticityStrategySelection.vue';
import ElasticityStrategyConfigTemplateInput from '@/workspace/slo/ElasticityStrategyConfigTemplateInput.vue';

const store = useSloStore();
const elasticityStrategyStore = useElasticityStrategyStore();
const helper = new SloHelper();

const props = defineProps({
  slo: Object,
  configItemClass: {
    type: String,
    required: false,
    default: () => 'col',
  },
});

function mergeDistinct(...lists) {
  return lists.flatMap((x) => x).filter((val, index, array) => array.indexOf(val) === index);
}

const formatIfEmpty = (value) => value || '-';

const knownValuePropertyDisplayNames = {
  memoryMiB: 'Memory (MiB)',
  milliCpu: 'CPU cores (in milli CPU)',
};

const sloExistsInPolaris = computed(() => props.slo.deployedSloMapping && !props.slo.deployedSloMapping.deleted);

function resetElasticityStrategyConfig(configKey) {
  const update = { ...props.slo };
  update.elasticityStrategy.config[configKey] =
    props.slo.deployedSloMapping?.sloMapping?.elasticityStrategyConfig[configKey];
  const configChanged = helper.sloMappingChanged(update);
  if (!configChanged) {
    update.polarisConflict = null;
  }
  store.saveSlo({
    ...update,
    configChanged,
  });
}

const elasticityStrategyKind = computed({
  get() {
    return props.slo.elasticityStrategy ? props.slo.elasticityStrategy.kind : null;
  },
  set(kind) {
    let config = props.slo.elasticityStrategy?.kind === kind ? props.slo.elasticityStrategy.config : {};
    if (kind === oldElasticityStrategy.value?.kind) {
      config = props.slo.deployedSloMapping.sloMapping.elasticityStrategyConfig;
    }
    if (kind !== props.slo.elasticityStrategy?.kind) {
      save({
        elasticityStrategy: { kind, config },
      });
    }
  },
});

const elasticityStrategy = computed(() =>
  elasticityStrategyKind.value ? elasticityStrategyStore.getElasticityStrategy(elasticityStrategyKind.value) : null
);

const oldElasticityStrategy = computed(() =>
  props.slo.deployedSloMapping?.sloMapping?.elasticityStrategy
    ? elasticityStrategyStore.getElasticityStrategy(props.slo.deployedSloMapping.sloMapping.elasticityStrategy.kind)
    : null
);
const elasticityStrategyChanged = computed(
  () => !!oldElasticityStrategy.value && oldElasticityStrategy.value.kind !== elasticityStrategyKind.value
);
const elasticityStrategyName = computed(() => formatIfEmpty(elasticityStrategy.value?.name));
const configKeys = computed(() => {
  const templateKeys = configTemplate.value ? Object.keys(configTemplate.value) : [];
  const itemConfigKeys = props.slo?.elasticityStrategy?.config ? Object.keys(props.slo.elasticityStrategy.config) : [];

  return mergeDistinct(templateKeys, itemConfigKeys);
});
const configTemplate = computed(() => {
  if (!elasticityStrategy.value) {
    return {};
  }
  return elasticityStrategy.value.sloSpecificConfig
    ? elasticityStrategy.value.sloSpecificConfig.reduce((map, curr) => {
        map[curr.parameter] = curr;
        return map;
      }, {})
    : {};
});
const configEditModel = computed({
  get() {
    return props.slo.elasticityStrategy?.config;
  },
  set(v) {
    if (!_.isEqual(v, props.slo.elasticityStrategy.config)) {
      save({
        elasticityStrategy: { kind: elasticityStrategyKind.value, config: v },
      });
    }
  },
});

function save(changes) {
  store.saveSlo({
    ...props.slo,
    ...changes,
    configChanged: true,
  });
}
</script>

<style scoped lang="scss"></style>
