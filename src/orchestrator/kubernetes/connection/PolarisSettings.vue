<template>
  <q-input
    label="Polaris Namespace *"
    :rules="[(val) => !!val || 'Polaris namespace is required']"
    v-model="namespace"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: String,
});
const emit = defineEmits(['update:modelValue']);

const namespace = computed({
  get: () => props.modelValue,
  set(v) {
    emit('update:modelValue', v);
  },
});
</script>

<style scoped></style>
