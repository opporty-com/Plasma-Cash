'use strict';

import BigInteger from './pairing/BigInteger'
import CryptoRandom from './pairing/Rnd'
import { Point, Point2 } from './pairing/Points' 
import { Field2, Field4, Field6, Field12 } from './pairing/Fields' 
import Parameters from './pairing/Parameters'
import { Curve, Curve2 } from './pairing/Curves'
import Pairing from './pairing/Pairing'

const rng = new CryptoRandom();

class BLSSigner {
    static sign(Et, H,s) {
        return H.twice(s);
    }
    static verify(pair, Q, H, sQ, sH) {
        let a = pair.tate(sQ, H);
        let b = pair.tate(Q, sH);
        return(a.eq(b));
    }
}

const br = [192, 256];

/*const m5 = new BigInteger('5');
m5 = m5.negate();
m5 = m5.add(new BigInteger('10')).subtract(new BigInteger('2')).
multiply(new BigInteger('2')).subtract(new BigInteger('1')).square().divide(new BigInteger('5')).shiftLeft(1).shiftRight(1);
console.log(m5.equals(new BigInteger('5'))); 
m5 = m5.modPow(new BigInteger('501'), new BigInteger('3'));
console.log('modpow501mod3',m5);
console.log('bitLength', m5.bitLength() )
console.log('byteArr', new BigInteger('514').toByteArray() )
console.log('intValue', new BigInteger('2147483649').intValue() )
console.log('compareTo', new BigInteger('5').compareTo(new BigInteger('4')) );
console.log('signum', new BigInteger('-5').signum() );
console.log('7mod3', new BigInteger('7').mod(new BigInteger('3')))
console.log('3modinv11', new BigInteger('3').modInverse(new BigInteger('11')))
console.log('6testbit1', new BigInteger('6').testBit(new BigInteger('1')))
console.log('6testbit2', new BigInteger('6').testBit(new BigInteger('2')))
console.log('6testbit3', new BigInteger('6').testBit(new BigInteger('3')))
const five = new MyNumber('5');
let m25 = five.negate().add(bigInt(10)).subtract(bigInt(2)).
multiply(bigInt(2)).subtract(bigInt(1)).square().divide(bigInt(5)).shiftLeft(1).shiftRight(1);
console.log('equals',m25.equals(bigInt(5)));
m25 = m25.modPow(bigInt(501), bigInt(3));
console.log('modpow501mod3',m25);
console.log('bitlength',m25.bitLength());
console.log('byteArr',bigInt(514).toArray(256));
console.log('intValue', new MyNumber('2147483649').intValue()  )
console.log('compareTo', bigInt(5).compare(bigInt(4)) );
console.log('signum', new MyNumber('-5').signum() );
console.log('7mod3', bigInt('7').mod(bigInt(3)))
console.log('3modinv11', bigInt('3').modInv(bigInt(11)))
console.log('6testbit1', new MyNumber(bigInt('6')).testBit(1)   )
console.log('6testbit2', new MyNumber(bigInt('6')).testBit(2)   )
console.log('6testbit3', new MyNumber(bigInt('6')).testBit(3)   )*/
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

console.log(rng)
console.log(rng.nextBytes(10));

for (let b of br) {
    console.time('t'+b)
    const bn = new Parameters(b);
    const E  = new Curve(bn);
    const Et = new Curve2(E);
    const pair = new Pairing(Et);
    
    const s = 2;
    let H = Et.pointFactory(rng);
    const Q = E.pointFactory(rng);
    const sQ = Q.twice(s);
    const sH = BLSSigner.sign(Et,  H,  s);
    const sH2 = BLSSigner.sign(Et, H, 4);
    
    console.log('\x1b[37m', ' Q ('+b+') = (' + (Q.x)+ ', ' +(Q.y)+ ', ' +(Q.z)+')');
    console.log('\x1b[37m', ' sQ('+b+') = (' + (sQ.x)+ ', ' +(sQ.y)+ ', ' +(sQ.z)+')');
    console.log('\x1b[37m', ' H ('+b+') = (' + (H.x.re)+ ', ' +(H.y.re)+ ', ' +(H.z.re)+')');
    console.log('\x1b[37m', ' sH('+b+') = (' + (sH.x.re)+ ', ' +(sH.y.re)+ ', ' +(sH.z.re)+')');

    console.log( '\x1b[33m', ' Verify(Q,sQ,H,sH) = ' + BLSSigner.verify(pair, Q,H,sQ,sH)+'');
    console.timeEnd('t'+b)

    console.log('\x1b[31m', ' Verify(Q,sQ,H,s2H) = ' + BLSSigner.verify(pair, Q,H,sQ,sH2)+'');
    
    console.log('\x1b[32m','-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-')
}
