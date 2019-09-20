import {EventEmitter} from 'events'
import BD from 'binary-data';

import WebSocket from 'ws';


const MESSAGE_CODES = {
  STATUS: 0,
  NEW_BLOCK_HASHES: 1,
  TX: 2,
  GET_BLOCK_HEADERS: 3,
  BLOCK_HEADERS: 4,
  GET_BLOCK_BODIES: 5,

  PREPARE_NEW_BLOCK: 6,
  BLOCK_VALID: 7,
  BLOCK_COMMIT: 8,
  NEW_BLOCK: 9,
  CHUNK_RECEIVE: 10
};

const MESSAGE_LABEL = {
  NEW_TX_CREATED: "NEW_TX_CREATED",
  PREPARE_NEW_BLOCK: "PREPARE_NEW_BLOCK",
  NEW_BLOCK_VALID: "NEW_BLOCK_VALID",
  NEW_BLOCK_COMMIT: "NEW_BLOCK_COMMIT",
  NEW_BLOCK_CREATED: "NEW_BLOCK_CREATED",
};
const MESSAGE_CODE = {
  [MESSAGE_CODES.BLOCK_VALID]: MESSAGE_LABEL.NEW_BLOCK_VALID,
  [MESSAGE_CODES.BLOCK_COMMIT]: MESSAGE_LABEL.NEW_BLOCK_COMMIT,
  [MESSAGE_CODES.PREPARE_NEW_BLOCK]: MESSAGE_LABEL.PREPARE_NEW_BLOCK,
};


const protocol = {
  code: BD.types.uint8,
  versionProtocol: BD.types.uint24le,
  sec: BD.types.uint8,
  countChunk: BD.types.uint24le,
  chunkNumber: BD.types.uint24le,
  length: BD.types.uint24le,
  payload: BD.types.buffer(({node}) => node.length)
};
const ChunkSize = 1000000;

let sec = 0;

function noop() {
}

class Server extends EventEmitter {
  constructor() {
    super();
  }

  versionProtocol = 1;
  EVENT_MESSAGES = MESSAGE_LABEL;

  chunks = {};


  create(options) {
    this.wss = new WebSocket.Server({port: 9000, maxPayload: 1000000000, ...options});
    this.wss.on('connection', (client, req) => {
      console.log("WS connection")
      client.ostream = BD.createEncode(protocol);
      client.istream = BD.createDecode(protocol);


      client._sendChunk = (sec, chunkNumber) => {
        if (!this.chunks[sec])
          return;
        const {countChunk, payload, code} = this.chunks[sec];
        if (chunkNumber >= countChunk)
          return delete this.chunks[sec];

        const data = payload.slice(chunkNumber * ChunkSize, Math.min((chunkNumber + 1) * ChunkSize, payload.length));

        if (client.readyState !== WebSocket.OPEN)
          return;

        client.ostream.write({
          code,
          sec,
          versionProtocol: this.versionProtocol,
          chunkNumber,
          countChunk,
          length: data.length,
          payload: data
        });


      };
      client._send = (code, payload) => {
        // console.log("send to ", req.connection.remoteAddress, code);
        sec++;
        if (sec >= 255) sec = 0;
        const countChunk = Math.ceil(payload.length / ChunkSize);

        this.chunks[sec] = {
          code,
          countChunk,
          payload
        };
        client._sendChunk(sec, 0);
      };
      const duplex = WebSocket.createWebSocketStream(client, {compress: false, binary: true});

      duplex.on('error', err => console.log(err));

      client.ostream.pipe(duplex);
      duplex.pipe(client.istream).on('data', packet => {
        const {code, sec, versionProtocol, length, payload, chunkNumber, countChunk} = packet;
        if (code === MESSAGE_CODES.CHUNK_RECEIVE)
          return client._sendChunk(sec, chunkNumber + 1);

        this.emit(MESSAGE_CODE[code], payload, client);
      });

      client.isAlive = true;
      client.on('pong', this._heartbeat.bind(client));
      client.on('error', err => console.log(4, err));

    });

    this.interval = setInterval(() => {
      this.wss.clients.forEach(client => {
        if (client.isAlive === false) return client.terminate();
        client.isAlive = false;
        client.ping(noop);
      });
    }, 30000);

  }

  _heartbeat() {
    this.isAlive = true;
  }

  _send(code, payload, client) {
    if (client)
      return client._send(code, payload);
    this.wss.clients.forEach(function each(client) {
        client._send(code, payload);
      }
    );
  }

  validateNewBlock(block, client) {
    this._send(MESSAGE_CODES.PREPARE_NEW_BLOCK, block, client);
  }

  getCountPeers() {

    return this.wss.clients.size;
  }
}

class Client extends EventEmitter {
  constructor() {
    super();
  }

  versionProtocol = 1;
  EVENT_MESSAGES = MESSAGE_LABEL;

  chunks = {};

  create(options) {
    console.log('WS client create')
    if (!options.uri)
      throw "Not found URI";

    this.ws = new WebSocket(options.uri);
    this.ws.on('open', () => {
      console.log("WS OPEN")
      this.ostream = BD.createEncode(protocol);
      this.istream = BD.createDecode(protocol);
      const duplex = WebSocket.createWebSocketStream(this.ws, {compress: false, binary: true, maxPayload: 1000000000});

      duplex.on('error', err => console.log(err));
      this.ostream.on('error', err => console.log(err));
      this.istream.on('error', err => console.log(err));


      this.ostream.pipe(duplex);
      duplex.pipe(this.istream).on('data', packet => {
        const {code, versionProtocol, length, payload, sec, chunkNumber, countChunk} = packet;
        if (countChunk === 1)
          return this.emit(MESSAGE_CODE[code], payload);

        if (!this.chunks[sec])
          this.chunks[sec] = [];

        this.chunks[sec].push(packet);
        this.ostream.write({
          code: MESSAGE_CODES.CHUNK_RECEIVE,
          sec,
          versionProtocol: this.versionProtocol,
          chunkNumber,
          countChunk,
          length: 0,
          payload: Buffer.from('')
        });

        if (this.chunks[sec].length !== countChunk)
          return;
        const data = this.chunks[sec].sort((a, b) => a.chunkNumber - b.chunkNumber).map(i => i.payload);
        const dataLength = this.chunks[sec].reduce((acc, val) => acc + val.length, 0);
        return this.emit(MESSAGE_CODE[code], Buffer.concat(data));
      });

      this._heartbeat();
    });
    this.ws.on('ping', this._heartbeat.bind(this));
    this.ws.on('error', err => {
      clearTimeout(this.pingTimeout);
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = setTimeout(() => {
        this.create(options);
      }, 1000)

    });
    this.ws.on('close', () => {
      console.log('close');
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = setTimeout(() => {
        this.create(options);
      }, 1000)

    });
  }

  _heartbeat() {
    clearTimeout(this.pingTimeout);
    this.pingTimeout = setTimeout(() => {
      this.ws.terminate();
    }, 30000 + 1000);
  }

  _send(code, payload) {
    this.ostream.write({
      code,
      versionProtocol: this.versionProtocol,
      length: payload.length,
      payload
    });
  }

  sendCommitBlock(block) {
    this._send(MESSAGE_CODES.BLOCK_COMMIT, block);
  }

  getCountPeers() {
    return this.ws.readyState !== WebSocket.OPEN ? 1 : 0
  }
}


const server = new Server();
const client = new Client();

export {
  server,
  client
};
