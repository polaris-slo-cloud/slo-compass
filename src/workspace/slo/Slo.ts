import { WorkspaceComponent } from '@/workspace/PolarisComponent';
import { NamespacedObjectReference, SloCompliance } from '@polaris-sloc/core';
import {SloMetricSourceTemplate, SloMetricTemplateId} from '@/polaris-templates/slo-metrics/metrics-template';

interface SloElasticityStrategy {
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
  source: SloMetricTemplateId;
  value?: unknown;
  lastUpdated?: Date;
}

export interface DeployedPolarisSloMapping {
  sloMapping?: PolarisSloMapping;
  reference?: NamespacedObjectReference;
  deleted?: boolean;
}

export default interface Slo extends WorkspaceComponent {
  kind: string;
  compliance?: number;
  target?: string;
  metrics: SloMetric[];
  config: Record<string, unknown>;
  configChanged: boolean;
  elasticityStrategy?: SloElasticityStrategy;
  deployedSloMapping: DeployedPolarisSloMapping;
}

export interface PolarisElasticityStrategySloOutput {
  sloOutputParams: SloCompliance;
  target: NamespacedObjectReference;
  staticConfig: Record<string, unknown>;
}

export function getComplianceColor(slo: Slo) {
  if (!slo?.compliance) {
    return 'grey';
  }

  const thresholds = {
    green: 10,
    orange: 25,
  };
  const complianceDeviation = Math.abs(100 - slo.compliance);
  return complianceDeviation <= thresholds.green
    ? 'positive'
    : complianceDeviation <= thresholds.orange
    ? 'orange'
    : 'negative';
}
