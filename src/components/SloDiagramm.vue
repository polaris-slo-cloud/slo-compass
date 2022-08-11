<template>
  <div class="column">
    <v-network-graph
      :nodes="data.nodes"
      :edges="data.edges"
      :configs="configs"
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
import { computed, ref, reactive, watch } from 'vue';
import { colors } from 'quasar';
import * as vNG from 'v-network-graph';
import { useWorkspaceStore } from '@/store';
import { ForceLayout } from 'v-network-graph/lib/force-layout';

const store = useWorkspaceStore();
const props = defineProps({
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

function onForceLayoutEnd() {
  configs.view.layoutHandler = new vNG.SimpleLayout();
  fitToContents();
}

const forceLayout = new ForceLayout({
  positionFixedByDrag: false,
  positionFixedByClickWithAltKey: true,
  createSimulation: (d3, nodes, edges) => {
    const forceLink = d3.forceLink(edges).id((d) => d.id);
    return d3
      .forceSimulation(nodes)
      .force('edge', forceLink.distance(125).strength(0.2))
      .force('charge', d3.forceManyBody())
      .force('collide', d3.forceCollide(125).strength(0.2))
      .alphaMin(0.1)
      .on('tick', fitToContents)
      .on('end', onForceLayoutEnd);
  },
});

const configs = reactive(
  vNG.defineConfigs({
    view: {
      maxZoomLevel: 16,
      scalingObjects: true,
      autoPanAndZoomOnLoad: 'fit-content',
      layoutHandler: forceLayout,
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
  })
);
const data = computed(() => {
  const edges = {};
  const nodes = {};

  if (store.workspace.targets) {
    for (const target of store.workspace.targets) {
      nodes[target.id] = {
        name: target.name,
        type: target.type,
        color: colors.getPaletteColor('white'),
        textColor: colors.getPaletteColor('black'),
        statusColor: getStatusColor(target.status),
        polarisComponent: target,
      };
      if (target.components) {
        for (const child of target.components) {
          edges[`edge_${target.id}_${child}`] = {
            source: target.id,
            target: child,
            dashed: true,
          };
        }
      }
    }
  }

  if (store.workspace.slos) {
    for (const slo of store.workspace.slos) {
      nodes[slo.id] = {
        name: slo.name,
        color: colors.getPaletteColor('blue'),
        polarisComponent: slo,
      };
      if (slo.strategy) {
        edges[`edge_${slo.id}_${slo.strategy}`] = {
          source: slo.id,
          target: slo.strategy,
          label: 'Scales target with',
        };
      }

      if (slo.targets) {
        for (const target of slo.targets) {
          edges[`edge_${target}_${slo.id}`] = {
            source: target,
            target: slo.id,
          };
        }
      }
    }
  }

  if (store.workspace.strategies) {
    for (const strategy of store.workspace.strategies) {
      nodes[strategy.id] = {
        name: strategy.name,
        color: '#FFC000',
        textColor: colors.getPaletteColor('black'),
        polarisComponent: strategy,
      };
    }
  }

  return { edges, nodes };
});

const graph = ref(null);

const nodeCount = computed(() => Object.keys(data.value.nodes).length);
watch(nodeCount, (value, oldValue) => {
  if (value === oldValue) {
    return;
  }
  configs.view.layoutHandler = forceLayout;
});
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
