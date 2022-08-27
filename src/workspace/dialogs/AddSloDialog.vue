<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h5">{{ template.name }} SLO</div>
        <q-input
          ref="nameInput"
          autofocus
          v-model="model.name"
          label="Name *"
          :rules="[(val) => (!!val && val.trim().length > 0) || 'You need to provide a name']"
        />
        <TargetSelection label="Targets" v-model="model.targets" multiple />
        <q-input v-model="model.description" label="Description" autogrow />
        <div class="text-h6 q-mt-lg q-mb-sm" v-if="template.config.length > 0">Config</div>
        <ConfigTemplateInput
          v-for="(config, idx) of template.config"
          :key="config.parameter"
          v-model="model.config[config.parameter]"
          :template="config"
          :ref="
            (el) => {
              optionInputs[idx] = el;
            }
          "
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="cancel" v-close-popup />
        <q-btn label="Save" color="primary" @click="save" :disable="!isValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, defineEmits, nextTick, onBeforeUpdate } from 'vue';
import TargetSelection from '@/components/TargetSelection.vue';
import { useWorkspaceStore } from '@/store';
import ConfigTemplateInput from '@/workspace/ConfigTemplateInput.vue';

const store = useWorkspaceStore();
const props = defineProps({
  show: Boolean,
  template: Object,
});

const emit = defineEmits(['update:modelValue', 'update:show']);
const showDialog = computed({
  get() {
    return props.show;
  },
  set(v) {
    emit('update:show', v);
  },
});

const model = ref({
  config: {},
});

const nameInput = ref(null);
const optionInputs = ref([]);
const isValid = computed(
  () => !nameInput.value?.hasError && !optionInputs.value.some((x) => x.hasError)
);
function save() {
  nameInput.value.validate();
  optionInputs.value.forEach((x) => x.validate());
  if (isValid.value) {
    const slo = { ...model.value, type: 'SLO', template: props.template.key };
    slo.targets = slo.targets?.map((x) => x.id) || [];
    store.saveSlo(slo);
    showDialog.value = false;
    model.value = {
      config: {},
    };
  } else {
    nextTick(() => {
      nameInput.value.focus();
    });
  }
}
function cancel() {
  model.value = {
    config: {},
  };
}
onBeforeUpdate(() => {
  // Reset optionInput refs before component updates
  optionInputs.value = [];
});
</script>

<style scoped></style>
