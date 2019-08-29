

/**
 * Created by Oleksandr <alex@moonion.com> on 8/27/19
 * moonion.com;
 */

var keythereum = require("keythereum");
var ethUtil = require("ethereumjs-util");

var datadir = "/root/.ethereum/devnet";
var address= "0xc124b6565191071e4a5108ee1248f25cfcbe4b24";
const password = "123456";

var keyObject = keythereum.importFromFile(address, datadir);
var privateKey = keythereum.recover(password, keyObject);
const pk = privateKey.toString('hex');
console.log("pk", pk);


function _sign(hash, pk) {
    let msgHash = ethUtil.hashPersonalMessage(hash);
    let key = Buffer.from(pk, 'hex');
    let sig = ethUtil.ecsign(msgHash, key);
    return ethUtil.toRpcSig(sig.v, sig.r, sig.s);
}

function getAddressFromSign(hash, signature) {
    let address;
    try {
        let sig = ethUtil.fromRpcSig(ethUtil.addHexPrefix(signature));
        let msgHash = ethUtil.hashPersonalMessage(hash);
        let pubKey = ethUtil.ecrecover(msgHash, sig.v, sig.r, sig.s);
        address = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));
    } catch (error) {
        throw new Error("Invalid signature")
    }
    return address;
}

const hash = Buffer.from(address, 'utf-8');
var sig = _sign(hash, pk);

console.log("sig", sig);
const add = getAddressFromSign(hash, sig);

console.log("add", add);

