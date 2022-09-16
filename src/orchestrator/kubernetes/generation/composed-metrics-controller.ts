import {
  V1ClusterRole,
  V1ClusterRoleBinding,
  V1Deployment,
  V1Service,
} from '@kubernetes/client-node';
import { polarisApiGroups, env } from '../constants';

export const generateMetricSourceClusterRole = (
  name: string,
  composedMetricResources: string
): V1ClusterRole => ({
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name,
  },
  rules: [
    {
      apiGroups: [polarisApiGroups.metrics],
      resources: [composedMetricResources],
      verbs: ['get', 'watch', 'list'],
    },
    {
      apiGroups: [polarisApiGroups.metrics],
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
              { name: 'PROMETHEUS_HOST', value: env.prometheusHost },
              { name: 'PROMETHEUS_PORT', value: env.prometheusPort },
              {
                name: 'PROMETHEUS_METRICS_ENDPOINT_PORT',
                value: env.prometheusMetricsEndpointPort,
              },
              {
                name: 'PROMETHEUS_METRICS_ENDPOINT_PATH',
                value: env.prometheusMetricsEndpointPath,
              },
              { name: 'COMPOSED_METRIC_COMPUTATION_INTERVAL_MS', value: '20000' },
              { name: 'KUBERNETES_SERVICE_HOST', value: 'kubernetes.default.svc' },
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
