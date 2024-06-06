const { F1TelemetryClient, } = require('@racehub-io/f1-telemetry-client');
const { constants: { PACKETS, }, } = require('@racehub-io/f1-telemetry-client');
const { createServer, } = require('http');
const { Server, } = require('socket.io');
const fs = require('fs');
const httpServer = createServer();
const io = new Server(httpServer, {
  maxHttpBufferSize: 1e8,
  cors: {
    origin: true,
    credentials: true,
    methods: [
      'GET',
      'POST',
    ],
  },
});

let config = {
  wsPort: 3000,
  telemetryPort: 20777,
};

try {
  config = JSON.parse(fs.readFileSync('./config.json').toString());
}
catch (e) {
  fs.writeFileSync('./config.json', JSON.stringify({
    wsPort: 3000,
    telemetryPort: 20777,
  }));
}

BigInt.prototype.toJSON = function() {
  return this.toString();
};

function startF1Client() {
  try {
    const f1Client = new F1TelemetryClient({
      port: config.telemetryPort,
    });

    f1Client.on(PACKETS.motion, (data) => emitEvent(PACKETS.motion, data));
    f1Client.on(PACKETS.session, (data) => emitEvent(PACKETS.session, data));
    f1Client.on(PACKETS.lapData, (data) => emitEvent(PACKETS.lapData, data));
    f1Client.on(PACKETS.event, (data) => emitEvent(PACKETS.event, data));
    f1Client.on(PACKETS.participants, (data) => emitEvent(PACKETS.participants, data));
    f1Client.on(PACKETS.carSetups, (data) => emitEvent(PACKETS.carSetups, data));
    f1Client.on(PACKETS.carTelemetry, (data) => emitEvent(PACKETS.carTelemetry, data));
    f1Client.on(PACKETS.carStatus, (data) => emitEvent(PACKETS.carStatus, data));
    f1Client.on(PACKETS.finalClassification, (data) => emitEvent(PACKETS.finalClassification, data));
    f1Client.on(PACKETS.lobbyInfo, (data) => emitEvent(PACKETS.lobbyInfo, data));
    f1Client.on(PACKETS.sessionHistory, (data) => emitEvent(PACKETS.sessionHistory, data));
    f1Client.on(PACKETS.carDamage, (data) => emitEvent(PACKETS.carDamage, data));
    f1Client.start();
  }
  catch (error) {
    console.error('Can\'t listen to the F1 Telemetry. Make sure your game is started. Retry again in 10 seconds.');
    setTimeout(() => startF1Client(), 10_000);
  }
}

startF1Client();

const listenToEvents = {};

function emitEvent(eventName, data) {
  if (typeof listenToEvents[eventName] === 'undefined') {
    return;
  }

  io.emit(eventName, data);
}

function unbindEvent(event, value = 1) {
  if (typeof listenToEvents[event] === 'undefined') {
    return;
  }

  listenToEvents[event] -= value;
  if (listenToEvents[event] === 0) {
    delete listenToEvents[event];
  }
}

io.on('connection', (socket) => {
  socket.data.events = {};
  socket.on('disconnect', () => {
    for (const event of Object.keys(socket.data.events)) {
      unbindEvent(event, socket.data.events[event]);
    }
  });

  socket.on('listen', (events) => {
    for (const key of events) {
      if (typeof socket.data.events[key] === 'undefined') {
        socket.data.events[key] = 0;
      }
      socket.data.events[key]++;

      if (typeof listenToEvents[key] === 'undefined') {
        listenToEvents[key] = 0;
      }

      listenToEvents[key]++;
    }
  });
  socket.on('stopListening', (events) => {
    for (const key of events) {
      if (typeof socket.data.events[key] === 'undefined') {
        continue;
      }

      socket.data.events[key]--;

      if (socket.data.events[key] === 0) {
        delete socket.data.events[key];
      }

      unbindEvent(key);
    }
  });
});

httpServer.listen(config.wsPort, '127.0.0.1');
console.log('F1 Telemetry Analyzer Client v1.1.0');
console.log(`WebSocket Server listening on 127.0.0.1:${config.wsPort}`);
