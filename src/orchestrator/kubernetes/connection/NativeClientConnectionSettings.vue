<template>
  <div>
    <q-select v-model="context" :options="contextOptions" label="Context" />
  </div>
</template>

<script setup>
import {computed, onBeforeMount, ref} from 'vue';

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

const contextOptions = ref([]);

onBeforeMount(async () => {
  if (window.k8sApi) {
    const contexts = await window.k8sApi.getContexts();
    contextOptions.value = contexts.map((x) => x.name);
  }
});
</script>
