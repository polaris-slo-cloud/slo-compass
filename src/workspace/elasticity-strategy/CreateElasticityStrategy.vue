<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h3">{{ template.displayName }}</div>
        <q-input
          ref="nameInput"
          autofocus
          v-model="model.name"
          label="Name *"
          :rules="[(val) => (!!val && val.trim().length > 0) || 'You need to provide a name']"
        />
        <q-input v-model="model.description" label="Description" autogrow />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="resetModel" v-close-popup />
        <q-btn label="Save" color="primary" @click="save" :disable="!isValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { getPolarisControllers } from '@/polaris-templates/strategy-template';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';

const store = useElasticityStrategyStore();
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
  name: props.template?.displayName,
  description: props.template?.description,
});
watch(() => props.template, resetModel, { deep: true });
function resetModel() {
  model.value = {
    name: props.template?.displayName,
    description: props.template?.description,
  };
}

const nameInput = ref(null);
const isValid = computed(() => !nameInput.value?.hasError);

function save() {
  nameInput.value.validate();
  if (isValid.value) {
    const strategy = {
      ...model.value,
      type: 'ElasticityStrategy',
      template: props.template.elasticityStrategyKind,
      polarisControllers: getPolarisControllers(props.template),
    };
    store.saveElasticityStrategy(strategy);
    showDialog.value = false;
    resetModel();
  } else {
    nextTick(() => {
      nameInput.value.focus();
    });
  }
}
</script>

<style scoped></style>
