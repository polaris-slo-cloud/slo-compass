import { V1ClusterRole, V1ClusterRoleBinding, V1CustomResourceDefinition, V1Deployment } from '@kubernetes/client-node';
import { env } from '../constants';
import { IDeployment } from '@/orchestrator/orchestrator-api';
import Slo from '@/workspace/slo/Slo';
import { POLARIS_API } from '@polaris-sloc/core';
import { ConfigParameter } from '@/polaris-templates/parameters';
import {convertParametersToSchemaProperties} from "@/orchestrator/kubernetes/generation/helpers";

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
        tolerations: [{ key: 'node-role.kubernetes.io/master', operator: 'Exists', effect: 'NoSchedule' }],
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
    labels: {
      polarisId: slo.id,
    },
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

const apiVersionPropertyDefinition = {
  type: 'string',
  description:
    'APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources',
};
const kindPropertyDefinition = {
  type: 'string',
  description:
    'Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds',
};

export const generateSloMappingCrd = (
  kind: string,
  kindPlural: string,
  parameters: ConfigParameter[],
  description: string
): V1CustomResourceDefinition => ({
  kind: 'CustomResourceDefinition',
  apiVersion: 'apiextensions.k8s.io/v1',
  metadata: {
    name: `${kindPlural}.${POLARIS_API.SLO_GROUP}`,
    annotations: {
      'polaris-slo-cloud.github.io/schema-gen-version': '0.3.0',
    },
  },
  spec: {
    group: POLARIS_API.SLO_GROUP,
    names: {
      kind: kind,
      listKind: `${kind}List`,
      singular: kind.toLowerCase(),
      plural: kindPlural,
    },
    scope: 'Namespaced',
    versions: [
      {
        name: 'v1',
        served: true,
        storage: true,
        schema: {
          openAPIV3Schema: {
            type: 'object',
            required: ['metadata', 'spec', 'apiVersion', 'kind'],
            description,
            properties: {
              metadata: { type: 'object' },
              apiVersion: apiVersionPropertyDefinition,
              kind: kindPropertyDefinition,
              spec: {
                type: 'object',
                required: ['elasticityStrategy', 'sloConfig', 'targetRef'],
                description: `The spec for a \`${kind}\`.`,
                properties: {
                  targetRef: {
                    type: 'object',
                    required: ['kind', 'name', 'apiVersion'],
                    properties: {
                      kind: kindPropertyDefinition,
                      name: { type: 'string', description: 'The name of the instance.' },
                      apiVersion: apiVersionPropertyDefinition,
                    },
                  },
                  elasticityStrategy: {
                    type: 'object',
                    required: ['kind', 'apiVersion'],
                    description: 'Identifies an elasticity strategy kind/type.',
                    properties: {
                      kind: kindPropertyDefinition,
                      apiVersion: apiVersionPropertyDefinition,
                    },
                  },
                  stabilizationWindow: {
                    type: 'object',
                    description:
                      'StabilizationWindow allows configuring the period of time that an elasticity strategy controller will wait after applying the strategy once, before applying it again (if the SLO is still violated), to avoid unnecessary scaling.\n\n' +
                      "For example, suppose that ScaleUpSeconds = 180 and a horizontal elasticity strategy scales out at time `t` due to an SLO violation. At time `t + 20 seconds` the SLO's evaluation still results in a violation, but the elasticity strategy does not scale again, because the stabilization window for scaling up/out has not yet passed. If the SLO evaluation at `t + 200 seconds` still results in a violation, the controller will scale again.",
                    properties: {
                      scaleUpSeconds: {
                        type: 'integer',
                        description:
                          'The number of seconds after the previous scaling operation to wait before an elasticity action that increases resources (e.g., scale up/out) or an equivalent configuration change can be issued due to an SLO violation.',
                        minimum: 0,
                        _default: new Number(60),
                        format: 'int64',
                      },
                      scaleDownSeconds: {
                        type: 'integer',
                        description:
                          'The number of seconds after the previous scaling operation to wait before an elasticity action that decreases resources (e.g., scale down/in) or an equivalent configuration change can be issued due to an SLO violation.',
                        minimum: 0,
                        _default: new Number(300),
                        format: 'int64',
                      },
                    },
                  },
                  sloConfig: {
                    type: 'object',
                    required: parameters.filter((x) => x.required).map((x) => x.parameter),
                    properties: convertParametersToSchemaProperties(parameters),
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
});
