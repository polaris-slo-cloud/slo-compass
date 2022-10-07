<template>
  <q-select
    v-model="model"
    :label="label"
    :multiple="multiple"
    :options="options"
    @filter="updateOptionsFilter"
    option-label="name"
    option-value="id"
    use-input
  >
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.name }}</q-item-label>
          <q-item-label caption>{{ scope.opt.type }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template v-slot:selected-item="scope">
      <q-chip
        removable
        dense
        @remove="scope.removeAtIndex(scope.index)"
        :tabindex="scope.tabindex"
        :icon="componentIcon(scope.opt)"
      >
        {{ scope.opt.name }}
      </q-chip>
    </template>
  </q-select>
</template>

<script setup>
import { computed, ref } from 'vue';
import componentIcon from '@/workspace/targets/component-icon';
import { useTargetStore } from '@/store/target';

const store = useTargetStore();
const props = defineProps({
  modelValue: Object,
  label: String,
  hideId: String,
  multiple: Boolean,
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

const options = computed(() => {
  if (store.targets) {
    return store.targets
      .filter((x) => x.id !== props.hideId)
      .filter((x) => x.name.toLowerCase().indexOf(optionsFilter.value) >= 0);
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
