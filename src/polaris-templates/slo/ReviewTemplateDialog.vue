<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="max-width: 80vw; width: 1200px">
      <q-card-section>
        <div class="text-h3">{{ currentTemplate.displayName }}</div>
      </q-card-section>
      <q-card-section>
        <SloParametersConfigForm v-model="currentTemplate.config" review-only />
        <h3>Metrics</h3>
        <SloTemplateMetricsForm v-model="metrics" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="cancel" />
        <q-btn color="primary" label="Confirm" @click="confirmTemplate" />
        <q-btn v-if="hasMoreToReview" color="primary" label="Confirm and Next" @click="confirmTemplateAndNext" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useTemplateStore } from '@/store/template';
import { v4 as uuidV4 } from 'uuid';
import SloParametersConfigForm from '@/polaris-templates/slo/SloParametersConfigForm.vue';
import SloTemplateMetricsForm from '@/polaris-templates/slo/SloTemplateMetricsForm.vue';
const templateStore = useTemplateStore();

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['update:show']);

const unconfirmedTemplates = computed(() => templateStore.sloTemplates.filter((x) => !x.confirmed));
const hasMoreToReview = computed(() => unconfirmedTemplates.value.length > 1);
const currentTemplate = ref({});

const metrics = computed({
  get: () => currentTemplate.value?.metricTemplates?.map(templateStore.getSloMetricTemplate) ?? [],
  set(v) {
    currentTemplate.value.metricTemplates = v.map((x) => x.id);
  },
});

function openNextTemplate() {
  const nextTemplate = unconfirmedTemplates.value[0];
  if (!nextTemplate) {
    cancel();
    return;
  }

  currentTemplate.value = {
    sloMappingKind: nextTemplate.sloMappingKind,
    config: nextTemplate.config.map((x) => ({
      id: uuidV4(),
      ...x,
    })),
    displayName: nextTemplate.displayName,
  };
}

const showDialog = computed({
  get: () => props.show,
  set(v) {
    emit('update:show', v);
  },
});
watch(showDialog, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    openNextTemplate();
  }
});

function cancel() {
  currentTemplate.value = {};
  showDialog.value = false;
}
function confirmTemplate() {
  templateStore.confirmTemplate(currentTemplate.value.sloMappingKind, currentTemplate.value.config);
  cancel();
}
function confirmTemplateAndNext() {
  templateStore.confirmTemplate(currentTemplate.value.sloMappingKind, currentTemplate.value.config);
  openNextTemplate();
}
</script>

<style scoped lang="scss"></style>
