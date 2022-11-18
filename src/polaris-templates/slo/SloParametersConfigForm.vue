<template>
  <div>
    <div class="row q-col-gutter-md text-bold">
      <span class="col">Display Name</span>
      <span class="col">Type</span>
      <span class="col">Parameter Key</span>
      <span class="col-1">Required</span>
      <span class="col-1" v-if="!reviewOnly"></span>
    </div>
    <ValidateEach v-for="(config, index) in configParameters" :key="config.id" :state="config" :rules="rules">
      <template #default="{ v }">
        <div class="row q-col-gutter-x-md q-mb-xs">
          <q-input
            outlined
            dense
            class="col"
            v-model="v.displayName.$model"
            :error="v.displayName.$error"
            @blur="v.displayName.$touch"
          >
            <template v-slot:error>
              <span class="text-no-wrap">{{ v.displayName.$errors[0] && v.displayName.$errors[0].$message }}</span>
            </template>
          </q-input>
          <q-select
            outlined
            dense
            class="col"
            v-model="v.type.$model"
            :options="parameterTypes"
            :error="v.type.$error"
            @blur="v.displayName.$touch"
          >
            <template v-slot:error>
              <span class="text-no-wrap">{{ v.type.$errors[0] && v.type.$errors[0].$message }}</span>
            </template>
          </q-select>
          <q-input
            outlined
            dense
            class="col"
            v-model="v.parameter.$model"
            :error="v.parameter.$error"
            @blur="v.parameter.$touch"
          >
            <template v-slot:error>
              <span class="text-no-wrap">{{ v.parameter.$errors[0] && v.parameter.$errors[0].$message }}</span>
            </template>
          </q-input>
          <!-- ".q-field--with-bottom" Adds the same padding as for the q-input and q-select above -->
          <q-checkbox dense class="col-1 q-field--with-bottom" v-model="config.required" />
          <div class="col-1 flex q-field--with-bottom" v-if="!reviewOnly">
            <q-btn icon="mdi-delete" flat color="negative" @click="removeParameter(index)" />
          </div>
        </div>
      </template>
    </ValidateEach>
    <div class="q-mt-lg flex justify-end" v-if="!reviewOnly">
      <q-btn flat icon="mdi-plus" label="Add Config Parameter" no-caps @click="addParameter" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { ValidateEach } from '@vuelidate/components';
import { required, helpers } from '@vuelidate/validators';
import { v4 as uuidV4 } from 'uuid';
import { ParameterType } from '@/polaris-templates/parameters';

const props = defineProps({
  modelValue: Array,
  addEmpty: Boolean,
  reviewOnly: Boolean,
});
const emit = defineEmits(['update:modelValue']);

const configParameters = computed({
  get: () => props.modelValue,
  set(v) {
    emit('update:modelValue', v);
  },
});

const parameterTypes = Object.values(ParameterType);

function removeParameter(index) {
  configParameters.value.splice(index, 1);
}
function addParameter() {
  configParameters.value = [
    ...configParameters.value,
    {
      id: uuidV4(),
      parameter: '',
      displayName: '',
      type: null,
      required: false,
    },
  ];
}

const rules = {
  parameter: {
    required,
    isProperty: helpers.withMessage('Has to be a valid name for a JSON property', helpers.regex(/^[a-z][a-zA-Z0-9]*$/)),
  },
  displayName: { required },
  type: { required },
};

const v$ = useVuelidate();

defineExpose({ v$ });
onMounted(() => {
  if (props.addEmpty) {
    addParameter();
  }
});
</script>

<style scoped lang="scss"></style>
