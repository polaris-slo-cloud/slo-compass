import {
  DeploymentConnectionMetadata,
  IDeployment,
  PolarisSloMappingMetadata,
} from '@/orchestrator/orchestrator-api';
import { PolarisComponent } from '@/workspace/PolarisComponent';
import { SloMetricSource } from '@/polaris-templates/slo-template';

export interface SloTarget {
  id: string;
  name: string;
  type: string;
  deployment: IDeployment;
}

interface SloElasticityStrategyConfig {
  [key: string]: any;
}

interface SloElasticityStrategy {
  id: string;
  kind: string;
  config: SloElasticityStrategyConfig;
}

interface SloConfig {
  [key: string]: any;
}

export interface PolarisSloMapping {
  target: DeploymentConnectionMetadata;
  config: SloConfig;
  elasticityStrategy?: string;
  elasticityStrategyConfig: SloElasticityStrategyConfig;
}

export interface SloMetric {
  source: SloMetricSource;
  value: any;
  lastUpdated: Date;
}

export default interface Slo extends PolarisComponent {
  target?: string;
  metrics: SloMetric[];
  config: SloConfig;
  configChanged: boolean;
  elasticityStrategy?: SloElasticityStrategy;
  sloMapping: PolarisSloMappingMetadata;
}
