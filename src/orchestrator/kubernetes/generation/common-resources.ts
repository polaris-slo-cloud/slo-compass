import { V1Namespace, V1ServiceAccount } from '@kubernetes/client-node';

export const generateNamespaceSpec = (namespace: string): V1Namespace => ({
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: namespace,
  },
});

export const generateServiceAccount = (name: string, namespace: string): V1ServiceAccount => ({
  apiVersion: 'v1',
  kind: 'ServiceAccount',
  metadata: {
    name,
    namespace,
  },
});
