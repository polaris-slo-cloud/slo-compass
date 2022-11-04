<template>
  <q-input
    v-if="isNumberInput"
    v-model.number="model"
    type="number"
    :label="label"
    :rules="validationRules"
    ref="input"
  />
  <q-input v-else v-model="model" type="text" :label="label" :rules="validationRules" ref="input" />
</template>

<script setup>
import { ref, computed } from 'vue';
import { ParameterType } from '@/polaris-templates/parameters';

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
const isNumberInput = computed(() => {
  switch (props.template.type) {
    case ParameterType.Integer:
    case ParameterType.Decimal:
    case ParameterType.Percentage:
      return true;
  }
  return false;
});
const label = computed(() => {
  let label = props.template.displayName;
  if (props.template.type === ParameterType.Percentage) {
    label += ' (%)';
  }
  return props.template.optional ? label : `${label} *`;
});
const validationRules = computed(() => {
  const rules = [...props.rules];
  if (props.template.required) {
    rules.push((val) => (val !== undefined && val !== null && val !== '') || 'This parameter is required');
  }
  if (props.template.type === ParameterType.Integer) {
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
