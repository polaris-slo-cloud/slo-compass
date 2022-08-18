<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h5">{{ template.name }} SLO</div>
        <q-input
          ref="nameInput"
          autofocus
          v-model="model.name"
          label="Name *"
          :rules="[(val) => (!!val && val.trim().length > 0) || 'You need to provide a name']"
        />
        <TargetSelection label="Targets" v-model="model.targets" />
        <q-input v-model="model.description" label="Description" autogrow />
        <div class="text-h6 q-mt-lg q-mb-sm" v-if="template.config.length > 0">Config</div>
        <q-input
          v-for="(config, idx) of template.config"
          :key="config.parameter"
          v-model="model.config[config.parameter]"
          :type="configType(config)"
          :label="configLabel(config)"
          :rules="configRules(config)"
          :ref="el => { optionInputs[idx] = el }"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="cancel" v-close-popup />
        <q-btn label="Save" color="primary" @click="save" :disable="!isValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, defineEmits, nextTick, onMounted, onBeforeUpdate, watch } from 'vue';
import TargetSelection from '@/components/TargetSelection.vue';
import { useWorkspaceStore } from '@/store';
import { ParameterType } from '@/polaris-templates/slo-template';

const store = useWorkspaceStore();
const props = defineProps({
  show: Boolean,
  item: Object,
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

function configType(template) {
  switch (template.type) {
    case ParameterType.Integer:
    case ParameterType.Decimal:
      return 'number';
  }
  return 'text';
}
function configLabel(template) {
  const label = template.displayName;
  return template.optional ? label : `${label} *`;
}
function configRules(template) {
  const rules = [];
  if (!template.optional) {
    rules.push(
      (val) => (val !== undefined && val !== null && val !== '') || 'This parameter is required'
    );
  }
  if (template.type === ParameterType.Integer) {
    rules.push((val) => Math.floor(val) === Number(val) || 'Please provide an integer');
  }
  return rules;
}

const model = ref({
  config: {},
});

const mapStoreComponent = (comp) => ({
  value: comp.id,
  label: comp.name,
  type: comp.type,
});
function updateModel(value) {
  model.value = { ...value };
  if (value.id) {
    model.value.targets = store.getComponents(value.id).map(mapStoreComponent);
  }
  if (!model.value.config) {
    model.value.config = {};
  }
}

watch(() => props.item, updateModel, { deep: true });

const nameInput = ref(null);
const optionInputs = ref([]);
const isValid = computed(
  () => !nameInput.value?.hasError && !optionInputs.value.some((x) => x.hasError)
);
function save() {
  nameInput.value.validate();
  optionInputs.value.forEach((x) => x.validate());
  if (isValid.value) {
    const slo = { ...model.value };
    slo.targets = slo.targets?.map((x) => x.value) || [];
    store.saveSlo(slo);
    showDialog.value = false;
    model.value = {};
  } else {
    nextTick(() => {
      nameInput.value.focus();
    });
  }
}
function cancel() {
  updateModel({});
}
onMounted(() => {
  updateModel(props.item);
});
onBeforeUpdate(() => {
  // Reset optionInput refs before component updates
  optionInputs.value = [];
});
</script>

<style scoped></style>
