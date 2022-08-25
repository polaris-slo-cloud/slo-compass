<template>
  <q-btn
    flat
    :icon="props.icon"
    @click="onIconClicked"
    size=".75em"
    :color="color"
    class="btn-icon"
    :class="props.class"
  />
</template>

<script setup>
import { defineEmits } from 'vue';

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: false,
    default: 'grey-9',
  },
  class: {
    type: String,
    required: false,
    default: '',
  },
});
const emit = defineEmits(['click']);

function onIconClicked() {
  emit('click');
}
</script>

<style lang="scss" scoped>
.btn-icon {
  padding: $spaces-xs;
  min-height: 1em !important;
}
</style>
