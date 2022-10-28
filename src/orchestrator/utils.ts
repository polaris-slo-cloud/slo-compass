import { PolarisSloMapping } from '@/workspace/slo/Slo';

export function transformToPolarisSloMapping(spec: any, namespace: string): PolarisSloMapping {
  const [targetGroup, targetApiVersion] = spec.targetRef.apiVersion.split('/');
  return {
    config: spec.sloConfig,
    elasticityStrategy: {
      apiVersion: spec.elasticityStrategy.apiVersion,
      kind: spec.elasticityStrategy.kind,
    },
    elasticityStrategyConfig: spec.staticElasticityStrategyConfig || {},
    target: {
      name: spec.targetRef.name,
      namespace: namespace,
      group: targetGroup,
      version: targetApiVersion,
      kind: spec.targetRef.kind,
    },
  };
}
