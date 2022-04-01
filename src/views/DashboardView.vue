<script setup>
  import { onMounted } from '@vue/runtime-core';
  import { fabric } from 'fabric'
  function createComponent(name) {
    const text = new fabric.Text(name, {
      originX: 'center',
      originY: 'center',
      fontSize: 20,
    });    
    
    const componentWidth = text.width + 10;
    const componentHeight = text.height + 10;
    text.left = 0.5 * componentWidth;
    text.top = 0.5 * componentHeight;

    const rect = new fabric.Rect({
        fill: '#5afffa',
        stroke: '#666',
        borderColor: 'black',
        cornerColor: 'black',
        height: componentHeight,
        width: componentWidth,
    });

    return new fabric.Group([rect, text]);
  }

  function getLineX(component) {
    return component.left + component.width * 0.5;
  }

  function getLineY(component) {
    return component.top + component.height * 0.5;
  }

  function createLink(comp1, comp2) {
    const line = new fabric.Line([getLineX(comp1), getLineY(comp1), getLineX(comp2), getLineY(comp2)], {
      stroke: 'green',
      evented: false,
    });
    
    comp1.lineStarts = comp1.lineStarts ? [...comp1.lineStarts, line] : [line];
    comp2.lineEnds = comp2.lineEnds ? [...comp2.lineEnds, line] : [line];

    return line;
  }

  onMounted(() => {
    const canvas = new fabric.Canvas("canvas", { width: 1200, height: 900 });
    const comp = createComponent("Metrics Controller");
    comp.top = 15;
    comp.left = 15;
    const comp2 = createComponent("SLO Controller");
    comp2.top = 50;
    comp2.left = 250;
    const line = createLink(comp, comp2);
    canvas.add(comp);
    canvas.add(comp2);
    canvas.add(line);
    canvas.sendToBack(line);

    canvas.on("object:moving", (e) => {
      const component = e.target;
      if(component.lineStarts) {
        component.lineStarts.forEach(line => {
          line.set({ x1: getLineX(component), y1: getLineY(component) });
        });
      }
      if(component.lineEnds) {
        component.lineEnds.forEach(line => {
          line.set({ x2: getLineX(component), y2: getLineY(component) });
        });
      }
      canvas.renderAll();
    });
  });
</script>

<template>
  <main class="canvas-wrapper">
    <canvas id="canvas" class="canvas"></canvas>
  </main>
</template>

<style lang="scss" scoped>
  .canvas-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
