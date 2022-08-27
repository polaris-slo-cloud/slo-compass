<template>
  <div>
    <q-input label="Address" v-model="url" />
    <q-input label="Polaris Namespace" v-model="polarisNamespace" />
  </div>
</template>

<script setup>
import { defineEmits, computed } from 'vue';

const props = defineProps({
  modelValue: Object,
});
const emit = defineEmits(['update:modelValue']);

const url = computed({
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
</script>
