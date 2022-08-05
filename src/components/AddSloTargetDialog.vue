<template>
  <q-dialog v-model="show" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">New {{ props.type }}</div>
        <q-input
          ref="nameInput"
          autofocus
          v-model="model.name"
          label="Name"
          :rules="[
            (val) =>
              (!!val && val.trim().length > 0) || 'You need to provide a name',
          ]"
        />
        <q-input v-model="model.deployment" label="Deployment">
          <template #prepend>
            <q-icon name="mdi-kubernetes" color="blue" />
          </template>
        </q-input>
        <q-input
          v-model="model.description"
          label="Description"
          type="textarea"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="cancel" v-close-popup />
        <q-btn label="Add" color="primary" @click="add" :disable="!isValid"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, defineEmits, computed, nextTick } from 'vue';
import { useWorkspaceStore } from '../store';

const props = defineProps({
  modelValue: Boolean,
  type: String,
});
const emit = defineEmits(['update:modelValue']);

const store = useWorkspaceStore();

const nameInput = ref(null);
const model = ref({});
const show = computed({
  get() {
    return props.modelValue;
  },
  set(v) {
    emit('update:modelValue', v);
  },
});
const isValid = computed(() => !nameInput.value?.hasError);
function add() {
  nameInput.value.validate();
  if (isValid.value) {
    store.addTarget({type: props.type, ...model.value});
    show.value = false;
    model.value = {};
  } else {
    nextTick(() => {
      nameInput.value.focus();
    });
  }
}
function cancel() {
  model.value = {};
}
</script>

<style scoped></style>
