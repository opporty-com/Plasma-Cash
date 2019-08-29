/**
 * Created by Oleksandr <alex@moonion.com> on 2019-07-09
 * moonion.com;
 */

import bls from '@chainsafe/bls-js'
import Boom from '@hapi/boom'

async function generateKeyPair(request, h) {
  const keys = bls.generateKeyPair();
  return {
    public: keys.publicKey.toHexString(),
    private: keys.privateKey.toHexString(),
  };
}


export {
  generateKeyPair
}
