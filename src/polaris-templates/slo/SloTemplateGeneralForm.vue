<template>
  <div>
    <q-input
      label="Name*"
      v-model="v$.name.$model"
      autofocus
      :error="v$.name.$error"
      error-message="The SLO template requires a name"
      @blur="v$.name.$touch"
    />
    <q-input label="Description" type="textarea" v-model="description" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';

const props = defineProps({
  modelValue: Object,
});
const emit = defineEmits(['update:modelValue']);

const name = computed({
  get: () => props.modelValue.name,
  set(v) {
    emit('update:modelValue', { ...props.modelValue, name: v });
  },
});
const description = computed({
  get: () => props.modelValue.description,
  set(v) {
    emit('update:modelValue', { ...props.modelValue, description: v });
  },
});

const v$ = useVuelidate(
  {
    name: { required },
  },
  { name, description }
);

defineExpose({
  v$,
});
</script>

<style scoped lang="scss"></style>
