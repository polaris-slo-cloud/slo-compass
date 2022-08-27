export default {
  polarisApiGroups: {
    elasticity: 'elasticity.polaris-slo-cloud.github.io',
    metrics: 'metrics.polaris-slo-cloud.github.io',
  },
  env: {
    prometheusHost: 'prometheus-kube-prometheus-prometheus.monitoring.svc',
    prometheusPort: '9090',
    prometheusMetricsEndpointPort: '3000',
    prometheusMetricsEndpointPath: '/metrics',
  },
};
