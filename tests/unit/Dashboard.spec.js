import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import Dashboard from "@/views/DashboardView.vue";

describe("DashboardView.vue", () => {
    let wrapper;
    beforeEach(() => {
        wrapper = mount(Dashboard, {});
    });
    afterEach(() => {
        wrapper.unmount();
    });

    test("can render", () => {
        expect(Dashboard).toBeTruthy();
        expect(wrapper.vm).toBeTruthy();
    });
});