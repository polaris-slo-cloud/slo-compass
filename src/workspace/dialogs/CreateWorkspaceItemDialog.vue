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
import AddSloTarget from './AddSloTargetDialog.vue';
import AddSlo from './AddSloDialog.vue';
import AddElasticityStrategy from './AddElasticityStrategyDialog.vue';

const props = defineProps({
  show: Boolean,
  type: String,
  template: Object,
});

const component = computed(() => {
  switch (props.type?.toLowerCase()) {
    case 'application':
    case 'component':
      return AddSloTarget;
    case 'slo':
      return AddSlo;
    case 'elasticitystrategy':
      return AddElasticityStrategy;
  }
  return 'div';
});
</script>
