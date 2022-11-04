import { useTemplateStore } from '@/store/template';
const templatesLocalStorageKey = 'polaris-templates';

const localStoragePersistence = {
  async saveTemplates(templates) {
    localStorage.setItem(templatesLocalStorageKey, JSON.stringify(templates));
  },
  async loadTemplates() {
    const templates = localStorage.getItem(templatesLocalStorageKey);
    return templates ? JSON.parse(templates) : [];
  },
};
const templatePersistenceService = window.templatesApi ? window.templatesApi : localStoragePersistence;

export function setupTemplatesAutosave() {
  const store = useTemplateStore();
  store.$subscribe(async (mutation, state) => {
    const templates = JSON.parse(JSON.stringify(state));
    await templatePersistenceService.saveTemplates(templates);
  });
}

export async function loadLocalTemplates() {
  const store = useTemplateStore();
  const templates = await templatePersistenceService.loadTemplates();
  store.$patch(templates);
}
