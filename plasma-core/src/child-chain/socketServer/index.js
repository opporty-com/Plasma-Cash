import net from 'net'
import fs from 'fs'

import BD from 'binary-data';
import { PROTOCOLS as API_PROTOCOLS } from "../../schemas/api-protocols";
import ROUTER from "./router";

const SOCKET_PATH = '/var/run/plasma.socket';
const { baseProtocol } = API_PROTOCOLS;

const server = net.createServer(socket => {
  const ostream = BD.createEncode(baseProtocol);
  const istream = BD.createDecode(baseProtocol);
  ostream.pipe(socket);
  socket.pipe(istream).on('data', async packet => {
    try {
      const {type, messageId, payload, error} = packet;
      const actions = Object.keys(API_PROTOCOLS);
      const act = actions.find(act => API_PROTOCOLS[act].type === type);

      let data = BD.decode(payload, API_PROTOCOLS[act].request);
      data._buffer = payload;
      const result = await ROUTER[act].controller(data);
      const res = {
        type,
        messageId,
        error: 0,
        length: result.length,
        payload: result
      };
      ostream.write(res);
    }
    catch (error) {
      console.log(error);
      const packet = BD.encode({
        message: error.message
      }, API_PROTOCOLS.error.response);
      const payload = packet.slice();
      const res = {
        type: 16,
        messageId: 0,
        error: 1,
        length: payload.length,
        payload
      };
      console.log(res);
      ostream.write(res);
    }
  });

});

function socketServer(cb) {
  fs.stat(SOCKET_PATH, err => {
    if (!err) fs.unlinkSync(SOCKET_PATH);

    server.listen(SOCKET_PATH, cb);
  })
}


export default socketServer;

