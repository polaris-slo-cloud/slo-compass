<template>
  <div class="column graph-wrapper">
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
          <div xmlns="http://www.w3.org/1999/xhtml" class="row items-center justify-center full-height">
            <span
              xmlns="http://www.w3.org/1999/xhtml"
              v-text="text"
              class="text-center"
              :style="`color: ${config.color}; font-size: ${config.fontSize * scale}px`"
            ></span>
          </div>
        </foreignObject>
      </template>
      <template #edge-label="{ edge, ...slotProps }">
        <v-edge-label :text="edge.label" align="center" vertical-align="above" v-bind="slotProps" v-if="edge.label" />
      </template>
    </v-network-graph>
    <WorkspaceFilter class="filter-bar" v-model="filter" />
    <q-card class="zoom-bar">
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
import { useWorkspaceStore } from '@/store/workspace';
import { ForceLayout } from 'v-network-graph/lib/force-layout';
import WorkspaceFilter from '@/workspace/WorkspaceFilter.vue';
import { workspaceItemTypes } from '@/workspace/constants';
import { getComplianceColor } from '@/workspace/slo/Slo';

const store = useWorkspaceStore();
const props = defineProps({
  selectedComponent: Object,
});
const emit = defineEmits(['update:selectedComponent']);

const filter = ref({
  targetTypes: Object.values(workspaceItemTypes.targets),
  targets: [],
});

const selectedNodes = computed({
  get() {
    return props.selectedComponent ? [props.selectedComponent.id] : [];
  },
  set(value) {
    if (value.length == 0) {
      emit('update:selectedComponent', null);
    } else {
      emit('update:selectedComponent', data.value.nodes[value[0]].polarisComponent);
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
    Available: 'green',
    Processing: 'orange',
    NotFound: 'red',
  };
  const colorName = map[status] ?? 'grey';
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
      selectable: 1,
      normal: {
        type: 'rect',
        borderRadius: 5,
        color: (node) => node.color || colors.getPaletteColor('primary'),
        strokeColor: (node) =>
          node.color === colors.getPaletteColor('white')
            ? colors.getPaletteColor('black')
            : node.color || colors.getPaletteColor('primary'),
        strokeWidth: 2,
        width: 100,
        height: 50,
      },
      hover: {
        width: 110,
        height: 55,
        color: (node) => colors.lighten(node.color || colors.getPaletteColor('primary'), -15),
        strokeColor: (node) =>
          node.color === colors.getPaletteColor('white')
            ? colors.getPaletteColor('black')
            : colors.lighten(node.color || colors.getPaletteColor('primary'), -15),
      },
      selected: {
        borderRadius: 5,
        color: (node) => colors.lighten(node.color || colors.getPaletteColor('primary'), -15),
        strokeColor: (node) =>
          node.color === colors.getPaletteColor('white')
            ? colors.getPaletteColor('black')
            : colors.lighten(node.color || colors.getPaletteColor('primary'), -15),
        strokeWidth: 2,
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

const filteredTargets = computed(() =>
  store.targets.filter(
    (x) =>
      filter.value.targetTypes.includes(x.type) &&
      (filter.value.targets.length === 0 || filter.value.targets.includes(x.id))
  )
);
const filteredTargetIds = computed(() => filteredTargets.value.map((x) => x.id));
const filteredSlos = computed(() => store.slos.filter((x) => !x.target || filteredTargetIds.value.includes(x.target)));

const data = computed(() => {
  const edges = {};
  const nodes = {};

  for (const target of filteredTargets.value) {
    nodes[target.id] = {
      name: target.name,
      type: target.type,
      color: colors.getPaletteColor('white'),
      textColor: colors.getPaletteColor('black'),
      statusColor: getStatusColor(target.deployment?.status),
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

  for (const slo of filteredSlos.value) {
    nodes[slo.id] = {
      name: slo.name,
      color: colors.getPaletteColor('blue'),
      statusColor: getComplianceColor(slo),
      polarisComponent: slo,
    };
    if (slo.elasticityStrategy) {
      edges[`edge_${slo.id}_${slo.elasticityStrategy.id}`] = {
        source: slo.id,
        target: slo.elasticityStrategy.id,
        label: 'Scales target with',
      };
    }

    if (slo.target) {
      edges[`edge_${slo.target}_${slo.id}`] = {
        source: slo.target,
        target: slo.id,
      };
    }
  }

  for (const strategy of store.elasticityStrategies) {
    nodes[strategy.id] = {
      name: strategy.name,
      color: colors.getPaletteColor('amber'),
      textColor: colors.getPaletteColor('black'),
      polarisComponent: strategy,
    };
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
  transition: fill 0.1s linear, stroke 0.1s linear, stroke-width 0.1s linear, x 0.1s linear, y 0.1s linear,
    width 0.1s linear, height 0.1s linear;
}
.graph-wrapper {
  position: relative;
  .filter-bar {
    position: absolute !important;
    top: 10px;
    left: 10px;
  }

  .zoom-bar {
    position: absolute !important;
    bottom: 10px;
    right: 10px;
  }
}
</style>
