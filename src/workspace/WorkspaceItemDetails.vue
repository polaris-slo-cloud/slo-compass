<template>
  <div>
    <InlineEdit v-model="name" display-type="h1">
      <template #edit="scope">
        <q-input outlined label="Name" v-model="scope.value" />
      </template>
    </InlineEdit>
    <div class="text-subtitle1 text-muted">{{ displayType }}</div>
    <EditableField label="Description" class="q-mt-lg" v-model="description">
      {{ formatIfEmpty(description) }}
      <template #edit="scope">
        <q-input outlined type="textarea" v-model="scope.value" />
      </template>
    </EditableField>
    <component :is="detailsComponent" :item="item" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useWorkspaceStore } from '@/store';
import { workspaceItemTypes } from '@/workspace/constants';
import EditableField from '@/workspace/EditableField.vue';
import TargetDetails from '@/workspace/targets/TargetDetails.vue';
import SloDetails from '@/workspace/slo/SloDetails.vue';
import ElasticityStrategyDetails from '@/workspace/elasticity-strategy/ElasticityStrategyDetails.vue';

const store = useWorkspaceStore();

const props = defineProps({
  itemId: String,
});

const item = computed(() => store.getItem(props.itemId));
const name = computed({
  get() {
    return item.value?.name;
  },
  set(v) {
    store.save({ ...item.value, name: v });
  },
});
const displayType = computed(() =>
  item.value?.type === workspaceItemTypes.elasticityStrategy
    ? 'Elasticity Strategy'
    : item.value?.type
);

const description = computed({
  get() {
    return item.value.description;
  },
  set(v) {
    store.save({ ...item.value, description: v });
  },
});

const formatIfEmpty = (value) => value || '-';

const detailsComponent = computed(() => {
  switch (item.value?.type) {
    case workspaceItemTypes.targets.application:
    case workspaceItemTypes.targets.component:
      return TargetDetails;
    case workspaceItemTypes.slo:
      return SloDetails;
    case workspaceItemTypes.elasticityStrategy:
      return ElasticityStrategyDetails;
  }
  return 'div';
});
</script>

<style lang="scss" scoped>
.config-label {
  font-weight: 600;
  font-size: 1em;
  color: $text-label-color;
  display: flex;
  align-items: center;
}
</style>
