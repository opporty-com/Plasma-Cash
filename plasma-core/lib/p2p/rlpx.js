'use strict'

import logger from 'lib/logger'

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');
var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const net = require('net')
const os = require('os')
const secp256k1 = require('secp256k1')

const {EventEmitter} = require('events')


const ms = require('ms')
const Buffer = require('safe-buffer').Buffer

const LRUCache = require('lru-cache')
const pVersion = require('../../package.json').version

const {pk2id, createDeferred} = require('./util')

const Peer = require('./peer')

/** Rlp transport protocol */
class RLPx extends EventEmitter {
  constructor(privateKey, options) {
    super()

    this._privateKey = Buffer.from(privateKey)
    this._id = pk2id(secp256k1.publicKeyCreate(this._privateKey, false))

    // options
    this._timeout = options.timeout || ms('10s')
    this._maxPeers = options.maxPeers || 10
    this._clientId = Buffer.from(options.clientId || `ethereumjs-devp2p/v${pVersion}/${os.platform()}-${os.arch()}/nodejs`)
    this._remoteClientIdFilter = options.remoteClientIdFilter
    this._capabilities = options.capabilities
    this._listenPort = options.listenPort

    // DPT
    this._dpt = options.dpt || null
    if (this._dpt !== null) {
      this._dpt.on('peer:new', (peer) => {
        if (this._peersLRU.has(peer.id.toString('hex'))) return
        this._peersLRU.set(peer.id.toString('hex'), true)

        if (this._getOpenSlots() > 0) return this._connectToPeer(peer)
        this._peersQueue.push({peer: peer, ts: 0}) // save to queue
      })
      this._dpt.on('peer:removed', (peer) => {
        // remove from queue
        this._peersQueue = this._peersQueue.filter((item) => !item.peer.id.equals(peer.id))
      })
    }

    // internal
    this._server = net.createServer()
    this._server.once('listening', () => this.emit('listening'))
    this._server.once('close', () => this.emit('close'))
    this._server.on('error', (err) => this.emit('error', err))
    this._server.on('connection', (socket) => this._onConnect(socket, null))

    this._peers = new Map();
    this._peersQueue = [];
    this._peersLRU = new LRUCache({ max: 25000 });
    this._refillIntervalId = setInterval(() => this._refillConnections(), ms('10s'));
  }

  listen(...args) {
    this._isAliveCheck();
    logger.info('call .listen');

    this._server.listen(...args);
  }

  destroy(...args) {
    this._isAliveCheck();
    logger.info('call .destroy');

    clearInterval(this._refillIntervalId);

    this._server.close(...args);
    this._server = null;

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = this._peers.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        let peerKey = _step.value;
        this.disconnect(Buffer.from(peerKey, 'hex'));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  connect(peer) {
    let _this = this

    return (0, _asyncToGenerator3.default)(function* () {
      _this._isAliveCheck();

      if (!Buffer.isBuffer(peer.id)) throw new TypeError('Expected peer.id as Buffer')
      const peerKey = peer.id.toString('hex')

      if (_this._peers.has(peerKey)) throw new Error('Already connected')
      if (_this._getOpenSlots() === 0) throw new Error('Too much peers already connected')

      logger.info(`connect to ${peer.address}:${peer.port} (id: ${peerKey})`)
      const deferred = createDeferred()

      const socket = new net.Socket()
      _this._peers.set(peerKey, socket)
      socket.once('close', function() {
        _this._peers.delete(peerKey)
        _this._refillConnections()
      })

      socket.once('error', deferred.reject)
      socket.setTimeout(_this._timeout, function() {
        return deferred.reject(new Error('Connection timeout'))
      })

      socket.connect(peer.port, peer.address, deferred.resolve)

      yield deferred.promise
      _this._onConnect(socket, peer.id)
    })()
  }

  getPeers() {
    return Array.from(this._peers.values()).filter(item => item instanceof Peer);
  }

  disconnect(id) {
    const peer = this._peers.get(id.toString('hex'));
    if (peer instanceof Peer) peer.disconnect(Peer.DISCONNECT_REASONS.CLIENT_QUITTING);
  }

  _isAlive() {
    return this._server !== null
  }

  _isAliveCheck() {
    if (!this._isAlive()) throw new Error('Server already destroyed');
  }

  _getOpenSlots() {
    return Math.max(this._maxPeers - this._peers.size, 0);
  }

  _connectToPeer(peer) {
    const opts = { id: peer.id, address: peer.address, port: peer.tcpPort };
    this.connect(opts).catch((err) => {
      if (this._dpt === null) return
      if (err.code === 'ECONNRESET' || err.toString().includes('Connection timeout')) {
        this._dpt.banPeer(opts, ms('5m'))
      }
    });
  }

  _onConnect(socket, peerId) {
    logger.info(`connected to ${socket.remoteAddress}:${socket.remotePort}, handshake waiting..`);

    const peer = new Peer({
      socket: socket,
      remoteId: peerId,
      privateKey: this._privateKey,
      id: this._id,

      timeout: this._timeout,
      clientId: this._clientId,
      remoteClientIdFilter: this._remoteClientIdFilter,
      capabilities: this._capabilities,
      port: this._listenPort,
    })
    peer.on('error', (err) => this.emit('peer:error', peer, err))

    // handle incoming connection
    if (peerId === null && this._getOpenSlots() === 0) {
      peer.once('connect', () => peer.disconnect(Peer.DISCONNECT_REASONS.TOO_MANY_PEERS))
      socket.once('error', () => {})
      return;
    }

    peer.once('connect', () => {
      let msg = `handshake with ${socket.remoteAddress}:${socket.remotePort} was successful`
      if (peer._eciesSession._gotEIP8Auth === true) {
        msg += ' (peer eip8 auth)'
      }
      if (peer._eciesSession._gotEIP8Ack === true) {
        msg += ' (peer eip8 ack)'
      }
      console.log(msg);
      if (peer.getId().equals(this._id)) {
        return peer.disconnect(Peer.DISCONNECT_REASONS.SAME_IDENTITY);
      }

      const peerKey = peer.getId().toString('hex');
      const item = this._peers.get(peerKey);
      if (item && item instanceof Peer) {
        return peer.disconnect(Peer.DISCONNECT_REASONS.ALREADY_CONNECTED);
      }

      this._peers.set(peerKey, peer);
      this.emit('peer:added', peer);
    })

    peer.once('close', (reason, disconnectWe) => {
      if (disconnectWe) {
        console.log(`disconnect from ${socket.remoteAddress}:${socket.remotePort}, reason: ${String(reason)}`)
      } else {
        console.log(`${socket.remoteAddress}:${socket.remotePort} disconnect, reason: ${String(reason)}`)
      }

      if (!disconnectWe && reason === Peer.DISCONNECT_REASONS.TOO_MANY_PEERS) {
        // hack
        this._peersQueue.push({
          peer: {
            id: peer.getId(),
            address: peer._socket.remoteAddress,
            tcpPort: peer._socket.remotePort,
          },
          ts: Date.now() + ms('5m')
        })
      }
      let peerKey = peer.getId().toString('hex')
      this._peers.delete(peerKey)
      this.emit('peer:removed', peer, reason, disconnectWe)
    });
  }

  _refillConnections() {
    if (!this._isAlive()) return
    logger.info(`refill connections.. queue size: ${this._peersQueue.length}, open slots: ${this._getOpenSlots()}`)

    this._peersQueue = this._peersQueue.filter((item) => {
      if (this._getOpenSlots() === 0) return true
      if (item.ts > Date.now()) return true

      this._connectToPeer(item.peer)
      return false
    })
  }
}

RLPx.DISCONNECT_REASONS = Peer.DISCONNECT_REASONS
module.exports = RLPx