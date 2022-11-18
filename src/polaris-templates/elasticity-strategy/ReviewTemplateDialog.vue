<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="max-width: 80vw; width: 1200px">
      <q-card-section>
        <div class="text-h3">{{ currentTemplate.displayName }}</div>
      </q-card-section>
      <q-card-section>
        <SloSpecificParametersConfigForm v-model="currentTemplate.sloSpecificConfig" review-only />
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
import SloSpecificParametersConfigForm from '@/polaris-templates/elasticity-strategy/SloSpecificParametersConfigForm.vue';
const templateStore = useTemplateStore();

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['update:show']);

const unconfirmedTemplates = computed(() => templateStore.elasticityStrategyTemplates.filter((x) => !x.confirmed));
const hasMoreToReview = computed(() => unconfirmedTemplates.value.length > 1);
const currentTemplate = ref({});

function openNextTemplate() {
  const nextTemplate = unconfirmedTemplates.value[0];
  if (!nextTemplate) {
    cancel();
    return;
  }

  currentTemplate.value = {
    elasticityStrategyKind: nextTemplate.elasticityStrategyKind,
    sloSpecificConfig: nextTemplate.sloSpecificConfig.map((x) => ({
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
  templateStore.confirmElasticityStrategyTemplate(currentTemplate.value.elasticityStrategyKind, currentTemplate.value.sloSpecificConfig);
  cancel();
}
function confirmTemplateAndNext() {
  templateStore.confirmElasticityStrategyTemplate(currentTemplate.value.elasticityStrategyKind, currentTemplate.value.sloSpecificConfig);
  openNextTemplate();
}
</script>

<style scoped lang="scss"></style>
