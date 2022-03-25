<script setup>
import { RouterView } from "vue-router";
import { computed, ref } from 'vue';
import AppIcon from '@/icons/AppIcon.vue';
import { Platform } from "quasar";

const isMini = ref(true);
const menuList = ref([
  {
    icon: "dashboard",
    label: "Dashboard",
    to: "/",
  },
  {
    icon: "settings",
    label: "Settings",
    to: "/settings",   
  }
]);
const isElectron = computed(() => {
  return Platform.is.electron;
});

function minimize() {
  if (isElectron.value) {
    window.polarisWindowAPI.minimize();
  }
}

function toggleMaximize() {
  if(isElectron.value) {
    window.polarisWindowAPI.toggleMaximize();
  }
}

function close() {
  if (isElectron.value) {
    window.polarisWindowAPI.close();
  }
}

function drawerClick(e) {
  if (!isElectron.value && isMini.value) {
    isMini.value = false;
  }
}
</script>

<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated v-if="isElectron">
      <q-bar class="q-electron-drag">
        <AppIcon />
        <q-space />
        <div>Polaris UI</div>
        <q-space />
        <q-btn dense flat icon="minimize" @click="minimize" />
        <q-btn dense flat icon="crop_square" @click="toggleMaximize" />
        <q-btn dense flat icon="close" @click="close" />
      </q-bar>
    </q-header>
    <q-header v-else>
      <q-toolbar>
        <AppIcon />
        <q-toolbar-title>Polaris UI</q-toolbar-title>
      </q-toolbar>
    </q-header>
    <q-drawer
      :modelValue="true"
      behavior="desktop"
      bordered
      :mini="isMini"
      @click.capture="drawerClick"
    >
      <q-scroll-area class="fit">
        <q-list>
          <q-item clickable v-ripple :to="item.to" v-for="(item, idx) in menuList" :key="idx">
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>
              {{ item.label }}
            </q-item-section>
            <ArrowTooltip v-if="isElectron" anchor="center end" self="center start" direction="left" :offset="[10, 14]">
              {{ item.label }}
            </ArrowTooltip>
          </q-item>
        </q-list>
      </q-scroll-area>
      <div class="q-mini-drawer-hide absolute" style="top: 15px; right: -17px">
          <q-btn
            dense
            round
            unelevated
            color="accent"
            icon="chevron_left"
            @click="isMini = true"
          />
        </div>
    </q-drawer>
    <q-page-container>
      <RouterView />
    </q-page-container>
  </q-layout>
</template>
