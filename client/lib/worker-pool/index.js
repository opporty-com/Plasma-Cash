const { Worker } = require('worker_threads');

class GlobalWork {

    constructor() {

        this.threads = []
        this.work = []
        this.workIsReady = false
    }

    initThreads(threadCount) {

        this.threadCount = threadCount

        for (let i = 0; i < threadCount; i++) {

            this.threads[i] = new Pool(this)
            this.threads[i].run();
        }
    }

    getWork() {

        if (this.work.length == 1) {

            this.workIsReady = false
            
        }

        return this.work.shift()
    }

    addWork(work, parameters) {

        this.work.push({ work, par1: parameters[0], par2: parameters[1] })

        this.workIsReady = true
    }

    stop(callback) {

        for (let i = 0; i < this.threadCount; i++) {

            this.threads[i].exit(() => {

                console.log(`Thread ${i} has been stopped`);

            });

            callback && callback()
        }
    }
}

class Pool {

    constructor(globalWork) {

        this.globalWork = globalWork;
    }

    run() {

        try { this.worker = new Worker(`${this.findWork()}`, { eval: true }) }

        catch ({ message }) { return console.error(message) }
    }

    findWork() {

        setInterval(() => {

            if (this.globalWork.workIsReady) {

                let instance = this.globalWork.getWork()

                instance && instance.work(instance.par1, instance.par2);
            }
        }, 0);
    }

    exit() {

        this.worker.terminate()
    }
}

module.exports = GlobalWork
