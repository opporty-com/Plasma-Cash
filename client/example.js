import ethUtil from 'ethereumjs-util'; 

import levelDB from './app/lib/db';
const {promisify} = require("es6-promisify");

const lget = promisify(levelDB.get);
const lput = promisify(levelDB.put);

// asynchronous methods

async function main() {
    let ar = [];
    console.time('t');
    for (let i=0; i < 100000; i++) {
        //ar.push( lput('lastBlockNumber', new BN(i+'',10).toBuffer('be', 4) ) );
        ar.push( lput('lastBlockNumber', i ) )
    }
    await Promise.all(ar);
    let res = await lget('lastBlockNumber');
    console.timeEnd('t');
}

main();