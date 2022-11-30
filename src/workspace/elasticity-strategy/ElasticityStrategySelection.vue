<template>
  <q-select
    v-model="selectedElasticityStrategy"
    :label="label"
    :options="filteredOptions"
    emit-value
    map-options
    use-input
    @filter="updateOptionsFilter"
  />
</template>

<script setup>
import { computed, ref } from 'vue';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';

const store = useElasticityStrategyStore();

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

const options = computed(() => store.elasticityStrategies.map((x) => ({ label: x.name, value: x.kind })));
const optionsFilter = ref('');
const filteredOptions = computed(() =>
  options.value.filter((x) => x.label.toLowerCase().includes(optionsFilter.value))
);
function updateOptionsFilter(val, update) {
  update(() => {
    optionsFilter.value = val.toLowerCase();
  });
}
</script>

<style scoped></style>
