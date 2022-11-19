import { V1ClusterRole, V1ClusterRoleBinding, V1Deployment } from '@kubernetes/client-node';
import { POLARIS_API } from '@polaris-sloc/core';
import { env } from '../constants';

export const generateElasticityStrategyClusterRole = (name: string, strategyResources: string): V1ClusterRole => ({
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name,
  },
  rules: [
    {
      apiGroups: [POLARIS_API.ELASTICITY_GROUP],
      resources: [strategyResources],
      verbs: ['get', 'watch', 'list'],
    },
    {
      apiGroups: [POLARIS_API.ELASTICITY_GROUP],
      resources: [`${strategyResources}/status`],
      verbs: ['get'],
    },
    {
      apiGroups: ['*'],
      resources: ['*/scale'],
      verbs: ['get', 'update'],
    },
  ],
});

export const generateElasticityStrategyClusterRoleBinding = (
  name: string,
  namespace: string,
  strategyResources: string
): V1ClusterRoleBinding => ({
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRoleBinding',
  metadata: {
    name: `control-${strategyResources}`,
  },
  subjects: [
    {
      kind: 'ServiceAccount',
      name,
      namespace,
    },
  ],
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name,
  },
});

export const generateElasticityStrategyControllerDeployment = (
  name: string,
  namespace: string,
  containerImage: string
): V1Deployment => ({
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    labels: {
      component: name,
      tier: 'control-plane',
    },
    name,
    namespace,
  },
  spec: {
    selector: {
      matchLabels: {
        component: name,
        tier: 'control-plane',
      },
    },
    replicas: 1,
    template: {
      metadata: {
        labels: {
          component: name,
          tier: 'control-plane',
        },
      },
      spec: {
        serviceAccountName: name,
        affinity: {
          nodeAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: {
              nodeSelectorTerms: [
                {
                  matchExpressions: [
                    {
                      key: 'kubernetes.io/arch',
                      operator: 'In',
                      values: ['amd64'],
                    },
                  ],
                },
              ],
            },
          },
        },
        tolerations: [{ key: 'node-role.kubernetes.io/master', operator: 'Exists', effect: 'NoSchedule' }],
        containers: [
          {
            image: containerImage,
            name: 'elasticity-controller',
            resources: {
              limits: {
                cpu: '1000m',
                memory: '1Gi',
              },
            },
            env: [
              { name: 'KUBERNETES_SERVICE_HOST', value: env.kubernetesHost },
              { name: 'POLARIS_CONNECTION_CHECK_TIMEOUT_MS', value: '600000' },
            ],
            securityContext: {
              privileged: false,
            },
          },
        ],
      },
    },
  },
});
