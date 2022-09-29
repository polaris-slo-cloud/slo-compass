<template>
  <div>
    <div class="flex items-center">
      <q-select
        v-model="provider"
        label="Metrics Provider"
        option-value="id"
        option-label="name"
        :options="providers"
        class="col-grow"
      />
      <q-btn
        flat
        label="New"
        icon="mdi-plus"
        class="q-ml-md"
        @click="showAddMetricsProviderDialog = true"
      />
    </div>
    <AddMetricsProviderDialog v-model:show="showAddMetricsProviderDialog" @added="providerAdded" />
  </div>
</template>

<script setup>
import AddMetricsProviderDialog from '@/connections/AddMetricsProviderDialog.vue';
import {computed, onMounted, ref} from 'vue';
import {metricsProviderStorage} from "@/connections/storage";

const props = defineProps({
  modelValue: Object,
});
const emit = defineEmits(['update:modelValue']);

const provider = computed({
  get: () => props.modelValue,
  set(v) {
    emit('update:modelValue', v);
  },
});
const providers = ref([]);

const showAddMetricsProviderDialog = ref(false);
function providerAdded(conn) {
  providers.value = metricsProviderStorage.getConnectionSettings();
  provider.value = conn;
}

onMounted(() => {
  providers.value = metricsProviderStorage.getConnectionSettings();
});
</script>
