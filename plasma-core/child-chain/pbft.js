import { rlpx } from 'lib/p2p'
import PlasmaProtocol  from 'lib/p2p/plasma-protocol'
import Block from 'child-chain/block'

const INIT = 0;
const PREPARE = 1;
const COMMIT = 2;
const N = 3;
const PBFT_N = Math.floor((N-1) / 3);
const PBFT_F = PBFT_N + 1;

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
    console.log('SUBMIT msg to PBFT', block.getRlp() )

    for (let peer of rlpx.getPeers() ) {
      const eth = peer.getProtocols()[0]
      eth.sendMessage(0x07, block.getRlp() )
    }

  }

  checkMessage(code, msg) {
    let bl
    switch (code)  {
    case 0x07: //PREPARE
      this.prepareMsgs++
      console.log('PREPARE msg GOT: ', this.prepareMsgs)
      bl = new Block(msg) 

      if (bl.isValid()) {
        if (this.prepareMsgs > PBFT_N) {
          console.log('SEND COMMIT msg', msg)
          this.status = COMMIT
          // const block = new Block(msg);
          //if (block.isValid()) {
            for (let peer of rlpx.getPeers()) {
              const eth = peer.getProtocols()[0]
              eth.sendMessage(0x06, msg)
            }
            this.prepareMsgs = 0
          //}
        }
      }
      break
    
    case 0x06: //COMMIT
      this.commitMsgs++
      console.log('COMMIT msg GOT: ', this.commitMsgs)
      if (this.commitMsgs > PBFT_F) {
        // reseting
        this.prepareMsgs = 0
        this.commitMsgs = 0
        this.status = INIT

        console.log('SUBMIT AND CALL msg:', this.callback)
        this.callback && this.callback()
      }
      break
    }
    




  }
}

let pbft = new PBFT()

export default pbft