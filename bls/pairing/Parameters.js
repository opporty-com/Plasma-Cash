'use strict';

import { Field2, Field4, Field6, Field12} from './Fields'
import bigInt from 'big-integer'
import ExNumber from './ExNumber'

class Parameters {
    constructor (fieldBits) {

        if (arguments.length === 1) {
            this._2 = bigInt("2");
            this._3 = bigInt("3");
            this._4 = bigInt("4");
            this._5 = bigInt("5");
            this._6 = bigInt("6");
            this._7 = bigInt("7");
            this._8 = bigInt("8");
            this._9 = bigInt("9");
            this._24= bigInt("24");
            this._0 = bigInt.zero;
            this._1 = bigInt.one;

            
            this.m = fieldBits;
            this.b = 3; 
            switch (fieldBits) {
                case 112:
                    this.u = bigInt("-110000001100001000000000001", 2);
                    break;
                case 120:
                    this.u = bigInt("11000000100000000100100000011", 2);
                    break;
                case 128:
                    this.u = bigInt("-1100111000000000000000000000001", 2);
                    break;
                case 136:
                    this.u = bigInt("-110000100000000000000001100000001", 2);
                    break;
                case 144:
                    this.u = bigInt("-10110010000000010000000000000000001", 2);
                    break;
                case 152:
                    this.u = bigInt("-1100100001000000100000000000000000001", 2);
                    break;
                case 158:
                    this.b = 2; 
                    this.u = bigInt("100000000000000100000000000000000100011", 2);
                   
                    break;
                case 160:
                   
                    this.u = bigInt("-110010001000000010000000000000001000001", 2);
                    break;
                case 168:
                    this.u = bigInt("-11001000000000000000000010000001000000001", 2);
                    break;
                case 176:
                    this.u = bigInt("-1100100100000000000000000010000000000000001", 2);
                    break;
                case 184:
                    this.u = bigInt("-110000001100000000000000000000001000000000001", 2);
                    break;
                case 190:
                    this.b = 2; 
                    this.u = bigInt("-10000000010000100100000000000000000000000000001", 2);
                    
                    break;
                case 192:
                    this.u = bigInt("-11000000000000000000010010000000000010000000001", 2);
                    break;
                case 200:
                    this.u = bigInt("-1101000000000000000000001000000000000010000000001", 2);
                    break;
                case 208:
                    this.u = bigInt("110000000000000000000000000000000000000000100000011", 2);
                    break;
                case 216:
                    this.u = bigInt("-11000000000000000010000000000000000000000000000000001", 2);
                    break;
                case 222:
                    this.b = 2; 
                    this.u = bigInt("1000010000000000010000000000000000000000000000000000011", 2);
                   
                    break;
                case 224:
                   
                    this.u = bigInt("-1100000100000000000000000010000000100000000000000000001", 2);
                    break;
                case 232:
                    this.u = bigInt("-110000000100000000100000000000000000000000000010000000001", 2);
                    break;
                case 240:
                    this.u = bigInt("-11000100000000000000000000000010000000000000000000100000001", 2);
                    break;
                case 248:
                    this.u = bigInt("-1100010000001000000000100000000000000000000000000000000000001", 2);
                    break;
                case 254:
                    this.b = 2; 
                    this.u = bigInt("-100000010000000000000000000000000000000000000000000000000000001", 2);
                   
                    break;
                case 256:
                    this.u = bigInt("110000010000000000000000000000000000000000001000000000001000011", 2);
                   
                    break;
                case 264:
                    this.u = bigInt("11000000000000000001000000000000000000000000000000000100000000011", 2);
                    break;
                case 272:
                    this.u = bigInt("1100000100000000000010000000000000000000000000000000000000001000011", 2);
                    break;
                case 280:
                    this.u = bigInt("-110001000000000000000000000000100000100000000000000000000000000000001", 2);
                    break;
                case 288:
                    this.u = bigInt("11000000000000000000000000000000000100000001000000000000000000000000011", 2);
                    break;
                case 296:
                    this.u = bigInt("-1100000000000100000000000000100000000000000000000000000000000000000010001", 2);
                    break;
                case 304:
                    this.u = bigInt("110000000000000100000000000000000000000000000000000000000001000000000000011", 2);
                    break;
                case 312:
                    this.u = bigInt("-11000000000000001000000000000000000000000001000010000000000000000000000000001", 2);
                    break;

                case 318:
                    this.b = 2; 
                    this.u = bigInt("1000000000000000100000000000000000000000000000000000000000000000000000000000011", 2);
                   
                    break;
                case 320:
                    this.u = bigInt("-1100000001000000000000000000000000000000000010001000000000000000000000000000001", 2);
                    break;
                case 328:
                    this.u = bigInt("-110000000000100000000000000000000000000000000000000010000000000100000000000000001", 2);
                    break;
                case 336:
                    this.u = bigInt("-11000000000000000000000000000000000000010000000000000000000100000000000000000000001", 2);
                    break;
                case 344:
                    this.u = bigInt("-1100100000000000000000000000000000000000010000001000000000000000000000000000000000001", 2);
                    break;
                case 352:
                    this.u = bigInt("-110000100000000000000000000000000000001000000000000000000000010000000000000000000000001", 2);
                    break;
                case 360:
                    this.u = bigInt("-11000100001000000000000000000000000000000000000000001000000000000000000000000000000000001", 2);
                    break;
                case 368:
                    this.u = bigInt("-1100000000000000001010000000000000000000000001000000000000000000000000000000000000000000001", 2);
                    break;
                case 376:
                    this.u = bigInt("-110000000010000000000100000000000000000000000000000000000000000000000000000000000000100000001", 2);
                    break;
                case 382: 
                    this.b = 2; 
                    this.u = bigInt("-10000000000000000010001000000000000000000000000000000000000000000000000000000000000000000000001", 2);
                    break;
                case 384:
                    this.u = bigInt("-11000000000000000000000000000000000001000000000000000000000000000000000000000001000000000000001", 2);
                    break;
                case 392:
                    this.u = bigInt("-1100100001000000000000000000000000000000000000000000000000000000000000000000100000000000000000001", 2);
                    break;
                case 400:
                    this.u = bigInt("110000000000000000000000000000000000000000000000000000000000000000000000000000000100000001000000011", 2);
                    break;
                case 408:
                    this.u = bigInt("-11000000000000010000000000000000000000000000000000000000000000000000000000000000000010000000000010001", 2);
                    break;
                case 416:
                    this.u = bigInt("-1100100000000000000000000000000000010000000000000000000000000000001000000000000000000000000000000000001", 2);
                    break;
                case 424:
                    this.u = bigInt("-110000000000000000000000000000100000000000010000000000000000000000001000000000000000000000000000000000001", 2);
                    break;
                case 432:
                    this.u = bigInt("-11000000000000000000000000000000000000000000000000010010000000000000000000000000000000000010000000000000001", 2);
                    break;
                case 440:
                    this.u = bigInt("-1100100000000000000000000000000000000000001000000000000000000000000000010000000000000000000000000000000000001", 2);
                    break;
                case 446: 
                    this.b = 2; 
                    this.u = bigInt("-100000000000000000000000000000000000000000000010000000001000000000000000000000000000000000000000000000000000001", 2);
                    break;
                case 448:
                    this.u = bigInt("110000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000001000000000000011", 2);
                    break;
                case 456:
                    this.u = bigInt("-11000000000000000000000000000100000000000000000000000000000000000000000000010000000000000000000000000000000000001", 2);
                    break;
                case 464:
                    this.u = bigInt("-1100100000000000000000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000001", 2);
                    break;
                case 472:
                    this.u = bigInt("-110000001000000000000000000000000000000000000000000000000000000000000000010000000000000000000000100000000000000000001", 2);
                    break;
                case 480:
                    this.u = bigInt("-11000000000000000100000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001", 2);
                    break;
                case 488:
                    this.u = bigInt("-1100000001000000000000000000000000000000000000000010000000000000000000000000000000001000000000000000000000000000000000001", 2);
                    break;
                case 496:
                    this.u = bigInt("-110010000000000000000000000100000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000001", 2);
                    break;
                case 504:
                    this.u = bigInt("-11010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000001", 2);
                    break;
                case 512:
                    this.u = bigInt("-1100001000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000001", 2);
                    break;
                default:
                    throw new Error(invalidParams + ": Field size in bits must be a multiple of 8 between 48 and 512");

            }
           
            this.p = this.u.add(this._1).multiply(this._6.multiply(this.u)).add(this._4).multiply(this.u).add(this._1).multiply(this._6.multiply(this.u)).add(this._1);
            this.t = this._6.multiply(this.u).multiply(this.u).add(this._1);
            this.ht = this.p.subtract(this._1).add(this.t);
           
            this.n = this.p.add(this._1).subtract(this.t);
           
            this.zeta = this._9.multiply(this.u).multiply(this.u.shiftLeft(1).multiply(this.u.add(this._1)).add(this._1)).add(this._1);
            this.zeta0 = this.zeta;
            this.zeta1 = this.zeta.add(this._1);
           
            this.rho = this._6.multiply(this.u).multiply(this._3.multiply(this.u).multiply(this.u.shiftLeft(1).add(this._1)).add(this._1)).add(this._1);
           
            if ((new ExNumber(this.rho)).signum() < 0) {
                this.rho = this.rho.negate();
            }
           
            this.optOrd = this._6.multiply(this.u).add(this._2);
           
            if ((new ExNumber(this.optOrd)).signum() < 0) {
                this.optOrd = this.optOrd.negate();
            }
           
            this.sqrtExponent = this.p.add(this._1).shiftRight(2);
            this.cbrtExponent = this.p.add(this.p).add(this._1).divide(this._9);

          

            this.sqrtExponent2 = this.p.multiply(this.p).add(this._7).shiftRight(4);

            this.cbrtExponent2 = this.p.multiply(this.p).add(this._2).divide(this._9);
            this.sigma = this.p.subtract(this._4).modPow(this.p.subtract(this._1).subtract(this.p.add(this._5).divide(this._24)), this.p);
            this.zeta0sigma = this.zeta0.multiply(this.sigma).mod(this.p);
            this.zeta1sigma = this.zeta1.multiply(this.sigma).mod(this.p);

            this.invSqrtMinus2 = this.p.subtract(this._2).modPow(this.p.subtract(this._1).subtract(this.p.add(this._1).shiftRight(2)), this.p);
            this.sqrtI = new Field2(this, this.invSqrtMinus2, ((new ExNumber(this.invSqrtMinus2)).signum() !== 0) ? this.p.subtract(this.invSqrtMinus2) : this.invSqrtMinus2, false);
            this.Fp2_0 = new Field2(this, this._0);
            this.Fp2_1 = new Field2(this, this._1);
            this.Fp2_i = new Field2(this, this._0, this._1, false);
            this.Fp12_0 = new Field12(this, this._0);
            this.Fp12_1 = new Field12(this, this._1);

            this.latInv = new Array(4);
            this.latInv[0] = this.u.shiftLeft(1).add(this._3).multiply(this.u).add(this._1);
            this.latInv[1] = this.u.multiply(this._3).add(this._2).multiply(this.u).multiply(this.u).shiftLeft(2).add(this.u);
            this.latInv[2] = this.u.multiply(this._3).add(this._2).multiply(this.u).multiply(this.u).shiftLeft(1).add(this.u);
            this.latInv[3] = this.u.multiply(this.u).shiftLeft(1).add(this.u).negate();

            this.latRed = new Array(4);
            for (let i = 0; i < 4; i++) {
                this.latRed[i] = new Array(4);
            }
            /*
                u+1,       u,      u,  -2*u,
                2*u+1,    -u, -(u+1),    -u,
                2*u,   2*u+1,  2*u+1, 2*u+1,
                u-1,   4*u+2, -2*u+1,   u-1
             */

            this.latRed[0][0] = this.u.add(this._1);
            this.latRed[0][1] = this.u;
            this.latRed[0][2] = this.u;
            this.latRed[0][3] = this.u.shiftLeft(1).negate();

            this.latRed[1][0] = this.u.shiftLeft(1).add(this._1);
            this.latRed[1][1] = this.u.negate();
            this.latRed[1][2] = this.u.add(this._1).negate();
            this.latRed[1][3] = this.u.negate();

            this.latRed[2][0] = this.u.shiftLeft(1);
            this.latRed[2][1] = this.u.shiftLeft(1).add(this._1);
            this.latRed[2][2] = this.u.shiftLeft(1).add(this._1);
            this.latRed[2][3] = this.u.shiftLeft(1).add(this._1);

            this.latRed[3][0] = this.u.subtract(this._1);
            this.latRed[3][1] = this.u.shiftLeft(2).add(this._2);
            this.latRed[3][2] = this.u.shiftLeft(1).negate().add(this._1);
            this.latRed[3][3] = this.u.subtract(this._1);
        }
    }


    get modulus () {
        return this.p;
    }

    get order () {
        return this.n;
    }

    legendre (v) {
       
        let J = 1;
        let x = new BigInteger(v);
        let y = this.p;
        if (x.signum() < 0) {
            x = x.negate();
            if (y.testBit(0) && y.testBit(1)) {
                J = -J;
            }
        }
        while (y.compareTo(this._1) > 0) {
            x = x.mod(y);
            if (x.compareTo(y.shiftRight(1)) > 0) {
                x = y.subtract(x);
                if (y.testBit(0) && y.testBit(1)) {
                    J = -J;
                }
            }
            if (x.signum() === 0) {
                x = this._1;
                y = this._0;
                J = 0;
                break;
            }
            while (!x.testBit(0) && !x.testBit(1)) {
                x = x.shiftRight(2);
            }
            if (!x.testBit(0)) {
                x = x.shiftRight(1);
                if (y.testBit(0) && (y.testBit(1) === !y.testBit(2))) {
                    J = -J;
                }
            }
            if (x.testBit(0) && x.testBit(1) && y.testBit(0) && y.testBit(1)) {
                J = -J;
            }
            let t = new BigInteger();
            t = x; x = y; y = t;
        }
        return J;
    }

    sqrt (v) {
        if (new ExNumber(v).signum() === 0) {
            return this._0;
        }
       
        if (new ExNumber(this.p).testBit(1)) {
            let r = v.modPow(this.p.shiftRight(2).add(this._1), this.p);
           
            return new ExNumber(r.multiply(r).subtract(v).mod(this.p)).signum() === 0 ? r : null;
        }
       
        if (this.p.testBit(2)) {
            let twog = v.shiftLeft(1).mod(this.p);
            let gamma = twog.modPow(this.p.shiftRight(3), this.p);
            let i = twog.multiply(gamma).multiply(gamma).mod(this.p);
            let r = v.multiply(gamma).multiply(i.subtract(this._1)).mod(this.p);
           
            return r.multiply(r).subtract(v).mod(this.p).signum() === 0 ? r : null;
        }
       
        if (this.p.testBit(3)) {
            let twou = this.p.shiftRight(2);
            let s0 = v.shiftLeft(1).modPow(twou, this.p);
            let s = s0;
            let d = this._1;
            let fouru = twou.shiftLeft(1);
            while (s.add(this._1).compareTo(this.p) !== 0) {
                d = d.add(this._2);
                s = d.modPow(fouru, this.p).multiply(s0).mod(this.p);
            }
            let w = d.multiply(d).multiply(v).shiftLeft(1).mod(this.p);
            let z = w.modPow(this.p.shiftRight(4), this.p);
            let i = z.multiply(z).multiply(w).mod(this.p);
            let r = z.multiply(d).multiply(v).multiply(i.subtract(this._1)).mod(this.p);
           
            return r.multiply(r).subtract(v).mod(this.p).signum() === 0 ? r : null;
        }
       
        if (this.p.testBit(4)) {
            let twou = this.p.shiftRight(3);
            let s0 = v.shiftLeft(1).modPow(twou, this.p);
            let s = s0;
            let d = this._1;
            let fouru = twou.shiftLeft(1);
            while (s.add(this._1).compareTo(this.p) !== 0) {
                d = d.add(this._2);
                s = d.modPow(fouru, this.p).multiply(s0).mod(this.p);
            }
            let w = d.multiply(d).multiply(v).shiftLeft(1).mod(this.p);
            let z = w.modPow(this.p.shiftRight(5), this.p);
            let i = z.multiply(z).multiply(w).mod(this.p);
            let r = z.multiply(d).multiply(v).multiply(i.subtract(this._1)).mod(this.p);
           
            return r.multiply(r).subtract(v).mod(this.p).signum() === 0 ? r : null;
        }
       
        if (v.compareTo(this._4) === 0) {
            return this._2;
        }
        let z = v.subtract(this._4).mod(this.p);
        let t = this._1;
        while (this.legendre(z) >= 0) {
            t = t.add(this._1);
            z = v.multiply(t).multiply(t).subtract(this._4).mod(this.p);
        }
        z = v.multiply(t).multiply(t).subtract(this._2).mod(this.p);
        let r = this.lucas(z, this.p.shiftRight(2)).multiply(t.modInverse(this.p)).mod(this.p);
       
        return r.multiply(r).subtract(v).mod(this.p).signum() === 0 ? r : null;
    }

    cbrt (v) {
        if (this.p.mod(this._9).intValue() !== 4) {
            throw new Error("This implementation is optimized for, and only works with, prime fields GF(p) where p = 4 (mod 9)");
        }
        if (v.signum() === 0) {
            return this._0;
        }
        let r = v.modPow(this.cbrtExponent, this.p);
        return r.multiply(r).multiply(r).subtract(v).mod(this.p).signum() === 0 ? r : null;
    }

    lucas (P, k) {
        let d_1 = P;
        let d_2 = P.multiply(P).subtract(this._2).mod(this.p);
        let l = k.bitLength() - 1;
        for (let j = l - 1; j >= 1; j--) {
            if (k.testBit(j)) {
                d_1 = d_1.multiply(d_2).subtract(P).mod(this.p);
                d_2 = d_2.multiply(d_2).subtract(this._2).mod(this.p);
            } else {
                d_2 = d_1.multiply(d_2).subtract(P).mod(this.p);
                d_1 = d_1.multiply(d_1).subtract(this._2).mod(this.p);
            }
        }
        return (k.testBit(0)) ? d_1.multiply(d_2).subtract(P).mod(this.p) : d_1.multiply(d_1).subtract(this._2).mod(this.p);
    }

}

export default Parameters;