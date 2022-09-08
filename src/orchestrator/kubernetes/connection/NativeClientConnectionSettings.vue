<template>
  <div>
    <q-select v-model="context" :options="contextOptions" label="Context" />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: Object,
});
const emit = defineEmits(['update:modelValue']);

const context = computed({
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
