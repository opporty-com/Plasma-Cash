import {DPT} from 'ethereumjs-devp2p'
import PlasmaProtocol from './plasma-protocol'
import config from 'config'
import logger from 'lib/logger'
import {RLPx} from 'ethereumjs-devp2p'
import {_util} from 'ethereumjs-devp2p'
import assert from 'assert'

const dpt = new DPT(config.dptKey, config.dptEndpoint)

const rlpx = new RLPx(config.dptKey, {
  dpt: dpt,
  maxPeers: 25,
  capabilities: [
    PlasmaProtocol.cash1,
  ],
  listenPort: config.dptPort,
})

rlpx.on('error', (err) => logger.error(`RLPx error: ${err.stack || err}`))

rlpx.on('peer:added', (peer) => {
  const addr = `${peer._socket.remoteAddress}:${peer._socket.remotePort}`
  logger.info(`${addr}`)

  const eth = peer.getProtocols()[0]
  const clientId = peer.getHelloMessage().clientId
  logger.info(`Add peer: ${addr} ${clientId} (eth${eth.getVersion()}) (total: ${rlpx.getPeers().length})`)

  eth.sendStatus({
    networkId: 1,
    td: _util.int2buffer(17179869184), // total difficulty in genesis block
    bestHash: Buffer.from('d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3', 'hex'),
    genesisHash: Buffer.from('d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3', 'hex'),
  })

  eth.sendMessage(PlasmaProtocol.MESSAGE_CODES.TX, ['tx', 'text'])

  eth.on('message', async (code, payload) => {
    switch (code) {
    case PlasmaProtocol.MESSAGE_CODES.TX:
      logger.info('GET TX MESSSAGE', payload)
      break
    }
  })

})

rlpx.on('peer:removed', (peer, reasonCode, disconnectWe) => {
  const addr = `${peer._socket.remoteAddress}:${peer._socket.remotePort}`
  const who = disconnectWe ? 'we disconnect' : 'peer disconnect'
  const total = rlpx.getPeers().length
  logger.info(`Remove peer: ${addr} - ${who}, reason: ${peer.getDisconnectPrefix(reasonCode)} (${String(reasonCode)}) (total: ${total})`)
})

rlpx.on('peer:error', (peer, err) => {
  if (err.code === 'ECONNRESET') return

  if (err instanceof assert.AssertionError) {
    const peerId = peer.getId()
    if (peerId !== null) dpt.banPeer(peerId, 5*60000)

    logger.error(`Peer error (${getPeerAddr(peer)}): ${err.message}`)
    return
  }

  logger.error(`Peer error (${getPeerAddr(peer)}): ${err.stack || err}`)
})


logger.info('Listening p2p on ' + config.dptPort)
rlpx.listen(config.dptPort, '0.0.0.0')
dpt.bind(config.dptPort, '0.0.0.0')

if (!config.bootNode) {
  logger.info('boot nodes')
  for (let bootnode of config.bootNodes) {
    logger.info('Boot node: ' + bootnode.address + ':'+ bootnode.tcpPort)
    dpt.bootstrap(bootnode).catch((err) => logger.error(err.stack || err))
  }
}


export {dpt}
