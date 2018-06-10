'use strict';

import CryptoRandom from './pairing/Rnd'
import { Point, Point2 } from './pairing/Points' 
import { Field2, Field4, Field6, Field12 } from './pairing/Fields' 
import Parameters from './pairing/Parameters'
import { Curve, Curve2 } from './pairing/Curves'
import Pairing from './pairing/Pairing'
import bigInt from 'big-integer'
import ExNumber from './pairing/ExNumber'

const rng = new CryptoRandom();

class BLSSigner {
    static sign(Et, H,s) {
        return H.multiply(s);
    }
    static verify(pair, Q, H, sQ, sH) {
        let a = pair.ate(H, sQ);
        let b = pair.ate(sH, Q);
        return(a.eq(b));
    }
}

const br = [192, 256];

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

for (let b of br) {
    const bn = new Parameters(b);
    const E  = new Curve(bn);
    const Et = new Curve2(E);
    const pair = new Pairing(Et);
    console.time('sign');

    const s = bigInt(5);
    let H = Et.pointFactory(rng);
    const Q = E.pointFactory(rng);
    const sQ = Q.multiply(s);
    const sH = BLSSigner.sign(Et,  H,  s);
    const sH2 = BLSSigner.sign(Et, H, 4);
    console.log('\x1b[37m', ' Q ('+b+') = (' + (Q.x)+ ', ' +(Q.y)+ ', ' +(Q.z)+')');
    console.log('\x1b[37m', ' sQ('+b+') = (' + (sQ.x)+ ', ' +(sQ.y)+ ', ' +(sQ.z)+')');
    console.log('\x1b[37m', ' H ('+b+') = (' + (H.x.re)+ ', ' +(H.y.re)+ ', ' +(H.z.re)+')');
    console.log('\x1b[37m', ' sH('+b+') = (' + (sH.x.re)+ ', ' +(sH.y.re)+ ', ' +(sH.z.re)+')');
    console.log( '\x1b[33m', ' Verify(Q,sQ,H,sH) = ' + BLSSigner.verify(pair, Q,H,sQ,sH)+'');
    console.log('\x1b[31m', ' Verify(Q,sQ,H,s2H) = ' + BLSSigner.verify(pair, Q,H,sQ,sH2)+'');

    console.timeEnd('sign');
 
    console.log('\x1b[32m','-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-')
}
