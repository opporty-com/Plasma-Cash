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
};

const MESSAGE_LABEL = {
  NEW_TX_CREATED: "NEW_TX_CREATED",
  PREPARE_NEW_BLOCK: "PREPARE_NEW_BLOCK",
  NEW_BLOCK_VALID: "NEW_BLOCK_VALID",
  NEW_BLOCK_COMMIT: "NEW_BLOCK_COMMIT",
  NEW_BLOCK_CREATED: "NEW_BLOCK_CREATED",
};
const MESSAGE_CODE = {
  [MESSAGE_CODES.BLOCK_VALID]: MESSAGE_LABEL.NEW_BLOCK_VALID
};

const protocol = {
  code: BD.types.uint8,
  versionProtocol: BD.types.uint24le,
  length: BD.types.uint24le,
  payload: BD.types.buffer(({node}) => node.length)
};


class Server extends EventEmitter {
  constructor() {
    super();
  }

  versionProtocol = 1;
  EVENT_MESSAGES = MESSAGE_LABEL;

  create(options) {
    this.wss = new WebSocket.Server({port: 9000, ...options});
    this.wss.on('connection', (client) => {
      client.ostream = BD.createEncode(protocol);
      client.istream = BD.createDecode(protocol);
      client._send = (code, payload) => {
        if (client.readyState !== WebSocket.OPEN)
          return;
        client.ostream.write({
          code,
          versionProtocol: this.versionProtocol,
          length: payload.length,
          payload
        });
      };
      const duplex = WebSocket.createWebSocketStream(client);
      client.ostream.pipe(duplex);
      duplex.pipe(client.istream).on('data', packet => {
        const {code, versionProtocol, length, payload} = packet;
        this.emit(MESSAGE_CODE[code], payload, client);
      })
    });
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
    return this.wss.clients.length
  }
}

class Client extends EventEmitter {
  constructor() {
    super();
  }

  versionProtocol = 1;
  EVENT_MESSAGES = MESSAGE_LABEL;

  create(options) {
    if (!options.uri)
      throw "Not found URI";

    this.ws = new WebSocket(options.uri);
    this.ostream = BD.createEncode(protocol);
    this.istream = BD.createDecode(protocol);
    const duplex = WebSocket.createWebSocketStream(this.ws);

    this.ostream.pipe(duplex);
    duplex.pipe(this.istream).on('data', packet => {
      const {code, versionProtocol, length, payload} = packet;
      this.emit(MESSAGE_CODE[code], payload);
    });
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
}


const server = new Server();
const client = new Client();

export {
  server,
  client
};
