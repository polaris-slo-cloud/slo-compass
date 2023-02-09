<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h3">{{ template.displayName }} SLO</div>
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
        <ElasticityStrategySelection class="q-mt-lg" label="Elasticity Strategy" v-model="elasticityStrategyKind" />
        <div v-if="elasticityStrategy && elasticityStrategy.sloSpecificConfig.length > 0">
          <div class="text-h6 q-mt-lg q-mb-sm">Elasticity Strategy Config</div>
          <ElasticityStrategyConfigTemplateInput
            v-for="config of elasticityStrategy.sloSpecificConfig"
            :key="config.parameter"
            v-model="elasticityStrategyConfig[config.parameter]"
            :template="config"
            ref="elasticityOptionInputs"
          />
        </div>
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
import { useSloStore } from '@/store/slo';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { workspaceItemTypes } from '@/workspace/constants';
import TargetSelection from '@/workspace/targets/TargetSelection.vue';
import ConfigTemplateInput from '@/workspace/slo/ConfigTemplateInput.vue';
import ElasticityStrategySelection from '@/workspace/elasticity-strategy/ElasticityStrategySelection.vue';
import ElasticityStrategyConfigTemplateInput from '@/workspace/slo/ElasticityStrategyConfigTemplateInput.vue';

const store = useSloStore();
const elasticityStrategyStore = useElasticityStrategyStore();

const props = defineProps({
  show: Boolean,
  template: Object,
});

const emit = defineEmits(['update:show', 'created']);
const showDialog = computed({
  get() {
    return props.show;
  },
  set(v) {
    emit('update:show', v);
  },
});
watch(showDialog, (value, oldValue) => {
  if (value && !oldValue) {
    resetModel();
  }
});

const model = ref({
  name: props.template?.displayName,
  description: props.template?.description,
  target: null,
  config: {},
});
const elasticityStrategyKind = ref(null);
const elasticityStrategy = computed(() =>
  elasticityStrategyKind.value ? elasticityStrategyStore.getElasticityStrategy(elasticityStrategyKind.value) : null
);
const elasticityStrategyConfig = ref({});
watch(
  elasticityStrategyKind,
  (value, oldValue) => {
    if (value !== oldValue) {
      elasticityStrategyConfig.value = {};
    }
  },
  { deep: true }
);
function resetModel() {
  elasticityStrategyKind.value = null;
  elasticityStrategyConfig.value = {};
  model.value = {
    name: props.template?.displayName,
    description: props.template?.description,
    target: null,
    config: {},
  };
}

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
      type: workspaceItemTypes.slo,
      kind: props.template.sloMappingKind,
      metrics: props.template.metricTemplates.map((x) => ({
        source: x,
      })),
      configChanged: true,
    };
    slo.target = slo.target?.id;
    if (elasticityStrategyKind.value) {
      slo.elasticityStrategy = {
        kind: elasticityStrategyKind.value,
        config: elasticityStrategyConfig.value,
      };
    }
    const sloId = store.saveSlo(slo);
    showDialog.value = false;
    resetModel();
    emit('created', sloId);
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
