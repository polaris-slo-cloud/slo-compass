<template>
  <q-dialog v-model="showDialog">
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h3">{{ item.name }} Deployments</div>
        <q-space />
        <q-btn icon="mdi-close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section>
        <div>
          The {{ itemDisplayType.toLowerCase() }} requires the following controllers to be deployed
          in order to function correctly:
        </div>
        <q-list class="q-mt-md">
          <q-item v-for="controller of item.polarisControllers" :key="controller.name">
            <q-item-section>
              <q-item-label>{{ controller.name }}</q-item-label>
              <q-item-label caption>{{ controller.type }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row items-center">
                <q-badge rounded :color="deploymentStatusColor(controller)" class="q-mr-sm" />
                <span>{{ deploymentStatusText(controller) }}</span>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="Deploy" color="primary" @click="deploy" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { workspaceItemTypes } from '@/workspace/constants';
import { useWorkspaceStore } from '@/store';

const store = useWorkspaceStore();

const props = defineProps({
  show: Boolean,
  item: Object,
});
const emit = defineEmits(['update:show']);

const showDialog = computed({
  get: () => props.show,
  set(v) {
    emit('update:show', v);
  },
});

const itemDisplayType = computed(() =>
  props.item?.type === workspaceItemTypes.elasticityStrategy
    ? 'Elasticity Strategy'
    : props.item?.type
);

const deploymentStatusColor = (controller) => (controller.deployment ? 'green' : 'grey');
const deploymentStatusText = (controller) => (controller.deployment ? 'Running' : 'Not Deployed');

function deploy() {
  switch (props.item.type) {
    case workspaceItemTypes.slo:
      store.deploySlo(props.item);
      break;
    case workspaceItemTypes.elasticityStrategy:
      store.deployElasticityStrategy(props.item);
      break;
  }
}
</script>

<style scoped></style>
