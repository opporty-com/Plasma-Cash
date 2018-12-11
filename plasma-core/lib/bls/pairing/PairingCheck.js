

import {Field, Fp2, Fp12, Field2} from './Fields'
import bigInt from 'big-integer'
import ExNumber from './ExNumber'
import {BN128Fp, BN128Fp2} from './BN128'

class EllCoeffs {
  constructor( ell0,  ellVW,  ellVV) {
      this.ell0 = ell0;
      this.ellVW = ellVW;
      this.ellVV = ellVV;
  }
}

 class PairingCheck {

    static get TWIST() {
      return new Fp2(bigInt(9), bigInt(1));
    }

    static get PAIRING_FINAL_EXPONENT_Z() {
      return bigInt("4965661367192848881");
    } 

    static get LOOP_COUNT() {
      return bigInt("29793968203157093288");
    } 

    static create() {
        let pc = new PairingCheck();
        pc.pairs = new Array();
        pc.product = Fp12._1;
        return pc;
    }

    addPair( g1, g2) {
        this.pairs.push([g1, g2]);
    }

    run() {
        for (let pair of this.pairs) {
           let miller = this.millerLoop(pair[0], pair[1]);

            if (!miller.eq(Fp12._1))    // run mul code only if necessary
                this.product = this.product.multiply(miller);
        }
        // finalize
        this.product = this.finalExponentiation(this.product);
    }

    result() {
        return this.product;
    }

    millerLoop(g1, g2) {

        // convert to affine coordinates
        g1 = g1.toAffine();
        g2 = g2.toAffine();

        // calculate Ell coefficients
        let coeffs = this.calcEllCoeffs(g2);

        let f = Fp12._1;
        let idx = 0;

        // for each bit except most significant one
        for (let i = PairingCheck.LOOP_COUNT.bitLength() - 2; i >= 0; i--) {

            let c = coeffs[idx++];
            f = f.square();

            f = f.mulBy024(c.ell0, g1.y.multiply(c.ellVW), g1.x.multiply(c.ellVV));

            if (ExNumber.testBit(PairingCheck.LOOP_COUNT, i)) {
                c = coeffs[idx++];
                f = f.mulBy024(c.ell0, g1.y.multiply(c.ellVW), g1.x.multiply(c.ellVV));
            }

        }

        let c = coeffs[idx++];
        f = f.mulBy024(c.ell0, g1.y.multiply(c.ellVW), g1.x.multiply(c.ellVV));

        c = coeffs[idx];
        f = f.mulBy024(c.ell0, g1.y.multiply(c.ellVW), g1.x.multiply(c.ellVV));

        return f;
    }

    calcEllCoeffs(base) {

        let coeffs = new Array();

        let addend = base;

        // for each bit except most significant one
        for (let i = PairingCheck.LOOP_COUNT.bitLength() - 2; i >=0; i--) {

            let doubling = this.flippedMillerLoopDoubling(addend);

            addend = doubling.g2;
            coeffs.push(doubling.coeffs);

            if (ExNumber.testBit(PairingCheck.LOOP_COUNT, i)) {
                let addition = this.flippedMillerLoopMixedAddition(base, addend);
                addend = addition.g2;
                coeffs.push(addition.coeffs);
            }
        }

        let q1 = base.mulByP();
        let q2 = q1.mulByP();

        q2 = new BN128Fp2(q2.x, q2.y.negate(), q2.z) ; // q2.y = -q2.y

        let addition = this.flippedMillerLoopMixedAddition(q1, addend);
        addend = addition.g2;
        coeffs.push(addition.coeffs);

        addition = this.flippedMillerLoopMixedAddition(q2, addend);
        coeffs.push(addition.coeffs);

        return coeffs;
    }

    flippedMillerLoopMixedAddition( base,  addend) {
        
        let x1 = addend.x, y1 = addend.y, z1 = addend.z;
        let x2 = base.x, y2 = base.y;

        let d = x1.subtract(x2.multiply(z1));             // d = x1 - x2 * z1
        let e = y1.subtract(y2.multiply(z1));             // e = y1 - y2 * z1
        let f = d.square();                    // f = d^2
        let g = e.square();                    // g = e^2
        let h = d.multiply(f);                       // h = d * f
        let i = x1.multiply(f);                      // i = x1 * f
        let j = h.add(z1.multiply(g)).subtract(i.double());  // j = h + z1 * g - 2 * i

        let x3 = d.multiply(j);                           // x3 = d * j
        let y3 = e.multiply(i.subtract(j)).subtract(h.multiply(y1));     // y3 = e * (i - j) - h * y1)
        let z3 = z1.multiply(h);                          // z3 = Z1*H

        let ell0 = PairingCheck.TWIST.multiply(e.multiply(x2).subtract(d.multiply(y2)));     // ell_0 = TWIST * (e * x2 - d * y2)
        let ellVV = e.negate();                             // ell_VV = -e
        let ellVW = d;                                      // ell_VW = d

        return  {g2:new BN128Fp2(x3, y3, z3) , coeffs: new EllCoeffs(ell0, ellVW, ellVV)};
    }

    flippedMillerLoopDoubling(g2) {

      let x = g2.x, y = g2.y, z = g2.z;
      
      let xy = x.multiply(y);
      let a = new Fp2(xy.a.multiply(Field._2_INV), xy.b.multiply(Field._2_INV) );            // a = x * y / 2
      let b = y.square();                        // b = y^2
      let c = z.square();                        // c = z^2
      let d = c.add(c).add(c);                    // d = 3 * c
      
      let twinv = PairingCheck.TWIST.inverse();
      let B_Fp2 = new Fp2(twinv.a.multiply( new Field(bigInt(3))), twinv.b.multiply(new Field(bigInt(3)) ) );
     
      let e = B_Fp2.multiply(d);                       // e = twist_b * d
      let f = e.add(e).add(e);                    // f = 3 * e
      let bf = b.add(f);
      let g = new Fp2(bf.a.multiply(Field._2_INV), bf.b.multiply(Field._2_INV) );  
      let h = y.add(z).square().subtract(b.add(c));   // h = (y + z)^2 - (b + c)
      let i = e.subtract(b);                           // i = e - b
      let j = x.square();                        // j = x^2
      let e2 = e.square();                       // e2 = e^2
      let rx = a.multiply(b.subtract(f));                       // rx = a * (b - f)
      let ry = g.square().subtract(e2.add(e2).add(e2));   // ry = g^2 - 3 * e^2
      let rz = b.multiply(h);                              // rz = b * h

      let ell0 = PairingCheck.TWIST.multiply(i);        // ell_0 = twist * i
      let ellVW = h.negate();         // ell_VW = -h
      let ellVV = j.add(j).add(j);    // ell_VV = 3 * j

      return {g2 : new BN128Fp2(rx, ry, rz), coeffs: new EllCoeffs(ell0, ellVW, ellVV) };
    }

    finalExponentiation(el) {

        // first chunk
        let w = new Fp12(el.a, el.b.negate()); // el.b = -el.b
        let x = el.inverse();
        let y = w.multiply(x);
        let z = y.frobeniusMap(bigInt(2));
        let pre = z.multiply(y);

        // last chunk
        let a = pre.negExp(PairingCheck.PAIRING_FINAL_EXPONENT_Z);
        let b = a.cyclotomicSquared();
        let c = b.cyclotomicSquared();
        let d = c.multiply(b);
        let e = d.negExp(PairingCheck.PAIRING_FINAL_EXPONENT_Z);
        let f = e.cyclotomicSquared();
        let g = f.negExp(PairingCheck.PAIRING_FINAL_EXPONENT_Z);
        let h = d.unitaryInverse();
        let i = g.unitaryInverse();
        let j = i.multiply(e);
        let k = j.multiply(h);
        let l = k.multiply(b);
        let m = k.multiply(e);
        let n = m.multiply(pre);
        let o = l.frobeniusMap(bigInt(1));
        let p = o.multiply(n);
        let q = k.frobeniusMap(bigInt(2));
        let r = q.multiply(p);
        let s = pre.unitaryInverse();
        let t = s.multiply(l);
        let u = t.frobeniusMap(bigInt(3));
        let v = u.multiply(r);

        return v;
    }

    
}

export {PairingCheck}