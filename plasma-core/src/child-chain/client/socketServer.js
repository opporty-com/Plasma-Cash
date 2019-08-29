import net from 'net'
import fs from 'fs'
import ROUTER from "./router"

const SOCKET_PATH = '/var/run/mysocket'


function runSocketServer() {
  //console.log("<------------------------- CREATE UNIX SERVER ----------------------------->")
  fs.stat(SOCKET_PATH, err => {
    if (!err) fs.unlinkSync(SOCKET_PATH);

    const unixServer = net.createServer(socket => {
      socket.on('data', async data => {

        const parseData = JSON.parse(data),
          {action, payload} = parseData;

        let resultFromController;
        try {
          resultFromController = await ROUTER[action].controller(payload);

        } catch (error) {
          resultFromController = {error: error.message ? error.message : error}
        }

        //console.log("<------------------------ UNIX SERVER RESULT ------------------------>", resultFromController)
        socket.end(JSON.stringify(resultFromController))
      });
      socket.on("connect", data => {
        //console.log("<------------------------ UNIX SERVER GOT DATA ------------------------>", data)
      });
      socket.on('end', () => {
        //console.log("<------------------------ UNIX SERVER DISCONNECT ------------------------>")
      });
    });

    unixServer.listen(SOCKET_PATH, err => err && console.log(err) );
  });

}

runSocketServer()
