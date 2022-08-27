<template>
  <div>
    <q-select v-model="context" :options="contextOptions" label="Context" />
    <q-input label="Polaris Namespace" v-model="polarisNamespace" />
  </div>
</template>

<script setup>
import { defineEmits, computed } from 'vue';

const props = defineProps({
  modelValue: Object,
});
const emit = defineEmits(['update:modelValue']);

const context = computed({
  get() {
    return props.modelValue?.connectionString;
  },
  set(v) {
    emit('update:modelValue', { ...props.modelValue, connectionString: v });
  },
});

const polarisNamespace = computed({
  get() {
    return props.modelValue?.polarisNamespace;
  },
  set(v) {
    emit('update:modelValue', { ...props.modelValue, polarisNamespace: v });
  },
});

const contextOptions = computed(() => {
  return window.k8sApi ? window.k8sApi.getContexts().map((x) => x.name) : [];
});
</script>
