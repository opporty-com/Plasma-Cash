const { deserialize, serialize } = require("surrial")
const { MessageChannel, Worker, } = require("worker_threads")

let ThreadWorker = {

  code: `
    const { parentPort } = require('worker_threads');
    const { serialize, deserialize } = require('surrial');
    var {resolve, join} = require('path');
    const redis = require(resolve() + '/../../lib/redis')

    parentPort.on('message', ({ action, payload: { port, runnable, data, rawData } }) => {
      if (action === "__run__") {
        try {
          let hydratedData = data && (data instanceof SharedArrayBuffer ? data : Object.assign(deserialize(data), rawData));       
          deserialize(runnable)({rowData: hydratedData, redis}).then((result) => {  
            port.postMessage({ action: "__result__", payload: { result: serialize(result) } });
          }).catch(error => { 
            console.log('[1]', error)
            port.postMessage({ action: "__error__", payload: { result: serialize(error), error: true } })})
          } catch (e) {
            console.log('Вывод ошибки', e)
          port.postMessage({ action: "__error__", payload: { result: serialize(e), error: true } });
        }
      }
    });`,

  createRunAction: function (payload) {
    let response = {
      action: '__run__',
      payload: payload
    }
    return response
  }
};

class FixedThreadPool {
  constructor(
    numThreads,
    workerOptions = {}
  ) {
    this.queue = []
    this.freeWorkers = Array.from(Array(numThreads).keys()).map(
      () =>
        new Worker(ThreadWorker.code, {
          ...workerOptions,
          eval: true
        })
    );
    this.apocalypse = false
  }

  destroy() {
    this.apocalypse = true
    this.executeNext()
  }

  submit(
    fn,
    data
  ) {
    return new Promise((resolve, reject) => {
      this.queue.push({fn, data, resolve, reject})
      this.executeNext()
    });
  };

  executeNext() {
    if (this.apocalypse) {
      if(this.freeWorkers.length > 0){
      const worker = this.freeWorkers.shift();
      worker.terminate()
      if (this.freeWorkers) {
        this.executeNext()
     }
      return void 0
    }
    }

    if (this.queue.length > 0 && this.freeWorkers.length > 0) {
      const { fn, data, resolve, reject } = this.queue.shift();
      const worker = this.freeWorkers.shift();
      const rawData = {};
      if (typeof data === "object") {
        // data.str = data.str + ` from thread with id: ${worker.threadId}`
        Object.entries(data).forEach(([key, value]) => {
          if (value instanceof SharedArrayBuffer) {
            rawData[key] = value;
            delete data.key;
          }
        });
      }

      const channel = new MessageChannel();

      channel.port2.on(
        "message",
        ({ action, payload: { result, msg } }) => {
          if (action === '__result__') {
            this.freeWorkers.push(worker);
            this.executeNext();
            resolve(deserialize(result));
          } else if (action === '__error__') {
            this.freeWorkers.push(worker);
            this.executeNext();
            const error = deserialize(result);
            reject(error);
          }
        }
      );

      worker.postMessage(
        ThreadWorker.createRunAction({
          data:
            data instanceof SharedArrayBuffer || !data
              ? data
              : serialize(data) || {},
          port: channel.port1,
          rawData,
          runnable: serialize(fn)
        }),
        [channel.port1]
      );
    }
  };
}

module.exports = FixedThreadPool