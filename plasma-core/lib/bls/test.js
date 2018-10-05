import {SecretKey, Signature, bn, sign, verify} from './index'
import CryptoRandom from './pairing/Rnd'
import {Curve, Curve2} from './pairing/Curves'

const rng = new CryptoRandom()
const E = new Curve(bn)
const Et = new Curve2(E)
const Q = E.pointFactory(rng)
let H = Et.pointFactory(rng)

// test signature with address

let signature = sign('0xcad96e8350e93eeD3224A217A42d28cF0276b67b',
  'e320b7c2fffc8d750423db8b1eb842ab720e951ed797f7affc8892b0f1fc122b')
let answer = verify(signature, '0xcad96e8350e93eeD3224A217A42d28cF0276b67b',
  'e320b7c2fffc8d750423db8b1eb842ab720e951ed797f7affc8892b0f1fc122b')
// above be true
let answer2 = verify(signature, '0xbDd97e8350e93eeD3224A217A42d28cF0276b67b',
  'e320b7c2fffc8d750423db8b1eb942ab720e951ed797f7affc8892b0f1fc122b')
// above should be false, because adress is wrong

console.log('ANSWER_1', answer)
console.log('ANSWER_2', answer2)

// next tests with desctiption as follow
console.log('-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-')
console.log(' BLS Signature over EC pairings')
console.log('  Q - fixed global ')
console.log('  s - secret key ')
console.log('  sQ - public key ')
console.log('  H - message hash on G1 ')
console.log('  sH - signature ')
console.log('  e: G1 x G2 -> Fp12')
console.log('  sign(H, s) -> sH')
console.log('  verify(H, sQ, sH) -> e(sQ, H(m)) = e(Q, s H(m)<br><br>')
console.log('-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-')

console.time('sign')
const s = new SecretKey()

console.log('s', s)
const sQ = s.getPublicKey()
console.log('sQ', sQ)
const sH = s.sign(H)
console.log('sH', sH)
const sH2 = new SecretKey().sign(H)
console.log('\x1b[37m', ' Q  = (' + (Q.x) + ', ' + (Q.y) + ', ' + (Q.z) + ')')
console.log('\x1b[37m', ' sQ = (' + (sQ.x) + ', ' + (sQ.y) + ', ' + (sQ.z) + ')')
console.log('\x1b[37m', ' H  = (' + (H.x.re) + ', ' + (H.y.re) + ', ' + (H.z.re) + ')')
console.log('\x1b[37m', ' sH = (' + (sH.sH.x.re) + ', ' + (sH.sH.y.re) + ', ' + (sH.sH.z.re) + ')')
console.log('\x1b[33m', ' Verify(Q,sQ,H,sH) = ' + sQ.verify(sH, H) + '')
console.log('\x1b[31m', ' Verify(Q,sQ,H,s2H) = ' + sQ.verify(sH2, H) + '')

console.timeEnd('sign')

console.log('\x1b[32m', '-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+**+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-')

/*
 * Start testing threshold signature (k, n) - (3, 5)
 */

const n = 5
const k = 3

let prv0 = new SecretKey()

let sig0 = new Signature()

sig0 = prv0.sign(H)

let pub0 = prv0.getPublicKey(pub0)

let vec = prv0.share(n, k)

let signVec = new Array(n)

for (let i = 0; i < n; i++) {
  let H = Et.pointFactory(rng)
  signVec[i] = vec[i].sign(H)

  let pub = vec[i].getPublicKey()
  if (pub == pub0) {
    throw new Error('error pub key')
  }
  if (!pub.verify(signVec[i], H)) {
    throw Error('verify error')
  } else {
    console.log('true in index')
  }
}

// 3-n
let prvVec = new Array(3)
prvVec[0] = vec[0]
prvVec[1] = vec[1]
prvVec[2] = vec[2]

let prv = new SecretKey()
prv.recover(prvVec)
if (!prv.s.equals(prv0.s)) {
  throw Error('Error wrong shares')
}

// n-n
prv = new SecretKey()
prv.recover(vec)
if (!prv.s.equals(prv0.s)) {
  throw Error('Error: wrong shares')
}

// 2-n (n = 5)
prvVec = new Array(2)
prvVec[0] = vec[0]
prvVec[1] = vec[1]
prv = new SecretKey()
prv.recover(prvVec)
if (prv.s.equals(prv0.s)) {
  throw Error('Error: shares 2-5 equal original key!')
}

let signArray = new Array(3)
signArray[0] = signVec[0]
signArray[1] = signVec[1]
signArray[2] = signVec[2]

let sig = new Signature()
sig.recover(signArray)

if (!sig.sH.eq(sig0.sH)) {
  throw Error('Error: can\'t recover signature!')
}

// 2-5 recover doesn't work
signArray = new Array(2)
signArray[0] = signVec[0]
signArray[1] = signVec[1]

sig.recover(signArray)

if (sig.sH.eq(sig0.sH)) {
  throw Error('Error: unlikely we can recover 2-n signature!');
}