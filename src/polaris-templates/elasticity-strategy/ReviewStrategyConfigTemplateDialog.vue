<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="max-width: 80vw; width: 1200px">
      <q-card-section>
        <div class="text-h3">{{ currentElasticityStrategy.name }}</div>
      </q-card-section>
      <q-card-section>
        <SloSpecificParametersConfigForm v-model="currentElasticityStrategy.sloSpecificConfig" review-only />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="cancel" />
        <q-btn color="primary" label="Confirm" @click="confirm" />
        <q-btn v-if="hasMoreToReview" color="primary" label="Confirm and Next" @click="confirmAndNext" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { v4 as uuidV4 } from 'uuid';
import SloSpecificParametersConfigForm from '@/polaris-templates/elasticity-strategy/SloSpecificParametersConfigForm.vue';

const store = useElasticityStrategyStore();

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['update:show']);

const unconfirmedElasticityStrategies = computed(() => store.elasticityStrategies.filter((x) => !x.confirmed));
const hasMoreToReview = computed(() => unconfirmedElasticityStrategies.value.length > 1);
const currentElasticityStrategy = ref({});

function openNext() {
  const nextElasticityStrategy = unconfirmedElasticityStrategies.value[0];
  if (!nextElasticityStrategy) {
    cancel();
    return;
  }

  currentElasticityStrategy.value = {
    kind: nextElasticityStrategy.kind,
    sloSpecificConfig: nextElasticityStrategy.sloSpecificConfig.map((x) => ({
      id: uuidV4(),
      ...x,
    })),
    name: nextElasticityStrategy.name,
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
    openNext();
  }
});

function cancel() {
  currentElasticityStrategy.value = {};
  showDialog.value = false;
}
function confirm() {
  store.confirmElasticityStrategy(
    currentElasticityStrategy.value.kind,
    currentElasticityStrategy.value.sloSpecificConfig
  );
  cancel();
}
function confirmAndNext() {
  store.confirmElasticityStrategy(
    currentElasticityStrategy.value.kind,
    currentElasticityStrategy.value.sloSpecificConfig
  );
  openNext();
}
</script>

<style scoped lang="scss"></style>
