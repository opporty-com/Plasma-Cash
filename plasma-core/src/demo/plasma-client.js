import net from 'net'
import * as RLP from 'rlp'
import ethUtil from "ethereumjs-util";

import BD from 'binary-data';


import {createInterface} from 'readline'

import Networker from '../child-chain/socketServer/protocol'

let i = 0;
let promises = {};
let socket = null;

// function init() {
//
//   let readline = createInterface({
//     input: socket,
//     output: socket
//   });
//   readline.on("line", result => {
//     const res = JSON.parse(result),
//       {messageId, payload, error} = res;
//     const promise = promises[messageId];
//     if (messageId && promise) {
//       clearTimeout(promise.timeout);
//       if (error)
//         promise.reject(error);
//       else
//         promise.resolve(payload);
//
//       delete promises[messageId];
//     }
//   });
// }
//
// function client() {
//   socket = net.createConnection("/var/run/plasma.socket", init);
// }
//
// function timeout(reject) {
//   return setTimeout(() => {
//     reject("Timeout")
//   }, 6000000);
// }
//
// const promise = data => new Promise((resolve, reject) => {
//
//   if (!socket) return reject("Plasma hasn't connected");
//   i++;
//   data.messageId = i;
//   promises[i] = {resolve, reject, timeout: timeout(reject)};
//   send(data)
// });
//
// const send = data => {
//   socket.write(JSON.stringify(data) + "\n");
// };


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
  const s = BD.encode(packet, protocol);

  // console.log(s.slice());

  promises[i] = {resolve, reject, timeout: timeout(reject)};
  ostream.write(packet);
});

const send = data => {
  return;
  socket.write(JSON.stringify(data) + "\n");
};


//
// let networker;
//
//
// function timeout(reject) {
//   return setTimeout(() => {
//     reject("Timeout")
//   }, 6000000);
// }
//
//
// function init() {
//   networker = new Networker(socket, rpl => {
//     const data = RLP.decode(rpl);
//     const bufferId = data.pop();
//     const messageId = ethUtil.bufferToInt(bufferId);
//     const promise = promises[messageId];
//     if (messageId && promise) {
//       clearTimeout(promise.timeout);
//       promise.resolve(data);
//       delete promises[messageId];
//     }
//   });
//   networker.init();
// }
//
//
// function client() {
//   socket = net.createConnection("/var/run/plasma.socket", init);
// }
//
//
//
//
// const promise = data => new Promise((resolve, reject) => {
//   i++;
//   data.push(ethUtil.toBuffer(i));
//   const rlp = RLP.encode(data);
//   promises[i] = {resolve, reject, timeout: timeout(reject)};
//   networker.send(rlp);
// });
//
//
// const send = data => {
//   const rlp = RLP.encode(data);
//   networker.send(rlp);
// };


export {
  client,
  promise,
  send
};
