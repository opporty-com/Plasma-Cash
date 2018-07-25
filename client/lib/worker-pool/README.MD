# Worker Pool

[![N|Solid](http://i.piccy.info/i9/a978a2370040773428c44745f8857656/1531315538/44176/1257017/logo_007.png)](https://nodesource.com/products/nsolid)

Worker pool provides the global object that makes threads of particular amount and rationally distributes the load between them

### Installation

 - First you must include the worker-pool folder to you project as lib
 - Then you should to install worker-threads module that be fundamental object in worker-pool

```sh
$ npm install worker-threads
```
 - after configures you code, you must to include `--experimental-worker` to you run option
    with simple run project at node.js we use:
```sh
$ node --experimental-worker mainfile.js
```
### Usage

```sh
const WorkerPool = require('worker-pool')
// must be initialized

function sayTextКRepeatedly(text, amountForSay){
    for(let i = 0, i < amountForSay; i++){
        console.log(text);
    }
}
// function that must will be working


const workerPool = new WorkerPool(),
    amountThread = 4,
    work = sayTextКRepeatedly
    parameters = { text: 'Hello world', amountForSay: 3 }
    
work.initThreads(amountThread); 
// after make pool object, we need to initialize threads of amountThread in this pool 

work.addWork(work, parameters); 
// now we can add work that will go to any free thread
// for now this method takes only two parameters for the work

work.stop()
// we should use this method to stop all threads is REQUIRED
// temporarily for now this method may not work well, please after stopping you app check and kill bug manually

```

### Methods


#### addWork(work, parameters) 
 - work - function that must be perfomed
 - parameters - parameters for this function

Includes function as work that will be perfomed now in worker pool


#### initThreads(amount)
 - work - amount of threads that will be initialized

Initializes and run threads amount per in pool

#### stop()
Use this for kill all threads in the pool
