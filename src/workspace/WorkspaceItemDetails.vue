<template>
  <div>
    <div class="flex justify-between">
      <InlineEdit v-model="name" display-type="h1">
        <template #edit="scope">
          <q-input outlined label="Name" v-model="scope.value" />
        </template>
      </InlineEdit>
      <div class="q-gutter-x-sm">
        <q-btn v-if="itemDetailsLink" icon="mdi-open-in-new" flat color="primary" :to="itemDetailsLink">
          <q-tooltip>Open Details</q-tooltip>
        </q-btn>
        <q-btn v-if="canBeDeleted" @click="confirmDelete = true" icon="mdi-delete" outline color="negative" />
        <q-dialog v-model="confirmDelete" persistent>
          <q-card>
            <q-card-section class="row items-center">
              <q-avatar icon="mdi-delete" color="negative" text-color="white" />
              <span class="q-ml-sm">Are you sure that you want to delete the {{ name }} {{ displayType }}?</span>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Cancel" color="primary" v-close-popup />
              <q-btn label="Delete" color="negative" v-close-popup @click="deleteItem" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>
    </div>
    <div class="text-subtitle1 text-muted">{{ displayType }}</div>
    <WorkspaceItemDetailsBanners :item="item" :display-type="displayType" />
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
import { ref, computed } from 'vue';
import { useWorkspaceStore } from '@/store/workspace';
import { workspaceItemTypes } from '@/workspace/constants';
import EditableField from '@/crosscutting/components/EditableField.vue';
import TargetDetails from '@/workspace/targets/TargetDetails.vue';
import SloDetails from '@/workspace/slo/SloDetails.vue';
import ElasticityStrategyDetails from '@/workspace/elasticity-strategy/ElasticityStrategyDetails.vue';
import WorkspaceItemDetailsBanners from '@/workspace/WorkspaceItemDetailsBanners.vue';

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
const itemDetailsLink = computed(() =>
  item.value?.type === workspaceItemTypes.slo ? { name: 'slo-details', params: { id: props.itemId } } : null
);
const displayType = computed(() =>
  item.value?.type === workspaceItemTypes.elasticityStrategy ? 'Elasticity Strategy' : item.value?.type
);

const confirmDelete = ref(false);
const canBeDeleted = computed(() => item.value?.type === workspaceItemTypes.slo);
async function deleteItem() {
  await store.deleteItem(props.itemId);
}

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
