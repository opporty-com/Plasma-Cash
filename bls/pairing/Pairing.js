'use strict';

import { Field2, Field4, Field6, Field12 } from './Fields'
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

    slope(V, P, Q) {
        let p = this.bn.p;
        if (V.zero() || P.zero() || Q.zero()) {
            return this.Fp12_1;
        }
        let Vz3 = new ExNumber(V.z.multiply(V.z).multiply(V.z)).mod(p);
        let n,d;
        if (V.eq(P)) {
            n = V.x.multiply(V.x).multiply(bigInt("3"));
            d = V.y.multiply(V.z).shiftLeft(1);
        } else {
            n = P.y.multiply(Vz3).subtract(V.y);
            d = P.x.multiply(Vz3).subtract(V.x.multiply(V.z));
        }
        let w = new Array(6);
        
        w[0] = new Field2(this.bn,new ExNumber( d.multiply(V.y).subtract(n.multiply(V.x).multiply(V.z)) ).mod(this.bn.p));
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
                if (ExNumber.testBit(bn.n, i)) {
                    f = f.multiply(this.slope(V, P, Q));
                    V = V.add(P);
                }
            }
            f = f.finExp();
        }
        return f;
    }

    ate(Q, P) {
        var f = this.Fp12_1;
        P = P.norm();
        Q = Q.norm();
        if (!P.zero() && !Q.zero()) {
            var ord = this.bn.t.subtract(this.E.bn._1);
            var X = Q.x;
            var Y = Q.y;
            var Z = Q.z;
            var w = new Array(6);
            var start = ord.bitLength() - 2;
            for (var i = start; i >= 0; i--) {
                var A = X.square();
                var B = Y.square();
                var C = Z.square();
                if (this.bn.b === 3) {
                    var D = C.multiply(new Number(3*this.bn.b)).mulV();
                } else {
                    var D = C.multiply(new Number(3*this.bn.b)).divV();
                }
                var F = Y.add(Z).square().subtract(B).subtract(C);
                if (i > 0) {
                    this.E = X.add(Y).square().subtract(A).subtract(B);
                    var G = D.multiply(new Number(3));
                    X = this.E.multiply(B.subtract(G));
                    Y = B.add(G).square().subtract(D.square().twice(2).multiply(new Number(3)));
                    Z = B.multiply(F).twice(2);
                }

                w[0] = F.multiply(P.y.negate()); 
                w[1] = A.multiply(new Number(3)).multiply(P.x); 
                w[3] = D.subtract(B); // L_{0,0}
                w[2] = w[4] = w[5] = this.E2.Fp2_0;
                var line = new Field12(this.bn, w);
                if (i !== ord.bitLength() - 2) {
                    f = f.square().multiply(line);
                } else {
                    f = new Field12(line);
                }
                if (ExNumber.testBit(ord, i)) {
                    A = X.subtract(Z.multiply(Q.x)); B = Y.subtract(Z.multiply(Q.y));
                    
                    w[0] = A.multiply(P.y); 
                    w[1] = B.multiply(P.x.negate()); 
                    w[3] = B.multiply(Q.x).subtract(A.multiply(Q.y)); 
                    w[2] = w[4] = w[5] = this.E2.Fp2_0;
                    line = new Field12(this.bn, w);
                    f = f.multiply(line);
                    C = A.square(); X = X.multiply(C); C = C.multiply(A);
                    D = B.square().multiply(Z).add(C).subtract(X.twice(1));
                    Y = B.multiply(X.subtract(D)).subtract(Y.multiply(C));
                    X = A.multiply(D);
                    Z = Z.multiply(C);
                }
            }
            f = f.finExp();
        }
        return f;
    }

}

export default Pairing