<template>
  <LineChart :chartData="chartData" :options="chartOptions" />
</template>

<script setup>
import { computed } from 'vue';
import * as _ from 'lodash';
import dayjs from 'dayjs';
import { LineChart } from 'vue-chart-3';
import { MetricQueryResultValueType } from '@/polaris-templates/slo-metrics/metrics-template';
import { colors } from 'quasar';

const props = defineProps({
  data: Object,
});

const chartOptions = {
  parsing: false,
  scales: {
    x: {
      type: 'linear',
      ticks: {
        source: 'data',
        callback(value) {
          return dayjs(value).format('HH:mm');
        },
      },
    },
    y: {
      min: 0,
      ticks: {
        callback(value) {
          return formatMetricValue(value);
        },
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        title(context) {
          return dayjs(context[0].raw.x).format('HH:mm');
        },
      },
    },
  },
};
/* eslint-disable prettier/prettier */
const paletteColorList = [
  'red', 'purple', 'blue', 'teal', 'lime', 'orange', 'brown', 'blue-grey',
  'pink', 'indigo', 'cyan', 'green', 'amber', 'grey', 'deep-purple', 'light-blue',
  'light-green', 'yellow', 'deep-orange',
];
/* eslint-enable prettier/prettier */

const chartData = computed(() => ({
  datasets: props.data.queryResult.map((queryResult, idx) => ({
    label: queryResult.target,
    data: queryResult.values.map((v) => ({ x: v.timestamp.valueOf(), y: v.value })),
    backgroundColor: colors.getPaletteColor(paletteColorList[idx % paletteColorList.length]),
  })),
}));
function formatMetricValue(value) {
  let formatted = value;
  if (props.data.resultType.type === MetricQueryResultValueType.Decimal) {
    formatted = _.round(value, 2);
  } else if (props.data.resultType.type === MetricQueryResultValueType.Percentage) {
    formatted = _.round(value * 100, 2);
  }

  return `${formatted} ${props.data.resultType.unit}`;
}
</script>

<style scoped lang="scss"></style>
