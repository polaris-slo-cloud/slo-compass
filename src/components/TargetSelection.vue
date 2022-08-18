<template>
  <q-select
    v-model="model"
    :label="label"
    multiple
    :options="options"
    @filter="updateOptionsFilter"
    use-input
    use-chips
  >
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
          <q-item-label caption>{{ scope.opt.type }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup>
import { computed, ref, defineEmits } from 'vue';
import { useWorkspaceStore } from '@/store';

const store = useWorkspaceStore();
const props = defineProps({
  modelValue: Object,
  label: String,
  hideId: String,
});
const emit = defineEmits(['update:modelValue']);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});

const mapStoreComponent = (comp) => ({
  value: comp.id,
  label: comp.name,
  type: comp.type,
});
const options = computed(() => {
  if (store.workspace.targets) {
    return store.workspace.targets
      .filter((x) => x.id !== props.hideId)
      .filter((x) => x.name.toLowerCase().indexOf(optionsFilter.value) >= 0)
      .map(mapStoreComponent);
  }
  return [];
});
const optionsFilter = ref('');
function updateOptionsFilter(val, update) {
  update(() => {
    optionsFilter.value = val.toLowerCase();
  });
}
</script>

<style scoped></style>
