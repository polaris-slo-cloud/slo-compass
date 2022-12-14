<template>
  <q-select
    v-if="isOptionInput"
    v-model="model"
    :label="label"
    :rules="validationRules"
    ref="input"
    :options="modelOptions"
  />
  <q-input
    v-else-if="isNumberInput"
    v-model.number="model"
    type="number"
    :label="label"
    :rules="validationRules"
    ref="input"
  />
  <div v-else-if="isResourcesInput">
    <q-input v-model.number="modelMemoryMiB" type="number" label="Memory (MiB)" />
    <q-input v-model.number="modelMilliCpu" type="number" label="CPU cores (in milli CPU)" />
  </div>
  <q-input v-else v-model="model" type="text" :label="label" :rules="validationRules" ref="input" />
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElasticityStrategyParameterType } from '@/polaris-templates/parameters';

const props = defineProps({
  modelValue: [String, Number],
  template: Object,
  rules: {
    type: Array,
    required: false,
    default: () => [],
  },
});
const emit = defineEmits(['update:modelValue']);

const input = ref(null);
const model = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

const modelMemoryMiB = computed({
  get() {
    return props.modelValue?.memoryMiB;
  },
  set(v) {
    emit('update:modelValue', { ...props.modelValue, memoryMiB: v });
  },
});

const modelMilliCpu = computed({
  get() {
    return props.modelValue?.milliCpu;
  },
  set(v) {
    emit('update:modelValue', { ...props.modelValue, milliCpu: v });
  },
});

const isNumberInput = computed(() => {
  switch (props.template.type) {
    case ElasticityStrategyParameterType.Integer:
    case ElasticityStrategyParameterType.Decimal:
    case ElasticityStrategyParameterType.Percentage:
      return true;
  }
  return false;
});
const isResourcesInput = computed(() => props.template.type === ElasticityStrategyParameterType.Resources);

const modelOptions = computed(() => props.template.valueOptions);
const isOptionInput = computed(() => !!modelOptions.value);
const label = computed(() => {
  let label = props.template.displayName;
  if (props.template.type === ElasticityStrategyParameterType.Percentage) {
    label += ' (%)';
  }
  return props.template.required ? `${label} *` : label;
});
const validationRules = computed(() => {
  const rules = [...props.rules];
  if (props.template.required) {
    rules.push((val) => (val !== undefined && val !== null && val !== '') || 'This parameter is required');
  }
  if (props.template.type === ElasticityStrategyParameterType.Integer) {
    rules.push((val) => !val || Math.floor(val) === Number(val) || 'Please provide an integer');
  }
  return rules;
});

function validate() {
  input.value.validate();
}
const hasError = computed(() => input.value?.hasError);

defineExpose({
  validate,
  hasError,
});
</script>

<style scoped></style>
