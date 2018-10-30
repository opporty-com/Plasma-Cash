import {EventEmitter} from 'events'
import rlp from 'rlp-encoding'
import {_util} from 'ethereumjs-devp2p'
import logger from 'lib/logger'

const MESSAGE_CODES = {
  STATUS: 0x00,
  NEW_BLOCK_HASHES: 0x01,
  TX: 0x02,
  GET_BLOCK_HEADERS: 0x03,
  BLOCK_HEADERS: 0x04,
  GET_BLOCK_BODIES: 0x05,
  BLOCK_BODIES: 0x06,
  NEW_BLOCK: 0x07,
}

class PlasmaProtocol extends EventEmitter {
  constructor (version, peer, send) {
    super()

    this._version = version
    this._peer = peer
    this._send = send

    this._status = null
    this._peerStatus = null
    this._statusTimeoutId = setTimeout(() => {
      this._peer.disconnect(11) //TIMEOUT HARDCODE
    }, 5000)
  }

  static cash1 = { name: 'pcash', version: 62, length: 8, constructor: PlasmaProtocol }

  static MESSAGE_CODES = MESSAGE_CODES

  _handleMessage (code, data) {
    const payload = rlp.decode(data)
    if (code !== MESSAGE_CODES.STATUS) {
      logger.info(`Received ${this.getMsgPrefix(code)} message from ${this._peer._socket.remoteAddress}:${this._peer._socket.remotePort}: ${data.toString('hex')}`)
    }
    switch (code) {
      case MESSAGE_CODES.STATUS:
        _util.assertEq(this._peerStatus, null, 'Uncontrolled status message')
        this._peerStatus = payload
        logger.info(`Received ${this.getMsgPrefix(code)} message from ${this._peer._socket.remoteAddress}:${this._peer._socket.remotePort}: : ${this._getStatusString(this._peerStatus)}`)
        this._handleStatus()
        break

      case MESSAGE_CODES.NEW_BLOCK_HASHES:
      case MESSAGE_CODES.TX:
      case MESSAGE_CODES.GET_BLOCK_HEADERS:
      case MESSAGE_CODES.BLOCK_HEADERS:
      case MESSAGE_CODES.GET_BLOCK_BODIES:
      case MESSAGE_CODES.BLOCK_BODIES:
      case MESSAGE_CODES.NEW_BLOCK:
        if (this._version >= PlasmaProtocol.cash1.version) break
        return

      default:
        return
    }

    this.emit('message', code, payload)
  }

  _handleStatus () {
    if (this._status === null || this._peerStatus === null) return
    clearTimeout(this._statusTimeoutId)

    _util.assertEq(this._status[0], this._peerStatus[0], 'Protocol version mismatch')
    _util.assertEq(this._status[1], this._peerStatus[1], 'NetworkId mismatch')
    _util.assertEq(this._status[4], this._peerStatus[4], 'Genesis block mismatch')

    this.emit('status', {
      networkId: this._peerStatus[1],
      td: Buffer.from(this._peerStatus[2]),
      bestHash: Buffer.from(this._peerStatus[3]),
      genesisHash: Buffer.from(this._peerStatus[4])
    })
  }

  getVersion() {
    return this._version
  }

  _getStatusString(status) {
    var sStr = `[V:${_util.buffer2int(status[0])}, NID:${_util.buffer2int(status[1])}, TD:${_util.buffer2int(status[2])}`
    sStr += `, BestH:${status[3].toString('hex')}, GenH:${status[4].toString('hex')}]`
    return sStr
  }

  sendStatus(status) {
    if (this._status !== null) return
    this._status = [
      _util.int2buffer(this._version),
      _util.int2buffer(status.networkId),
      status.td,
      status.bestHash,
      status.genesisHash
    ]

    logger.info(`Send STATUS message to ${this._peer._socket.remoteAddress}:${this._peer._socket.remotePort} (eth${this._version}): ${this._getStatusString(this._status)}`)
    this._send(MESSAGE_CODES.STATUS, rlp.encode(this._status))
    this._handleStatus()
  }

  sendMessage (code, payload) {
    logger.info(`Send ${this.getMsgPrefix(code)} message to ${this._peer._socket.remoteAddress}:${this._peer._socket.remotePort}: ${rlp.encode(payload).toString('hex')}`)
    switch (code) {
      case MESSAGE_CODES.STATUS:
        throw new Error('Please send status message through .sendStatus')

      case MESSAGE_CODES.NEW_BLOCK_HASHES:
      case MESSAGE_CODES.TX:
      case MESSAGE_CODES.GET_BLOCK_HEADERS:
      case MESSAGE_CODES.BLOCK_HEADERS:
      case MESSAGE_CODES.GET_BLOCK_BODIES:
      case MESSAGE_CODES.BLOCK_BODIES:
      case MESSAGE_CODES.NEW_BLOCK:
        if (this._version >= PlasmaProtocol.cash1.version) break
        throw new Error(`Code ${code} not allowed with version ${this._version}`)

      default:
        throw new Error(`Unknown code ${code}`)
    }

    this._send(code, rlp.encode(payload))
  }

  getMsgPrefix (msgCode) {
    return Object.keys(MESSAGE_CODES).find(key => MESSAGE_CODES[key] === msgCode)
  }
}

module.exports = PlasmaProtocol