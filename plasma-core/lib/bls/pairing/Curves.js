'use strict';

import Parameters from './Parameters'
import { Point, Point2 } from './Points'
import { Field2, Field12, Fp2 } from './Fields'
import CryptoRandom from './Rnd'
import bigInt from 'big-integer'
import ExNumber from './ExNumber'

class Curve {
  constructor(bn) {
      const _1 = new Field2(bn.p, bigInt(1));
      const _2 = new Field2(bn.p, bigInt(2));
      const _3 = new Field2(bn.p, bigInt(3));
      this.bn = bn;
      this.b =  _3; 
      this.infinity = new Point(this);
      this.G = new Point(this, _1, _2);
    
  }

  pointFactory(rand) {
    if (rand instanceof CryptoRandom) {
      return this.G.multiply(ExNumber.construct(2*this.bn.p.bitLength() ) );
    } else {
      throw new Error("Parameter is not a cryptographically strong PRNG");
    }
  }

  contains(P) {
    if (P.E !== this) {
      return false;
    }
    
    let x  = P.x;
    let y  = P.y;

    if (x instanceof Field12 && y instanceof Field12) {
      const b = new Field12(this.bn, [
        new Field2(this.bn.p, bigInt('3'), bigInt.zero, false),
        new Field2(this.bn.p, bigInt.zero, bigInt.zero, false),
        new Field2(this.bn.p, bigInt.zero, bigInt.zero, false),
        new Field2(this.bn.p, bigInt.zero, bigInt.zero, false),
        new Field2(this.bn.p, bigInt.zero, bigInt.zero, false),
        new Field2(this.bn.p, bigInt.zero, bigInt.zero, false),
      ]);
      return y.square().eq(x.multiply(x).multiply(x).add(b));
    }

    return y.square().eq(x.multiply(x).multiply(x).add(this.b));
  }

  kG(k) {
    return this.Gt.multiply(k);
  }
}

class Curve2 extends Curve {
  constructor(E) {
    super(E.bn);
    if (E instanceof Curve) {
      this.E = E;
      this.bn = E.bn;
      this.Fp2_0 = E.bn.Fp2_0;
      this.Fp2_1 = E.bn.Fp2_1;
      this.Fp2_i = E.bn.Fp2_i;
      this.infinity = new Point2(this);

      this.b = new Field2(E.bn.p, bigInt('3')).mulV();

      if (E.bn.m == 256)
        this.b = new Field2(E.bn.p, bigInt('3')).divide(new Field2(E.bn.p, bigInt('9'), bigInt('1'), false));

      this.xt = new Field2(E.bn.p, bigInt('1'), bigInt.zero, false);
      this.yt = this.xt.cube().add(this.b).sqrt();

      if (E.bn.m == 256) {
        this.xt = new Field2(E.bn.p, 
          bigInt('10857046999023057135944570762232829481370756359578518086990519993285655852781'),
          bigInt('11559732032986387107991004021392285783925812861821192530917403151452391805634'), false);
        this.yt = new Field2(E.bn.p, 
          bigInt('8495653923123431417604973247489272438418190587263600148770280649306958101930'),
          bigInt('4082367875863433681332203403145435568316851327593401208105741076214120093531'), false);
      }

      this.Gt = new Point2(this, this.xt, this.yt);
    }
  }

  pointFactory(rand) {
    if (rand instanceof CryptoRandom) {
      return this.Gt.multiply(ExNumber.construct(2*this.bn.p.bitLength() ) );
    } else {
      throw new Error("Parameter is not a cryptographically strong PRNG");
    }
  }
}

export { Curve, Curve2 }