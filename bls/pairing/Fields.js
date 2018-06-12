'use strict';

import CryptoRandom from './Rnd'
import bigInt from 'big-integer'
import ExNumber from './ExNumber'

class Field2 {
    constructor (bn, re, im, reduce) {
        if(arguments.length === 1) {
            this.bn = bn;
            this.re = bn._0;
            this.im = bn._0;
        }
        if(arguments.length === 2) {
            if (bigInt.isInstance(re)) {
                this.bn = bn;
                this.re = re;
                this.im = bn._0;
            } else if (re instanceof CryptoRandom) {
                this.bn = bn;
                let rand = re;
                do {
                    this.re = new ExNumber(this.bn.p.bitLength(), rand).int();
                } while (this.re.compareTo(this.bn.p) >= 0);
                do {
                    this.im = new ExNumber(this.bn.p.bitLength(), rand).int();
                } while (this.im.compareTo(this.bn.p) >= 0);
            }
        }
        if(arguments.length === 4) {
            this.bn = bn;
            if (reduce) {
                this.re = ExNumber.mod(re, bn.p);
                this.im = ExNumber.mod(im, bn.p);
            } else {
                this.re = re;
                this.im = im;
            }
        }
    }

    randomize(rand) {
        return new Field2(this.bn, rand);
    };

    zero() {
        return ExNumber.signum(this.re) === 0 && ExNumber.signum(this.im) === 0;
    }

    one() {
        return this.re.compareTo(this.bn._1) === 0 && ExNumber.signum(this.im) === 0;
    }

    eq(u) {
        if (!(u instanceof Field2)) {
            return false;
        }
        let v = u;
        return this.bn === v.bn &&
            this.re.compareTo(v.re) === 0 &&
            this.im.compareTo(v.im) === 0;
    }

    neg() {
        return new Field2(this.bn, (ExNumber.signum(this.re) !== 0) ? this.bn.p.subtract(this.re) : this.re, (ExNumber.signum(this.im) !== 0) ? this.bn.p.subtract(this.im) : this.im, false);
    }

    conj() {
        return new Field2(this.bn, this.re, (ExNumber.signum(this.im) !== 0) ? this.bn.p.subtract(this.im) : this.im, false);
    }

    add (v) {
        if (v instanceof Field2) {
            if (this.bn !== v.bn) {
                throw new Error("Operands are in different finite fields");
            }
            let r = this.re.add(v.re);
            
            if (r.compareTo(this.bn.p) >= 0) {
                r = r.subtract(this.bn.p);
            }
            let i = this.im.add(v.im);
            
            if (i.compareTo(this.bn.p) >= 0) {
                i = i.subtract(this.bn.p);
            }
            return new Field2(this.bn, r, i, false);
        } else if (bigInt.isInstance(v)) {
            let s = this.re.add(v);
            
            if (s.compareTo(this.bn.p) >= 0) {
                s = s.subtract(this.bn.p);
            }
            return new Field2(this.bn, s, this.im, false);
        }
    }

    subtract(v) {
        if (v instanceof Field2) {
            if (this.bn !== v.bn) {
                throw new Error("Operands are in different finite fields");
            }
            let r = this.re.subtract(v.re);
            
            if (ExNumber.signum(r) < 0) {
                r = r.add(this.bn.p);
            }
            let i = this.im.subtract(v.im);
            
            if (ExNumber.signum(i) < 0) {
                i = i.add(this.bn.p);
            }
            return new Field2(this.bn, r, i, false);
        } else if (bigInt.isInstance(v)) {
            
            let r = this.re.subtract(v);
            if (r.signum() < 0) {
                r = r.add(this.bn.p);
            }
            return new Field2(this.bn, r, this.im, false);
        }
    }

    twice  (k) {
        let r = this.re;
        let i = this.im;
        while (k-- > 0) {
            r = r.shiftLeft(1);
            if (r.compareTo(this.bn.p) >= 0) {
                r = r.subtract(this.bn.p);
            }
            i = i.shiftLeft(1);
            if (i.compareTo(this.bn.p) >= 0) {
                i = i.subtract(this.bn.p);
            }
        }
        return new Field2(this.bn, r, i, false);
    }

    halve () {
        return new Field2(this.bn,
            (ExNumber.testBit(this.re, 0) ? this.re.add(this.bn.p) : this.re).shiftRight(1),
            (ExNumber.testBit(this.im, 0) ? this.im.add(this.bn.p) : this.im).shiftRight(1),
            false);
    }

    multiply (v) {
        if (v instanceof Field2) {
            if (this === v) {
                return this.square();
            }
            if (this.bn !== v.bn) {
                throw new Error("Operands are in different finite fields");
            }
            if (this.one() || v.zero()) {
                return v;
            }
            if (this.zero() || v.one()) {
                return this;
            }

            let re2 = this.re.multiply(v.re);
            let im2 = this.im.multiply(v.im);
            let mix = this.re.add(this.im).multiply(v.re.add(v.im));

            return new Field2(this.bn,
                re2.subtract(im2),
                mix.subtract(re2).subtract(im2),
                true);
        }

        else if (bigInt.isInstance(v) ) {
            return new Field2(this.bn, this.re.multiply(v), this.im.multiply(v), true);
        }
        else if (v instanceof Number) {
            let newre = this.re.multiply(bigInt(v.toString()));
            while ( ExNumber.signum(newre) < 0) {
                newre = newre.add(this.bn.p);
            }
            while (newre.compareTo(this.bn.p) >= 0) {
                newre = newre.subtract(this.bn.p);
            }
            let newim = this.im.multiply(bigInt(v.toString()));
            while (ExNumber.signum(newim) < 0) {
                newim = newim.add(this.bn.p);
            }
            while (newim.compareTo(this.bn.p) >= 0) {
                newim = newim.subtract(this.bn.p);
            }
            return new Field2(this.bn, newre, newim, false);
        } else {
            throw new Error("Incorrect type argument");
        }
    }

    square () {
        if (this.zero() || this.one()) {
            return this;
        }
        if (ExNumber.signum(this.im) === 0) {
            return new Field2(this.bn,
                this.re.multiply(this.re), this.bn._0, true);
        }
        if ( ExNumber.signum(this.re) === 0) {
            return new Field2(this.bn,
                this.im.multiply(this.im).negate(), this.bn._0, true);
        }

        return new Field2(this.bn,
            this.re.add(this.im).multiply(this.re.subtract(this.im)),
            this.re.multiply(this.im).shiftLeft(1),
            true);
    }

    cube () {
        let re2 = this.re.multiply(this.re);
        let im2 = this.im.multiply(this.im);
        return new Field2(this.bn,
            this.re.multiply(re2.subtract(im2.add(im2).add(im2))),
            this.im.multiply(re2.add(re2).add(re2).subtract(im2)),
            true);
    }

    inverse () {
        let d = this.re.multiply(this.re).add(this.im.multiply(this.im)).modInv(this.bn.p);
        return new Field2(this.bn, this.re.multiply(d), this.bn.p.subtract(this.im).multiply(d), true);
    }

    mulI () {
        return new Field2(this.bn, (ExNumber.signum(this.im) !== 0) ? this.bn.p.subtract(this.im) : this.im, this.re, false);
    }

    divideI () {
        return new Field2(this.bn, this.im, (ExNumber.signum(this.re) !== 0) ? bn.p.subtract(this.re) : this.re, false);
    }

    mulV () {
        let r = this.re.subtract(this.im);
        if (ExNumber.signum(r) < 0) {
            r = r.add(this.bn.p);
        }
        let i = this.re.add(this.im);
        if (i.compareTo(this.bn.p) >= 0) {
            i = i.subtract(this.bn.p);
        }
        return new Field2(this.bn, r, i, false);
    }

    divV () {
        let qre = this.re.add(this.im);
        if (qre.compareTo(this.bn.p) >= 0) {
            qre = qre.subtract(this.bn.p);
        }
        let qim = this.im.subtract(this.re);
        if (ExNumber.signum(qim) < 0) {
            qim = qim.add(this.bn.p);
        }
        return new Field2(this.bn, (ExNumber.testBit(qre, 0) ? qre.add(this.bn.p) : qre).shiftRight(1),
            (ExNumber.testBit(qim, 0) ? qim.add(this.bn.p) : qim).shiftRight(1), false);
    }

    exp (k) {
        let P = this;
        if (ExNumber.signum(k) < 0) {
            k = k.neg();
            P = P.inverse();
        }
        let e = ExNumber.toByteArray(k);

        var mP = new Array(16);
        mP[0] = this.bn.Fp2_1;
        mP[1] = P;
        for (var m = 1; m <= 7; m++) {
            
            mP[2*m] = mP[m].square();
            mP[2*m + 1] = mP[2*m].multiply(P);
        }
        var A = mP[0];
        for (var i = 0; i < e.length; i++) {
            var u = e[i] & 0xff;
            A = A.square().square().square().square().multiply(mP[u >>> 4]).square().square().square().square().multiply(mP[u & 0xf]);
        }
        return A;
    }

    sqrt () {
        if (this.zero()) {
            return this;
        }
        let r = this.exp(this.bn.sqrtExponent2);
        let r2 = r.square();
        if (r2.subtract(this).zero()) {
            return r;
        }
        if (r2.add(this).zero()) {
            return r.mulI();
        }
        r2 = r2.mulI();
       
        r = r.multiply(this.bn.sqrtI);
        if (r2.subtract(this).zero()) {
            return r;
        }
        if (r2.add(this).zero()) {
            return r.mulI();
        }
        return null;
    }

    cbrt () {
        if (this.zero()) {
            return this;
        }
        let r = this.exp(bn.cbrtExponent2);
        return r.cube().subtract(this).zero() ? r : null;
    }

    toString() {
        return '['+this.re.toJSNumber()+','+this.im.toJSNumber()+']';
    }

    
}

class Field4 {

    constructor (bn, re, im) {
        if (arguments.length === 1) {
            this.bn = bn;
            this.re = this.im = bn.Fp2_0;
        }
        if (arguments.length === 2) {
    
            if (re instanceof Field2) {
                this.bn = bn;
                this.re = re;
                this.im = bn.Fp2_0;
            }
            else if (bigInt.isInstance(re)) {
                let k = re;
                this.bn = bn;
                this.re = new Field2(bn, k);
                this.im = bn.Fp2_0;
            }
            else if (re instanceof CryptoRandom()) {
                this.bn = bn;
                this.re = new Field2(bn, re);
                this.im = new Field2(bn, re);
            }
        }

        if (arguments.length === 3) {
            this.bn = bn;
            this.re = re;
            this.im = im;
        }
    }

    randomize (rand) {
        return new Field4(this.bn, rand);
    }

    zero () {
        return this.re.zero() && this.im.zero();
    }

    

    multiply (w) {
        /*
         * 
         * @param {Field4} w
         * @returns
         */
        if (w instanceof Field4) {
            if (w === this) {
                return square();
            }
            if (this.bn !== w.bn) {
                throw new Error("Operands are in different finite fields");
            }
            if (this.one() || w.zero()) {
                return w;
            }
            if (this.zero() || w.one()) {
                return this;
            }
            let b0 = this.re;
            let b1 = this.im;
            let c0 = w.re;
            let c1 = w.im;
           
            let b0c0 = b0.multiply(c0);
            let b1c1 = b1.multiply(c1);
            return new Field4(this.bn,
                (this.bn.b === 3) ? b0c0.add(b1c1.divV()) :  b0c0.add(b1c1.mulV()),
                b0.add(b1).multiply(c0.add(c1)).subtract(b0c0).subtract(b1c1));
        }
        /*
         * 
         */
        if (w instanceof Field2) {
            if (this.bn !== w.bn) {
                throw new Error("Operands are in different finite fields");
            }
            if (w.one()) {
                return this;
            }
            return new Field4(this.bn, this.re.multiply(w), this.im.multiply(w));
        }
    }

    square () {
        if (this.zero() || this.one()) {
            return this;
        }
        let a0 = this.re;
        let a1 = this.im;
       
        let a02 = a0.square();
        let a12 = a1.square();
        return new Field4 (this.bn,
            (this.bn.b === 3) ? a02.add(a12.divV()) : a02.add(a12.mulV()),
            a0.add(a1).square().subtract(a02).subtract(a12));
    }

    inverse() {
        let d = this.re.square().subtract(this.im.square().mulV());
        return new Field4(this.bn, this.re.multiply(d), this.im.multiply(d).neg());
    }

    one() {
        return this.re.one() && this.im.zero();
    }

    eq(o) {
        if (!(o instanceof Field4)) {
            return false;
        }
        let w = o;
        return this.bn === w.bn &&
            this.re.eq(w.re) && this.im.eq(w.im);
    }

    neg () {
        return new Field4(this.bn, this.re.neg(), this.im.neg());
    }

    add  (w) {
        if (this.bn !== w.bn) {
            throw new Error("Operands are in different finite fields");
        }
        return new Field4(this.bn, this.re.add(w.re), this.im.add(w.im));
    }

    subtract (w) {
        if (this.bn !== w.bn) {
            throw new Error("Operands are in different finite fields");
        }
        return new Field4(this.bn, this.re.subtract(w.re), this.im.subtract(w.im));
    }

    twice  (k) {
        return new Field4(this.bn, this.re.twice(k), this.im.twice(k));
    }

    halve  () {
        return new Field4(this.bn, this.re.halve(), this.im.halve());
    }

    mulV () {
        return new Field4(this.bn, this.im.mulV(), this.re);
    }

    divV () {
        return new Field4(this.bn, this.im.divV(), this.re);
    }
}

class Field6 {

    constructor (bn, k, v1, v2) {
        if (arguments.length === 1) {
            this.bn = bn;
            this.v = new Array(3);
            this.v[0] = this.v[1] = this.v[2] = bn.Fp2_0;
        }
        if (arguments.length === 2) {
            if (bigInt.isInstance(k)) {
                this.bn = bn;
                this.v = new Array(3);
                this.v[0] = new Field2(bn, k);
                this.v[1] = this.v[2] = bn.Fp2_0;
             } else if (k instanceof Field2) {
                let v0 = k;
                this.bn = bn;
                this.v = new Array(3);
                this.v[0] = v0;
                this.v[1] = this.v[2] = bn.Fp2_0;
            } else {
                let rand = k;
                this.bn = bn;
                this.v = new Array(3);
                this.v[0] = new Field2(bn, rand);
                this.v[1] = new Field2(bn, rand);
                this.v[2] = new Field2(bn, rand);
            }
        }

        if (arguments.length === 4) {
            let v0 = k;
            this.bn = bn;
            this.v = new Array(3);
            this.v[0] = v0;
            this.v[1] = v1;
            this.v[2] = v2;
        }
    }

    randomize(rand) {
        return new Field6(this.bn, rand);
    }

    zero() {
        return this.v[0].zero() && this.v[1].zero() && this.v[2].zero();
    }

    one () {
        return this.v[0].one() && this.v[1].zero() && this.v[2].zero();
    }


    eq (o) {
        if (!(o instanceof Field6)) {
            return false;
        }
        let w = o;
        return this.bn === w.bn &&
            this.v[0].eq(w.v[0]) && this.v[1].eq(w.v[1]) && this.v[2].eq(w.v[2]);
    }

    neg() {
        return new Field6(this.bn, this.v[0].neg(), this.v[1].neg(), this.v[2].neg());
    }

    conj(m) {
        switch (m) {
            case 0:
                return this;
            case 1:
                return new Field6(this.bn, this.v[0], this.v[1].multiply(this.bn.zeta1).neg(), this.v[2].multiply(this.bn.zeta0));
            case 2:
                return new Field6(this.bn, this.v[0], this.v[1].multiply(this.bn.zeta0), this.v[2].multiply(this.bn.zeta1).neg());
            default:
        }
    }

    add(w) {
        if (this.bn !== w.bn) {
            throw new Error("Operands are in different finite fields");
        }
        return new Field6(this.bn, this.v[0].add(w.v[0]), this.v[1].add(w.v[1]), this.v[2].add(w.v[2]));
    }

    subtract(w) {
        if (this.bn !== w.bn) {
            throw new Error("Operands are in different finite fields");
        }
        return new Field6(this.bn, this.v[0].subtract(w.v[0]), this.v[1].subtract(w.v[1]), this.v[2].subtract(w.v[2]));
    }

    twice (k) {
        return new Field6(this.bn, this.v[0].twice(k), this.v[1].twice(k), this.v[2].twice(k));
    }

    halve () {
        return new Field6(this.bn, this.v[0].halve(), this.v[1].halve(), this.v[2].halve());
    }

    multiply(w) {
        if (w instanceof Field6) {
            if (w === this) {
                return square();
            }
            if (this.bn !== w.bn) {
                throw new Error("Operands are in different finite fields");
            }
            if (this.one() || w.zero()) {
                return w;
            }
            if (this.zero() || w.one()) {
                return this;
            }
            let d00 = this.v[0].multiply(w.v[0]);
            let d11 = this.v[1].multiply(w.v[1]);
            let d22 = this.v[2].multiply(w.v[2]);
            let d01 = this.v[0].add(this.v[1]).multiply(w.v[0].add(w.v[1])).subtract(d00.add(d11));
            let d02 = this.v[0].add(this.v[2]).multiply(w.v[0].add(w.v[2])).subtract(d00.add(d22));
            let d12 = this.v[1].add(this.v[2]).multiply(w.v[1].add(w.v[2])).subtract(d11.add(d22));
            if (this.bn.b === 3) {
                return new Field6(this.bn, d12.divV().add(d00), d22.divV().add(d01), d02.add(d11));
            } else {
                return new Field6(this.bn, d12.mulV().add(d00), d22.mulV().add(d01), d02.add(d11));
            }
        } else if (w instanceof Field2) {
            if (this.bn !== w.bn) {
                throw new Error("Operands are in different finite fields");
            }
            if (w.one()) {
                return this;
            }
            return new Field6(this.bn, this.v[0].multiply(w), this.v[1].multiply(w), this.v[2].multiply(w));
        }
    }

    multiplyConj() {
        if (this.one() || this.zero()) {
            return this;
        }
        if (this.bn.b === 3) {
            return new Field6(this.bn, this.v[0].square().subtract(this.v[1].multiply(this.v[2]).divV()),
                this.v[2].square().divV().subtract(this.v[0].multiply(this.v[1])).multiply(this.bn.zeta0),
                this.v[0].multiply(this.v[2]).subtract(this.v[1].square()).multiply(this.bn.zeta1));
        } else {
           
            return new Field6(this.bn, this.v[0].square().subtract(this.v[1].multiply(this.v[2]).mulV()),
                this.v[2].square().mulV().subtract(this.v[0].multiply(this.v[1])).multiply(this.bn.zeta0),
                this.v[0].multiply(this.v[2]).subtract(this.v[1].square()).multiply(this.bn.zeta1));
        }
    }

    normCompletion(k) {
        let d00 = this.v[0].multiply(k.v[0]);
        let d12 = this.v[1].multiply(k.v[2]).add(this.v[2].multiply(k.v[1]));
        if (this.bn.b === 3) {
            return d12.divV().add(d00);
        } else {
            return d12.mulV().add(d00);
        }
    }

    square() {
        if (this.zero() || this.one()) {
            return this;
        }
        let a0 = this.v[0];
        let a1 = this.v[1];
        let a2 = this.v[2];
       
        let c0 = a0.square();
        let S1 = a2.add(a1).add(a0).square();
        let S2 = a2.subtract(a1).add(a0).square();
        let c3 = a1.multiply(a2).twice(1);
        let c4 = a2.square();
        let T1 = S1.add(S2).halve();
        let c1 = S1.subtract(T1).subtract(c3);
        let c2 = T1.subtract(c4).subtract(c0);
      
        if (this.bn.b === 3) {
            c0 = c0.add(c3.divV());
            c1 = c1.add(c4.divV());
        } else {
            c0 = c0.add(c3.mulV());
            c1 = c1.add(c4.mulV());
        }
        return new Field6(this.bn, c0, c1, c2);
    }
    mulV () {
        return new Field6(this.bn, this.v[2].mulV(), this.v[0], this.v[1]);
    }

    divV () {
        return new Field6(this.bn, this.v[2].divV(), this.v[0], this.v[1]);
    }
}

class Field12 {

    constructor (bn, k) {
        if (arguments.length === 1) {
            let f = bn;
            this.bn = f.bn;
            this.v = new Array(6);
            for (let i = 0; i < 6; i++) {
                this.v[i] = f.v[i];
            }
        }
        if (arguments.length === 2) {
            /*
             * 
             */
            if (bigInt.isInstance(k)) {
                this.bn = bn;
                this.v = new Array(6);
                this.v[0] = new Field2(bn, k);
                for (let i = 1; i < 6; i++) {
                    this.v[i] = new Field2(bn);
                }
            } else if (k instanceof Array) {
                this.bn = bn;
                this.v = k;
            } else {
                let rand = k;
                this.bn = bn;
                this.v = new Array(6);
                for (let i = 0; i < 6; i++) {
                    this.v[i] = new Field2(bn, rand);
                }
            }
        }
    }

    randomize (rand) {
        return new Field12(this.bn, rand);
    }

    zero () {
        return this.v[0].zero() && this.v[1].zero() && this.v[2].zero() &&
                this.v[3].zero() && this.v[4].zero() && this.v[5].zero();
    }

    one () {
        return this.v[0].one() && this.v[1].zero() && this.v[2].zero() &&
                this.v[3].zero() && this.v[4].zero() && this.v[5].zero();
    }

    eq(o) {
        if (!(o instanceof Field12)) {
            return false;
        }
        let w = o;
        
        return this.bn === w.bn &&
            this.v[0].eq(w.v[0]) &&
            this.v[1].eq(w.v[1]) &&
            this.v[2].eq(w.v[2]) &&
            this.v[3].eq(w.v[3]) &&
            this.v[4].eq(w.v[4]) &&
            this.v[5].eq(w.v[5]);
    }

    neg () {
        let w = new Array(6);
        for (let i = 0; i < 6; i++) {
            w[i] = this.v[i].neg();
        }
        return new Field12(this.bn, w);
    }

    frobenius () {
        let w = new Array(6);
        w[0] = this.v[0].conj();
        if (this.bn.b === 3) {
            w[1] = this.v[1].conj().mulV().multiply(this.bn.sigma);
            w[2] = this.v[2].conj().multiply(this.bn.zeta0).mulI().neg();
            w[3] = this.v[3].mulV().conj().multiply(this.bn.zeta0sigma);
            w[4] = this.v[4].conj().multiply(this.bn.zeta1);
            w[5] = this.v[5].conj().mulV().multiply(this.bn.zeta1sigma);
        } else {
            w[1] = this.v[1].mulV().conj().multiply(this.bn.zeta0sigma).neg();
            w[2] = this.v[2].conj().multiply(this.bn.zeta0).mulI();
            w[3] = this.v[3].conj().mulV().multiply(this.bn.zeta1sigma);
            w[4] = this.v[4].conj().multiply(this.bn.zeta1);
            w[5] = this.v[5].mulV().conj().multiply(this.bn.sigma);
        }
        return new Field12(this.bn, w);
    }

    conj (m) {
        let w ;
        switch (m) {
            case 0:
                return this;
            case 1:
                w = new Array(6);
                w[0] = this.v[0];
                w[1] = this.v[1].multiply(this.bn.zeta0).neg();
                w[2] = this.v[2].multiply(this.bn.zeta1).neg();
                w[3] = this.v[3].neg();
                w[4] = this.v[4].multiply(this.bn.zeta0);
                w[5] = this.v[5].multiply(this.bn.zeta1);
                return new Field12(this.bn, w);
            case 2:
                w = new Array(6);
                w[0] = this.v[0];
                w[1] = this.v[1].multiply(this.bn.zeta1).neg();
                w[2] = this.v[2].multiply(this.bn.zeta0);
                w[3] = this.v[3];
                w[4] = this.v[4].multiply(this.bn.zeta1).neg();
                w[5] = this.v[5].multiply(this.bn.zeta0);
                return new Field12(this.bn, w);
            case 3:
                w = new Array(6);
                w[0] = this.v[0];
                w[1] = this.v[1].neg();
                w[2] = this.v[2];
                w[3] = this.v[3].neg();
                w[4] = this.v[4];
                w[5] = this.v[5].neg();
                return new Field12(this.bn, w);
            case 4:
                w = new Array(6);
                w[0] = this.v[0];
                w[1] = this.v[1].multiply(this.bn.zeta0);
                w[2] = this.v[2].multiply(this.bn.zeta1).neg();
                w[3] = this.v[3];
                w[4] = this.v[4].multiply(this.bn.zeta0);
                w[5] = this.v[5].multiply(this.bn.zeta1).neg();
                return new Field12(this.bn, w);
            case 5:
                w = new Array(6);
                w[0] = this.v[0];
                w[1] = this.v[1].multiply(this.bn.zeta1);
                w[2] = this.v[2].multiply(this.bn.zeta0);
                w[3] = this.v[3].neg();
                w[4] = this.v[4].multiply(this.bn.zeta1).neg();
                w[5] = this.v[5].multiply(this.bn.zeta0).neg();
                return new Field12(this.bn, w);
            default: 
        }
    }

    add (k) {
        if (this.bn !== k.bn) {
            throw new Error("Operands are in different finite fields");
        }
        let w = new Array(6);
        for (let i = 0; i < 6; i++) {
            w[i] = this.v[i].add(k.v[i]);
        }
        return new Field12(this.bn, w);
    }

    subtract  (k) {
        if (this.bn !== k.bn) {
            throw new Error("Operands are in different finite fields");
        }
        let w = new Array(6);
        for (let i = 0; i < 6; i++) {
            w[i] = this.v[i].subtract(k.v[i]);
        }
        return new Field12(this.bn, w);
    }

    multiply  (k) {
        if (k instanceof Field12) {
            if (k === this) {
                return this.square();
            }
            if (this.bn !== k.bn) {
                throw new Error("Operands are in different finite fields");
            }
            if (this.one() || k.zero()) {
                return k;
            }
            if (this.zero() || k.one()) {
                return this;
            }
            let w = new Array(6);
            if (k.v[2].zero() && k.v[4].zero() && k.v[5].zero()) {
                if (this.v[2].zero() && this.v[4].zero() && this.v[5].zero()) {
                    let d00 = this.v[0].multiply(k.v[0]);
                    let d11 = this.v[1].multiply(k.v[1]);
                    let d33 = this.v[3].multiply(k.v[3]);
                    let s01 = this.v[0].add(this.v[1]);
                    let t01 = k.v[0].add(k.v[1]);
                    let u01 = d00.add(d11);
                    let z01 = s01.multiply(t01);
                    let d01 = z01.subtract(u01);
                    let d13 = this.v[1].add(this.v[3]).multiply(k.v[1].add(k.v[3])).subtract(d11.add(d33));
                    u01 = u01.add(d01);
                    let d03 = s01.add(this.v[3]).multiply(t01.add(k.v[3])).subtract(u01.add(d33).add(d13));
                    let d05 = z01.subtract(u01);
                    if (this.bn.b === 3) {
                        w[0] = d33.divV().add(d00);
                    } else {
                        w[0] = d33.mulV().add(d00);
                    }
                    w[1] = d01;
                    w[2] = d11;
                    w[3] = d03;
                    w[4] = d13;
                    w[5] = d05;
                } else {
                    let d00 = this.v[0].multiply(k.v[0]);
                    let d11 = this.v[1].multiply(k.v[1]);
                    let d33 = this.v[3].multiply(k.v[3]);
                    let s01 = this.v[0].add(this.v[1]);
                    let t01 = k.v[0].add(k.v[1]);
                    let u01 = d00.add(d11);
                    let d01 = s01.multiply(t01).subtract(u01);
                    let d02 = this.v[0].add(this.v[2]).multiply(k.v[0]).subtract(d00);
                    let d04 = this.v[0].add(this.v[4]).multiply(k.v[0]).subtract(d00);
                    let d13 = this.v[1].add(this.v[3]).multiply(k.v[1].add(k.v[3])).subtract(d11.add(d33));
                    let d15 = this.v[1].add(this.v[5]).multiply(k.v[1]).subtract(d11);
                    let s23 = this.v[2].add(this.v[3]);
                    let d23 = s23.multiply(k.v[3]).subtract(d33);
                    let d35 = this.v[3].add(this.v[5]).multiply(k.v[3]).subtract(d33);
                    u01 = u01.add(d01);
                    let u23 = d33.add(d23);
                    let d03 = s01.add(s23).multiply(t01.add(k.v[3])).subtract(u01.add(u23).add(d02).add(d13));
                    let s45 = this.v[4].add(this.v[5]);
                    let d05 = s01.add(s45).multiply(t01).subtract(u01.add(d04).add(d15));
                    let d25 = s23.add(s45).multiply(k.v[3]).subtract(u23.add(d35));
                    if (this.bn.b === 3) {
                        w[0] = d15.add(d33).divV().add(d00);
                        w[1] = d25.divV().add(d01);
                        w[2] = d35.divV().add(d02).add(d11);
                    } else {
                        w[0] = d15.add(d33).mulV().add(d00);
                        w[1] = d25.mulV().add(d01);
                        w[2] = d35.mulV().add(d02).add(d11);
                    }
                    w[3] = d03;
                    w[4] = d04.add(d13);
                    w[5] = d05.add(d23);
                }
            } else if (k.v[1].zero() && k.v[4].zero() && k.v[5].zero()) {
                let d00 = this.v[0].multiply(k.v[0]);
                let d22 = this.v[2].multiply(k.v[2]);
                let d33 = this.v[3].multiply(k.v[3]);
                let s01 = this.v[0].add(this.v[1]);
                let d01 = s01.multiply(k.v[0]).subtract(d00);
                let d02 = this.v[0].add(this.v[2]).multiply(k.v[0].add(k.v[2])).subtract(d00.add(d22));
                let d04 = this.v[0].add(this.v[4]).multiply(k.v[0]).subtract(d00);
                let d13 = this.v[1].add(this.v[3]).multiply(k.v[3]).subtract(d33);
                let s23 = this.v[2].add(this.v[3]);
                let t23 = k.v[2].add(k.v[3]);
                let u23 = d22.add(d33);
                let d23 = s23.multiply(t23).subtract(u23);
                let d24 = this.v[2].add(this.v[4]).multiply(k.v[2]).subtract(d22);
                let d35 = this.v[3].add(this.v[5]).multiply(k.v[3]).subtract(d33);
                let u01 = d00.add(d01);
                let d03 = s01.add(s23).multiply(k.v[0].add(t23)).subtract(u01.add(u23).add(d02).add(d13).add(d23));
                let s45 = this.v[4].add(this.v[5]);
                let d05 = s01.add(s45).multiply(k.v[0]).subtract(u01.add(d04));
                let d25 = s23.add(s45).multiply(t23).subtract(u23.add(d23).add(d24).add(d35));
                if (this.bn.b === 3) {
                    w[0] = d24.add(d33).divV().add(d00);
                    w[1] = d25.divV().add(d01);
                    w[2] = d35.divV().add(d02);
                } else {
                    w[0] = d24.add(d33).mulV().add(d00);
                    w[1] = d25.mulV().add(d01);
                    w[2] = d35.mulV().add(d02);
                }
                w[3] = d03;
                w[4] = d04.add(d13).add(d22);
                w[5] = d05.add(d23);
            } else {
                let d00 = this.v[0].multiply(k.v[0]);
                let d11 = this.v[1].multiply(k.v[1]);
                let d22 = this.v[2].multiply(k.v[2]);
                let d33 = this.v[3].multiply(k.v[3]);
                let d44 = this.v[4].multiply(k.v[4]);
                let d55 = this.v[5].multiply(k.v[5]);
                let s01 = this.v[0].add(this.v[1]);
                let t01 = k.v[0].add(k.v[1]);
                let u01 = d00.add(d11);
                let d01 = s01.multiply(t01).subtract(u01);
                let d02 = this.v[0].add(this.v[2]).multiply(k.v[0].add(k.v[2])).subtract(d00.add(d22));
                let d04 = this.v[0].add(this.v[4]).multiply(k.v[0].add(k.v[4])).subtract(d00.add(d44));
                let d13 = this.v[1].add(this.v[3]).multiply(k.v[1].add(k.v[3])).subtract(d11.add(d33));
                let d15 = this.v[1].add(this.v[5]).multiply(k.v[1].add(k.v[5])).subtract(d11.add(d55));
                let s23 = this.v[2].add(this.v[3]);
                let t23 = k.v[2].add(k.v[3]);
                let u23 = d22.add(d33);
                let d23 = s23.multiply(t23).subtract(u23);
                let d24 = this.v[2].add(this.v[4]).multiply(k.v[2].add(k.v[4])).subtract(d22.add(d44));
                let d35 = this.v[3].add(this.v[5]).multiply(k.v[3].add(k.v[5])).subtract(d33.add(d55));
                let s45 = this.v[4].add(this.v[5]);
                let t45 = k.v[4].add(k.v[5]);
                let u45 = d44.add(d55);
                let d45 = s45.multiply(t45).subtract(u45);
                u01 = u01.add(d01);
                u23 = u23.add(d23);
                u45 = u45.add(d45);
                let d03 = s01.add(s23).multiply(t01.add(t23)).subtract(u01.add(u23).add(d02).add(d13));
                let d05 = s01.add(s45).multiply(t01.add(t45)).subtract(u01.add(u45).add(d04).add(d15));
                let d25 = s23.add(s45).multiply(t23.add(t45)).subtract(u23.add(u45).add(d24).add(d35));
                if (this.bn.b === 3) {
                    w[0] = d15.add(d24).add(d33).divV().add(d00);
                    w[1] = d25.divV().add(d01);                  
                    w[2] = d35.add(d44).divV().add(d02).add(d11);
                    w[3] = d45.divV().add(d03);                  
                    w[4] = d55.divV().add(d04).add(d13).add(d22);
                    w[5] = d05.add(d23);                            
                } else {
                    w[0] = d15.add(d24).add(d33).mulV().add(d00);
                    w[1] = d25.mulV().add(d01);
                    w[2] = d35.add(d44).mulV().add(d02).add(d11);
                    w[3] = d45.mulV().add(d03);
                    w[4] = d55.mulV().add(d04).add(d13).add(d22);
                    w[5] = d05.add(d23);
                }
            }

            return new Field12(this.bn, w);
        } else if (bigInt.isInstance(k)) {
            let w = new Array(6);
            for (let i = 0; i < 6; i++) {
                w[i] = this.v[i].multiply(k);
            }
            return new Field12(this.bn, w);
        } else if (k instanceof Field2) {
            let w = new Array(6);
            for (let i = 0; i < 6; i++) {
                w[i] = this.v[i].multiply(k);
            }
            return new Field12(this.bn, w);
        } else {
            let dr = new Field6(this.bn, this.v[0], this.v[2], this.v[4]).multiply(k);
            let di = new Field6(this.bn, this.v[1], this.v[3], this.v[5]).multiply(k);
            let m = new Array(6);
            m[0] = dr.v[0];
            m[1] = di.v[0];
            m[2] = dr.v[1];
            m[3] = di.v[1];
            m[4] = dr.v[2];
            m[5] = di.v[2];
            return new Field12(this.bn, m);
        }
    }

    decompress (h) {
       
        if (!h.v[1].zero()) {
            if (this.bn.b === 2) {
                h.v[3] = h.v[5].square().mulV().add(h.v[2].square().multiply(new Number(3))).subtract(h.v[4].twice(1)).multiply(h.v[1].twice(2).inverse());
                h.v[0] = h.v[3].square().twice(1).add(h.v[1].multiply(h.v[5])).subtract(h.v[4].multiply(h.v[2]).multiply(new Number(3))).mulV().add(bigInt.one);
                
            } else {
                h.v[3] = h.v[5].square().divV().add(h.v[2].square().multiply(new Number(3))).subtract(h.v[4].twice(1)).multiply(h.v[1].twice(2).inverse());
                h.v[0] = h.v[3].square().twice(1).add(h.v[1].multiply(h.v[5])).subtract(h.v[4].multiply(h.v[2]).multiply(new Number(3))).divV().add(bigInt.one);
            }
        } else {
            h.v[3] = h.v[2].multiply(h.v[5]).twice(1).multiply(h.v[4].inverse());
            h.v[0] = h.v[3].square().twice(1).subtract(h.v[4].multiply(h.v[2]).multiply(new Number(3))).mulV().add(bigInt.one);
        }
    }

    square  () {
        if (this.zero() || this.one()) {
            return this;
        }

       
       
        let a0 =  new Field4(this.bn, this.v[0], this.v[3]);
        let a1 =  new Field4(this.bn, this.v[1], this.v[4]);
        let a2 =  new Field4(this.bn, this.v[2], this.v[5]);
        let c0 = a0.square();
        let S1 = a2.add(a1).add(a0).square();
        let S2 = a2.subtract(a1).add(a0).square();
        let c3 = a1.multiply(a2).twice(1);
        let c4 = a2.square();
        let T1 = S1.add(S2).halve();
        let c1 = S1.subtract(T1).subtract(c3);
        let c2 = T1.subtract(c4).subtract(c0);
       
       
       
       
        if (this.bn.b === 3) {
            c0 = c0.add(c3.divV());
            c1 = c1.add(c4.divV());
        } else {
            c0 = c0.add(c3.mulV());
            c1 = c1.add(c4.mulV());
        }

        let v = new Array(6);
        v[0] = c0.re;
        v[1] = c1.re;
        v[2] = c2.re;
        v[3] = c0.im;
        v[4] = c1.im;
        v[5] = c2.im;
        return new Field12(this.bn, v);
    }

    compressedSquare () {
       
        let h = new Field12(this.bn.Fp12_0);
        if (this.bn.b === 2) {
            let A23 = this.v[1].add(this.v[4]).multiply(this.v[1].add(this.v[4].mulV()));
            let A45 = this.v[2].add(this.v[5]).multiply(this.v[2].add(this.v[5].mulV()));
            let B45 = this.v[2].multiply(this.v[5]);
            let B23 = this.v[1].multiply(this.v[4]);
            h.v[1] = this.v[1].add(B45.mulV().multiply(new Number(3))).twice(1);
            h.v[4] = A45.subtract(B45.add(B45.mulV())).multiply(new Number(3)).subtract(this.v[4].twice(1));
            h.v[2] = A23.subtract(B23.add(B23.mulV())).multiply(new Number(3)).subtract(this.v[2].twice(1));
            h.v[5] = this.v[5].add(B23.multiply(new Number(3))).twice(1);
        } else {
            let A23 = this.v[1].add(this.v[4]).multiply(this.v[1].add(this.v[4].divV()));
            let A45 = this.v[2].add(this.v[5]).multiply(this.v[2].add(this.v[5].divV()));
            let B45 = this.v[2].multiply(this.v[5]);
            let B23 = this.v[1].multiply(this.v[4]);
            h.v[1] = this.v[1].add(B45.divV().multiply(new Number(3))).twice(1);
            h.v[4] = A45.subtract(B45.add(B45.divV())).multiply(new Number(3)).subtract(this.v[4].twice(1));
            h.v[2] = A23.subtract(B23.add(B23.divV())).multiply(new Number(3)).subtract(this.v[2].twice(1));
            h.v[5] = this.v[5].add(B23.multiply(new Number(3))).twice(1);
        }
       
        return h;
    }

    uniSquare () {
        let a0sqr = this.v[0].square();
        let a1sqr = this.v[3].square();
        let b0sqr = this.v[1].square();
        let b1sqr = this.v[4].square();
        let c0sqr = this.v[2].square();
        let c1sqr = this.v[5].square();
        let a0, a1, b0, b1, c0, c1;
        if (this.bn.b === 3) {
           
            a0 = a1sqr.divV().add(a0sqr).multiply(new Number(3)).subtract(this.v[0].twice(1));
           
            a1 = this.v[0].add(this.v[3]).square().subtract(a0sqr).subtract(a1sqr).multiply(new Number(3)).add(this.v[3].twice(1));
           
            b0 = this.v[2].add(this.v[5]).square().subtract(c0sqr).subtract(c1sqr).multiply(new Number(3)).divV().add(this.v[1].twice(1));
           
            b1 = c0sqr.add(c1sqr.divV()).multiply(new Number(3)).subtract(this.v[4].twice(1));
           
            c0 = b1sqr.divV().add(b0sqr).multiply(new Number(3)).subtract(this.v[2].twice(1));
           
            c1 = this.v[1].add(this.v[4]).square().subtract(b0sqr).subtract(b1sqr).multiply(new Number(3)).add(this.v[5].twice(1));
        } else {
           
           
            a0 = a1sqr.mulV().add(a0sqr).multiply(new Number(3)).subtract(this.v[0].twice(1));
           
            a1 = this.v[0].add(this.v[3]).square().subtract(a0sqr).subtract(a1sqr).multiply(new Number(3)).add(this.v[3].twice(1));
           
           
            b0 = this.v[2].add(this.v[5]).square().subtract(c0sqr).subtract(c1sqr).multiply(new Number(3)).mulV().add(this.v[1].twice(1));
           
            b1 = c0sqr.add(c1sqr.mulV()).multiply(new Number(3)).subtract(this.v[4].twice(1));
           
           
            c0 = b1sqr.mulV().add(b0sqr).multiply(new Number(3)).subtract(this.v[2].twice(1));
           
            c1 = this.v[1].add(this.v[4]).square().subtract(b0sqr).subtract(b1sqr).multiply(new Number(3)).add(this.v[5].twice(1));
        }
       
        let m = new Array(6);
        m[0] = a0;
        m[1] = b0;
        m[2] = c0;
        m[3] = a1;
        m[4] = b1;
        m[5] = c1;
        return new Field12(this.bn, m);
    }

    mulV () {
       
        let m = new Array(6);
        m[0] = this.v[4].mulV();
        m[1] = this.v[5].mulV();
        m[2] = this.v[0];
        m[3] = this.v[1];
        m[4] = this.v[2];
        m[5] = this.v[3];
        return new Field12(this.bn, m);
    }

    divV () {
       
        let m = new Array(6);
        m[0] = this.v[4].divV();
        m[1] = this.v[5].divV();
        m[2] = this.v[0];
        m[3] = this.v[1];
        m[4] = this.v[2];
        m[5] = this.v[3];
        return new Field12(this.bn, m);
    }

    norm6 () {
       
        let re = new Field6(this.bn, this.v[0], this.v[2], this.v[4]);
        let im = new Field6(this.bn, this.v[1], this.v[3], this.v[5]);
        if (this.bn.b === 3) {
            return re.square().subtract(im.square().divV());
        } else {
            return re.square().subtract(im.square().mulV());
        }
    }

    inverse () {
       
        let l = this.norm6();                      
        let m = l.multiplyConj().conj(1);
        let e = l.normCompletion(m);          
        let d = m.multiply(e.inverse());      
        let c = this.conj(3).multiply(d);    

        return c;
    }

    plainExp (k) {
        /*
         * This method is likely to be very fast, because k is very sparse
         */
        let w = this;
        for (let i = k.bitLength()-2; i >= 0; i--) {
            w = w.square();
            if (ExNumber.testBit(k, i)) {
                w = w.multiply(this);
            }
        }
        return w;
    }

    uniExp (k) {
        let w = new Field12(this);
        for (let i = k.bitLength()-2; i >= 0; i--) {
            w = w.compressedSquare()
            if (ExNumber.testBit(k, i)) {
                this.decompress(w);
                w = w.multiply(this);
            }
        }

        return w;
    }

    finExp () {
        let f = this;
       
        f = f.conj(3).multiply(f.inverse());
        f = f.conj(1).multiply(f);
        let fconj = f.conj(3);
        let fu; let fu2; let fu3;
        if (ExNumber.signum(this.bn.u) >= 0) {
            fu  = fconj.uniExp(this.bn.u);           
            fu2 = fu.conj(3).uniExp(this.bn.u); 
            fu3 = fu2.conj(3).uniExp(this.bn.u);
        } else {
            fu = f.uniExp(this.bn.u.negate());       
            fu2 = fu.uniExp(this.bn.u.negate());     
            fu3 = fu2.uniExp(this.bn.u.negate());    
        }

        let fp = f.frobenius();
        let fp2 = fp.frobenius();
        let fp3 = fp2.frobenius();

        let fup = fu.frobenius();
        let fu2p = fu2.frobenius();
        let fu3p = fu3.frobenius();
        let fu2p2 = fu2.conj(1);

        let y0 = fp.multiply(fp2).multiply(fp3);
        let y1 = fconj;
        let y2 = fu2p2;
        let y3 = fup;
        let y4 = fu.multiply(fu2p.conj(3));
        let y5 = fu2.conj(3);
        let y6 = fu3.multiply(fu3p);

        let T0 = y6.uniSquare().multiply(y4).multiply(y5);
        let T1 = y3.multiply(y5).multiply(T0).uniSquare();
        T0 = T0.multiply(y2);
        T1 = T1.multiply(T0).uniSquare();
        T0 = T1.multiply(y1).uniSquare();
        T1 = T1.multiply(y0);
        T0 = T0.multiply(T1);
        f = T0;

        return f;
    }
    exp (k) {
        return this.plainExp(k);
    }
}

export {Field2, Field4, Field6, Field12}