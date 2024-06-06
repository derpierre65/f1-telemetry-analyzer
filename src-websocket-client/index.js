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

    // f1Client.on(PACKETS.motion, (data) => socket.emit('emit', PACKETS.motion, data));
    f1Client.on(PACKETS.session, (data) => io.emit(PACKETS.session, data));
    f1Client.on(PACKETS.lapData, (data) => io.emit(PACKETS.lapData, data));
    f1Client.on(PACKETS.event, (data) => io.emit(PACKETS.event, data));
    f1Client.on(PACKETS.participants, (data) => io.emit(PACKETS.participants, data));
    // f1Client.on(PACKETS.carSetups, (data) => socket.emit('emit', PACKETS.carSetups, data));
    // f1Client.on(PACKETS.carTelemetry, (data) => socket.emit('emit', PACKETS.carTelemetry, data));
    // f1Client.on(PACKETS.carStatus, (data) => socket.emit('emit', PACKETS.carStatus, data));
    // f1Client.on(PACKETS.finalClassification, (data) => socket.emit('emit', PACKETS.finalClassification, data));
    f1Client.on(PACKETS.lobbyInfo, (data) => io.emit(PACKETS.lobbyInfo, data));
    f1Client.on(PACKETS.sessionHistory, (data) => io.emit(PACKETS.sessionHistory, data));
    f1Client.on(PACKETS.carDamage, (data) => io.emit(PACKETS.carDamage, data));
    f1Client.start();
  }
  catch (error) {
    console.error('Can\'t listen to the F1 Telemetry. Make sure your game is started. Retry again in 10 seconds.');
    setTimeout(() => startF1Client(), 10_000);
  }
}

startF1Client();

io.on('connection', () => {
  // do something here with the socket.
});

httpServer.listen(config.wsPort, '127.0.0.1');
console.log('F1 Telemetry Analyzer Client v1.0.0');
console.log(`WebSocket Server listening on 127.0.0.1:${config.wsPort}`);
