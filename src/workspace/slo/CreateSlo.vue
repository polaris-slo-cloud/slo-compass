<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h3">{{ template.name }} SLO</div>
        <q-input
          ref="nameInput"
          autofocus
          v-model="model.name"
          label="Name *"
          :rules="[(val) => (!!val && val.trim().length > 0) || 'You need to provide a name']"
        />
        <TargetSelection label="Target" v-model="model.target" />
        <q-input v-model="model.description" label="Description" autogrow />
        <div class="text-h6 q-mt-lg q-mb-sm" v-if="template.config.length > 0">Config</div>
        <ConfigTemplateInput
          v-for="config of template.config"
          :key="config.parameter"
          v-model="model.config[config.parameter]"
          :template="config"
          ref="optionInputs"
        />
        <ElasticityStrategySelection
          class="q-mt-lg"
          label="Elasticity Strategy"
          v-model="elasticityStrategy"
        />
        <div
          class="text-h6 q-mt-lg q-mb-sm"
          v-if="elasticityStrategy && elasticityStrategyTemplate.sloSpecificConfig.length > 0"
        >
          Elasticity Strategy Config
        </div>
        <ConfigTemplateInput
          v-for="config of elasticityStrategyTemplate.sloSpecificConfig"
          :key="config.parameter"
          v-model="elasticityStrategyConfig[config.parameter]"
          :template="config"
          ref="elasticityOptionInputs"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="resetModel" v-close-popup />
        <q-btn label="Save" color="primary" @click="save" :disable="!isValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUpdate, watch } from 'vue';
import { useWorkspaceStore } from '@/store';
import { getTemplate as getElasticityStrategyTemplate } from '@/polaris-templates/strategy-template';
import { getPolarisControllers } from '@/polaris-templates/slo-template';
import TargetSelection from '@/workspace/targets/TargetSelection.vue';
import ConfigTemplateInput from '@/workspace/ConfigTemplateInput.vue';
import ElasticityStrategySelection from '@/workspace/elasticity-strategy/ElasticityStrategySelection.vue';

const store = useWorkspaceStore();
const props = defineProps({
  show: Boolean,
  template: Object,
});

const emit = defineEmits(['update:modelValue', 'update:show']);
const showDialog = computed({
  get() {
    return props.show;
  },
  set(v) {
    emit('update:show', v);
  },
});

const model = ref({
  name: props.template?.name,
  description: props.template?.description,
  target: null,
  config: {},
});
const elasticityStrategy = ref(null);
const elasticityStrategyConfig = ref({});
watch(
  elasticityStrategy,
  (value, oldValue) => {
    if (value?.template !== oldValue?.template) {
      elasticityStrategyConfig.value = {};
    }
  },
  { deep: true }
);
function resetModel() {
  elasticityStrategy.value = null;
  elasticityStrategyConfig.value = {};
  model.value = {
    name: props.template?.name,
    description: props.template?.description,
    target: null,
    config: {},
  };
}

const elasticityStrategyTemplate = computed(() =>
  elasticityStrategy.value ? getElasticityStrategyTemplate(elasticityStrategy.value.template) : {}
);

const nameInput = ref(null);
const optionInputs = ref([]);
const elasticityOptionInputs = ref([]);
const isValid = computed(
  () =>
    !nameInput.value?.hasError &&
    !optionInputs.value.some((x) => x.hasError) &&
    !elasticityOptionInputs.value.some((x) => x.hasError)
);

function save() {
  nameInput.value.validate();
  optionInputs.value.forEach((x) => x.validate());
  elasticityOptionInputs.value.forEach((x) => x.validate());
  if (isValid.value) {
    const slo = {
      ...model.value,
      type: 'SLO',
      template: props.template.key,
      polarisControllers: getPolarisControllers(props.template),
      configChanged: false,
    };
    slo.target = slo.target?.id;
    if (elasticityStrategy.value) {
      slo.elasticityStrategy = {
        id: elasticityStrategy.value.id,
        kind: elasticityStrategyTemplate.value.kind,
        config: elasticityStrategyConfig.value,
      };
    }
    store.saveSlo(slo);
    showDialog.value = false;
    resetModel();
  } else {
    nextTick(() => {
      nameInput.value.focus();
    });
  }
}

onBeforeUpdate(() => {
  // Reset optionInput refs before component updates
  optionInputs.value = [];
  elasticityOptionInputs.value = [];
});
</script>

<style scoped></style>
