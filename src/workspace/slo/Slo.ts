import { PolarisComponent } from '@/workspace/PolarisComponent';
import { SloMetricSource } from '@/polaris-templates/slo-template';
import {ApiObject, NamespacedObjectReference} from '@polaris-sloc/core';

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
  source: SloMetricSource;
  value?: unknown;
  lastUpdated?: Date;
}

export interface PolarisSloConflict {
  type: 'DELETED' | 'MODIFIED';
  polarisSloMapping?: PolarisSloMapping;
}

export default interface Slo extends PolarisComponent {
  target?: string;
  metrics: SloMetric[];
  config: Record<string, unknown>;
  configChanged: boolean;
  elasticityStrategy?: SloElasticityStrategy;
  sloMapping: NamespacedObjectReference;
  polarisConflict?: PolarisSloConflict;
}
