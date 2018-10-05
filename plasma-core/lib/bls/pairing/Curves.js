'use strict';

import Parameters from './Parameters'
import { Point, Point2 } from './Points'
import { Field2, Field4, Field6, Field12 } from './Fields'
import CryptoRandom from './Rnd'
import bigInt from 'big-integer'
import ExNumber from './ExNumber'

class Curve {
    constructor(bn) {
        if (bn instanceof Parameters) {
            this.bn = bn;
            this.b = (bn.b === 3) ? bn._3 : bn._2;
            this.infinity = new Point(this);
            this.G = (bn.b === 3) ? new Point(this, bn._1, bn._2) : new Point(this, bn._1.negate(), bn._1);
        }
    }

    pointFactory(rand) {
        if (rand instanceof CryptoRandom) {
            let x, y;
            do {
                x = ExNumber.mod(ExNumber.construct(2 * this.bn.p.bitLength(), rand), this.bn.p);
                y = this.bn.sqrt(x.multiply(x).multiply(x).add(this.b));
            } while (y === null);
            return new Point(this, x, y);
        } else {
            throw new Error("Parameter is not a cryptographically strong PRNG");
        }
    }

    contains(P) {
        if (P.E !== this) {
            return false;
        }
        let x, y, z = bigInt();

        let x2, z2, z4, br = new bigInt();
        x = P.x,
            y = P.y,
            z = P.z;

        x2 = new ExNumber(x.multiply(x)).mod(this.bn.p),
            z2 = new ExNumber(z.multiply(z)).mod(this.bn.p),
            z4 = new ExNumber(z2.multiply(z2)).mod(this.bn.p),
            br = new ExNumber(this.b.multiply(z2)).mod(this.bn.p);
        return new ExNumber(
            x.multiply(x2).add(br.multiply(z4)).subtract(y.multiply(y)).mod(this.bn.p)).signum() === 0;
    }
}

class Curve2 {
    constructor(E) {

        if (E instanceof Curve) {
            this.E = E;
            this.Fp2_0 = E.bn.Fp2_0;
            this.Fp2_1 = E.bn.Fp2_1;
            this.Fp2_i = E.bn.Fp2_i;
            this.infinity = new Point2(this);
            if (ExNumber.intValue(E.b) === 3) {

                this.bt = new Field2(E.bn, E.b).mulV();
                this.xt = this.Fp2_1;

                this.yt = this.xt.multiply(this.xt).multiply(this.xt).add(this.bt).sqrt();
            } else {
                this.bt = this.Fp2_1.subtract(this.Fp2_i);
                this.xt = this.Fp2_i.negate();
                this.yt = this.Fp2_1;
            }
            this.Gt = new Point2(this, this.xt, this.yt);
            this.Gt = this.Gt.multiply(E.bn.ht).norm();
            this.pp16Gt = new Array(Math.round((this.E.bn.n.bitLength() + 3) / 4));
            for (let i = 0; i < Math.round((this.E.bn.n.bitLength() + 3) / 4); i++) {
                this.pp16Gt[i] = new Array(16);
            }
            this.pp16Gi = this.pp16Gt[0];
            this.pp16Gi[0] = this.infinity;
            this.pp16Gi[1] = this.Gt;
            for (let i = 1, j = 2; i <= 7; i++ , j += 2) {
                this.pp16Gi[j] = this.pp16Gi[i].twice(1);
                this.pp16Gi[j + 1] = this.pp16Gi[j].add(this.Gt);
            }
            for (let i = 1; i < this.pp16Gt.length; i++) {
                this.pp16Gh = this.pp16Gi;
                this.pp16Gi = this.pp16Gt[i];
                this.pp16Gi[0] = this.pp16Gh[0];
                for (let j = 1; j < 16; j++) {
                    this.pp16Gi[j] = this.pp16Gh[j].twice(4);
                }
            }
        }
    }

    pointFactory(rand) {
        let k;
        do {
            k = ExNumber.mod(ExNumber.construct(this.E.bn.n.bitLength(), rand), this.E.bn.n);
        } while (ExNumber.signum(k) === 0);

        let multiply = this.Gt.multiply(k);

        return multiply
    }

    contains(P) {
        if (P.E !== this) {
            return false;
        }
        let x = P.x;
        let y = P.y;
        let z = P.z;
        // y^2 = x^3+bz^5
        return y.square().eq(x.cube().add(this.bt.multiply(z.square().cube())));
    }

    kG(k) {
        k = new ExNumber(k).mod(this.E.bn.n);
        let A = this.infinity;
        for (let i = 0, w = 0; i < this.pp16Gt.length; i++ , w >>>= 4) {
            if ((i & 7) === 0) {
                w = ExNumber.intValue(k);
                k = k.shiftRight(32);
            }
            A = A.add(this.pp16Gt[i][w & 0xf]);
        }
        return A;
    }
}

export { Curve, Curve2 }