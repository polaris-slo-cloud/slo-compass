<template>
  <section>
    <div class="text-h3">Polaris Controller</div>
    <q-input label="Deployment Name" v-model="deploymentName" />
    <q-input label="Container Image" v-model="containerImage" />
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useVuelidate } from '@vuelidate/core';

const props = defineProps({
  modelValue: Object,
});
const emit = defineEmits(['update:modelValue']);

const deploymentName = computed({
  get: () => props.modelValue.deploymentName,
  set(v) {
    emit('update:modelValue', { ...props.modelValue, deploymentName: v });
  },
});

const containerImage = computed({
  get: () => props.modelValue.containerImage,
  set(v) {
    emit('update:modelValue', { ...props.modelValue, containerImage: v });
  },
});

const v$ = useVuelidate({}, { deploymentName, containerImage });
defineExpose({ v$ });
</script>

<style scoped lang="scss"></style>
