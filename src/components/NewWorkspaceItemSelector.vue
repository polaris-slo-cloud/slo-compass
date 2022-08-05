<template>
  <div>
    <q-input
      label="Search"
      outlined
      dense
      v-model="search"
      type="search"
      class="q-ma-md"
    >
      <template #prepend>
        <q-icon name="mdi-magnify" />
      </template>
    </q-input>
    <q-separator />
    <q-list>
      <q-expansion-item
        switch-toggle-side
        expand-separator
        default-opened
        label="SLO Target"
      >
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
    </q-list>
    <AddSloTargetDialog
      v-model="showAddSloTargetDialog"
      :type="sloTargetType"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import WorkspaceItem from '@/components/WorkspaceItem.vue';
import AddSloTargetDialog from './AddSloTargetDialog.vue';

const search = ref(null);

const showAddSloTargetDialog = ref(false);
const sloTargetType = ref('');

function showAddTarget(type) {
  showAddSloTargetDialog.value = true;
  sloTargetType.value = type;
}
</script>
