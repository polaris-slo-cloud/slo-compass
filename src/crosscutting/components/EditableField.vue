<template>
  <div>
    <div class="field-label">
      <span>{{ props.label }}</span>
      <IconButton icon="mdi-pencil" class="q-ml-sm" v-if="!isEditing" @click="startEdit" />
      <IconButton icon="mdi-undo" class="q-ml-sm" v-if="valueChanged" @click="resetValue" />
    </div>
    <div v-if="isEditing">
      <slot name="edit" v-bind="scope"></slot>
      <div class="flex justify-end q-mt-xs q-gutter-sm">
        <q-btn outline icon="mdi-close" @click="cancel" />
        <q-btn outline icon="mdi-check" @click="save" />
      </div>
    </div>
    <div v-else>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import _ from 'lodash';
import IconButton from '@/crosscutting/components/IconButton.vue';
const props = defineProps({
  label: String,
  modelValue: [String, Number, Boolean, Array, Object],
  resettable: Boolean,
  oldValue: [String, Number, Boolean, Array, Object],
});
const emit = defineEmits(['update:modelValue']);

const valueChanged = computed(() => props.resettable && !_.isEqual(props.modelValue, props.oldValue));
const isEditing = ref(false);
const editModel = ref(null);
const scope = computed(() => {
  const scope = {};
  Object.defineProperty(scope, 'value', {
    get() {
      return editModel.value;
    },
    set(v) {
      editModel.value = v;
    },
    enumerable: true,
  });
  return scope;
});

function resetValue() {
  emit('update:modelValue', props.oldValue);
}
function cancel() {
  isEditing.value = false;
  editModel.value = null;
}
function save() {
  isEditing.value = false;
  emit('update:modelValue', scope.value.value);
}

function startEdit() {
  editModel.value =
    typeof props.modelValue === 'object' ? JSON.parse(JSON.stringify(props.modelValue)) : props.modelValue;
  isEditing.value = true;
}
</script>
