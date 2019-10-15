import net from 'net'
import fs from 'fs'
import ROUTER from "./router"

import BD from 'binary-data';

import {send} from '../controllers/Transaction';

const SOCKET_PATH = '/var/run/plasma.socket';


const protocol = {
  type: BD.types.uint8,
  messageId: BD.types.uint24le,
  error: BD.types.uint8,
  length: BD.types.uint24le,
  payload: BD.types.buffer(({node}) => node.length)
};


const TransactionProtocol = {
  prevHash: BD.types.buffer(20),
  prevBlock: BD.types.uint24le,
  tokenId: BD.types.string(null),
  totalFee: BD.types.string(null),
  type: BD.types.uint8,
  newOwner: BD.types.buffer(20),
  dataLength: BD.types.uint24le,
  data: BD.types.buffer(({current}) => current.dataLength),
  signature: BD.types.buffer(65),
  hash: BD.types.buffer(32),
};


const server = net.createServer(socket => {
  const ostream = BD.createEncode(protocol);
  const istream = BD.createDecode(protocol);
  ostream.pipe(socket);
  socket.pipe(istream).on('data', async packet => {
    const {type, messageId, payload, error} = packet;

    let data = BD.decode(payload, TransactionProtocol);
    data._buffer = payload;
    const result = await send(data);
    const res = {
      type,
      messageId,
      error: 0,
      length: result.length,
      payload: result
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


export default socketServer;

