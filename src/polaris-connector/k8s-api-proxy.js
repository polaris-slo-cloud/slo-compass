import axios from 'axios';

const k8sClient = axios.create({
  baseURL: import.meta.env.VITE_K8S_BASE_URL,
});

export default {
  async getCustomResourceDefinitions() {
    const { data } = await k8sClient.get(
      '/apis/apiextensions.k8s.io/v1/customresourcedefinitions'
    );
    return data.items;
  },
  async getCustomResourceObjects(crd) {
    const group = crd.spec.group;
    const version = crd.spec.versions[0].name;
    const plural = crd.spec.names.plural;
    const { data } = await k8sClient.get(`/apis/${group}/${version}/${plural}`);
    return data.items;
  },
  async getDeployment(namespace, name) {
    try {
      const { data } = await k8sClient.get(
        `/apis/apps/v1/namespaces/${namespace}/deployments/${name}`
      );
      return data;
    } catch (e) {
      if (e.response.status === 404) {
        return null;
      }
      throw e;
    }
  },
};
