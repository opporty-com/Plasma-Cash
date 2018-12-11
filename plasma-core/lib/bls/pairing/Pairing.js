'use strict';

import { Field2, Field12 } from './Fields'
import { Point12 } from './Points'
import bigInt from 'big-integer'
import ExNumber from './ExNumber'

class Pairing {
    constructor (Et) {
      this.E2 = Et;
      this.E = Et.E;
      this.bn = this.E.bn;
      this.Fp12_0 = this.bn.Fp12_0;
      this.Fp12_1 = this.bn.Fp12_1;
    }

    tate(P, Q) {
      let f = this.Fp12_1;

      if (!P.zero() && !Q.zero()) {
        const bn = this.E.bn;
        let V = P;
        for (let i = bn.n.bitLength() - 2; i >= 0; i--) {
            f = f.square().multiply(this.slope(V, V, Q));
            V = V.twice(1);
            if (ExNumber.testBit(bn.n, i)) {
                f = f.multiply(this.slope(V, P, Q));
                V = V.add(P);
            }
        }
        f = f.finExp();
      }
      return f;
    }

    doubletate(P,Q,P2,Q2) {
      let f = this.Fp12_1;
      if (!P.zero() && !Q.zero()) {
        let bn = this.E.bn;
        let V = P;
        let V2 = P2;
        for (let i = bn.n.bitLength() - 2; i >= 0; i--) {
          f = f.square().multiply(this.slope(V, V, Q)).multiply(this.slope(V2, V2, Q2));
          V = V.twice(1);
          V2 = V2.twice(1);
          if (ExNumber.testBit(bn.n, i)) {
            f = f.multiply(this.slope(V, P, Q)).multiply(this.slope(V2, P2, Q2));
            V = V.add(P);
            V2 = V2.add(P2);
          }
        }

      }
      return f;
    }

    slope(P1, P2, T) {
      const x1 = P1.x;
      const y1 = P1.y;
      const x2 = P2.x;
      const y2 = P2.y;
      const xt = T.x;
      const yt = T.y;
      let m;
      const _3 = new Field12(this.E.bn, bigInt(3));
      const _2 = new Field12(this.E.bn, bigInt(2));

      if (!x1.eq(x2)) {
        m = y2.subtract(y1).divide(x2.subtract(x1));
        
        return m.multiply(xt.subtract(x1)).subtract(yt.subtract(y1));
      } else if (y1.eq(y2)) {
        
        m = _3.multiply(x1.multiply(x1)).divide(_2.multiply(y1));
       
        return m.multiply (xt.subtract(x1)).subtract(yt.subtract (y1))
      } else {
        
        return xt.subtract(x1);
      }
    }

    ate(P, Q) {
      const ateCount = bigInt('29793968203157093288')
      const logAteCount = bigInt('63')

      let R = Q;
      let f = this.E.bn.Fp12_1;

      if (Q.eq(this.E2.infinity) || P.eq(this.E.infinity)) {
        return this.E.bn.Fp12_1;
      }
      
      for (let i = logAteCount; i >- 1; i--) {
        f = f.multiply( f).multiply (this.slope(R, R, P))
        R = R.double();
        if (!ateCount.and(bigInt(2).pow(i)).isZero()) {
          f = f.multiply(this.slope(R, Q, P));
          R = R.add(Q);
        }
      }
      
      const Q1 = new Point12(this.E.bn,  Q.x.exp(this.E.bn.p), Q.y.exp( this.E.bn.p) );
      const nQ2 = new Point12(this.E.bn, Q1.x.exp( this.E.bn.p ), Q1.y.exp( this.E.bn.p ).neg() );
      
      f = f.multiply( this.slope(R, Q1, P) )
      R = R.add(Q1)
      f = f.multiply( this.slope(R, nQ2, P) );
      return f.finExp();
    }
}

export default Pairing