import axios from 'axios';

const k8sClient = axios.create({
  baseURL: import.meta.env.VITE_K8S_BASE_URL,
});

export default {
  async getDeployment(namespace, name) {
    try {
      const { data } = await k8sClient.get(`/apis/apps/v1/namespaces/${namespace}/deployments/${name}`);
      return data;
    } catch (e) {
      if (e.response.status === 404) {
        return null;
      }
      throw e;
    }
  },
};
