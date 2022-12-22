<template>
  <div>
    <div class="text-h3">Polaris Controller</div>
    <q-input
      label="Deployment Name"
      v-model="v$.deploymentName.$model"
      :error="v$.deploymentName.$error"
      error-message="You need to select a name for the controller if you want to define a deployment"
    />
    <q-input
      label="Container Image"
      v-model="v$.containerImage.$model"
      :error="v$.containerImage.$error"
      error-message="You need to select an image for the controller if you want to define a deployment"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { requiredIf } from '@vuelidate/validators';

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

const v$ = useVuelidate(
  {
    deploymentName: {
      requiredIf: requiredIf(containerImage),
    },
    containerImage: {
      requiredIf: requiredIf(deploymentName),
    },
  },
  { deploymentName, containerImage }
);
defineExpose({ v$ });
</script>

<style scoped lang="scss"></style>
