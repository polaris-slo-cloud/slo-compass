<template>
  <q-input v-model="directory">
    <template #append>
      <q-btn icon="mdi-folder" flat @click="chooseDirectory" />
    </template>
  </q-input>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: String,
});
const emit = defineEmits(['update:modelValue']);

const directory = computed({
  get: () => props.modelValue,
  set(v) {
    emit('update:modelValue', v);
  },
});

async function chooseDirectory() {
  if (window.filesApi) {
    directory.value = await window.filesApi.chooseDirectory();
  }
}
</script>

<style scoped>

</style>
