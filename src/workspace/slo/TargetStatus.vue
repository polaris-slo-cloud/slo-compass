<template>
  <div class="flex">
    <EditableField
      label="Target"
      v-model="targetEditModel"
      :oldValue="oldTarget"
      :resettable="sloExistsInPolaris"
    >
      <span v-if="targetChanged" class="chip-strike-through-container">
        <span class="chip-strike-through"></span>
        <q-chip :icon="oldTargetComponentIcon">
          {{ oldTarget.name }}
        </q-chip>
      </span>
      <q-icon v-if="targetChanged" name="mdi-arrow-right-thin" />
      <q-chip v-if="target" :icon="targetComponentIcon">
        {{ target.name }}
      </q-chip>
      <template #edit="scope">
        <TargetSelection v-model="scope.value" />
      </template>
    </EditableField>

    <div v-if="sloExistsInPolaris" class="q-ml-xl">
      <div class="field-label">Status</div>
      <div class="flex items-center q-mt-sm q-pt-xs">
        <q-icon name="mdi-circle" :color="statusColor" class="q-mr-xs" />
        <span v-if="slo.compliance" class="flex">
          <span class="field-item-label q-mr-xs">Compliance:</span>
          {{ slo.compliance }} %
        </span>
        <span v-else class="text-muted text-italic">- No compliance found </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSloStore } from '@/store/slo';
import { useTargetStore } from '@/store/target';
import { getComplianceColor } from '@/workspace/slo/Slo';
import componentIcon from '@/workspace/targets/component-icon';
import EditableField from '@/crosscutting/components/EditableField.vue';
import TargetSelection from '@/workspace/targets/TargetSelection.vue';

const store = useSloStore();
const targetStore = useTargetStore();

const props = defineProps({
  slo: Object,
});

const sloExistsInPolaris = computed(() => props.slo.deployedSloMapping && !props.slo.deployedSloMapping.deleted);
const statusColor = computed(() => getComplianceColor(props.slo));

const target = computed(() => (props.slo.target ? targetStore.getSloTarget(props.slo.target) : null));
const targetComponentIcon = computed(() => (target.value ? componentIcon(target.value) : null));
const targetEditModel = computed({
  get() {
    return target.value;
  },
  set(v) {
    if (v.id !== props.slo.target) {
      store.saveSlo({
        ...props.slo,
        target: v.id,
        configChanged: true,
      });
    }
  },
});
const oldTarget = computed(() =>
  props.slo.deployedSloMapping?.sloMapping?.target
    ? targetStore.findTargetByReference(props.slo.deployedSloMapping.sloMapping.target)
    : null
);
const oldTargetComponentIcon = computed(() => (oldTarget.value ? componentIcon(oldTarget.value) : null));
const targetChanged = computed(() => !!oldTarget?.value && oldTarget.value.id !== target.value?.id);
</script>

<style scoped lang="scss"></style>
