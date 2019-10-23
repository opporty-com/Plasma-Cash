import net from 'net'
import BD from 'binary-data';
import { PROTOCOLS as API_PROTOCOLS } from "../schemas/api-protocols";

let i = 0;
let promises = {};
let socket = null;

const TransactionProtocol = {
  prevHash: BD.types.buffer(20),
  prevBlock: BD.types.uint24le,
  tokenId: BD.types.string(null),
  type: BD.types.uint8,
  newOwner: BD.types.buffer(20),
  dataLength: BD.types.uint24le,
  data: BD.types.buffer(({current}) => current.dataLength),
  signature: BD.types.buffer(65),
  hash: BD.types.buffer(32),
  blockNumber: BD.types.uint24le,
  timestamp: BD.types.uint48le,
};

const baseProtocol = {
  type: BD.types.uint8,
  messageId: BD.types.uint24le,
  error: BD.types.uint8,
  length: BD.types.uint24le,
  payload: BD.types.buffer(({node}) => node.length)
};


let ostream = BD.createEncode(baseProtocol);
const istream = BD.createDecode(baseProtocol);

function client() {
  socket = net.createConnection("/var/run/plasma.socket", () => {
    ostream.pipe(socket);
    socket.pipe(istream).on('data', packet => {
      const {type, messageId, payload, error} = packet;
      const actions = Object.keys(API_PROTOCOLS);
      const act = actions.find(act => API_PROTOCOLS[act].type === type);
      let data = BD.decode(payload, API_PROTOCOLS[act].response);

      const promise = promises[messageId];
      if (messageId && promise) {
        clearTimeout(promise.timeout);
        if (error)
          promise.reject(data);
        else
          promise.resolve(data);

        delete promises[messageId];
      }
    });
  });

}

function timeout(reject) {
  return setTimeout(() => {
    reject("Timeout")
  }, 6000000);
}

const promise = data => new Promise((resolve, reject) => {
  if (!socket) return reject("Plasma hasn't connected");
  i++;

  const packet = {
    type: 9,
    error: 0,
    messageId: i,
    length: data.length,
    payload: data
  };
  promises[i] = {resolve, reject, timeout: timeout(reject)};
  ostream.write(packet);
});

export {
  client,
  promise
};

