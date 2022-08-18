import * as KubernetesCostEfficiencySlo from '@/polaris-templates/kubernetes/CostEfficiencySlo';
import * as KubernetesCpuUsageSlo from '@/polaris-templates/kubernetes/CpuUsageSlo';

const templateMap = {
  kubernetes: {
    slos: [KubernetesCostEfficiencySlo, KubernetesCpuUsageSlo],
    strategies: [],
  },
};
//Placeholder
export default {};
