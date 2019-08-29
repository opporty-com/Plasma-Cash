/**
 * Created by Oleksandr <alex@moonion.com> on 2019-08-07
 * moonion.com;
 */
import {EventEmitter} from 'events'
import {DPT, RLPx, _util} from 'ethereumjs-devp2p';
import config from "../../config";

import PCP from "./PCP";
import logger from "./logger";
import assert from "assert";


class PlasmaEmitter extends EventEmitter {
  constructor() {
    super();
  }

  EVENT_MESSAGES = {
    NEW_TX_CREATED: "NEW_TX_CREATED",
    PREPARE_NEW_BLOCK: "PREPARE_NEW_BLOCK",
    NEW_BLOCK_VALID: "NEW_BLOCK_VALID",
    NEW_BLOCK_COMMIT: "NEW_BLOCK_COMMIT",
    NEW_BLOCK_CREATED: "NEW_BLOCK_CREATED",
  };
  EVENT_CODES = {
    [PCP.MESSAGE_CODES.TX]: "NEW_TX_CREATED",
    [PCP.MESSAGE_CODES.PREPARE_NEW_BLOCK]: "PREPARE_NEW_BLOCK",
    [PCP.MESSAGE_CODES.NEW_BLOCK_VALID]: "NEW_BLOCK_VALID",
    [PCP.MESSAGE_CODES.BLOCK_COMMIT]: "NEW_BLOCK_COMMIT",
    [PCP.MESSAGE_CODES.NEW_BLOCK]: "NEW_BLOCK_CREATED",
  };

  validateNewBlock(block) {
    _send(PCP.MESSAGE_CODES.PREPARE_NEW_BLOCK, block);
  }

  sendCommitBlock(block) {
    _send(PCP.MESSAGE_CODES.BLOCK_COMMIT, block);
  }
  sendNewBlock(block) {
    _send(PCP.MESSAGE_CODES.NEW_BLOCK, block);
  }

  sendNewTransaction(tx) {
    _send(PCP.MESSAGE_CODES.TX, tx);
  }
}

const _p2pEmitter = new PlasmaEmitter();

const _dpt = new DPT(config.dptKey, config.dptEndpoint)

const _rlpx = new RLPx(config.dptKey, {
  dpt: _dpt,
  maxPeers: 25,
  capabilities: [
    PCP.pcp1,
  ],
  listenPort: config.dptPort,
});

_rlpx.on('error', (err) => logger.error(`RLPx error: ${err.stack || err}`));
_rlpx.on('peer:removed', (peer, reasonCode, disconnectWe) => {
  const addr = `${peer._socket.remoteAddress}:${peer._socket.remotePort}`;
  const who = disconnectWe ? 'we disconnect' : 'peer disconnect';
  const total = _rlpx.getPeers().length;
  logger.debug(`Remove peer: ${addr} - ${who}, reason: ${peer.getDisconnectPrefix(reasonCode)} (${String(reasonCode)}) (total: ${total})`);
});

_rlpx.on('peer:error', (peer, err) => {
  if (err.code === 'ECONNRESET') return;
  if (err instanceof assert.AssertionError) {
    const peerId = peer.getId();
    if (peerId !== null) dpt.banPeer(peerId, 5 * 60000);
    logger.error(`Peer error (${peer._socket.remoteAddress}): ${err.message}`);
    return
  }
  logger.error(`Peer error (${peer._socket.remoteAddress}): ${err.stack || err}`)
});
_rlpx.on('peer:added', (peer) => {
  const addr = `${peer._socket.remoteAddress}:${peer._socket.remotePort}`;
  const [pcp] = peer.getProtocols();
  const clientId = peer.getHelloMessage().clientId;
  logger.debug(`Add peer: ${addr} ${clientId} (pcp${pcp.getVersion()}) (total: ${_rlpx.getPeers().length})`)

  pcp.sendStatus({
    networkId: 1,
    td: _util.int2buffer(17179869184), // total difficulty in genesis block
    bestHash: Buffer.from('d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3', 'hex'),
    genesisHash: Buffer.from('d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3', 'hex'),
  });

  pcp.on('message', async (code, payload) => {
    const key = _p2pEmitter.EVENT_CODES[code];
    if (!key) return;
    _p2pEmitter.emit(key, payload);
  })

});

function _send(code, message) {
  for (let peer of _rlpx.getPeers()) {
    const [pcp] = peer.getProtocols();
    pcp.sendMessage(code, message);
  }
};


_rlpx.listen(config.dptPort, '0.0.0.0', () => {
  logger.info(`Listening rlpx on ${config.dptPort}`);
});
_dpt.bind(config.dptPort, '0.0.0.0', () => {
  logger.info(`Listening dpt on ${config.dptPort}`);
});


setTimeout(() => {
  if (!config.bootNode) {
    logger.debug('boot nodes')
    for (let bootnode of config.bootNodes) {
      logger.debug('Boot node: ' + bootnode.address + ':' + bootnode.tcpPort)
      _dpt.bootstrap(bootnode).catch((err) => logger.error(err.stack || err))
    }
  }

  setInterval(() => {
    const peersCount = _dpt.getPeers().length
    const openSlots = _rlpx._getOpenSlots()
    const queueLength = _rlpx._peersQueue.length
    const queueLength2 = _rlpx._peersQueue.filter((o) => o.ts <= Date.now()).length;
    logger.info(`Total nodes in DPT: ${peersCount}, open slots: ${openSlots}, queue: ${queueLength} / ${queueLength2}`)
  }, 10000);
}, 10000);


export default _p2pEmitter;
