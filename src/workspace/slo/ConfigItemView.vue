<template>
  <div>
    <div class="field-item-label">
      {{ title }}
      <q-btn icon="mdi-undo" flat v-if="valueChanged" @click="resetValue" />
    </div>
    <div v-if="isObjectValue" class="q-ml-sm">
      <div v-for="key of Object.keys(value)" :key="key">
        <span class="field-item-sub-label">{{ propertyDisplayName(key) }}</span>
        <div>
          <span class="old-value" v-if="valuePropertyChanged(key)">{{ formattedOldValueProperty(key) }}</span>
          <q-icon name="mdi-arrow-right-thin" v-if="valuePropertyChanged(key)" />
          <span>{{ formattedValueProperty(key) }}</span>
        </div>
      </div>
    </div>
    <div v-else>
      <span class="old-value" v-if="valueChanged">{{ formattedOldValue }}</span>
      <q-icon name="mdi-arrow-right-thin" v-if="valueChanged" />
      <span>{{ formattedValue }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import * as _ from 'lodash';

const props = defineProps({
  title: String,
  value: [Number, String, Object],
  oldValue: [Number, String, Object],
  showConfigChange: Boolean,
  valuePropertyDisplayNames: Object,
});
const emit = defineEmits(['resetValue']);

const formattedValue = computed(() => props.value || '-');
const formattedOldValue = computed(() => props.oldValue || '-');
const valueChanged = computed(() => props.showConfigChange && props.value !== props.oldValue);

const isObjectValue = computed(() => _.isObject(props.value) || _.isObject(props.oldValue));
const propertyDisplayName = (key) => props.valuePropertyDisplayNames[key] ?? key;
function valuePropertyChanged(key) {
  const val = props.value ?? {};
  const oldVal = props.oldValue ?? {};
  return props.showConfigChange && val[key] !== oldVal[key];
}
const formattedValueProperty = (key) => (props.value && props.value[key]) || '-';
const formattedOldValueProperty = (key) => (props.oldValue && props.oldValue[key]) || '-';

function resetValue() {
  emit('resetValue');
}
</script>

<style lang="scss" scoped>
.old-value {
  text-decoration: line-through;
  color: $text-muted-color;
}
.field-item-sub-label {
  font-weight: 600;
  font-size: 0.9em;
  color: $text-sub-label-color;
}
</style>
