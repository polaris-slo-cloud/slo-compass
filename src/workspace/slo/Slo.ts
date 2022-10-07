import { CustomResourceObjectReference } from '@/orchestrator/orchestrator-api';
import { PolarisComponent } from '@/workspace/PolarisComponent';
import { SloMetricSource } from '@/polaris-templates/slo-template';
import { NamespacedObjectReference } from '@polaris-sloc/core';

interface SloElasticityStrategy {
  id: string;
  kind: string;
  config: Record<string, unknown>;
}

export interface PolarisSloMapping {
  target: NamespacedObjectReference;
  config: Record<string, unknown>;
  elasticityStrategy?: string;
  elasticityStrategyConfig: Record<string, unknown>;
}

export interface SloMetric {
  source: SloMetricSource;
  value: unknown;
  lastUpdated: Date;
}

export default interface Slo extends PolarisComponent {
  target?: string;
  metrics: SloMetric[];
  config: Record<string, unknown>;
  configChanged: boolean;
  elasticityStrategy?: SloElasticityStrategy;
  sloMapping: CustomResourceObjectReference;
}
