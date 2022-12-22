<template>
  <q-dialog v-model="showDialog">
    <q-card class="medium-dialog">
      <q-card-section>
        <div class="text-h3">Resolve missing controller</div>
      </q-card-section>
      <q-card-section>
        <div class="q-mb-sm text-subtitle1">How do you want to resolve the missing controller?</div>
        <q-btn-toggle
          v-model="resolveMethod"
          toggle-color="primary"
          :options="resolveOptions"
          no-caps
          class="q-mb-md"
        />
        <div v-if="resolveWithDeployment">
          <q-input
            label="Deployment Name *"
            v-model="newDeploymentValidator.containerName.$model"
            @blur="newDeploymentValidator.containerName.$touch"
            :error="newDeploymentValidator.containerName.$error"
            error-message="Please select a name for the controller deployment"
          />
          <q-input
            label="Container Image *"
            v-model="newDeploymentValidator.containerImage.$model"
            @blur="newDeploymentValidator.containerImage.$touch"
            :error="newDeploymentValidator.containerImage.$error"
            error-message="Please select the container image for the controller deployment"
          />
        </div>
        <div v-else>
          <DeploymentSelection
            label="Controller Deployment"
            v-model="findDeploymentValidator.selectedControllerDeployment.$model"
            @blur="findDeploymentValidator.selectedControllerDeployment.$touch"
            :error="findDeploymentValidator.selectedControllerDeployment.$error"
            error-message="Please select a controller deployment from the cluster"
          />
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="closeDialog" />
        <q-btn
          v-if="resolveWithDeployment"
          color="primary"
          label="Deploy"
          icon="mdi-rocket-launch"
          :disable="newDeploymentValidator.$invalid"
          @click="createDeployment"
          :loading="isCreatingDeployment"
        />
        <q-btn
          v-else
          color="primary"
          label="Link with Deployment"
          icon="mdi-link-plus"
          :disable="findDeploymentValidator.$invalid"
          @click="linkWithDeployment"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { usePolarisComponentStore } from '@/store/polaris-component';
import DeploymentSelection from '@/orchestrator/DeploymentSelection.vue';

const store = usePolarisComponentStore();

const props = defineProps({
  show: Boolean,
  controller: Object,
});

const emit = defineEmits(['update:show']);

const showDialog = computed({
  get: () => props.show,
  set(v) {
    emit('update:show', v);
  },
});

const resolveMethod = ref('newDeployment');
const resolveOptions = [
  {
    label: 'Deploy Controller',
    value: 'newDeployment',
  },
  {
    label: 'Find Controller Deployment',
    value: 'findDeployment',
  },
];

const resolveWithDeployment = computed(() => resolveMethod.value === 'newDeployment');

const newDeploymentModel = ref({});
const newDeploymentValidator = useVuelidate(
  {
    containerName: {
      required,
    },
    containerImage: {
      required,
    },
  },
  newDeploymentModel
);

watch(
  () => props.controller,
  (c) => {
    if (c?.deploymentInfo) {
      newDeploymentModel.value.containerName = c.deploymentInfo.name;
      newDeploymentModel.value.containerImage = c.deploymentInfo.containerImage;
    }
  },
  { deep: true }
);

const selectedControllerDeployment = ref(null);
const findDeploymentValidator = useVuelidate(
  {
    selectedControllerDeployment: {
      required,
    },
  },
  { selectedControllerDeployment }
);

function closeDialog() {
  resolveMethod.value = 'newDeployment';
  newDeploymentModel.value = {};
  selectedControllerDeployment.value = null;
  showDialog.value = false;
}

const isCreatingDeployment = ref(false);
async function createDeployment() {
  isCreatingDeployment.value = true;
  const deploymentMetadata = {
    name: newDeploymentModel.value.containerName,
    containerImage: newDeploymentModel.value.containerImage,
  };
  await store.createControllerDeployment(props.controller, deploymentMetadata);
  closeDialog();
  isCreatingDeployment.value = false;
}

function linkWithDeployment() {
  const controller = {
    type: props.controller.type,
    handlesKind: props.controller.handlesKind,
  };
  store.linkControllerWithDeployment(controller, selectedControllerDeployment.value);
  closeDialog();
}
</script>

<style scoped lang="scss"></style>
