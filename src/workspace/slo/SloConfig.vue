<template>
  <EditableField v-if="slo.config" label="Config" class="q-mt-lg" v-model="configEditModel">
    <div class="row q-col-gutter-md q-mt-none">
      <ConfigItemView
        v-for="configKey of configKeys"
        :key="configKey"
        :class="configItemClass"
        :title="configKey"
        :value="slo.config[configKey]"
        :oldValue="slo.deployedSloMapping?.sloMapping?.config[configKey]"
        :showConfigChange="sloExistsInPolaris"
        @resetValue="resetSloConfig(configKey)"
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
</template>

<script setup>
import { computed } from 'vue';
import * as _ from 'lodash';
import { useSloStore } from '@/store/slo';
import { useTemplateStore } from '@/store/template';
import { SloHelper } from '@/workspace/slo/SloHelper';
import EditableField from '@/crosscutting/components/EditableField.vue';
import ConfigItemView from '@/workspace/slo/ConfigItemView.vue';
import ConfigTemplateInput from '@/workspace/ConfigTemplateInput.vue';

const store = useSloStore();
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
const sloExistsInPolaris = computed(() => props.slo.deployedSloMapping && !props.slo.deployedSloMapping.deleted);

const configKeys = computed(() => {
  const templateKeys = configTemplate.value ? Object.keys(configTemplate.value) : [];
  const itemConfigKeys = props.slo?.config ? Object.keys(props.slo.config) : [];

  return mergeDistinct(templateKeys, itemConfigKeys);
});

const configTemplate = computed(() => {
  const template = templateStore.getSloTemplate(props.slo.template);
  return template
    ? template.config.reduce((map, curr) => {
        map[curr.parameter] = curr;
        return map;
      }, {})
    : {};
});
const configEditModel = computed({
  get() {
    return props.slo.config;
  },
  set(v) {
    if (!_.isEqual(props.slo.config, v)) {
      store.saveSlo({
        ...props.slo,
        config: v,
        configChanged: true,
      });
    }
  },
});

function resetSloConfig(configKey) {
  const update = { ...props.item };
  update.config[configKey] = props.item.deployedSloMapping?.sloMapping?.config[configKey];
  const configChanged = helper.sloMappingChanged(update);
  if (!configChanged) {
    update.polarisConflict = null;
  }
  store.saveSlo({
    ...update,
    configChanged,
  });
}
</script>

<style scoped lang="scss"></style>
