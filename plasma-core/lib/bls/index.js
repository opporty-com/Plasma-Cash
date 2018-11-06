
import CryptoRandom from './pairing/Rnd'
import {Point2} from './pairing/Points'
import Parameters from './pairing/Parameters'
import {Curve, Curve2} from './pairing/Curves'
import {Field2} from './pairing/Fields'
import Pairing from './pairing/Pairing'
import bigInt from 'big-integer'
import RLP from 'rlp'
import ethUtil from 'ethereumjs-util'

const rng = new CryptoRandom()
const bn = new Parameters(192)
const E = new Curve(bn)
const Et = new Curve2(E)
const pair = new Pairing(Et)
const Q = E.pointFactory(rng)
let H = Et.pointFactory(rng)

/** Secret Key */
class SecretKey {
  constructor(s) {
    if (!s) {
      let s = new Array(2)
      rng.nextBytes(s)
      this.s = bigInt(s[0])
    } else {
      this.s = bigInt(s, 16)
    }
  }

  getPublicKey() {
    let pk = new PublicKey()
    pk.init(this.s)
    return pk
  }

  sign(H) {
    let sig = new Signature()

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
      msk[i] = new SecretKey()
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
      secVec[i] = new SecretKey()
      secVec[i].s = Polynomial.eval(msk, id)
      secVec[i].id = id
    }
    return secVec
  }

  recover(vec) {
    let s = Polynomial.lagrange(vec)
    this.s = s
    this.id = 0
  }
}

/** Class representing authentic signature */
class Signature {
  recover(signVec) {
    this.sH = Polynomial.lagrange(signVec)
    return this
  }
}
/** Class representing public key */
class PublicKey {
  init(s) {
    this.sQ = Q.multiply(s)
  }
  verify(sign, H) {
    let a = pair.ate(H, this.sQ)
    let b = pair.ate(sign.sH, Q)
    return (a.eq(b))
  }
}

/** Class representing math polynomial */
class Polynomial {
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

  static lagrange(vec) {
    let S = new Array(vec.length)
    for (let i = 0; i < vec.length; i++) {
      S[i] = vec[i].id
    }
    let delta = Polynomial.calcDelta(S)
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
  static sign(H, s) {
    return H.multiply(s)
  }
  static verify(pair, Q, H, sQ, sH) {
    let a = pair.ate(H, sQ)
    let b = pair.ate(sH, Q)
    return (a.eq(b))
  }
}

const sigToString = (sigObject) => {
  let array = [sigObject.sH.x, sigObject.sH.y, sigObject.sH.z]

  let dataToEncode = []

  for (let i = 0; i < array.length; i++) {
    dataToEncode.push((array[i].re).toString())
    dataToEncode.push((array[i].im).toString())
  }

  let signature = ethUtil.bufferToHex((RLP.encode(dataToEncode)))

  return signature
}

const strToSig = (sigStr) => {
  let array = (RLP.decode(ethUtil.toBuffer(sigStr))).toString().split(',')

  let x = new Field2(bn, bigInt(array[0]), bigInt(array[1]), null)
  let y = new Field2(bn, bigInt(array[2]), bigInt(array[3]), null)
  let z = new Field2(bn, bigInt(array[4]), bigInt(array[5]), null)

  let sH = new Point2(E, x, y, z)

  let signature = new Signature()
  signature.sH = sH

  return signature
}

const sign = (address, message) => {
  let secretKey = new SecretKey(address.substr(2))
  let H = Et.Gt.multiply(message)
  let signature = secretKey.sign(H)
  return sigToString(signature)
}

const verify = (signature, address, message) => {
  let secretKey = new SecretKey(address.substr(2))
  let publicKey = secretKey.getPublicKey()
  let H = Et.Gt.multiply(message)
  let sig = strToSig(signature)
  return publicKey.verify(sig, H)
}

export {sign, verify, SecretKey, Signature, bn}
