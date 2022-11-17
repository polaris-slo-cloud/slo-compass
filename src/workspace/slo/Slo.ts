import { PolarisComponent } from '@/workspace/PolarisComponent';

import { NamespacedObjectReference } from '@polaris-sloc/core';
import { SloMetricSourceTemplate } from '@/polaris-templates/slo-metrics/metrics-template';

interface SloElasticityStrategy {
  id: string;
  kind: string;
  config: Record<string, unknown>;
}

export interface PolarisElasticityStrategyKind {
  kind: string;
  apiVersion: string;
}

export interface PolarisSloMapping {
  target: NamespacedObjectReference;
  config: Record<string, unknown>;
  elasticityStrategy?: PolarisElasticityStrategyKind;
  elasticityStrategyConfig: Record<string, unknown>;
}

export interface SloMetric {
  source: SloMetricSourceTemplate;
  value?: unknown;
  lastUpdated?: Date;
}

export interface DeployedPolarisSloMapping {
  sloMapping?: PolarisSloMapping;
  reference?: NamespacedObjectReference;
  deleted?: boolean;
}

export default interface Slo extends PolarisComponent {
  target?: string;
  metrics: SloMetric[];
  config: Record<string, unknown>;
  configChanged: boolean;
  elasticityStrategy?: SloElasticityStrategy;
  deployedSloMapping: DeployedPolarisSloMapping;
}
