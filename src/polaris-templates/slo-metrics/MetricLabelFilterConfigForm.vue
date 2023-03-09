<template>
  <div>
    <div class="row q-col-gutter-md text-bold">
      <span class="col">Label</span>
      <span class="col">Filter Value</span>
      <span class="col-1"></span>
    </div>
    <ValidateEach v-for="(labelFilter, index) in labelFilters" :key="index" :state="labelFilter" :rules="rules">
      <template #default="{ v }">
        <div class="row q-col-gutter-x-md q-mb-xs">
          <q-input outlined dense class="col" v-model="v.label.$model" :error="v.label.$error" @blur="v.label.$touch">
            <template v-slot:error>
              <span class="text-no-wrap">{{ v.label.$errors[0] && v.label.$errors[0].$message }}</span>
            </template>
          </q-input>
          <q-input
            outlined
            dense
            class="col"
            v-model="v.filterValue.$model"
            :error="v.filterValue.$error"
            @blur="v.filterValue.$touch"
          >
            <template v-slot:error>
              <span class="text-no-wrap">{{ v.filterValue.$errors[0] && v.filterValue.$errors[0].$message }}</span>
            </template>
          </q-input>
          <div class="col-1 flex q-field--with-bottom">
            <q-btn icon="mdi-delete" flat color="negative" @click="removeLabelFilter(index)" />
          </div>
        </div>
      </template>
    </ValidateEach>
    <div class="q-mt-lg flex justify-end">
      <q-btn flat icon="mdi-plus" label="Add Label Filter" no-caps @click="addLabelFilter" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ValidateEach } from '@vuelidate/components';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';

const props = defineProps({
  modelValue: Array,
});
const emit = defineEmits(['update:modelValue']);

const labelFilters = computed({
  get: () => props.modelValue,
  set(v) {
    emit('update:modelValue', v);
  },
});

function removeLabelFilter(index) {
  labelFilters.value.splice(index, 1);
}
function addLabelFilter() {
  labelFilters.value = [
    ...labelFilters.value,
    {
      label: '',
      filterValue: '',
    },
  ];
}

const rules = {
  label: { required },
  filterValue: { required },
};

const v$ = useVuelidate();

defineExpose({ v$ });
</script>

<style scoped lang="scss"></style>
