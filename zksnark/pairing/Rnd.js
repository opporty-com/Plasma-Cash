'use strict';
import crypto from 'crypto';

class CryptoRandom {
  nextBytes(ba) {
    if (!ba.length ) return;
    for(let i = 0; i < ba.length; ++i) ba[i] = crypto.randomBytes(1).readUInt8(0);
  }
}

export default CryptoRandom;