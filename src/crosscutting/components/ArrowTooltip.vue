<script setup>
import { computed } from 'vue';
const props = defineProps({
  direction: {
    type: String,
    default: 'bottom',
  },
});

const arrowDirectionClass = computed(() => {
  const validDirections = ['bottom', 'top', 'left', 'right'];
  let arrowDirection = props.direction.toLowerCase();
  if (!validDirections.includes(arrowDirection)) {
    arrowDirection = 'bottom';
  }

  return `tooltip-arrow-${arrowDirection}`;
});
</script>
<template>
  <q-tooltip
    @update:model-value="$emit('update:model-value', $event)"
    class="tooltip-arrow"
    :class="arrowDirectionClass"
  >
    <div class="tooltip-inner">
      <slot></slot>
    </div>
  </q-tooltip>
</template>
<style lang="scss">
$arrow-size: 8px;

.tooltip-arrow {
  background: unset !important;
  padding: 0 !important;
  overflow-y: unset !important;
  overflow-x: unset !important;
  .tooltip-inner {
    background: $tooltip-background;
    color: $tooltip-color;
    border-radius: $tooltip-border-radius;
    padding: $tooltip-padding;
    overflow-y: visible;
    overflow-x: visible;
    position: relative;
  }
  .tooltip-inner:after {
    border: solid transparent;
    content: '';
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
    border-width: $arrow-size;
  }

  &-top > .tooltip-inner:after {
    bottom: 100%;
    left: 50%;
    border-bottom-color: $tooltip-background;
    margin-left: -$arrow-size;
  }

  &-right > .tooltip-inner:after {
    left: 100%;
    top: 50%;
    border-left-color: $tooltip-background;
    margin-top: -$arrow-size;
  }
  &-bottom > .tooltip-inner:after {
    top: 100%;
    left: 50%;
    border-top-color: $tooltip-background;
    margin-left: -$arrow-size;
  }
  &-left > .tooltip-inner:after {
    right: 100%;
    top: 50%;
    border-right-color: $tooltip-background;
    margin-top: -$arrow-size;
  }
}
</style>
