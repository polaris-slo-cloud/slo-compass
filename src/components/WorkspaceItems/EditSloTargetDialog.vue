<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">
          {{ model.id ? 'Edit' : 'New' }} {{ model.type }}
        </div>
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
        <q-select
          v-model="model.components"
          label="Components"
          multiple
          :options="componentOptions"
          @filter="updateComponentOptionsFilter"
          use-input
          use-chips
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
                <q-item-label caption>{{ scope.opt.type }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="cancel" v-close-popup />
        <q-btn label="Save" color="primary" @click="save" :disable="!isValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, defineEmits, computed, nextTick, onMounted } from 'vue';
import { useWorkspaceStore } from '@/store';

const store = useWorkspaceStore();
const props = defineProps({
  show: Boolean,
  item: Object,
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
const mapStoreComponent = (comp) => ({
  value: comp.id,
  label: comp.name,
  type: comp.type,
});
function updateModel(value) {
  model.value = { ...value };
  if (value.id) {
    model.value.components = store
      .getComponents(value.id)
      .map(mapStoreComponent);
  }
}

watch(() => props.item, updateModel, { deep: true });

const componentOptions = computed(() => {
  if (store.workspace.targets) {
    return store.workspace.targets
      .filter((x) => x.id !== model.value.id)
      .filter(
        (x) => x.name.toLowerCase().indexOf(componentOptionsFilter.value) >= 0
      )
      .map(mapStoreComponent);
  }
  return [];
});
const componentOptionsFilter = ref('');
function updateComponentOptionsFilter(val, update) {
  update(() => {
    componentOptionsFilter.value = val.toLowerCase();
  });
}

const nameInput = ref(null);
const isValid = computed(() => !nameInput.value?.hasError);
function save() {
  nameInput.value.validate();
  if (isValid.value) {
    const component = { ...model.value };
    component.components = component.components?.map((x) => x.value) || [];
    store.saveTarget(component);
    showDialog.value = false;
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

onMounted(() => {
  updateModel(props.item);
});
</script>

<style scoped></style>
