import net from 'net'
import {createInterface} from 'readline'

let i = 0;
let promises = {};
let socket = null;

function init() {
  let readline = createInterface({
    input: socket,
    output: socket
  });
  readline.on("line", result => {
    const res = JSON.parse(result),
      {messageId, payload, error} = res;
    const promise = promises[messageId];
    if (messageId && promise) {
      clearTimeout(promise.timeout);
      if (error)
        promise.reject(error);
      else
        promise.resolve(payload);

      delete promises[messageId];
    }
  });
}

function client() {
  socket = net.createConnection("/var/run/plasma.socket", init);
}

function timeout(reject) {
  return setTimeout(() => {
    reject("Timeout")
  }, 60000);
}

const promiseFromEvent = data => new Promise((resolve, reject) => {

  if (!socket) return reject("Plasma hasn't connected");
  i++;
  data.messageId = i;
  promises[i] = {resolve, reject, timeout: timeout(reject)};
  socket.write(JSON.stringify(data) + "\n");
});

export default promiseFromEvent;

export {
  client
};
