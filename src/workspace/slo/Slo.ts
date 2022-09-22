import {
  DeploymentConnectionMetadata,
  IDeployment,
  PolarisSloMappingMetadata,
  PolarisSloMappingObject,
} from '@/orchestrator/orchestrator-api';
import { PolarisComponent, PolarisController } from '@/workspace/PolarisComponent';

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

export default interface Slo extends PolarisComponent {
  name: string;
  description: string;
  target?: string;
  config: SloConfig;
  configChanged: boolean;
  template: string;
  elasticityStrategy?: SloElasticityStrategy;
  polarisControllers: PolarisController[];
  sloMapping: PolarisSloMappingMetadata;
  failedSloMappings?: PolarisSloMappingObject[];
}
