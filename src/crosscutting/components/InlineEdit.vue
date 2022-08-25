<template>
  <div v-if="isEditing">
    <slot name="edit"></slot>
  </div>
  <div v-else class="view-container q-pa-sm" @click="isEditing = true">
    <slot></slot>
    <q-icon name="mdi-pencil" class="edit-icon" size="1rem" />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isEditing = ref(false);
</script>

<style lang="scss" scoped>
.view-container:hover {
  background: $grey-4;
  .edit-icon {
    visibility: visible;
  }
}
.view-container {
  padding: map-get($space-sm, y) map-get($space-sm, x);
  border: 1px solid transparent;
  border-radius: $generic-border-radius;
  position: relative;
}
.edit-icon {
  visibility: hidden;
  position: absolute;
  // Position inside border
  top: -1px;
  right: -1px;
  padding: map-get($space-sm, y) map-get($space-sm, x);
  background: $grey-1;
  opacity: 80%;
}
</style>
