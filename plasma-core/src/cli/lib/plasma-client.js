import net from 'net'
import BD from 'binary-data';
import { PROTOCOLS as API_PROTOCOLS } from "../../schemas/api-protocols";

let i = 0;
let promises = {};
let socket = null;

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
          promise.reject(data.message);
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
  const type = API_PROTOCOLS[data.action].type;
  const protocol = API_PROTOCOLS[data.action].request;

  const stream = BD.encode(data.payload, protocol);
  const payload = stream.slice();
  const packet = {
    type,
    error: 0,
    messageId: i,
    length: BD.encodingLength(data.payload, protocol),
    payload
  };
  promises[i] = {resolve, reject, timeout: timeout(reject)};
  ostream.write(packet);
});

export {
  client,
  promise
};
