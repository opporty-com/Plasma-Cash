'use strict';

import BigInteger from './BigInteger'
import { Field2, Field4, Field6, Field12} from './Fields'

let MillerLoop = true;
let FinalExp = true;

class Pairing {
    constructor (Et) {
        this.E2 = Et;
        this.E = Et.E;
        this.bn = this.E.bn;
        this.Fp12_0 = this.bn.Fp12_0;
        this.Fp12_1 = this.bn.Fp12_1;
    }

    slope(V, P, Q) {
        let p = this.bn.p;
        if (V.zero() || P.zero() || Q.zero()) {
            return this.Fp12_1;
        }
        let Vz3 = V.z.multiply(V.z).multiply(V.z).mod(p);
        let n,d;
        if (V.eq(P)) {
            n = V.x.multiply(V.x).multiply(new BigInteger("3"));
            d = V.y.multiply(V.z).shiftLeft(1);
        } else {
            n = P.y.multiply(Vz3).subtract(V.y);
            d = P.x.multiply(Vz3).subtract(V.x.multiply(V.z));
        }
        let w = new Array(6);
        
        w[0] = new Field2(this.bn, d.multiply(V.y).subtract(n.multiply(V.x).multiply(V.z)).mod(this.bn.p));
        w[2] = Q.x.multiply(n.multiply(Vz3));
        w[3] = Q.y.multiply(p.subtract(d).multiply(Vz3));
        w[1] = w[4] = w[5] = this.E2.Fp2_0;
        return new Field12(this.bn, w);
    }

    tate(P, Q) {
        let f = this.Fp12_1;
        P = P.norm();
        Q = Q.norm();
        if (!P.zero() && !Q.zero()) {
            let bn = this.E.bn;
            let V = P;
            for (let i = bn.n.bitLength() - 2; i >= 0; i--) {
                f = f.square().multiply(this.slope(V, V, Q));
                V = V.twice(1);
                if (bn.n.testBit(i)) {
                    f = f.multiply(this.slope(V, P, Q));
                    V = V.add(P);
                }
            }
            f = f.finExp();
        }
        return f;
    }

}

export default Pairing