<template>
  <q-select
    v-model="selectedDeployment"
    :label="label"
    :options="filteredOptions"
    option-value="id"
    option-label="name"
    use-input
    @filter="updateOptionsFilter"
    :readonly="!orchestratorConnected"
  >
    <template #prepend v-if="orchestratorConnected">
      <q-icon v-bind="orchestratorIcon" />
    </template>
    <q-tooltip v-if="!orchestratorConnected" class="bg-red text-body2">
      <q-icon name="mdi-alert-circle" />
      Please connect to an orchestrator in order to select a Deployment!
    </q-tooltip>
  </q-select>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';
import orchestratorIconMap from '@/orchestrator/orchestrator-icon-map';

const orchestratorApi = useOrchestratorApi();

const props = defineProps({
  modelValue: Object,
  label: String,
});
const emit = defineEmits(['update:modelValue']);

const selectedDeployment = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

const orchestratorConnected = ref(false);
const orchestratorIcon = computed(() => orchestratorIconMap[orchestratorApi.orchestratorName.value]);
const options = ref([]);
const optionsFilter = ref('');
const filteredOptions = computed(() => options.value.filter((x) => x.name.toLowerCase().includes(optionsFilter.value)));
function updateOptionsFilter(val, update) {
  update(() => {
    optionsFilter.value = val.toLowerCase();
  });
}

async function updateOrchestratorSettings() {
  orchestratorConnected.value = await orchestratorApi.test();
  if (orchestratorConnected.value) {
    options.value = await orchestratorApi.findDeployments();
  }
}
onMounted(updateOrchestratorSettings);
watch(() => orchestratorApi.orchestratorName.value, updateOrchestratorSettings);
</script>

<style scoped></style>
