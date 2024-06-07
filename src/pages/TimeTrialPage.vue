<template>
  <q-page class="q-pa-md">
    <div class="tw-flex tw-gap-4">
      <div class="tw-flex-auto">
        <q-table
          :rows="laps"
          :rows-per-page-options="rowsPerPageOptions"
          :columns
          class="tw-w-full"
          flat
          dense
        />
      </div>
      <div>
        <q-card class="tw-sticky tw-top-28" flat>
          <q-card-section>
            {{ t('time_trial.stats.best_lap_time') }}: <strong>{{ formatTimestamp(bestLapTime) }}</strong><br>
            {{ t('time_trial.stats.average_time') }}: <strong>{{ formatTimestamp(averageLapTime) }}</strong><br>
            {{ t('time_trial.stats.possible_best_time') }}: <strong>{{ formatTimestamp(bestSector1 + bestSector2 + bestSector3) }}</strong>
          </q-card-section>
          <q-card-actions>
            <input v-show="false" ref="fileInput" type="file" accept="text" @change="loadFile">
            <q-btn :label="$t('global.load')" color="green" icon="fas fa-upload" no-caps @click="load" />
            <q-btn
              v-if="laps.length"
              :label="$t('global.save')"
              icon="fas fa-save"
              color="green"
              no-caps
              @click="save"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { type QTableProps, useQuasar } from 'quasar';
import { formatTimestamp } from 'src/utils/type-helpers/math';
import type { LapHistoryData, PacketSessionHistoryData } from '@racehub-io/f1-telemetry-client/build/main/parsers/packets/types';
import { useTranslation } from 'i18next-vue';
import { useTelemetryClient } from 'src/composables/telemetry-client';
import { PACKETS } from '@racehub-io/f1-telemetry-client/build/main/constants';
defineOptions({
  name: 'IndexPage',
});

//#region Composable & Prepare
const q = useQuasar();
const { t, } = useTranslation();
useTelemetryClient({
  [PACKETS.sessionHistory]: onSessionHistory,
});
//#endregion

//#region Data
const requiredKeys = [
  'm_sector1TimeInMS',
  'm_sector2TimeInMS',
  'm_sector3TimeInMS',
  'm_lapTimeInMS',
  'm_lapValidBitFlags',
];
const fileInput = ref<HTMLInputElement>();
const laps = ref<LapHistoryData[]>([]);
const rowsPerPageOptions = ref([
  25,
  50,
  100,
]);
//#endregion

//#region Computed
const columns = computed(() => {
  return [
    {
      label: t('time_trial.columns.lap'),
      name: 'lap',
      field: 'lap',
      headerClasses: 'tw-w-8',
    },
    {
      label: 'S1',
      name: 'm_sector1TimeInMS',
      classes: (lap: LapHistoryData) => (lap.m_sector1TimeInMS === bestSector1.value ? '!tw-bg-purple-500' : ''),
      field: (lap: LapHistoryData) => formatTimestamp(lap.m_sector1TimeInMS),
      sortable: true,
    },
    {
      label: 'S2',
      name: 'm_sector2TimeInMS',
      classes: (lap: LapHistoryData) => (lap.m_sector2TimeInMS === bestSector2.value ? '!tw-bg-purple-500' : ''),
      field: (lap: LapHistoryData) => formatTimestamp(lap.m_sector2TimeInMS),
      sortable: true,
    },
    {
      label: 'S3',
      name: 'm_sector3TimeInMS',
      classes: (lap: LapHistoryData) => (lap.m_sector3TimeInMS === bestSector3.value ? '!tw-bg-purple-500' : ''),
      field: (lap: LapHistoryData) => formatTimestamp(lap.m_sector3TimeInMS),
      sortable: true,
    },
    {
      label: t('time_trial.columns.lap_time'),
      name: 'm_lapTimeInMS',
      classes: (lap: LapHistoryData) => (lap.m_lapTimeInMS === bestLapTime.value ? '!tw-bg-purple-500' : ''),
      field: (lap: LapHistoryData) => formatTimestamp(lap.m_lapTimeInMS),
      sortable: true,
    },
  ] as QTableProps['columns'];
});
const bestSector1 = computed(() => laps.value.reduce(getBestTime('m_sector1TimeInMS'), 0));
const bestSector2 = computed(() => laps.value.reduce(getBestTime('m_sector2TimeInMS'), 0));
const bestSector3 = computed(() => laps.value.reduce(getBestTime('m_sector3TimeInMS'), 0));
const bestLapTime = computed(() => laps.value.reduce(getBestTime('m_lapTimeInMS'), 0));
const averageLaps = computed(() => laps.value.filter((lap) => lap.m_lapTimeInMS < bestLapTime.value + 8 * 1_000));
const averageLapTime = computed(() => {
  if (averageLaps.value.length === 0) {
    return 0;
  }

  return Math.ceil(averageLaps.value.reduce((previous, lap) => previous + lap.m_lapTimeInMS, 0) / averageLaps.value.length);
});
//#endregion

//#region Watch
//#endregion

//#region Lifecycle Events
//#endregion

//#region Methods
function onSessionHistory(data: PacketSessionHistoryData) {
  if (data.m_carIdx !== 0) {
    return;
  }

  const newLaps = [];
  let lapId = 1;
  // TODO need to check if someone drives more than 100 rounds in one session
  for (const lapInfo of data.m_lapHistoryData) {
    const lapTime = lapInfo.m_lapTimeInMS;
    const lapTimeAllSectors = lapInfo.m_sector1TimeInMS + lapInfo.m_sector2TimeInMS + lapInfo.m_sector3TimeInMS;
    if (lapInfo.m_lapTimeInMS > 0 && Math.abs(lapTime - lapTimeAllSectors) < 500) {
      newLaps.push({
        lap: lapId,
        ...lapInfo,
      });
      lapId++;
    }
  }

  laps.value = newLaps;

  console.log('onSessionHistory', data);
}

function getBestTime(key: keyof LapHistoryData) {
  return (previous: number, lap: LapHistoryData): number => {
    if (lap[key] === 0) {
      return previous;
    }

    return (previous === 0 ? lap[key] : Math.min(lap[key] || previous, previous)) || 0;
  };
}
function load() {
  fileInput.value!.click();
}

function loadFile(event) {
  console.log('loadFile');
  q.loading.show({
    group: 'importing',
  });
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const possibleObject = JSON.parse(reader.result);
      if (!Array.isArray(possibleObject)) {
        throw new Error('is not an array.');
      }

      for (const element of possibleObject) {
        for (const key of requiredKeys) {
          if (typeof element[key] === 'undefined') {
            throw new Error(`Missing key ${key}`);
          }
        }
      }

      laps.value = possibleObject;

      q.notify({
        color: 'positive',
        message: t('time_trial.import_success'),
      });
    }
    catch (error) {
      q.notify({
        color: 'red',
        message: t('time_trial.import_invalid'),
      });
    }

    q.loading.hide('importing');
    fileInput.value!.value = '';
  };
  reader.readAsText(event.target.files[0]);
}
function save() {
  const link = document.createElement('a');
  const file = new Blob([ JSON.stringify(laps.value), ], {
    type: 'text/plain',
  });
  link.href = URL.createObjectURL(file);
  link.download = 'time_trial.txt'; // TODO add map name
  link.click();
  URL.revokeObjectURL(link.href);
}
//#endregion

//#region Created
//#endregion
</script>
