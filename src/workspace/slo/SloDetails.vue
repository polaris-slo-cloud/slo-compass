<template>
  <div>
    <TargetStatus class="q-mt-lg" :slo="item" />
    <MetricsOverview :slo="item" class="q-mt-lg" />
    <SloConfig :slo="item" class="q-mt-lg" config-item-class="col-12 col-lg-6" />
    <ElasticityStrategyConfig :slo="item" class="q-mt-lg" config-item-class="col-12 col-lg-6" />
    <div class="flex justify-end q-mt-lg q-gutter-x-md" v-if="item.configChanged">
      <q-btn label="Reset" color="negative" outline @click="resetConfiguration" v-if="sloExistsInPolaris" />
      <q-btn label="Apply" color="primary" @click="applyConfiguration" />
    </div>
  </div>
</template>

<script setup>
import MetricsOverview from '@/workspace/slo/MetricsOverview.vue';
import { useSloStore } from '@/store/slo';
import { computed } from 'vue';
import TargetStatus from '@/workspace/slo/TargetStatus.vue';
import SloConfig from '@/workspace/slo/SloConfig.vue';
import ElasticityStrategyConfig from '@/workspace/slo/ElasticityStrategyConfig.vue';

const store = useSloStore();

const props = defineProps({
  item: Object,
});

const sloExistsInPolaris = computed(() => props.item.deployedSloMapping && !props.item.deployedSloMapping.deleted);

function applyConfiguration() {
  store.applySloMapping(props.item.id);
}

function resetConfiguration() {
  store.resetSloMapping(props.item.id);
}
</script>

<style scoped lang="scss">
.old-value {
  text-decoration: line-through;
  color: $text-muted-color;
}
.chip-strike-through-container {
  position: relative;
  .chip-strike-through {
    border-top: 1px solid $text-muted-color;
    position: absolute;
    top: 60%;
    left: 10px;
    right: 10px;
    z-index: 1000;
  }
  .q-chip {
    background: $grey-3;
    color: $text-muted-color;
    :deep(.q-icon) {
      color: $text-muted-color;
    }
  }
}
</style>
