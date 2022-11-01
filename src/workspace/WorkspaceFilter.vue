<template>
  <q-card>
    <q-card-actions align="stretch">
      <q-btn-group flat>
        <template v-for="targetType of allTargetTypes" :key="targetType">
          <q-btn
            :icon="targetTypeCheckIcon(targetType)"
            :label="`${targetType}s`"
            no-caps
            @click="toggleTypeFilter(targetType)"
          />
          <q-separator vertical />
        </template>
        <q-btn-dropdown
          label="Filter"
          icon="mdi-filter"
          no-caps
          menu-anchor="bottom start"
          menu-self="top start"
          @hide="clearTargetSearchFilter"
        >
          <q-list>
            <q-item>
              <q-item-section>
                <q-input v-model="targetSearchFilter" dense outlined autofocus clearable>
                  <template #prepend>
                    <q-icon name="mdi-magnify" />
                  </template>
                </q-input>
              </q-item-section>
            </q-item>
            <q-item v-if="targetFilterOptions.length === 0">
              <q-item-section>
                <q-item-label> No Targets found </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-for="target of targetFilterOptions" :key="target.id" clickable @click="toggleSelection(target)">
              <q-item-section side top>
                <q-checkbox :model-value="isTargetSelected(target.id)" @update:model-value="toggleSelection(target)" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ target.name }}</q-item-label>
                <q-item-label caption>{{ target.type }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-btn-group>
      <q-separator vertical class="q-mx-md" v-if="selectedTargets.length > 0" />
      <q-chip
        v-for="selectedTarget of selectedTargets"
        :key="selectedTarget.id"
        :label="selectedTarget.name"
        :icon="selectedTarget.icon"
        removable
        @remove="toggleSelection(selectedTarget)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import componentIcon from '@/workspace/targets/component-icon';
import { workspaceItemTypes } from '@/workspace/constants';
import { useTargetStore } from '@/store/target';

const store = useTargetStore();

const props = defineProps({
  modelValue: Object,
});
const emit = defineEmits(['update:modelValue']);

const allTargetTypes = Object.values(workspaceItemTypes.targets);
const targetTypes = computed({
  get: () => props.modelValue.targetTypes,
  set: (v) => {
    const newFilter = { ...props.modelValue, targetTypes: v };
    emit('update:modelValue', newFilter);
    persistFilter(newFilter);
  },
});

const targetTypeCheckIcon = function (type) {
  return targetTypes.value.includes(type) ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline';
};
function toggleTypeFilter(type) {
  if (targetTypes.value.includes(type)) {
    targetTypes.value = targetTypes.value.filter((x) => x !== type);
  } else {
    targetTypes.value = [...targetTypes.value, type];
  }
}

const mapTarget = (target) => ({
  ...target,
  icon: componentIcon(target),
});

const selectedTargets = computed({
  get: () => props.modelValue.targets.map((x) => mapTarget(store.getSloTarget(x))),
  set(v) {
    const newFilter = { ...props.modelValue, targets: v.map((x) => x.id) };
    emit('update:modelValue', newFilter);
    persistFilter(newFilter);
  },
});
const isTargetSelected = (targetId) => !!selectedTargets.value.find((x) => x.id === targetId);
function toggleSelection(target) {
  if (isTargetSelected(target.id)) {
    selectedTargets.value = selectedTargets.value.filter((x) => x.id !== target.id);
  } else {
    selectedTargets.value = [...selectedTargets.value, target];
  }
}
const targetFilterOptions = computed(() => {
  const filter = targetSearchFilter.value ? targetSearchFilter.value.toLowerCase() : '';
  return store.targets
    .filter((x) => targetTypes.value.includes(x.type) && x.name.toLowerCase().includes(filter))
    .map(mapTarget);
});
const targetSearchFilter = ref('');
function clearTargetSearchFilter() {
  targetSearchFilter.value = '';
}

const localStorageKey = 'workspace-filter';
function persistFilter(filter) {
  localStorage.setItem(localStorageKey, JSON.stringify(filter));
}

onMounted(() => {
  const persistedFilter = localStorage.getItem(localStorageKey);
  if (persistedFilter) {
    emit('update:modelValue', JSON.parse(persistedFilter));
  }
});
</script>

<style scoped></style>
