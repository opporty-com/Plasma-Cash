import net from 'net'
import fs from 'fs'
import * as RLP from 'rlp'
import {createInterface} from 'readline'
import ROUTER from "./router"

import BD from 'binary-data';

import {demo, send} from '../controllers/Transaction';

import Networker from './protocol'

const SOCKET_PATH = '/var/run/plasma.socket';
//
//
// const server = net.createServer(socket => {
//
//   const i = createInterface({
//     input: socket,
//     output: socket
//   });
//
//   i.on('line', async data => {
//     const parseData = JSON.parse(data),
//       {action, payload, messageId} = parseData;
//     const response = {
//       messageId
//     };
//     try {
//       response.payload = await ROUTER[action].controller(payload);
//     } catch (error) {
//       response.error = error.message ? error.message : error
//     }
//     if (response.messageId)
//       socket.write(JSON.stringify(response) + "\n");
//
//   });
//   socket.on("connect", data => {
//   });
//   socket.on('end', () => {
//   });
// });
//
// function socketServer(cb) {
//   fs.stat(SOCKET_PATH, err => {
//     if (!err) fs.unlinkSync(SOCKET_PATH);
//
//     server.listen(SOCKET_PATH, cb);
//   })
// }


const protocol = {
  type: BD.types.uint8,
  messageId: BD.types.uint24le,
  error: BD.types.uint8,
  length: BD.types.uint24le,
  value: BD.types.buffer(({node}) => node.length)
};


const server = net.createServer(socket => {
  const ostream = BD.createEncode(protocol);
  const istream = BD.createDecode(protocol);
  ostream.pipe(socket);
  socket.pipe(istream).on('data', async packet => {
    const {type, messageId, value, error} = packet;
    const result = await send(value);
    const res = {
      type,
      messageId,
      error: 0,
      length: result.length,
      value: result
    };
    ostream.write(res);
  });

});

function socketServer(cb) {
  fs.stat(SOCKET_PATH, err => {
    if (!err) fs.unlinkSync(SOCKET_PATH);

    server.listen(SOCKET_PATH, cb);
  })
}


// const server = net.createServer(socket => {
//   let networker = new Networker(socket, async rpl => {
//     const data = RLP.decode(rpl);
//     const id = data.pop();
//     const result = await demo(data);
//     result.push(id);
//     const rlpResult = RLP.encode(result);
//     networker.send(rlpResult);
//   });
//   networker.init();
// });
//
// function socketServer(cb) {
//   fs.stat(SOCKET_PATH, err => {
//     if (!err) fs.unlinkSync(SOCKET_PATH);
//
//     server.listen(SOCKET_PATH, cb);
//   })
// }


export default socketServer;

