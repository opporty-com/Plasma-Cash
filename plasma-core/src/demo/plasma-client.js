import net from 'net'
import BD from 'binary-data';

let i = 0;
let promises = {};
let socket = null;


const protocol = {
  type: BD.types.uint8,
  messageId: BD.types.uint24le,
  error: BD.types.uint8,
  length: BD.types.uint24le,
  value: BD.types.buffer(({node}) => node.length)
};


let ostream = BD.createEncode(protocol);
const istream = BD.createDecode(protocol);

function client() {
  socket = net.createConnection("/var/run/plasma.socket", () => {
    ostream.pipe(socket);
    socket.pipe(istream).on('data', packet => {
      const {type, messageId, value, error} = packet;
      const promise = promises[messageId];
      if (messageId && promise) {
        clearTimeout(promise.timeout);
        if (error)
          promise.reject(value);
        else
          promise.resolve(value);

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
    type: 1,
    error: 0,
    messageId: i,
    length: data.length,
    value: data
  };
  promises[i] = {resolve, reject, timeout: timeout(reject)};
  ostream.write(packet);
});




export {
  client,
  promise
};
