import { V1ClusterRole, V1ClusterRoleBinding, V1Deployment } from '@kubernetes/client-node';
import { env } from '../constants';
import { IDeployment } from '@/orchestrator/orchestrator-api';
import Slo from '@/workspace/slo/Slo';
import { POLARIS_API } from '@polaris-sloc/core';

export const generateSloClusterRole = (name: string, mappingResources: string): V1ClusterRole => ({
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name,
  },
  rules: [
    {
      apiGroups: [POLARIS_API.SLO_GROUP],
      resources: [mappingResources],
      verbs: ['get', 'watch', 'list'],
    },
    {
      apiGroups: [POLARIS_API.SLO_GROUP],
      resources: [`${mappingResources}/status`],
      verbs: ['get'],
    },
    {
      apiGroups: [POLARIS_API.ELASTICITY_GROUP],
      resources: ['*'],
      verbs: ['create', 'delete', 'get', 'list', 'patch', 'update', 'watch'],
    },
    {
      apiGroups: [POLARIS_API.METRICS_GROUP],
      resources: ['*'],
      verbs: ['create', 'delete', 'get', 'list', 'patch', 'update', 'watch'],
    },
  ],
});

export const generateSloClusterRoleBinding = (
  name: string,
  namespace: string,
  mappingResources: string
): V1ClusterRoleBinding => ({
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRoleBinding',
  metadata: {
    name: `control-${mappingResources}-slos`,
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

export const generateSloControllerDeployment = (
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
        tolerations: [
          { key: 'node-role.kubernetes.io/master', operator: 'Exists', effect: 'NoSchedule' },
        ],
        containers: [
          {
            image: containerImage,
            name: 'slo-controller',
            resources: {
              limits: {
                cpu: '1000m',
                memory: '512Mi',
              },
            },
            env: [
              { name: 'PROMETHEUS_HOST', value: env.prometheusHost },
              { name: 'PROMETHEUS_PORT', value: env.prometheusPort },
              { name: 'SLO_CONTROL_LOOP_INTERVAL_MSEC', value: '20000' },
              { name: 'KUBERNETES_SERVICE_HOST', value: 'kubernetes.default.svc' },
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

export const generateSloMapping = (kind: string, name: string, slo: Slo, target: IDeployment) => ({
  kind,
  apiVersion: `${POLARIS_API.SLO_GROUP}/v1`,
  metadata: {
    namespace: target.connectionMetadata.namespace,
    name,
  },
  spec: {
    targetRef: {
      kind: target.connectionMetadata.kind,
      name: target.connectionMetadata.name,
      namespace: target.connectionMetadata.namespace,
      apiVersion: `${target.connectionMetadata.group}/${target.connectionMetadata.version}`,
    },
    sloConfig: slo.config,
    elasticityStrategy: slo.elasticityStrategy
      ? {
          kind: slo.elasticityStrategy.kind,
          apiVersion: `${POLARIS_API.ELASTICITY_GROUP}/v1`,
        }
      : undefined,
    staticElasticityStrategyConfig: slo.elasticityStrategy?.config,
  },
});
