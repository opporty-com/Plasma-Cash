
import CryptoRandom from './pairing/Rnd'
import {Point2} from './pairing/Points'
import bigInt from 'big-integer'
import {Parameters} from './pairing/Fields'
import {BN128Fp, BN128Fp2} from './pairing/BN128'
import {PairingCheck} from './pairing/PairingCheck'
import ExNumber from './pairing/ExNumber'
/** Secret Key */
class BLSSecretKey {
  constructor(s) {
    this.rng = new CryptoRandom()
    if (!s) {
      let s = new Array(2)
      this.rng.nextBytes(s)
      this.s = bigInt(s[0])
    } else {
      this.s = bigInt(s)
    }
  }

  toString() {
    return this.s.toString();
  }

  getPublicKey() {
    let pk = new BLSPublicKey()
    pk.init(this.s)
    return pk
  }

  sign(H) {
    let sig = new BLSSignature()

    sig.sH = H.multiply(this.s)
    if (this.id) {
      sig.id = this.id
    }
    return sig
  }

  getMasterSecretKey(k) {
    if (k <= 1) {
      throw Error('bad k ' + k)
    }
    let msk = new Array(k)
    msk[0] = this
    for (let i = 1; i < k; i++) {
      msk[i] = new BLSSecretKey()
    }
    return msk
  }

  share(n, k) {
    let msk = this.getMasterSecretKey(k)
    let secVec = new Array(n)
    let ids = new Array(n)
    for (let i = 0; i < n; i++) {
      let id = i + 1
      ids[i] = id
      secVec[i] = new BLSSecretKey()
      secVec[i].s = BLSPolynomial.eval(msk, id)
      secVec[i].id = id
    }
    return secVec
  }

  recover(vec) {
    let s = BLSPolynomial.lagrange(vec)
    this.s = s
    this.id = 0
  }
}

/** Class representing authentic signature */
class BLSSignature {
  recover(signVec, Et) {
    this.sH = BLSPolynomial.lagrange(signVec, Et)
    return this
  }

  toString() {
    return this.sH.toString();
  }
}
/** Class representing public key */
class BLSPublicKey {
  constructor(s, Q) {
    this.sQ = Q.multiply(s.s)
  }

  toString() {
    return this.sQ.toString();
  }
}

/** Class representing math polynomial */
class BLSPolynomial {
  static init(s, k) {
    if (k < 2) {
      throw Error('bad k ' + k)
    }
    this.c = new Array(k)
    this.c[0] = s
    for (let i = 1; i < this.c.length; i++) {
      let s = new Array(2)
      rng.nextBytes(s)
      this.c[i] = bigInt(s[0])
    }
  }
  static eval(msk, x) {
    let s = bigInt.zero
    for (let i = 0; i < msk.length; i++) {
      s = s.add(msk[i].s.multiply(x ** i))
    }
    return s
  }
  static calcDelta(S) {
    let k = S.length
    if (k < 2) throw Error('bad size' + k)
    let delta = new Array(k)
    let a = bigInt(S[0])
    for (let i = 1; i < k; i++) {
      a = a.multiply(bigInt(S[i]))
    }
    for (let i = 0; i < k; i++) {
      let b = bigInt(S[i])
      for (let j = 0; j < k; j++) {
        if (j != i) {
          let v = bigInt(S[j]).subtract(S[i])
          if (v == 0) throw Error('S has same id' + i + ' ' + j)
          b = b.multiply(v)
        }
      }
      delta[i] = a.divide(b)
    }
    return delta
  }

  static lagrange(vec, Et) {
    let S = new Array(vec.length)
    for (let i = 0; i < vec.length; i++) {
      S[i] = vec[i].id
    }
    let delta = BLSPolynomial.calcDelta(S)
    let r
    if (vec[0].s) {
      r = bigInt.zero
    } else {
      r = new Point2(Et)
    }
    for (let i = 0; i < delta.length; i++) {
      if (vec[i].s) {
        r = r.add(vec[i].s.multiply(delta[i]))
      } else {
        r = r.add(vec[i].sH.multiply(delta[i]))
      }
    }
    return r
  }
}
/** BLS signature signer */
class BLSSigner {

  constructor(bitLength) {
    this.rng = new CryptoRandom()

    this.G = BN128Fp.create( bigInt('1'), bigInt('2') );

    this.G2 = BN128Fp2.create(
      bigInt('10857046999023057135944570762232829481370756359578518086990519993285655852781'), 
      bigInt('11559732032986387107991004021392285783925812861821192530917403151452391805634'), 
      bigInt('8495653923123431417604973247489272438418190587263600148770280649306958101930'), 
      bigInt('4082367875863433681332203403145435568316851327593401208105741076214120093531') ) ;

  }

  getRandomPointOnE() {
    if (this.rng instanceof CryptoRandom) {
      return this.getG().multiply(ExNumber.construct(2*Parameters.p.bitLength() ) )
    } else {
      throw new Error("Parameter is not a cryptographically strong PRNG")
    }
  }

  getRandomPointOnEt() {
    if (this.rng instanceof CryptoRandom) {
      return this.getG2().multiply(ExNumber.construct(2*Parameters.p.bitLength() ) )
    } else {
      throw new Error("Parameter is not a cryptographically strong PRNG")
    }
  }

  getG() {
    return this.G
  }

  getG2() {
    return this.G2
  }

  getPairing() {
    return this.pair
  }

  getParameters() {
    return this.bn
  }

  sign(H, s) {
    return H.multiply(s)
  }

  verify(Q, H, sQ, sH) {
    let pc = PairingCheck.create()
    pc.addPair(sQ.sQ, H)
    pc.run()
    let pair = pc.result()
    pc = PairingCheck.create()
    pc.addPair(Q, sH.sH)
    pc.run()
    let pair2 = pc.result()

    return pair.eq(pair2)
  }
}

export {BLSSigner, BLSSecretKey, BLSSignature, BLSPublicKey, BLSPolynomial}
