<template>
  <component
    :is="component"
    v-bind="{ ...props, ...$attrs }"
  />
</template>
<script>
export default {
  //necessary for correct attribute and event binding to inner component
  inheritAttrs: false,
};
</script>
<script setup>
import { computed, defineProps } from 'vue';
import EditSloTarget from './EditSloTargetDialog.vue';

const props = defineProps({
  show: Boolean,
  item: Object,
});

const component = computed(() => {
  switch (props.item?.type?.toLowerCase()) {
    case 'application':
    case 'component':
      return EditSloTarget;
  }
  return 'div';
});
</script>
