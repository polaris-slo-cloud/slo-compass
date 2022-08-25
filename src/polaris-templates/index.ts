import * as KubernetesCostEfficiencySlo from '@/polaris-templates/kubernetes/CostEfficiencySlo';
import * as KubernetesCpuUsageSlo from '@/polaris-templates/kubernetes/CpuUsageSlo';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const templateMap = {
  kubernetes: {
    slos: [KubernetesCostEfficiencySlo, KubernetesCpuUsageSlo],
    strategies: [],
  },
};
//Placeholder
export default {};
