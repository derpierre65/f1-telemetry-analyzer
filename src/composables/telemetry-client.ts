import type {
  CarDamageData,
  CarStatusData,
  CarTelemetryData,
  FinalClassificationData,
  LapData,
  LobbyInfoData,
  MotionData,
  PacketCarSetupData,
  PacketEvent,
  PacketMotionExData,
  PacketParticipantsData,
  PacketSessionData,
  PacketSessionHistoryData,
  PacketTyreSetsData,
} from '@racehub-io/f1-telemetry-client/build/main/parsers/packets/types';
import { onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io';

type PacketMethods = {
  motion?: (data: MotionData) => void;
  session?: (data: PacketSessionData) => void;
  lapData?: (data: LapData) => void;
  event?: (data: PacketEvent) => void;
  participants?: (data: PacketParticipantsData) => void;
  carSetups?: (data: PacketCarSetupData) => void;
  carTelemetry?: (data: CarTelemetryData) => void;
  carStatus?: (data: CarStatusData) => void;
  finalClassification?: (data: FinalClassificationData) => void;
  lobbyInfo?: (data: LobbyInfoData) => void;
  carDamage?: (data: CarDamageData) => void;
  sessionHistory?: (data: PacketSessionHistoryData) => void;
  tyreSets?: (data: PacketTyreSetsData) => void;
  motionEx?: (data: PacketMotionExData) => void;
};

let socket: Socket | null = null;
let socketConnected = false;

function useTelemetryClient(packets: { [K in keyof PacketMethods]: PacketMethods[K] }) {
  //#region Composable & Prepare

  //#endregion

  //#region Data
  //#endregion

  //#region Computed
  //#endregion

  //#region Watch
  //#endregion

  //#region Lifecycle Events
  onMounted(bindEvents);
  onUnmounted(unbindEvents);
  //#endregion

  //#region Methods
  function unbindEvents() {
    if (!socket) {
      return;
    }

    socket.off('connect', bindEvents);

    for (const key of Object.keys(packets)) {
      console.debug(`[TelemetryClient] Unbind ${key}`);
      socket.off(key, packets[key]);
    }
  }
  function bindEvents() {
    if (!socketConnected || !socket) {
      return;
    }

    socket.off('connect', bindEvents);

    for (const key of Object.keys(packets)) {
      console.debug(`[TelemetryClient] listen to ${key}`);
      socket?.on(key, packets[key]);
    }
  }
  //#endregion

  //#region Created
  if (!socket) {
    socket = io('ws://127.0.0.1:3000'); // TODO add configuration for url/port
    socket.on('connect', () => socketConnected = true);
    socket.on('disconnect', () => socketConnected = false);
    socket.on('connect', bindEvents);
  }
  //#endregion
}

export {
  useTelemetryClient,
};
