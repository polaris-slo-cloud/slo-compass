<template>
  <component :is="component" v-bind="{ ...props, ...$attrs }" />
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
import EditSlo from './EditSloDialog.vue';

const props = defineProps({
  show: Boolean,
  item: Object,
  template: Object,
});

const component = computed(() => {
  switch (props.item?.type?.toLowerCase()) {
    case 'application':
    case 'component':
      return EditSloTarget;
    case 'slo':
      return EditSlo;
  }
  return 'div';
});
</script>
