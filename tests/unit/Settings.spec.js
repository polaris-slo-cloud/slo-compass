import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { Quasar } from "quasar";
import Settings from "@/views/SettingsView.vue";

describe("Settings.vue", () => {
    let wrapper;
    beforeEach(() => {
        wrapper = mount(Settings,  {
            global: {
                plugins: [Quasar],
            },
        });
    });
    afterEach(() => {
        wrapper.unmount();
    });

    test("can render", () => {
        expect(Settings).toBeTruthy();
        expect(wrapper.vm).toBeTruthy();
    });
});