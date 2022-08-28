<template>
  <q-btn flat no-caps @click="$emit('click')" class="q-px-xs workspace-item">
    <div class="column flex-center">
      <svg width="80" height="40">
        <g>
          <rect
            class="node-rect"
            width="80"
            height="40"
            :fill="fillColor"
            :stroke="strokeColor"
            :stroke-width="2"
            :rx="5"
            :ry="5"
          />
        </g>
      </svg>
      <span>{{ props.title }}</span>
    </div>
  </q-btn>
</template>

<script setup>
import { computed, defineProps } from 'vue';
import { colors } from 'quasar';

const props = defineProps({
  title: String,
  color: String,
});

const fillColor = computed(() => colors.getPaletteColor(props.color));
const strokeColor = computed(() =>
  props.color === 'white' ? colors.getPaletteColor('black') : colors.getPaletteColor(props.color)
);
</script>

<style lang="scss">
.workspace-item .q-btn__content {
  align-items: start;
}
</style>
