<template>
  <q-select
    v-model="selectedElasticityStrategy"
    :label="label"
    :options="filteredOptions"
    option-value="id"
    option-label="name"
    use-input
    @filter="updateOptionsFilter"
  />
</template>

<script setup>
import { computed, ref } from 'vue';
import { useWorkspaceStore } from '@/store';

const store = useWorkspaceStore();

const props = defineProps({
  label: String,
  modelValue: Object,
});
const emit = defineEmits(['update:modelValue']);

const selectedElasticityStrategy = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

const options = computed(() => store.workspace.elasticityStrategies);
const optionsFilter = ref('');
const filteredOptions = computed(() =>
  options.value.filter((x) => x.name.toLowerCase().includes(optionsFilter.value))
);
function updateOptionsFilter(val, update) {
  update(() => {
    optionsFilter.value = val.toLowerCase();
  });
}
</script>

<style scoped></style>
