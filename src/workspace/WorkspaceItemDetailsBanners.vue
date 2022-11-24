<template>
  <div>
    <q-banner v-if="hasMissingDeployment" class="bg-warning">
      <template #avatar>
        <q-icon name="mdi-alert" />
      </template>
      Not all required Polaris controllers have been deployed for this {{ displayType }}!
      <template #action>
        <q-btn flat label="Details" @click="showMissingDeploymentDetails = true" />
      </template>
    </q-banner>
    <q-banner v-if="failedResourceDeployments.length > 0" class="bg-negative text-white">
      <template #avatar>
        <q-icon name="mdi-alert-circle" />
      </template>
      <div>
        The deployment failed for the following resouces:
        <ul>
          <li v-for="(resource, idx) of failedResourceDeployments" :key="idx">
            {{ resource.displayName }}
          </li>
        </ul>
      </div>
      <template #action>
        <q-btn flat label="retry" @click="retryDeployment" />
      </template>
    </q-banner>
    <MissingDeploymentDetailsDialog :item="item" v-model:show="showMissingDeploymentDetails" />
    <component :is="detailsBannersComponent" :item="item" :displayType="displayType" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useWorkspaceStore } from '@/store/workspace';
import { workspaceItemTypes } from '@/workspace/constants';
import MissingDeploymentDetailsDialog from '@/workspace/MissingDeploymentDetailsDialog.vue';
import SloDetailsBanners from '@/workspace/slo/SloDetailsBanners.vue';

const store = useWorkspaceStore();

const props = defineProps({
  item: Object,
  displayType: String,
});

const hasMissingDeployment = computed(
  () => props.item.polarisControllers && props.item.polarisControllers.some((x) => !x.deployment)
);
const showMissingDeploymentDetails = ref(false);
const failedResourceDeployments = computed(() => (props.item.failedDeployments ? props.item.failedDeployments : []));

const detailsBannersComponent = computed(() => {
  switch (props.item?.type) {
    case workspaceItemTypes.slo:
      return SloDetailsBanners;
  }
  return 'div';
});

async function retryDeployment() {
  await store.retryDeployment(props.item);
}
</script>

<style scoped lang="scss"></style>
