import TxController from './controllers/TxController';
import DefController from './controllers/DefController';

const controllers = {
  TxController
};

class Routing {
  static route(req, res) {
    console.log(req.url);
    let parts = req.url.split('/');
    if (parts.length == 2) {
      if (DefController.hasOwnProperty(parts[1])) {
        return DefController[parts[1]](req, res);
      }
    } else if (parts.length == 3) {
      let controller = parts[1];
      let action = parts[2];
      if (typeof controllers[controller][action] === 'function')
        return controllers[controller][action](req, res);
    }
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('404 Not Found\n');
    res.end();
  }
}

export default Routing;
