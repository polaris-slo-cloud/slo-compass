<template>
  <q-input label="Address" v-model="model" />
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
</script>
