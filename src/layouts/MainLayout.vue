<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          F1 Telemetry Analyzer
        </q-toolbar-title>

        <div>v{{ version }}</div>
      </q-toolbar>
      <q-tabs align="left">
        <q-route-tab :label="$t('menu.time_trial')" :to="{name: 'time-trial'}" />
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
defineOptions({
  name: 'MainLayout',
});

const version = import.meta.env.VITE_VERSION;
</script>
