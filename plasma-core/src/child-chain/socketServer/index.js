import net from 'net'
import fs from 'fs'
import {createInterface} from 'readline'
import ROUTER from "./router"

const SOCKET_PATH = '/var/run/plasma.socket';


const server = net.createServer(socket => {
  const i = createInterface({
    input: socket,
    output: socket
  });

  i.on('line', async data => {
    const parseData = JSON.parse(data),
      {action, payload, messageId} = parseData;
    const response = {
      messageId
    };
    try {
      response.payload = await ROUTER[action].controller(payload);

    } catch (error) {
      response.error = error.message ? error.message : error
    }

    socket.write(JSON.stringify(response) + "\n");
  });
  socket.on("connect", data => {
  });
  socket.on('end', () => {
  });
});

function socketServer(cb) {
  fs.stat(SOCKET_PATH, err => {
    if (!err) fs.unlinkSync(SOCKET_PATH);

    server.listen(SOCKET_PATH, cb);
  })
}


export default socketServer;

