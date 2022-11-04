import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SloTemplateMetadata, templates as defaultSloTemplates } from '@/polaris-templates/slo-template';
import { useOrchestratorApi } from '@/orchestrator/orchestrator-api';

export const useTemplateStore = defineStore('templates', () => {
  const orchestratorApi = useOrchestratorApi();

  const sloTemplates = ref<SloTemplateMetadata[]>(defaultSloTemplates);

  const getSloTemplate = computed(() => {
    const templateMap = new Map(sloTemplates.value.map((x) => [x.key, x]));
    return (key: string): SloTemplateMetadata => templateMap.get(key);
  });
  const findTemplateForKind = computed(() => {
    const kindMap = new Map(sloTemplates.value.map((x) => [x.sloMappingKind, x]));
    return (kind: string): SloTemplateMetadata => kindMap.get(kind);
  });

  async function createSloTemplate(template: SloTemplateMetadata) {
    if (getSloTemplate.value(template.key)) {
      //TODO: This template already exists, do we need a notification here?
      return;
    }

    sloTemplates.value.push(template);
    await orchestratorApi.deploySloMappingCrd(template);
  }

  return {
    sloTemplates,
    getSloTemplate,
    findTemplateForKind,
    createSloTemplate,
  };
});
