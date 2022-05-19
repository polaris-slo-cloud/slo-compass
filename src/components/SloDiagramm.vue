<template>
  <div class="column">
    <v-network-graph
      :nodes="data.nodes"
      :edges="data.edges"
      :configs="configs"
      :layouts="{ nodes: data.nodePositions }"
      v-model:selected-nodes="selectedNodes"
      class="col"
      ref="graph"
    >
      <template #override-node="{ nodeId, scale, config, ...slotProps }">
        <rect
          class="node-rect draggable selectable"
          :x="(config.width * scale) / -2"
          :y="(config.height * scale) / -2"
          :height="config.height * scale"
          :width="config.width * scale"
          :fill="config.color"
          v-bind="slotProps"
          :rx="config.borderRadius"
          :ry="config.borderRadius"
          :stroke="config.strokeColor"
          :stroke-width="config.strokeWidth"
        />
        <circle
          v-if="data.nodes[nodeId].statusColor"
          :cx="((config.width - 15) * scale) / 2"
          :cy="((config.height - 15) * scale) / -2"
          :r="4 * scale"
          :fill="data.nodes[nodeId].statusColor"
        />
      </template>
      <template #override-node-label="{ shape, scale, text, config }">
        <foreignObject
          :x="(shape.width * scale) / -2"
          :y="(shape.height * scale) / -2"
          :width="shape.width * scale"
          :height="shape.height * scale"
          style="pointer-events: none"
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            class="row items-center justify-center full-height"
          >
            <span
              xmlns="http://www.w3.org/1999/xhtml"
              v-text="text"
              class="text-center"
              :style="`color: ${config.color}; font-size: ${
                config.fontSize * scale
              }px`"
            ></span>
          </div>
        </foreignObject>
      </template>
      <template #edge-label="{ edge, ...slotProps }">
        <v-edge-label
          :text="edge.label"
          align="center"
          vertical-align="above"
          v-bind="slotProps"
          v-if="edge.label"
        />
      </template>
    </v-network-graph>
    <q-card style="position: absolute; bottom: 10px; right: 10px">
      <q-card-actions>
        <span class="q-pr-sm">Zoom</span>
        <q-btn flat @click="zoomOut"><q-icon name="zoom_out" /></q-btn>
        <q-btn flat @click="zoomIn"><q-icon name="zoom_in" /></q-btn>
        <q-btn flat @click="fitToContents"><q-icon name="fit_screen" /></q-btn>
      </q-card-actions>
    </q-card>
  </div>
</template>
<script setup>
import { defineProps, computed, ref } from '@vue/runtime-core';
import { colors } from 'quasar';
import * as vNG from 'v-network-graph';
const props = defineProps({
  workspace: Object,
  selectedComponent: Object,
});
const emit = defineEmits(['update:selectedComponent']);

const selectedNodes = computed({
  get() {
    return props.selectedComponent ? [props.selectedComponent.id] : [];
  },
  set(value) {
    if (value.length == 0) {
      emit('update:selectedComponent', null);
    } else {
      emit(
        'update:selectedComponent',
        data.value.nodes[value[0]].polarisComponent
      );
    }
  },
});

function zoomOut() {
  if (graph.value) {
    graph.value.zoomOut();
  }
}

function zoomIn() {
  if (graph.value) {
    graph.value.zoomIn();
  }
}

function fitToContents() {
  if (graph.value) {
    graph.value.fitToContents();
  }
}

function getStatusColor(status) {
  const map = {
    Success: 'green',
    NotFound: 'red',
  };
  const colorName = map[status] ?? 'orange';
  return colors.getPaletteColor(colorName);
}

const configs = vNG.defineConfigs({
  view: {
    scalingObjects: true,
    autoPanAndZoomOnLoad: 'fit-content',
  },
  node: {
    selectable: true,
    normal: {
      type: 'rect',
      borderRadius: 5,
      color: (node) => node.color || colors.getPaletteColor('primary'),
      strokeColor: (node) =>
        node.color == colors.getPaletteColor('white')
          ? colors.getPaletteColor('black')
          : node.color || colors.getPaletteColor('primary'),
      strokeWidth: 2,
      width: 100,
      height: 50,
    },
    hover: {
      width: 110,
      height: 55,
      color: (node) =>
        colors.lighten(node.color || colors.getPaletteColor('primary'), -15),
      strokeColor: (node) =>
        node.color == colors.getPaletteColor('white')
          ? colors.getPaletteColor('black')
          : colors.lighten(
              node.color || colors.getPaletteColor('primary'),
              -15
            ),
    },
    selected: {
      borderRadius: 5,
      color: (node) =>
        colors.lighten(node.color || colors.getPaletteColor('primary'), -15),
      width: 100,
      height: 50,
    },
    focusring: {
      visible: true,
      color: colors.getPaletteColor('yellow'),
    },
    label: {
      fontSize: 11,
      color: (node) => node.textColor || colors.getPaletteColor('white'),
      direction: 'center',
    },
  },
  edge: {
    normal: {
      color: 'black',
      dasharray: (edge) => (edge.dashed ? '5' : '0'),
    },
    marker: {
      target: {
        type: 'arrow',
        width: 5,
        height: 5,
      },
    },
  },
});
const data = computed(() => {
  const edges = {};
  const nodes = {};
  const nodePositions = {};
  const canvasHeight = 1000;

  if (!props.workspace) {
    return { nodes, edges, nodePositions };
  }

  let yDistance = canvasHeight / (props.workspace.targets.length + 1);
  let nodeYPosition = yDistance;

  let componentYDistance =
    canvasHeight /
    (props.workspace.targets.reduce(
      (sum, curr) => sum + (curr.components?.length ?? 0),
      0
    ) +
      1);
  let componentYPosition = componentYDistance;
  for (const target of props.workspace.targets) {
    nodes[target.id] = {
      name: target.name,
      color: colors.getPaletteColor('white'),
      textColor: colors.getPaletteColor('black'),
      statusColor: getStatusColor(target.status),
      polarisComponent: target,
    };
    nodePositions[target.id] = { x: 0, y: nodeYPosition };
    nodeYPosition += yDistance;
    if (target.components) {
      for (const component of target.components) {
        nodes[component.id] = {
          ...component,
          color: colors.getPaletteColor('white'),
          textColor: colors.getPaletteColor('black'),
          polarisComponent: component,
        };
        nodePositions[component.id] = { x: 200, y: componentYPosition };
        componentYPosition += componentYDistance;
        edges[`edge_${target.id}_${component.id}`] = {
          source: target.id,
          target: component.id,
          dashed: true,
        };
      }
    }
  }

  yDistance = canvasHeight / (props.workspace.metrics.length + 1);
  nodeYPosition = yDistance;
  for (const metric of props.workspace.metrics) {
    nodes[metric.id] = {
      name: metric.name,
      color: colors.getPaletteColor('orange'),
      textColor: colors.getPaletteColor('black'),
      polarisComponent: metric,
    };
    nodePositions[metric.id] = { x: 400, y: nodeYPosition };
    nodeYPosition = nodeYPosition + yDistance;
    if (metric.exposedBy) {
      edges[`edge_${metric.exposedBy}_${metric.id}`] = {
        source: metric.exposedBy,
        target: metric.id,
        label: 'Exposes',
      };
    }
  }

  yDistance = canvasHeight / (props.workspace.slos.length + 1);
  nodeYPosition = yDistance;
  for (const slo of props.workspace.slos) {
    nodes[slo.id] = {
      name: slo.name,
      color: colors.getPaletteColor('blue'),
      polarisComponent: slo,
    };
    nodePositions[slo.id] = { x: 600, y: nodeYPosition };
    nodeYPosition = nodeYPosition + yDistance;
    if (slo.strategy) {
      edges[`edge_${slo.id}_${slo.strategy}`] = {
        source: slo.id,
        target: slo.strategy,
        label: 'Scales target with',
      };
    }

    if (slo.metrics) {
      for (const metric of slo.metrics) {
        edges[`edge_${metric}_${slo.id}`] = { source: metric, target: slo.id };
      }
    }
    if (slo.appliedTo) {
      for (const appliedTo of slo.appliedTo) {
        edges[`edge_${slo.id}_${appliedTo}`] = {
          source: slo.id,
          target: appliedTo,
          label: 'Applied to',
        };
      }
    }
  }

  yDistance = canvasHeight / (props.workspace.strategies.length + 1);
  nodeYPosition = yDistance;
  for (const strategy of props.workspace.strategies) {
    nodes[strategy.id] = {
      name: strategy.name,
      color: '#FFC000',
      textColor: colors.getPaletteColor('black'),
      polarisComponent: strategy,
    };
    nodePositions[strategy.id] = { x: 800, y: nodeYPosition };
    nodeYPosition = nodeYPosition + yDistance;
  }

  return { edges, nodes, nodePositions };
});

const graph = ref(null);
</script>
<style lang="scss">
// Fixes sizing problems
.v-network-graph {
  position: relative;
}
.v-canvas {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
}
.node-rect {
  transition: fill 0.1s linear, stroke 0.1s linear, stroke-width 0.1s linear,
    x 0.1s linear, y 0.1s linear, width 0.1s linear, height 0.1s linear;
}
</style>
