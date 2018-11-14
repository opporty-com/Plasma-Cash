'use strict'

import TxController from 'routing/controllers/TxController'
import BlockController from 'routing/controllers/BlockController'
import DefController from 'routing/controllers/DefController'

const controllers = {
  TxController,
  BlockController,
}
/** Class representing a routing. */
class Routing {
  static capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }
  static route(req, res) {
    let parts = req.url.split('/')
    if (parts.length <= 2) {
      if (DefController.hasOwnProperty(parts[1])) {
        return DefController[parts[1]](req, res)
      }
    } else {
      let controller = Routing.capitalize(parts[1]) + 'Controller'

      let action = parts[2]
      if (typeof controllers[controller][action] === 'function') {
        return controllers[controller][action](req, res)
      }
    }
    res.writeHead(404, {'Content-Type': 'text/plain'})
    res.write('404 Not Found\n')
    res.end()
  }
}

export default Routing
