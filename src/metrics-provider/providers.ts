import { Component } from 'vue';
import prometheus from './prometheus/metadata';
import { MetricsConnection } from '@/connections/storage';
import { MetricsProvider } from '@/metrics-provider/api';
import { SloMetricSourceTemplate } from '@/polaris-templates/slo-metrics/metrics-template';

export interface IConfigureMetricsProvider {
  name: string;
  connectionSettingsComponent?: Component;
  metricSourceTemplateKey: string;
  createMetricsProvider(connection: MetricsConnection): MetricsProvider;
  addProviderMetricsSource(template: SloMetricSourceTemplate, rawQueries?: Record<string, string>): void;
}

const providers: IConfigureMetricsProvider[] = [prometheus];

const providerMap = providers.reduce((map, config) => {
  map.set(config.name, config);
  return map;
}, new Map<string, IConfigureMetricsProvider>());

export function getProvider(name: string): IConfigureMetricsProvider {
  return providerMap.get(name);
}
export const availableProviderNames = providers.map((x) => x.name);
export const availableProviders = providers;
