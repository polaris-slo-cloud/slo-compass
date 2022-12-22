import { V1ClusterRole, V1ClusterRoleBinding, V1Deployment, V1Service } from '@kubernetes/client-node';
import { CONTROLLER_ENV } from '../constants';
import { COMMON_LABELS, CONTROLLER_TYPES } from '@/orchestrator/constants';
import { POLARIS_API } from '@polaris-sloc/core';

export const generateMetricSourceClusterRole = (name: string, composedMetricResources: string): V1ClusterRole => ({
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name,
  },
  rules: [
    {
      apiGroups: [POLARIS_API.METRICS_GROUP],
      resources: [composedMetricResources],
      verbs: ['get', 'watch', 'list'],
    },
    {
      apiGroups: [POLARIS_API.METRICS_GROUP],
      resources: [`${composedMetricResources}/status`],
      verbs: ['get'],
    },
  ],
});

export const generateMetricSourceClusterRoleBinding = (
  name: string,
  namespace: string,
  composedMetricResources: string
): V1ClusterRoleBinding => ({
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRoleBinding',
  metadata: {
    name: `control-${composedMetricResources}`,
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

export const generateComposedMetricsControllerDeployment = (
  name: string,
  namespace: string,
  containerImage: string,
  crdName: string
): V1Deployment => ({
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    labels: {
      component: name,
      tier: 'control-plane',
      [COMMON_LABELS.CONTROLLER_TYPE]: CONTROLLER_TYPES.COMPOSED_METRIC,
      [COMMON_LABELS.CRD_API_GROUP]: POLARIS_API.METRICS_GROUP,
      [COMMON_LABELS.CRD_NAME]: crdName,
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
          'polaris-controller-type': 'composed-metric',
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
          {
            key: 'node-role.kubernetes.io/master',
            operator: 'Exists',
            effect: 'NoSchedule',
          },
        ],
        containers: [
          {
            image: containerImage,
            name: 'metrics-controller',
            resources: {
              limits: {
                cpu: '1000m',
                memory: '1Gi',
              },
            },
            ports: [
              {
                name: 'metrics',
                containerPort: 3000,
              },
            ],
            securityContext: {
              privileged: false,
            },
            env: [
              { name: 'PROMETHEUS_HOST', value: CONTROLLER_ENV.prometheusHost },
              { name: 'PROMETHEUS_PORT', value: CONTROLLER_ENV.prometheusPort },
              {
                name: 'PROMETHEUS_METRICS_ENDPOINT_PORT',
                value: CONTROLLER_ENV.prometheusMetricsEndpointPort,
              },
              {
                name: 'PROMETHEUS_METRICS_ENDPOINT_PATH',
                value: CONTROLLER_ENV.prometheusMetricsEndpointPath,
              },
              { name: 'COMPOSED_METRIC_COMPUTATION_INTERVAL_MS', value: '20000' },
              { name: 'KUBERNETES_SERVICE_HOST', value: CONTROLLER_ENV.kubernetesHost },
              { name: 'POLARIS_CONNECTION_CHECK_TIMEOUT_MS', value: '600000' },
            ],
          },
        ],
      },
    },
  },
});

export const generateComposedMetricsService = (name: string, namespace: string): V1Service => ({
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    namespace,
    name,
    labels: {
      component: name,
      tier: 'control-plane',
      'polaris-controller-type': 'composed-metric',
    },
  },
  spec: {
    selector: {
      component: name,
      tier: 'control-plane',
      'polaris-controller-type': 'composed-metric',
    },
    ports: [
      {
        name: 'metrics',
        port: 3000,
        targetPort: 'metrics',
      },
    ],
  },
});

export const generateComposedMetricsServiceMonitor = (name: string, namespace: string) => ({
  apiVersion: 'monitoring.coreos.com/v1',
  kind: 'ServiceMonitor',
  metadata: {
    namespace,
    name,
    labels: {
      component: name,
      tier: 'control-plane',
      'polaris-controller-type': 'composed-metric',
    },
  },
  spec: {
    namespaceSelector: {
      matchNames: [namespace],
    },
    selector: {
      matchLabels: {
        component: name,
        tier: 'control-plane',
        'polaris-controller-type': 'composed-metric',
      },
    },
    endpoints: [{ targetPort: 'metrics', interval: '20s' }],
  },
});
