import { rlpx } from 'lib/p2p'
import Block from 'child-chain/block'
import logger from 'lib/logger'

const INIT = 0
const PREPARE = 1
const COMMIT = 2
const N = 8
const PBFT_N = Math.floor((N-1) / 3)
const PBFT_F = PBFT_N*2 + 1

/** pbft */
class PBFT {
  constructor() {
    this.status = INIT
    this.callback = null
    this.prepareMsgs = 0
    this.commitMsgs = 0
  }

  setCallback(callback) {
    this.callback = callback
  }

  acceptBlock(block) {
    logger.info('SUBMIT msg to PBFT', block.getRlp() )

    for (let peer of rlpx.getPeers() ) {
      const eth = peer.getProtocols()[0]
      eth.sendMessage(0x07, block.getRlp() )
    }
    this.status = PREPARE

  }

  checkMessage(code, msg) {
    let bl
    switch (code)  {
    case 0x07: //PREPARE
      this.prepareMsgs++
      logger.info('PREPARE msg GOT: ', this.prepareMsgs)
      bl = new Block(msg)

      if (bl.isValid()) {
        if (this.prepareMsgs > PBFT_N) {
          logger.info('SEND COMMIT msg', msg)
          this.status = COMMIT
          const block = new Block(msg)
          if (block.isValid()) {
            for (let peer of rlpx.getPeers()) {
              const eth = peer.getProtocols()[0]
              eth.sendMessage(0x06, msg)
            }
            this.prepareMsgs = 0
            this.status = COMMIT
          }
        }
        
      }
      break
    
    case 0x06: //COMMIT
      this.commitMsgs++
      logger.info('COMMIT msg GOT: ', this.commitMsgs)
      if (this.commitMsgs > PBFT_F) {
        // reseting
        this.prepareMsgs = 0
        this.commitMsgs = 0
        this.status = INIT

        logger.info('SUBMIT AND CALL msg:', this.callback)
        this.callback && this.callback()
      }
      break
    }
  }
}

let pbft = new PBFT()

export default pbft