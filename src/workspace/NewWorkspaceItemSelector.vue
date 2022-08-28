<template>
  <div>
    <q-input label="Search" outlined dense v-model="search" type="search" class="q-ma-md">
      <template #prepend>
        <q-icon name="mdi-magnify" />
      </template>
    </q-input>
    <q-separator />
    <q-list>
      <q-expansion-item switch-toggle-side expand-separator default-opened label="SLO Target">
        <q-card>
          <q-card-section>
            <div class="row q-gutter-sm">
              <WorkspaceItem
                class="col-6 col-md-4 col-xl-3"
                title="Application"
                color="white"
                @click="showAddTarget('Application')"
              />
              <WorkspaceItem
                class="col-6 col-md-4 col-xl-3"
                title="Component"
                color="white"
                @click="showAddTarget('Component')"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-expansion-item switch-toggle-side expand-separator default-opened label="SLO">
        <q-card>
          <q-card-section>
            <div class="row q-gutter-sm">
              <WorkspaceItem
                class="col-6 col-md-4 col-xl-3"
                v-for="template of sloTemplates"
                :key="template.key"
                :title="template.name"
                color="blue"
                @click="showAddSlo(template)"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-expansion-item
        switch-toggle-side
        expand-separator
        default-opened
        label="Elasticity Strategy"
      >
        <q-card>
          <q-card-section>
            <div class="row q-gutter-sm">
              <WorkspaceItem
                class="col-6 col-md-4 col-xl-3"
                v-for="template of strategyTemplates"
                :key="template.key"
                :title="template.name"
                color="amber"
                @click="showAddStrategy(template)"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
    <CreateWorkspaceItemDialog
      v-model:show="showAddItemDialog"
      :type="newItemType"
      :template="newItemTemplate"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import WorkspaceItem from '@/workspace/WorkspaceItem.vue';
import CreateWorkspaceItemDialog from '@/workspace/dialogs/CreateWorkspaceItemDialog.vue';
import { templates as sloTemplates } from '@/polaris-templates/slo-template';
import { templates as strategyTemplates } from '@/polaris-templates/strategy-template';

const search = ref(null);

const showAddItemDialog = ref(false);
const newItemType = ref('');
const newItemTemplate = ref({});

function showAddTarget(type) {
  showAddItemDialog.value = true;
  newItemType.value = type;
}
function showAddSlo(template) {
  showAddItemDialog.value = true;
  newItemType.value = 'SLO';
  newItemTemplate.value = template;
}
function showAddStrategy(template) {
  showAddItemDialog.value = true;
  newItemType.value = 'ElasticityStrategy';
  newItemTemplate.value = template;
}
</script>
