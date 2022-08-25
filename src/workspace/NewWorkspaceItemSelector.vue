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
              <div class="col">
                <WorkspaceItem
                  title="Application"
                  color="white"
                  @click="showAddTarget('Application')"
                />
              </div>
              <div class="col">
                <WorkspaceItem
                  title="Component"
                  color="white"
                  @click="showAddTarget('Component')"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-expansion-item switch-toggle-side expand-separator default-opened label="SLO">
        <q-card>
          <q-card-section>
            <div class="row q-gutter-sm">
              <div class="col" v-for="template of sloTemplates" :key="template.key">
                <WorkspaceItem :title="template.name" color="blue" @click="showAddSlo(template)" />
              </div>
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
import sloTemplates from '@/polaris-templates/slo-template';

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
</script>
