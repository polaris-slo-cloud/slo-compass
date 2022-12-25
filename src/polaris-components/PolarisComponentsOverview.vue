<template>
  <div>
    <h3>SLO Controllers</h3>
    <div class="row q-col-gutter-md">
      <div class="col-6 col-md-3 col-lg-2" v-for="controller of sloControllers" :key="controller.handlesKind">
        <q-card class="hover-container" flat bordered>
          <q-card-section>
            <div class="flex no-wrap justify-between items-start">
              <div class="text-h4">{{ controller.name }}</div>
              <IconButton
                icon="mdi-pencil"
                class="show-on-hover"
                @click="startEditSloControllerAssignment(controller)"
              />
            </div>
          </q-card-section>
          <q-card-section>
            <div class="text-right text-muted">{{ controller.handlesDisplayName }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <h3>Composed Metric Controllers</h3>
    <div class="row q-col-gutter-md">
      <div class="col-6 col-md-3 col-lg-2" v-for="controller of metricControllers" :key="controller.handlesKind">
        <q-card class="hover-container" flat bordered>
          <q-card-section>
            <div class="flex no-wrap justify-between items-start">
              <div class="text-h4">{{ controller.name }}</div>
              <IconButton
                icon="mdi-pencil"
                class="show-on-hover"
                @click="startEditMetricControllerAssignment(controller)"
              />
            </div>
          </q-card-section>
          <q-card-section>
            <div class="text-right text-muted">{{ controller.handlesDisplayName }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <h3>Elasticity Strategy Controllers</h3>
    <div class="row q-col-gutter-md">
      <div
        class="col-6 col-md-3 col-lg-2"
        v-for="controller of elasticityStrategyControllers"
        :key="controller.handlesKind"
      >
        <q-card class="hover-container" flat bordered>
          <q-card-section>
            <div class="flex no-wrap justify-between items-start">
              <div class="text-h4">{{ controller.name }}</div>
              <IconButton
                icon="mdi-pencil"
                class="show-on-hover"
                @click="startEditStrategyControllerAssignment(controller)"
              />
            </div>
          </q-card-section>
          <q-card-section>
            <div class="text-right text-muted">{{ controller.handlesDisplayName }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <div v-if="missingControllers.length > 0">
      <h3>Missing Controllers</h3>
      <div class="row q-col-gutter-md">
        <div class="col-6 col-md-3 col-lg-2" v-for="controller of missingControllers" :key="controller.handlesKind">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-h4">{{ controller.handlesDisplayName }}</div>
              <div class="text-muted">{{ controller.type }}</div>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat color="primary" label="Resolve" @click="startResolveMissingController(controller)" />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>
    <q-dialog v-model="showEditControllerAssignmentDialog">
      <q-card class="medium-dialog">
        <q-card-section>
          <div class="text-h3">{{ editControllerAssignmentModel.name }}</div>
        </q-card-section>
        <q-card-section>
          <div>Please select the type of {{ editControllerAssignmentModel.resourceType }} this controller handles.</div>
          <q-select
            label="Handles"
            v-model="editControllerAssignmentModel.handlesKind"
            :options="editControllerAssignmentModel.handlesKindOptions"
            emit-value
            map-options
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="cancelEditControllerAssignment" />
          <q-btn color="primary" label="Save" @click="saveControllerAssignment" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <ResolveMissingControllerDialog
      v-model:show="showResolveMissingControllerDialog"
      :controller="selectedControllerForResolve"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import { usePolarisComponentStore } from '@/store/polaris-component';
import { useTemplateStore } from '@/store/template';
import IconButton from '@/crosscutting/components/IconButton.vue';
import { SloMetricSourceType } from '@/polaris-templates/slo-metrics/metrics-template';
import ResolveMissingControllerDialog from '@/polaris-components/ResolveMissingControllerDialog.vue';
import { PolarisControllerType } from '@/workspace/PolarisComponent';

const templateStore = useTemplateStore();
const elasticityStrategyStore = useElasticityStrategyStore();
const polarisComponentStore = usePolarisComponentStore();

const sloControllers = computed(() =>
  polarisComponentStore.sloControllers.map((controller) => {
    const slo = templateStore.getSloTemplate(controller.handlesKind);
    return {
      ...controller,
      handlesDisplayName: slo.displayName,
      name: controllerName(controller),
    };
  })
);

const metricControllers = computed(() =>
  polarisComponentStore.metricControllers.map((controller) => {
    const metric = templateStore.sloMetricSourceTemplates.find(
      (x) => x.metricsController?.composedMetricKind === controller.handlesKind
    );
    return {
      ...controller,
      handlesDisplayName: metric?.displayName,
      name: controllerName(controller),
    };
  })
);

const elasticityStrategyControllers = computed(() =>
  polarisComponentStore.elasticityStrategyControllers.map((controller) => {
    const elasticityStrategy = elasticityStrategyStore.getElasticityStrategy(controller.handlesKind);
    return {
      ...controller,
      handlesDisplayName: elasticityStrategy.name,
      name: controllerName(controller),
    };
  })
);

const missingControllers = computed(() => {
  const missingSloControllers = templateStore.sloTemplates
    .filter((x) => polarisComponentStore.hasMissingPolarisComponent(x.sloMappingKind))
    .map((x) => ({
      type: PolarisControllerType.Slo,
      handlesKind: x.sloMappingKind,
      handlesDisplayName: x.displayName,
      deploymentInfo: x.sloController,
    }));
  const missingComposedMetricControllers = templateStore.sloMetricSourceTemplates
    .filter(
      (x) =>
        x.type === SloMetricSourceType.Composed &&
        (!x.metricsController ||
          polarisComponentStore.hasMissingPolarisComponent(x.metricsController.composedMetricKind))
    )
    .map((x) => ({
      type: PolarisControllerType.Metric,
      handlesKind: x.metricsController?.composedMetricKind,
      handlesDisplayName: x.displayName,
      deploymentInfo:
        x.metricsController?.controllerName || x.metricsController?.containerImage
          ? {
              name: x.metricsController?.controllerName,
              containerImage: x.metricsController?.containerImage,
            }
          : undefined,
    }));
  const missingElasticityStrategyControllers = elasticityStrategyStore.elasticityStrategies
    .filter((x) => polarisComponentStore.hasMissingPolarisComponent(x.kind))
    .map((x) => ({
      type: PolarisControllerType.ElasticityStrategy,
      handlesKind: x.kind,
      handlesDisplayName: x.name,
      deploymentInfo: x.controllerDeploymentMetadata,
    }));

  return [...missingSloControllers, ...missingComposedMetricControllers, ...missingElasticityStrategyControllers];
});

function controllerName(controller) {
  return controller.deployment?.name;
}

const editControllerAssignmentModel = ref(null);
const showEditControllerAssignmentDialog = computed({
  get: () => editControllerAssignmentModel.value !== null,
  set(v) {
    if (!v) {
      editControllerAssignmentModel.value = null;
    }
  },
});
function cancelEditControllerAssignment() {
  showEditControllerAssignmentDialog.value = false;
}
function saveControllerAssignment() {
  polarisComponentStore.correctControllerAssignment(
    editControllerAssignmentModel.value.oldHandlesKind,
    editControllerAssignmentModel.value.handlesKind
  );
  showEditControllerAssignmentDialog.value = false;
}

function startEditSloControllerAssignment(controller) {
  editControllerAssignmentModel.value = {
    ...controller,
    resourceType: 'SLO',
    handlesKindOptions: templateStore.sloTemplates.map((x) => ({ value: x.sloMappingKind, label: x.displayName })),
    oldHandlesKind: controller.handlesKind,
  };
}
function startEditMetricControllerAssignment(controller) {
  editControllerAssignmentModel.value = {
    ...controller,
    resourceType: 'Composed Metric',
    handlesKindOptions: templateStore.sloMetricSourceTemplates
      .filter((x) => !!x.metricsController)
      .map((x) => ({
        value: x.metricsController.composedMetricKind,
        label: x.displayName,
      })),
    oldHandlesKind: controller.handlesKind,
  };
}
function startEditStrategyControllerAssignment(controller) {
  editControllerAssignmentModel.value = {
    ...controller,
    resourceType: 'Elasticity Strategy',
    handlesKindOptions: elasticityStrategyStore.elasticityStrategies.map((x) => ({ value: x.kind, label: x.name })),
    oldHandlesKind: controller.handlesKind,
  };
}

const selectedControllerForResolve = ref(null);
const showResolveMissingControllerDialog = computed({
  get: () => selectedControllerForResolve.value !== null,
  set(v) {
    if (!v) {
      selectedControllerForResolve.value = null;
    }
  },
});

function startResolveMissingController(controller) {
  selectedControllerForResolve.value = controller;
}
</script>

<style scoped lang="scss"></style>
