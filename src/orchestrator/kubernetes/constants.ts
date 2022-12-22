export const CONTROLLER_ENV = Object.freeze({
  prometheusHost: 'prometheus-kube-prometheus-prometheus.default.svc.cluster.local',
  prometheusPort: '9090',
  kubernetesHost: 'kubernetes.default.svc',
  prometheusMetricsEndpointPort: '3000',
  prometheusMetricsEndpointPath: '/metrics',
});
