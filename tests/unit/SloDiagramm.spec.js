import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { Quasar } from "quasar";
import VNetworkGraph from "v-network-graph";
import SloDiagramm from "@/components/SloDiagramm.vue";

describe("SloDiagramm.vue", () => {
    let wrapper;
    beforeEach(() => {
        wrapper = mount(SloDiagramm,  {
            global: {
                plugins: [Quasar, VNetworkGraph],
            },
        });
    });
    afterEach(() => {
        wrapper.unmount();
    });

    test("can render", () => {
        expect(SloDiagramm).toBeTruthy();
        expect(wrapper.vm).toBeTruthy();
    });
});