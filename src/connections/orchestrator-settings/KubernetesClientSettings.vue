<template>
  <q-select v-model="model" :options="contextOptions" label="Context" />
</template>

<script setup>
import { defineEmits, computed } from 'vue';

const props = defineProps({
  modelValue: String,
});
const emit = defineEmits(['update:modelValue']);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

const contextOptions = computed(() => {
  return window.k8sApi ? window.k8sApi.getContexts().map((x) => x.name) : [];
});
</script>
