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
  seq: BD.types.uint8,
  countChunk: BD.types.uint24le,
  chunkNumber: BD.types.uint24le,
  length: BD.types.uint24le,
  payload: BD.types.buffer(({node}) => node.length)
};
const ChunkSize = 1000000;

let seq = 0;

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


      client._sendChunk = (seq, chunkNumber) => {
        if (!this.chunks[seq])
          return;
        const {countChunk, payload, code} = this.chunks[seq];
        if (chunkNumber >= countChunk)
          return delete this.chunks[seq];

        const data = payload.slice(chunkNumber * ChunkSize, Math.min((chunkNumber + 1) * ChunkSize, payload.length));

        if (client.readyState !== WebSocket.OPEN)
          return;

        client.ostream.write({
          code,
          seq,
          versionProtocol: this.versionProtocol,
          chunkNumber,
          countChunk,
          length: data.length,
          payload: data
        });


      };
      client._send = (code, payload) => {
        // console.log("send to ", req.connection.remoteAddress, code);
        seq++;
        if (seq >= 255) seq = 0;
        const countChunk = Math.ceil(payload.length / ChunkSize);

        this.chunks[seq] = {
          code,
          countChunk,
          payload
        };
        client._sendChunk(seq, 0);
      };
      const duplex = WebSocket.createWebSocketStream(client, {compress: false, binary: true});

      duplex.on('error', err => console.log(err));

      client.ostream.pipe(duplex);
      duplex.pipe(client.istream).on('data', packet => {
        const {code, seq, versionProtocol, length, payload, chunkNumber, countChunk} = packet;
        if (code === MESSAGE_CODES.CHUNK_RECEIVE)
          return client._sendChunk(seq, chunkNumber + 1);

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

  wss = [];

  create(options) {
    console.log('WS client create')
    if (!options.uri)
      throw "Not found URI";

    console.log(options.uri);
    console.log(Array.isArray(options.uri));
    const uris = Array.isArray(options.uri) ? options.uri : [options.uri];

    for (const uri of uris)
      this._connect({...options, uri})

  }

  _connect(options) {
    this.wss = this.wss.filter(ws => ws._uri !== options.uri);

    const ws = new WebSocket(options.uri);
    ws._uri = options.uri;
    ws.chunks = {};

    ws.on('open', () => {
      console.log(`WS OPEN ${ options.uri}`);
      ws.ostream = BD.createEncode(protocol);
      ws.istream = BD.createDecode(protocol);
      const duplex = WebSocket.createWebSocketStream(ws, {compress: false, binary: true, maxPayload: 1000000000});

      duplex.on('error', err => console.log(err));
      ws.ostream.on('error', err => console.log(err));
      ws.istream.on('error', err => console.log(err));


      ws.ostream.pipe(duplex);
      duplex.pipe(ws.istream).on('data', packet => {
        const {code, versionProtocol, length, payload, seq, chunkNumber, countChunk} = packet;
        if (countChunk === 1)
          return this.emit(MESSAGE_CODE[code], payload);

        if (!ws.chunks[seq])
          ws.chunks[seq] = [];

        ws.chunks[seq].push(packet);
        ws.ostream.write({
          code: MESSAGE_CODES.CHUNK_RECEIVE,
          seq,
          versionProtocol: this.versionProtocol,
          chunkNumber,
          countChunk,
          length: 0,
          payload: Buffer.from('')
        });

        if (ws.chunks[seq].length !== countChunk)
          return;
        const data = ws.chunks[seq].sort((a, b) => a.chunkNumber - b.chunkNumber).map(i => i.payload);
        const dataLength = ws.chunks[seq].reduce((acc, val) => acc + val.length, 0);
        delete  ws.chunks[seq];

        return this.emit(MESSAGE_CODE[code], Buffer.concat(data));
      });

      this._heartbeat.bind(ws)();
    });
    ws.on('ping', this._heartbeat.bind(ws));
    ws.on('error', err => {
      clearTimeout(ws.pingTimeout);
      clearTimeout(ws.reconnectTimeout);
      ws.reconnectTimeout = setTimeout(() => {
        this._connect(options);
      }, 1000)

    });
    ws.on('close', () => {
      console.log(`WS CLOSE ${ options.uri}`);
      clearTimeout(ws.reconnectTimeout);
      this.reconnectTimeout = setTimeout(() => {
        this._connect(options);
      }, 1000)

    });

    this.wss.push(ws);
  }

  _heartbeat() {
    clearTimeout(this.pingTimeout);
    this.pingTimeout = setTimeout(() => {
      this.terminate();
    }, 30000 + 10000);
  }

  _send(code, payload) {
    for (const ws of this.wss)
      ws.ostream.write({
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
    return this.wss.length;
  }
}


const server = new Server();
const client = new Client();

export {
  server,
  client
};
