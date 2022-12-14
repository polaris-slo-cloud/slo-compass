<template>
  <div>
    <div class="row q-col-gutter-md text-bold">
      <span class="col">Display Name</span>
      <span class="col">Type</span>
      <span class="col">Parameter Key</span>
      <span class="col">Possible Values</span>
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
            @blur="v.type.$touch"
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
            :disable="reviewOnly"
          >
            <template v-slot:error>
              <span class="text-no-wrap">{{ v.parameter.$errors[0] && v.parameter.$errors[0].$message }}</span>
            </template>
          </q-input>
          <!-- ".q-field--with-bottom" Adds the same padding as for the q-input and q-select above -->
          <div v-if="!hasValueOptions(config)" class="col flex q-field--with-bottom justify-center items-center">
            <span v-if="reviewOnly" class="text-weight-bold">All values possible</span>
            <q-btn
              v-else
              label="select possible values"
              no-caps
              flat
              color="primary"
              @click="enableValueOptions(config)"
            />
          </div>
          <div v-else class="col row">
            <q-select
              outlined
              dense
              v-model="v.valueOptions.$model"
              class="col"
              use-input
              use-chips
              multiple
              hide-dropdown-icon
              input-debounce="0"
              new-value-mode="add-unique"
              @new-value="(inputValue, doneFn) => addValueOption(config, inputValue, doneFn)"
              clearable
              @clear="v.valueOptions.$model = []"
              hint="Press Enter to add a new value"
              hide-hint
              :error="v.valueOptions.$error"
              :error-message="v.valueOptions.$errors[0]?.$message"
              :disable="reviewOnly"
            />
            <q-btn
              v-if="!reviewOnly"
              flat
              icon="mdi-delete-forever"
              color="negative"
              @click="disableValueOptions(config)"
              class="col-auto self-end q-ml-xs q-mb-lg"
              padding="xs"
            />
          </div>
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
import { convertToConfigParameterType, ParameterType } from '@/polaris-templates/parameters';

function optionsValidType(value, siblingState) {
  let validator = () => true;
  switch (siblingState.type) {
    case ParameterType.Integer:
      validator = (val) => parseInt(val) === Number(val);
      break;
    case ParameterType.Decimal:
    case ParameterType.Percentage:
      validator = (val) => !isNaN(Number(val));
      break;
  }

  return value.every(validator);
}

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
const hasValueOptions = (configParameter) => Array.isArray(configParameter.valueOptions);

function enableValueOptions(configParameter) {
  configParameter.valueOptions = [];
}

function disableValueOptions(configParameter) {
  delete configParameter.valueOptions;
}

function addValueOption(configParameter, inputValue, doneFn) {
  const converted = convertToConfigParameterType(inputValue, configParameter.type);
  doneFn(converted);
}

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
  valueOptions: {
    validType: helpers.withMessage('All options have to be of the selected type', optionsValidType),
  },
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
