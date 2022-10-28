<template>
  <div>
    <div class="field-item-label">
      {{ title }}
      <q-btn icon="mdi-undo" flat v-if="valueChanged" @click="resetValue" />
    </div>
    <div>
      <span v-if="valueChanged" class="old-value">{{ formattedOldValue }}</span>
      <q-icon name="mdi-arrow-right-thin" v-if="valueChanged" />
      <span>{{ formattedValue }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: String,
  value: [Number, String],
  oldValue: [Number, String],
});
const emit = defineEmits(['resetValue']);

const formattedValue = computed(() => props.value || '-');
const formattedOldValue = computed(() => props.oldValue || '-');
const valueChanged = computed(() => props.value !== props.oldValue);

function resetValue() {
  emit('resetValue');
}
</script>

<style lang="scss" scoped>
.old-value {
  text-decoration: line-through;
  color: $text-muted-color;
}
</style>
