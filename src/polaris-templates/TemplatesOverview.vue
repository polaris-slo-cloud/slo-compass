<template>
  <div>
    <div class="flex items-baseline">
      <h3 class="q-mt-none q-mr-md">SLO Templates</h3>
      <q-btn label="New" icon="mdi-plus" outline color="primary" @click="showCreateSloTemplate = true" />
      <CreateSloTemplateDialog v-model:show="showCreateSloTemplate" />
    </div>
    <div class="row q-col-gutter-md">
      <div class="col-6 col-md-3 col-lg-2" v-for="template of sloTemplates" :key="template.sloMappingKind">
        <q-card @click="openSloTemplate(template)" class="cursor-pointer" flat bordered>
          <q-card-section>
            <span class="text-h4">{{ template.displayName }}</span>
            <div class="flex items-center">
              <q-icon name="mdi-circle" :color="sloTemplateStatusColor(template)" />
              <span :class="`text-${sloTemplateStatusColor(template)}`" class="q-ml-xs">
                {{ templateHasBeenDeployed(template) ? 'Published' : 'Local' }}
              </span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <div class="flex items-baseline">
      <h3 class="q-mr-md">SLO Metrics Templates</h3>
      <q-btn label="New" icon="mdi-plus" outline color="primary" @click="showCreateSloMetricSourceTemplate = true" />
      <CreateSloMetricTemplateDialog v-model:show="showCreateSloMetricSourceTemplate" />
    </div>
    <div class="row q-col-gutter-md">
      <div class="col-6 col-md-3 col-lg-2" v-for="template of sloMetricSourceTemplates" :key="template.id">
        <q-card @click="openSloMetricSourceTemplate(template)" class="cursor-pointer" flat bordered>
          <q-card-section>
            <div class="text-h4">{{ template.displayName }}</div>
            <div class="text-muted">{{ template.type }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <h3>Elasticity Strategies</h3>
    <div class="row q-col-gutter-md">
      <div class="col-6 col-md-3 col-lg-2" v-for="strategy of elasticityStrategies" :key="strategy.kind">
        <q-card class="cursor-pointer" @click="openElasticityStrategy(strategy)" flat bordered>
          <q-card-section>
            <div class="text-h4">{{ strategy.name }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useTemplateStore } from '@/store/template';
import { usePolarisComponentStore } from '@/store/polaris-component';
import { useElasticityStrategyStore } from '@/store/elasticity-strategy';
import CreateSloTemplateDialog from '@/polaris-templates/slo/CreateSloTemplateDialog.vue';
import CreateSloMetricTemplateDialog from '@/polaris-templates/slo-metrics/CreateSloMetricTemplateDialog.vue';

const router = useRouter();

const store = useTemplateStore();
const polarisComponentStore = usePolarisComponentStore();
const elasticityStrategyStore = useElasticityStrategyStore();

const { sloTemplates, sloMetricSourceTemplates } = storeToRefs(store);
const { elasticityStrategies } = storeToRefs(elasticityStrategyStore);

const showCreateSloTemplate = ref(false);
const showCreateSloMetricSourceTemplate = ref(false);

function openSloTemplate(template) {
  router.push({ name: 'slo-template', params: { kind: template.sloMappingKind } });
}
function openSloMetricSourceTemplate(template) {
  router.push({ name: 'slo-metric-source-template', params: { id: template.id } });
}

function openElasticityStrategy(strategy) {
  router.push({ name: 'elasticity-strategy', params: { kind: strategy.kind } });
}

const templateHasBeenDeployed = (template) => polarisComponentStore.sloMappingHasBeenDeployed(template.sloMappingKind);
const sloTemplateStatusColor = (template) => (templateHasBeenDeployed(template) ? 'positive' : 'blue');
</script>

<style scoped lang="scss"></style>
