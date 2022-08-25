<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="width: 700px; max-width: 80vw;">
      <q-card-section>
        <div class="text-h6">{{ model.type }}</div>
        <q-input
          ref="nameInput"
          autofocus
          v-model="model.name"
          @change="nameChanged = true"
          label="Name"
          :rules="[(val) => (!!val && val.trim().length > 0) || 'You need to provide a name']"
        />
        <DeploymentSelection v-model="model.deployment" label="Deployment" />
        <q-input v-model="model.description" label="Description" type="textarea" />
        <TargetSelection v-model="model.components" label="Components" :hideId="model.id" multiple />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="cancel" v-close-popup />
        <q-btn label="Save" color="primary" @click="save" :disable="!isValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, defineEmits, computed, nextTick } from 'vue';
import { useWorkspaceStore } from '@/store';
import TargetSelection from '@/components/TargetSelection.vue';
import DeploymentSelection from '@/workspace/DeploymentSelection.vue';

const store = useWorkspaceStore();

const props = defineProps({
  show: Boolean,
  type: String,
});
const emit = defineEmits(['update:show']);
const showDialog = computed({
  get() {
    return props.show;
  },
  set(v) {
    emit('update:show', v);
  },
});

const model = ref({});
const nameChanged = ref(false);

watch(
  () => model.value.deployment?.name,
  (val) => {
    if (!nameChanged.value) {
      model.value.name = val;
    }
  },
);

const nameInput = ref(null);
const isValid = computed(() => !nameInput.value?.hasError);
function save() {
  nameInput.value.validate();
  if (isValid.value) {
    const component = { ...model.value, type: props.type };
    component.components = component.components?.map((x) => x.value) || [];
    store.saveTarget(component);
    showDialog.value = false;
    model.value = {};
    nameChanged.value = false;
  } else {
    nextTick(() => {
      nameInput.value.focus();
    });
  }
}
function cancel() {
  model.value = {};
  nameChanged.value = false;
}
</script>

<style scoped></style>
