import { Component } from 'vue';
import prometheus from './prometheus/metadata';
import { MetricsConnection } from '@/connections/storage';
import { MetricsProvider } from '@/metrics-provider/api';

export interface IConfigureMetricsProvider {
  name: string;
  connectionSettingsComponent?: Component;
  createMetricsProvider(connection: MetricsConnection): MetricsProvider;
}

const providers: IConfigureMetricsProvider[] = [prometheus];

const providerMap = providers.reduce((map, config) => {
  map.set(config.name, config);
  return map;
}, new Map<string, IConfigureMetricsProvider>());

export function getProvider(name: string): IConfigureMetricsProvider {
  return providerMap.get(name);
}
export const availableProviders = providers.map((x) => x.name);
