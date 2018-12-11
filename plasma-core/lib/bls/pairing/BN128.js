

import {Field, Fp2} from './Fields'

import CryptoRandom from './Rnd'
import bigInt from 'big-integer'
import ExNumber from './ExNumber'

class BN128Fp {

    constructor( x,  y, z) {
      if (x instanceof Field && y instanceof Field && z instanceof Field) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    }




    static get n() {
      return bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
    }

    static get ZERO() {
      return new BN128Fp(Field._0, Field._0, Field._0);
    } 

    zero() {
        return BN128Fp.ZERO;
    }

    b() {
        return new Field(bigInt(3));
    }

    one() {
        return Field._1;
    }

    neg() {
      return new BN128Fp(this.x, this.y.negate(), this.z);
    }

    /**
     * Transforms given Jacobian to affine coordinates and then creates a point
     */
    toAffine() {

        if (this.isZero()) {
            zero = zero();
            return new BN128(zero.x, one(), zero.z); // (0; 1; 0)
        }

        let zInv = this.z.inverse();
        let zInv2 = zInv.square();
        let zInv3 = zInv2.multiply(zInv);

        let ax = this.x.multiply(zInv2);
        let ay = this.y.multiply(zInv3);

        return new BN128Fp(ax, ay, this.one());
    }

    /**
     * Runs affine transformation and encodes point at infinity as (0; 0; 0)
     */
    toEthNotation() {
        let affine = this.toAffine();

        // affine zero is (0; 1; 0), convert to Ethereum zero: (0; 0; 0)
        if (affine.isZero()) {
            return this.zero();
        } else {
            return affine;
        }
    }

    isOnCurve() {
        if (this.isZero()) return true;

        let z6 = this.z.square().multiply(this.z).square();
        let left  = this.y.square();                          // y^2
        let right = this.x.square().multiply(this.x).add(this.b().multiply(z6));  // x^3 + b * z^6
        return left.eq(right);
    }

    add(o) {
        if (this.isZero()) return o; // 0 + P = P
        if (o.isZero()) return this; // P + 0 = P

        let x1 = this.x, y1 = this.y, z1 = this.z;
        let x2 = o.x,    y2 = o.y,    z2 = o.z;

        // ported code is started from here
        // next calculations are done in Jacobian coordinates

        let z1z1 = z1.square();
        let z2z2 = z2.square();

        let u1 = x1.multiply(z2z2);
        let u2 = x2.multiply(z1z1);

        let z1Cubed = z1.multiply(z1z1);
        let z2Cubed = z2.multiply(z2z2);

        let s1 = y1.multiply(z2Cubed);      // s1 = y1 * Z2^3
        let s2 = y2.multiply(z1Cubed);      // s2 = y2 * Z1^3

        if (u1.eq(u2) && s1.eq(s2)) {
            return this.double(); // P + P = 2P
        }

        let h = u2.subtract(u1);          // h = u2 - u1
        let i = h.double().square();   // i = (2 * h)^2
        let j = h.multiply(i);            // j = h * i
        let r = s2.subtract(s1).double();    // r = 2 * (s2 - s1)
        let v = u1.multiply(i);           // v = u1 * i
        let zz = z1.add(z2).square()
                .subtract(z1.square()).subtract(z2.square());

       let x3 = r.square().subtract(j).subtract(v.double());        // x3 = r^2 - j - 2 * v
       let y3 = v.subtract(x3).multiply(r).subtract(s1.multiply(j).double());  // y3 = r * (v - x3) - 2 * (s1 * j)
       let z3 = zz.multiply(h); // z3 = ((z1+z2)^2 - z1^2 - z2^2) * h = zz * h

        return new BN128Fp(x3, y3, z3);
    }

    multiply(s) {
        if (!bigInt.isInstance(s)) {
          throw new Error('error not bigint')
        }

        if (s.compareTo(bigInt.zero) == 0) // P * 0 = 0
            return this.zero();

        if (this.isZero()) return this; // 0 * s = 0

        let res = this.zero();

        for (let i = s.bitLength() - 1; i >= 0; i--) {

            res = res.double();

            if (ExNumber.testBit(s,i)) {
                res = res.add(this);
            }
        }

        return res;
    }

    double() {

        if (this.isZero()) return this;

        // ported code is started from here
        // next calculations are done in Jacobian coordinates with z = 1

        let a = this.x.square();     // a = x^2
        let b = this.y.square();     // b = y^2
        let c = b.square();     // c = b^2
        let d = this.x.add(b).square().subtract(a).subtract(c);
        d = d.add(d);                              // d = 2 * ((x + b)^2 - a - c)
        let e = a.add(a).add(a);  // e = 3 * a
        let f = e.square();     // f = e^2

        let x3 = f.subtract(d.add(d)); // rx = f - 2 * d
        let y3 = e.multiply(d.subtract(x3)).subtract(c.double().double().double()); // ry = e * (d - rx) - 8 * c
        let z3 = this.y.multiply(this.z).double(); // z3 = 2 * y * z

        return new BN128Fp(x3, y3, z3);
    }

    isZero() {
        return this.z.isZero();
    }

    isValid() {

        // check whether coordinates belongs to the Field
        if (!this.x instanceof Field || !this.y instanceof Field || !this.z instanceof Field) {
            return false;
        }

        // check whether point is on the curve
        if (!this.isOnCurve()) {
            return false;
        }

        return true;
    }

    toString() {
        return this.x.toString(), this.y.toString(), this.z.toString();
    }

    eq(o) {
        if (this == o) return true;
        if (!(o instanceof BN128Fp)) return false;

        let bn128 =  o;
        if (this.x != null ? !this.x.eq(bn128.x) : bn128.x != null) return false;
        if (this.y != null ? !this.y.eq(bn128.y) : bn128.y != null) return false;
        return !(this.z != null ? !this.z.eq(bn128.z) : bn128.z != null);
    }

    static create(xx, yy) {
      let x = new Field(xx);
      let y = new Field(yy);

      // check for point at infinity
      if (x.isZero() && y.isZero()) {
          return BN128.ZERO;
      }

      let p = new BN128Fp(x, y, Field._1);

      // check whether point is a valid one
      if (p.isValid()) {
          return p;
      } else {
          return null;
      }
    }

    toString() {
      return this.x.toString() + ' ' + this.y.toString() + ' ' + this.z.toString()
    }
}

class BN128Fp2 {
  constructor(x, y, z) {
    if (x instanceof Fp2 && y instanceof Fp2 && z instanceof Fp2) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  }

  static get n() {
    return bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
    }

    static get TWIST_MUL_BY_P_X() {
      return new Fp2(bigInt("21575463638280843010398324269430826099269044274347216827212613867836435027261"),
      bigInt("10307601595873709700152284273816112264069230130616436755625194854815875713954"));
    } 
      

    static get TWIST_MUL_BY_P_Y() {
      return new Fp2( bigInt("2821565182194536844548159561693502659359617185244120367078079554186484126554"),
      bigInt("3505843767911556378687030309984248845540243509899259641013678093033130930403"));
    }

  static get ZERO() {
    return new BN128Fp2(Fp2._0, Fp2._0, Fp2._0);
  } 

  zero() {
      return BN128Fp2.ZERO;
  }

  static get TWIST() {
    return new Fp2(bigInt(9), bigInt(1));
  }

  b() {
    let twinv = BN128Fp2.TWIST.inverse();
    let B_Fp2 = new Fp2(twinv.a.multiply( new Field(bigInt(3))), twinv.b.multiply(new Field(bigInt(3)) ) );
    return B_Fp2;
  }

  one() {
      return Fp2._1;
  }

  /**
   * Transforms given Jacobian to affine coordinates and then creates a point
   */
  toAffine() {

      if (this.isZero()) {
          zero = zero();
          return new BN128Fp2(zero.x, one(), zero.z); // (0; 1; 0)
      }

      let zInv = this.z.inverse();
      let zInv2 = zInv.square();
      let zInv3 = zInv2.multiply(zInv);

      let ax = this.x.multiply(zInv2);
      let ay = this.y.multiply(zInv3);

      return new BN128Fp2(ax, ay, this.one());
  }

  /**
   * Runs affine transformation and encodes point at infinity as (0; 0; 0)
   */
  toEthNotation() {
      let affine = this.toAffine();

      // affine zero is (0; 1; 0), convert to Ethereum zero: (0; 0; 0)
      if (affine.isZero()) {
          return this.zero();
      } else {
          return affine;
      }
  }

  isOnCurve() {
      if (this.isZero()) return true;

      let z6 = this.z.square().multiply(this.z).square();
      let left  = this.y.square(); // y^2

      let right = this.x.square().multiply(this.x).add(this.b().multiply(z6));  // x^3 + b * z^6
      return left.eq(right);
  }

  add(o) {
      if (this.isZero()) return o; // 0 + P = P
      if (o.isZero()) return this; // P + 0 = P

      let x1 = this.x, y1 = this.y, z1 = this.z;
      let x2 = o.x,    y2 = o.y,    z2 = o.z;

      // ported code is started from here
      // next calculations are done in Jacobian coordinates

      let z1z1 = z1.square();
      let z2z2 = z2.square();

      let u1 = x1.multiply(z2z2);
      let u2 = x2.multiply(z1z1);

      let z1Cubed = z1.multiply(z1z1);
      let z2Cubed = z2.multiply(z2z2);

      let s1 = y1.multiply(z2Cubed);      // s1 = y1 * Z2^3
      let s2 = y2.multiply(z1Cubed);      // s2 = y2 * Z1^3

      if (u1.eq(u2) && s1.eq(s2)) {
          return this.double(); // P + P = 2P
      }

      let h = u2.subtract(u1);          // h = u2 - u1
      let i = h.double().square();   // i = (2 * h)^2
      let j = h.multiply(i);            // j = h * i
      let r = s2.subtract(s1).double();    // r = 2 * (s2 - s1)
      let v = u1.multiply(i);           // v = u1 * i
      let zz = z1.add(z2).square()
              .subtract(z1.square()).subtract(z2.square());

     let x3 = r.square().subtract(j).subtract(v.double());        // x3 = r^2 - j - 2 * v
     let y3 = v.subtract(x3).multiply(r).subtract(s1.multiply(j).double());  // y3 = r * (v - x3) - 2 * (s1 * j)
     let z3 = zz.multiply(h); // z3 = ((z1+z2)^2 - z1^2 - z2^2) * h = zz * h

      return new BN128Fp2(x3, y3, z3);
  }



  multiply(s) {

      if (!bigInt.isInstance(s)) {
        throw new Error('error not bigint')
      }

      if (s.compareTo(bigInt.zero) == 0) // P * 0 = 0
          return this.zero();

      if (this.isZero()) return this; // 0 * s = 0

      let res = this.zero();

      for (let i = s.bitLength() - 1; i >= 0; i--) {

          res = res.double();

          if (ExNumber.testBit(s,i)) {
              res = res.add(this);
          }
      }

      return res;
  }

  double() {

      if (this.isZero()) return this;

      // ported code is started from here
      // next calculations are done in Jacobian coordinates with z = 1

      let a = this.x.square();     // a = x^2
      let b = this.y.square();     // b = y^2
      let c = b.square();     // c = b^2
      let d = this.x.add(b).square().subtract(a).subtract(c);
      d = d.add(d);                              // d = 2 * ((x + b)^2 - a - c)
      let e = a.add(a).add(a);  // e = 3 * a
      let f = e.square();     // f = e^2

      let x3 = f.subtract(d.add(d)); // rx = f - 2 * d
      let y3 = e.multiply(d.subtract(x3)).subtract(c.double().double().double()); // ry = e * (d - rx) - 8 * c
      let z3 = this.y.multiply(this.z).double(); // z3 = 2 * y * z

      return new BN128Fp2(x3, y3, z3);
  }

  isZero() {
      return this.z.isZero();
  }

  isValid() {

      // check whether coordinates belongs to the Field
      if (!this.x instanceof Fp2 || !this.y instanceof Fp2 || !this.z instanceof Fp2) {
          return false;
      }

      // check whether point is on the curve
      if (!this.isOnCurve()) {
          return false;
      }

      return true;
  }

  toString() {
      return '['+this.x.toString()+ ', '+ this.y.toString() + ', '+ this.z.toString()+']';
  }

  eq(o) {
      if (this == o) return true;
      if (!(o instanceof BN128Fp2)) return false;

      let bn128 = o;
      if (this.x != null ? !this.x.eq(bn128.x) : bn128.x != null) return false;
      if (this.y != null ? !this.y.eq(bn128.y) : bn128.y != null) return false;
      return !(this.z != null ? !this.z.eq(bn128.z) : bn128.z != null);
  }

  static create(aa, bb, cc, dd) {
    let x = new Fp2(new Field(aa), new Field(bb));
    let y = new Fp2(new Field(cc), new Field(dd));

    // check for point at infinity
    if (x.isZero() && y.isZero()) {
        return BN128Fp2.ZERO;
    }

    let p = new BN128Fp2(x, y, Fp2._1);

    // check whether point is a valid one
    if (p.isValid()) {
        return p;
    } else {
        return null;
    }
  }

  mulByP() {

      let rx = BN128Fp2.TWIST_MUL_BY_P_X.multiply(this.x.frobeniusMap(bigInt("1")));
      let ry = BN128Fp2.TWIST_MUL_BY_P_Y.multiply(this.y.frobeniusMap(bigInt("1")));
      let rz = this.z.frobeniusMap(bigInt("1"));

      return new BN128Fp2(rx, ry, rz);
  }


}


export {BN128Fp, BN128Fp2}