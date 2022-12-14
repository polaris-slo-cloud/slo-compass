<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="width: 80vw; max-width: 80vw">
      <q-card-section>
        <div class="text-h3">New SLO Template</div>
        <q-stepper v-model="step" ref="stepper" color="primary" animated flat header-nav keep-alive>
          <q-step
            :name="1"
            title="General"
            icon="mdi-card-text"
            header-nav
            :done="isDone(1, generalForm?.v$)"
            :error="hasError(1, generalForm?.v$)"
          >
            <SloTemplateGeneralForm v-model="generalModel" ref="generalForm" />
          </q-step>
          <q-step
            :name="2"
            title="Configure Polaris"
            icon="mdi-application-cog"
            caption="Optional"
            :header-nav="maxStep >= 2"
            :done="step > 2"
          >
            <div class="row">
              <EditableField label="Slo Mapping Kind" v-model="polarisConfig.sloMappingKind" class="col-6">
                {{ sloMappingKind }}
                <template #edit="scope">
                  <q-input v-model="scope.value" :shadow-text="sloMappingKind" dense outlined autofocus />
                </template>
              </EditableField>
              <EditableField label="Slo Mapping Kind Plural" v-model="polarisConfig.sloMappingKindPlural" class="col-6">
                {{ sloMappingKindPlural }}
                <template #edit="scope">
                  <q-input dense outlined autofocus v-model="scope.value" :shadow-text="sloMappingKind" />
                </template>
              </EditableField>
            </div>
            <PolarisControllerForm v-model="polarisConfig" ref="polarisConfigForm" class="q-mt-md" />
          </q-step>
          <q-step
            :name="3"
            title="Configure the SLO"
            icon="mdi-wrench"
            :header-nav="maxStep >= 3"
            :done="isDone(3, parametersConfigForm?.v$)"
            :error="hasError(3, parametersConfigForm?.v$)"
          >
            <SloParametersConfigForm v-model="sloConfig" ref="parametersConfigForm" addEmpty />
          </q-step>
          <q-step
            :name="4"
            title="Define Metrics"
            icon="mdi-chart-box"
            caption="Optional"
            :done="step > 4"
            :header-nav="maxStep === 4"
          >
            <SloTemplateMetricsForm v-model="metrics" />
          </q-step>
          <template #navigation>
            <q-stepper-navigation class="flex">
              <q-btn flat label="Cancel" @click="cancel"></q-btn>
              <q-space />
              <q-btn v-if="step > 1" flat color="primary" @click="stepper.previous()" label="Back" />
              <q-btn v-if="step < 4" @click="stepper.next()" color="primary" class="q-ml-md" label="Next" />
              <q-btn
                v-else
                @click="showPublishDialog = true"
                color="primary"
                class="q-ml-md"
                icon="mdi-plus"
                label="Create"
                :disable="v.$invalid"
              />
            </q-stepper-navigation>
          </template>
        </q-stepper>
      </q-card-section>
    </q-card>
    <q-dialog v-model="showPublishDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h3">Publish Template?</div>
        </q-card-section>
        <q-card-section>
          Do you want to publish this SLO template to the Polaris cluster? Other people in the same workspace will be
          able to use this template to define SLOs. Once the first SLO has been created this template will also be
          published automatically.
        </q-card-section>
        <q-card-actions>
          <q-btn label="Cancel" flat color="negative" v-close-popup />
          <q-space />
          <q-btn label="Save Locally" flat @click="create(false)" />
          <q-btn label="Publish" color="primary" @click="create(true)" icon="mdi-cloud-upload" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import SloTemplateGeneralForm from '@/polaris-templates/slo/SloTemplateGeneralForm.vue';
import PolarisControllerForm from '@/polaris-templates/slo/PolarisControllerForm.vue';
import SloParametersConfigForm from '@/polaris-templates/slo/SloParametersConfigForm.vue';
import EditableField from '@/crosscutting/components/EditableField.vue';
import { useVuelidate } from '@vuelidate/core';
import { useTemplateStore } from '@/store/template';
import SloTemplateMetricsForm from '@/polaris-templates/slo/SloTemplateMetricsForm.vue';

const templateStore = useTemplateStore();

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(['update:show', 'created']);

const generalModel = ref({});
const polarisConfig = ref({});
const sloConfig = ref([]);
const metrics = ref([]);

const sloMappingKind = computed(() =>
  polarisConfig.value.sloMappingKind || generalModel.value.name
    ? generalModel.value.name.replaceAll(' ', '') + 'SloMapping'
    : 'SloMapping'
);
const sloMappingKindPlural = computed(
  () =>
    polarisConfig.value.sloMappingKindPlural ||
    (sloMappingKind.value.endsWith('y')
      ? sloMappingKind.value.substring(0, sloMappingKind.value.length - 1) + 'ies'
      : sloMappingKind.value + 's'
    ).toLowerCase()
);

const v = useVuelidate();
const generalForm = ref(null);
const parametersConfigForm = ref(null);

const showDialog = computed({
  get() {
    return props.show;
  },
  set(v) {
    emit('update:show', v);
  },
});

const stepper = ref(null);
const step = ref(1);
const maxStep = ref(1);
watch(step, (v) => (maxStep.value = Math.max(v, maxStep.value)));
watch(step, (newValue, oldValue) => {
  // Mark Errors in this form if we navigate away
  if (newValue !== oldValue && newValue !== 3 && maxStep.value > 3) {
    parametersConfigForm.value.v$.$touch();
  }
});

const isDone = (formStep, validator) => formStep <= maxStep.value && !validator?.$invalid;
const hasError = (formStep, validator) =>
  step.value === formStep ? validator && validator.$dirty && validator.$invalid : validator?.$invalid;

function resetForm() {
  generalModel.value = {};
  polarisConfig.value = {};
  sloConfig.value = [];
  step.value = 1;
  maxStep.value = 1;

  showPublishDialog.value = false;
}

function cancel() {
  resetForm();
  showDialog.value = false;
}

const showPublishDialog = ref(false);

async function create(publish) {
  if (!v.value.$validate()) {
    return;
  }
  const newTemplate = {
    sloMappingKind: sloMappingKind.value,
    sloMappingKindPlural: sloMappingKindPlural.value,
    displayName: generalModel.value.name,
    description: generalModel.value.description,
    controllerName: polarisConfig.value.deploymentName,
    containerImage: polarisConfig.value.containerImage,
    config: sloConfig.value,
    metricTemplates: metrics.value.map((x) => x.id),
    confirmed: true,
  };
  if (publish) {
    await templateStore.createSloTemplate(newTemplate);
  } else {
    templateStore.saveSloTemplate(newTemplate);
  }
  resetForm();
  emit('created', newTemplate);
  showDialog.value = false;
}
</script>

<style lang="scss" scoped>
:deep(.q-stepper__nav) {
  padding: 0 !important;
}
</style>
