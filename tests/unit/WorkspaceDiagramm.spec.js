import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { Quasar } from 'quasar';
import VNetworkGraph from 'v-network-graph';
import { createTestingPinia } from '@pinia/testing';
import sinon from 'sinon';
import SloDiagramm from '@/workspace/WorkspaceDiagramm.vue';

describe('WorkspaceDiagramm.vue', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(SloDiagramm, {
      global: {
        plugins: [Quasar, VNetworkGraph, createTestingPinia({ createSpy: sinon.spy })],
      },
    });
  });
  afterEach(() => {
    wrapper.unmount();
  });

  test('can render', () => {
    expect(SloDiagramm).toBeTruthy();
    expect(wrapper.vm).toBeTruthy();
  });
});
