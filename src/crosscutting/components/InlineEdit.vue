<template>
  <div v-if="isEditing">
    <slot name="edit" v-bind="scope"></slot>
    <div class="flex justify-end q-mt-xs q-gutter-sm">
      <q-btn outline icon="mdi-close" @click="cancel" />
      <q-btn outline icon="mdi-check" @click="save" />
    </div>
  </div>
  <component v-else :is="displayType" class="q-ma-none flex items-start no-wrap">
    <span>{{ modelValue }}</span>
    <IconButton icon="mdi-pencil" class="q-ml-sm" @click="startEdit" size=".5em" />
  </component>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: String,
  displayType: {
    type: String,
    required: false,
    default: () => 'div',
  },
});
const emit = defineEmits(['update:modelValue']);

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

function startEdit() {
  editModel.value = props.modelValue;
  isEditing.value = true;
}
function cancel() {
  isEditing.value = false;
  editModel.value = null;
}
function save() {
  isEditing.value = false;
  emit('update:modelValue', scope.value.value);
}
</script>
