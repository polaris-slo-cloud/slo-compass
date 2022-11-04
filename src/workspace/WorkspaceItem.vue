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
            :stroke-dasharray="strokeDashArray"
            :rx="5"
            :ry="5"
          />
          <path v-if="isCustom" d="M 30 19 h 20 v 2 H 30 V 19 M 39 10 h 2 v 20 H 39 V 20" />
        </g>
      </svg>
      <span>{{ props.title }}</span>
    </div>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue';
import { colors } from 'quasar';

const props = defineProps({
  title: String,
  color: String,
  isCustom: Boolean,
});

const fillColor = computed(() =>
  props.isCustom ? colors.getPaletteColor('white') : colors.getPaletteColor(props.color)
);
const strokeColor = computed(() =>
  props.color === 'white' || props.isCustom ? colors.getPaletteColor('black') : colors.getPaletteColor(props.color)
);
const strokeDashArray = computed(() => (props.isCustom ? '5,5' : undefined));
</script>

<style lang="scss">
.workspace-item .q-btn__content {
  align-items: start;
}
</style>
