<template>
  <div>
    <div class="flex items-baseline">
      <h3 class="q-mt-none q-mr-md">SLO Templates</h3>
      <q-btn label="New" icon="mdi-plus" outline color="primary" @click="showCreateSloTemplate = true" />
      <CreateSloTemplateDialog v-model:show="showCreateSloTemplate" skip-deployment />
    </div>
    <div class="row q-col-gutter-md">
      <div class="col-6 col-md-3 col-lg-2" v-for="template of sloTemplates" :key="template.sloMappingKind">
        <q-card @click="openSloTemplate(template)" class="cursor-pointer" flat bordered>
          <q-card-section>
            <span class="text-h4">{{ template.displayName }}</span>
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
    <h3>
      Elasticity Strategy Templates
      <span class="text-muted text-italic text-subtitle2">- Not Editable</span>
    </h3>
    <div class="text-h4 text-red">TODO!</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useTemplateStore } from '@/store/template';
import CreateSloTemplateDialog from '@/polaris-templates/slo/CreateSloTemplateDialog.vue';
import CreateSloMetricTemplateDialog from '@/polaris-templates/slo-metrics/CreateSloMetricTemplateDialog.vue';

const router = useRouter();

const store = useTemplateStore();
const { sloTemplates, sloMetricSourceTemplates } = storeToRefs(store);

const showCreateSloTemplate = ref(false);
const showCreateSloMetricSourceTemplate = ref(false);

function openSloTemplate(template) {
  router.push({ name: 'slo-template', params: { kind: template.sloMappingKind } });
}
function openSloMetricSourceTemplate(template) {
  router.push({ name: 'slo-metric-source-template', params: { id: template.id } });
}
</script>

<style scoped lang="scss"></style>
