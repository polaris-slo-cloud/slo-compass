<template>
  <div>
    <EditableField
      label="Elasticity Strategy"
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
    <EditableField v-if="elasticityStrategy" label="Config" class="q-mt-md q-ml-md" v-model="configEditModel">
      <div class="row q-col-gutter-md q-mt-none">
        <ConfigItemView
          v-for="configKey of configKeys"
          :key="configKey"
          :class="configItemClass"
          :title="configKey"
          :value="slo.elasticityStrategy.config[configKey]"
          :oldValue="slo.deployedSloMapping?.sloMapping?.elasticityStrategyConfig[configKey]"
          :showConfigChange="sloExistsInPolaris"
          @resetValue="resetElasticityStrategyConfig(configKey)"
        />
      </div>
      <template #edit="scope">
        <div class="row q-col-gutter-md q-mt-none">
          <div v-for="configKey of configKeys" :key="'edit-' + configKey" :class="configItemClass">
            <div class="field-item-label">{{ configKey }}</div>
            <ConfigTemplateInput v-model="scope.value[configKey]" :template="configTemplate[configKey]" />
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
import { useTemplateStore } from '@/store/template';
import { SloHelper } from '@/workspace/slo/SloHelper';
import EditableField from '@/crosscutting/components/EditableField.vue';
import ConfigItemView from '@/workspace/slo/ConfigItemView.vue';
import ConfigTemplateInput from '@/workspace/ConfigTemplateInput.vue';
import ElasticityStrategySelection from '@/workspace/elasticity-strategy/ElasticityStrategySelection.vue';

const store = useSloStore();
const elasticityStrategyStore = useElasticityStrategyStore();
const templateStore = useTemplateStore();
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

const elasticityStrategy = computed({
  get() {
    return props.slo.elasticityStrategy
      ? elasticityStrategyStore.getElasticityStrategy(props.slo.elasticityStrategy.id)
      : null;
  },
  set(v) {
    let config = props.slo.elasticityStrategy?.template === v.template ? props.slo.elasticityStrategy.config : {};
    if (v.id === oldElasticityStrategy.value?.id) {
      config = props.slo.deployedSloMapping.sloMapping.elasticityStrategyConfig;
    }
    const template = templateStore.getElasticityStrategyTemplate(v.template);

    if (v.id !== props.slo.elasticityStrategy?.id) {
      save({
        elasticityStrategy: { id: v.id, kind: template.elasticityStrategyKind, config },
      });
    }
  },
});

const oldElasticityStrategy = computed(() =>
  props.slo.deployedSloMapping?.sloMapping?.elasticityStrategy
    ? elasticityStrategyStore.elasticityStrategies.find(
        (x) => x.template === props.slo.deployedSloMapping.sloMapping.elasticityStrategy.kind
      )
    : null
);
const elasticityStrategyChanged = computed(
  () => !!oldElasticityStrategy.value && oldElasticityStrategy.value.id !== elasticityStrategy.value?.id
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
  const template = templateStore.getElasticityStrategyTemplate(elasticityStrategy.value.template);
  return template
    ? template.sloSpecificConfig.reduce((map, curr) => {
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
        elasticityStrategy: { ...props.slo.elasticityStrategy, config: v },
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
