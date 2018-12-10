'use strict';

import CryptoRandom from './Rnd'
import bigInt from 'big-integer'
import ExNumber from './ExNumber'

const _1 = bigInt('1')
const _2 = bigInt('2')
const _0 = bigInt('0')
const _7 = bigInt('7')

class Parameters {
  static get p() {
    return bigInt("21888242871839275222246405745257275088696311157297823662689037894645226208583");
  }

  static get n() {
    return bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
  }
}

class Field {
  static get _0() {
    return new Field(bigInt.zero);
  } 
  static get _1() {
    return new Field(bigInt.one);
  }

  static get NON_RESIDUE() {
    return new Field(bigInt("21888242871839275222246405745257275088696311157297823662689037894645226208582"));
  } 
  static get _2_INV() {
    return new Field(bigInt("10944121435919637611123202872628637544348155578648911831344518947322613104292") );
  } 

  constructor(v) { this.v = v; }

  add(o)      { return new Field(ExNumber.mod(this.v.add(o.v), Parameters.p)); }
  multiply(o) { 
    if (o instanceof Fp2) {
      return new Fp2(o.a.multiply(this), o.b.multiply(this));
    }  
    return new Field(ExNumber.mod(this.v.multiply(o.v),Parameters.p));
  
  }
  subtract(o) { return new Field(ExNumber.mod(this.v.subtract(o.v),Parameters.p)); }
  square()    { return new Field(ExNumber.mod(this.v.multiply(this.v), Parameters.p)); }
  double()    { return new Field(ExNumber.mod(this.v.add(this.v), Parameters.p)); }
  inverse()   { return new Field(this.v.modInv(Parameters.p)); }
  divide(o)   { let inv = o.inverse(); return new Field(  ExNumber.mod(this.v.multiply(inv.v), Parameters.p)    ) }
  negate()    { return new Field(this.v.negate().mod(Parameters.p)); }
  isZero()    { return this.v.compareTo(bigInt.zero) == 0; }
  exp(k) {
    let w = this;
    for (let i = k.bitLength()-2; i >= 0; i--) {
        w = w.square();
        if (ExNumber.testBit(k, i)) {
            w = w.multiply(this);
        }
    }
    return w;
  }

  bytes() {
      return ExNumber.toByteArray(this.v);
  }

  eq(o) {
    return this.v.compareTo(o.v) == 0;
  }

  toString() {
    return this.v.toString();
  }
}

class Fp2  {
  static get _0() {
    return new Fp2(Field._0, Field._0);
  } 
  static get _1() {
    return new Fp2(Field._1, Field._0);
  } 
  static get NON_RESIDUE() {
    return new Fp2(bigInt(9), bigInt.one);
  } 

  static get FROBENIUS_COEFFS_B() {
    let fp = new Array(2);
    
    fp[0] = new Field(bigInt.one);
    fp[1] = new Field(bigInt("21888242871839275222246405745257275088696311157297823662689037894645226208582"));
    
    return fp;
  } 


  constructor(a, b) {
    if (a instanceof Field && b instanceof Field) { 
      this.a = a;
      this.b = b;
    }
    if (bigInt.isInstance(a) && bigInt.isInstance(b)) {
      this.a = new Field(a);
      this.b = new Field(b);
    }
  }


  square() {
    let ab = this.a.multiply(this.b);

    let ra = this.a.add(this.b).multiply(this.b.multiply(Field.NON_RESIDUE).add(this.a))
            .subtract(ab).subtract(ab.multiply(Field.NON_RESIDUE)); // ra = (a + b)(a + NON_RESIDUE * b) - ab - NON_RESIDUE * b
            
            let rb = ab.double();

    return new Fp2(ra, rb);
  }

  multiply(o) {

    let aa = this.a.multiply(o.a);
    let bb = this.b.multiply(o.b);

    let ra = bb.multiply(Field.NON_RESIDUE).add(aa);    // ra = a1 * a2 + NON_RESIDUE * b1 * b2
    let rb = this.a.add(this.b).multiply(o.a.add(o.b)).subtract(aa).subtract(bb);     // rb = (a1 + b1)(a2 + b2) - a1 * a2 - b1 * b2

    return new Fp2(ra, rb);
  }

  divide(o) {
    let e = o.inverse();
    return this.multiply(e);
  }

  add(o) {
    return new Fp2(this.a.add(o.a), this.b.add(o.b));
  }

  subtract(o) {
    return new Fp2(this.a.subtract(o.a), this.b.subtract(o.b));
  }

  double() {
    return this.add(this);
  }

  inverse() {
    let t0 = this.a.square();
    let t1 = this.b.square();
    let t2 = t0.subtract(Field.NON_RESIDUE.multiply(t1));
    let t3 = t2.inverse();

    let ra = this.a.multiply(t3);
    let rb = this.b.multiply(t3).negate();

    return new Fp2(ra, rb);
  }

  negate() {
    return new Fp2(this.a.negate(), this.b.negate());
  }

  isZero() {
      return this.eq(Fp2._0);
  }

  eq(o) {
      if (!o instanceof Fp2) return false;

      let fp2 = o;

      if (this.a != null ? !this.a.eq(fp2.a) : fp2.a != null) return false;
      return !(this.b != null ? !this.b.eq(fp2.b) : fp2.b != null);

  }

  frobeniusMap(power) {
    let ra = this.a;

    let rb = Fp2.FROBENIUS_COEFFS_B[power.mod( bigInt(2) )].multiply(this.b);

    return new Fp2(ra, rb);
  }

  mulByNonResidue() {
    return Fp2.NON_RESIDUE.multiply(this);
  }

  exp(k) {
    let w = this;
    for (let i = k.bitLength()-2; i >= 0; i--) {
        w = w.square();
        if (ExNumber.testBit(k, i)) {
            w = w.multiply(this);
        }
    }
    return w;
  }

  toString() {
      return this.a.toString()+ ", " + this.b.toString();
  }
}

class Fp6 {
  static get _0() {
    return new Fp6(Fp2._0, Fp2._0, Fp2._0);
  }

  static get _1() {
    return new Fp6(Fp2._1, Fp2._0, Fp2._0);
  }

  static get NON_RESIDUE() {
    return new Fp2(bigInt(9), bigInt.one);
  }

  constructor(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
  }

  toString() {
    return '['+ this.a.toString() + ', ' + this.b.toString() + ', ' + this.c.toString()+']'
  }

  square() {
    let s0 = this.a.square();
    let ab = this.a.multiply(this.b);
    let s1 = ab.double();
    let s2 = this.a.subtract(this.b).add(this.c).square();
    let bc = this.b.multiply(this.c);
    let s3 = bc.double();
    let s4 = this.c.square();

    let ra = s0.add(s3.mulByNonResidue());
    let rb = s1.add(s4.mulByNonResidue());
    let rc = s1.add(s2).add(s3).subtract(s0).subtract(s4);

    return new Fp6(ra, rb, rc);
  }

  double() {
    return this.add(this);
  }

  multiply(o) {
    if (o instanceof Fp6) {
      let a1 = this.a;  
      let b1 = this.b;  
      let c1 = this.c;
      let a2 = o.a;
      let b2 = o.b;
      let c2 = o.c;

      let a1a2 = a1.multiply(a2);
      let b1b2 = b1.multiply(b2);
      let c1c2 = c1.multiply(c2);

      let ra = a1a2.add(b1.add(c1).multiply(b2.add(c2)).subtract(b1b2).subtract(c1c2).mulByNonResidue());
      let rb = a1.add(b1).multiply(a2.add(b2)).subtract(a1a2).subtract(b1b2).add(c1c2.mulByNonResidue());
      let rc = a1.add(c1).multiply(a2.add(c2)).subtract(a1a2).add(b1b2).subtract(c1c2);

      return new Fp6(ra, rb, rc);
    }
    if (o instanceof Fp2) {
      let ra = this.a.multiply(o);
      let rb = this.b.multiply(o);
      let rc = this.c.multiply(o);

      return new Fp6(ra, rb, rc);
    }
  }

  mulByNonResidue() {
    let ra = Fp6.NON_RESIDUE.multiply(this.c);
    let rb = this.a;
    let rc = this.b;

    return new Fp6(ra, rb, rc);
  }

  add(o) {
    let ra = this.a.add(o.a);
    let rb = this.b.add(o.b);
    let rc = this.c.add(o.c);

    return new Fp6(ra, rb, rc);
  }

  subtract(o) {
    let ra = this.a.subtract(o.a);
    let rb = this.b.subtract(o.b);
    let rc = this.c.subtract(o.c);

    return new Fp6(ra, rb, rc);
  }

  inverse() {
    let t0 = this.a.square();
    let t1 = this.b.square();
    let t2 = this.c.square();
    let t3 = this.a.multiply(this.b);
    let t4 = this.a.multiply(this.c);
    let t5 = this.b.multiply(this.c);
    let c0 = t0.subtract(t5.mulByNonResidue());
    let c1 = t2.mulByNonResidue().subtract(t3);
    let c2 = t1.subtract(t4);
    let t6 = this.a.multiply(c0).add((this.c.multiply(c1).add(this.b.multiply(c2))).mulByNonResidue()).inverse();

    let ra = t6.multiply(c0);
    let rb = t6.multiply(c1);
    let rc = t6.multiply(c2);

    return new Fp6(ra, rb, rc);
  }

  negate() {
    return new Fp6(this.a.negate(), this.b.negate(), this.c.negate());
  }

  isZero() {
    return this.eq(this.ZERO);
  }

  frobeniusMap(power) {
    let ra = this.a.frobeniusMap(power);
    let rb = Fp6.FROBENIUS_COEFFS_B()[power.mod( 6 ).toJSNumber()].multiply(this.b.frobeniusMap(power));
    let rc = Fp6.FROBENIUS_COEFFS_C()[power.mod( 6 ).toJSNumber()].multiply(this.c.frobeniusMap(power));

    return new Fp6(ra, rb, rc);
  }

  eq(o) {
      if (!(o instanceof Fp6)) return false;
      let fp6 = o;

      if (this.a != null ? !this.a.eq(fp6.a) : fp6.a != null) return false;
      if (this.b != null ? !this.b.eq(fp6.b) : fp6.b != null) return false;
      return !(this.c != null ? !this.c.eq(fp6.c) : fp6.c != null);
  }

  divide(o) {
    let e = o.inverse();
    return this.multiply(e);
  }

  exp(k) {
    let w = this;
    for (let i = k.bitLength()-2; i >= 0; i--) {
        w = w.square();
        if (ExNumber.testBit(k, i)) {
            w = w.multiply(this);
        }
    }
    return w;
  }

  static FROBENIUS_COEFFS_B() {

    let ar = [];

    ar.push(Fp2._1 );

    ar.push(new Fp2(bigInt("21575463638280843010398324269430826099269044274347216827212613867836435027261"),
    bigInt("10307601595873709700152284273816112264069230130616436755625194854815875713954")));

    ar.push(new Fp2(bigInt("21888242871839275220042445260109153167277707414472061641714758635765020556616"),
    bigInt.zero));

    ar.push(new Fp2(bigInt("3772000881919853776433695186713858239009073593817195771773381919316419345261"),
      bigInt("2236595495967245188281701248203181795121068902605861227855261137820944008926")));

    ar.push(new Fp2(bigInt("2203960485148121921418603742825762020974279258880205651966"), bigInt.zero));

    ar.push(new Fp2(bigInt("18429021223477853657660792034369865839114504446431234726392080002137598044644"),
      bigInt("9344045779998320333812420223237981029506012124075525679208581902008406485703")));
  
    return ar;
  };

  static  FROBENIUS_COEFFS_C() {

    let ar = [];

    ar[0] = Fp2._1;

    ar[1] = new Fp2(bigInt("2581911344467009335267311115468803099551665605076196740867805258568234346338"),
    bigInt("19937756971775647987995932169929341994314640652964949448313374472400716661030"));

    ar[2] = new Fp2(bigInt("2203960485148121921418603742825762020974279258880205651966"), bigInt.zero);

    ar[3] = new Fp2(bigInt("5324479202449903542726783395506214481928257762400643279780343368557297135718"),
    bigInt("16208900380737693084919495127334387981393726419856888799917914180988844123039"));

    ar[4] = new Fp2(bigInt("21888242871839275220042445260109153167277707414472061641714758635765020556616"),
          bigInt.zero);

    ar[5] = new Fp2(bigInt("13981852324922362344252311234282257507216387789820983642040889267519694726527"),
          bigInt("7629828391165209371577384193250820201684255241773809077146787135900891633097"));

    return ar;
  };
}

class Fp12 {

  static get _0() {
    return new Fp12(Fp6._0, Fp6._0);
  } 
  static get _1() {
    return new Fp12(Fp6._1, Fp6._0);
  } 

  constructor(a, b) {
      this.a = a;
      this.b = b;
  }

  square() {
      let ab = this.a.multiply(this.b);

      let ra = this.a.add(this.b).multiply(this.a.add(this.b.mulByNonResidue())).subtract(ab).subtract(ab.mulByNonResidue());
      let rb = ab.add(ab);

      return new Fp12(ra, rb);
  }

  double() {
      return null;
  }

  mulBy024( ell0,  ellVW,  ellVV) {

      let z0 = this.a.a;
      let z1 = this.a.b;
      let z2 = this.a.c;
      let z3 = this.b.a;
      let z4 = this.b.b;
      let z5 = this.b.c;

      let x0 = ell0;
      let x2 = ellVV;
      let x4 = ellVW;

      let t0, t1, t2, s0, t3, t4, d0, d2, d4, s1;

      d0 = z0.multiply(x0);
      d2 = z2.multiply(x2);
      d4 = z4.multiply(x4);
      t2 = z0.add(z4);
      t1 = z0.add(z2);
      s0 = z1.add(z3).add(z5);

      // For z.a_.a_ = z0.
      s1 = z1.multiply(x2);
      t3 = s1.add(d4);
      t4 = Fp6.NON_RESIDUE.multiply(t3).add(d0);
      z0 = t4;

      // For z.a_.b_ = z1
      t3 = z5.multiply(x4);
      s1 = s1.add(t3);
      t3 = t3.add(d2);
      t4 = Fp6.NON_RESIDUE.multiply(t3);
      t3 = z1.multiply(x0);
      s1 = s1.add(t3);
      t4 = t4.add(t3);
      z1 = t4;

      // For z.a_.c_ = z2
      t0 = x0.add(x2);
      t3 = t1.multiply(t0).subtract(d0).subtract(d2);
      t4 = z3.multiply(x4);
      s1 = s1.add(t4);
      t3 = t3.add(t4);

      // For z.b_.a_ = z3 (z3 needs z2)
      t0 = z2.add(z4);
      z2 = t3;
      t1 = x2.add(x4);
      t3 = t0.multiply(t1).subtract(d2).subtract(d4);
      t4 = Fp6.NON_RESIDUE.multiply(t3);
      t3 = z3.multiply(x0);
      s1 = s1.add(t3);
      t4 = t4.add(t3);
      z3 = t4;

      // For z.b_.b_ = z4
      t3 = z5.multiply(x2);
      s1 = s1.add(t3);
      t4 = Fp6.NON_RESIDUE.multiply(t3);
      t0 = x0.add(x4);
      t3 = t2.multiply(t0).subtract(d0).subtract(d4);
      t4 = t4.add(t3);
      z4 = t4;

      // For z.b_.c_ = z5.
      t0 = x0.add(x2).add(x4);
      t3 = s0.multiply(t0).subtract(s1);
      z5 = t3;

      return new Fp12(new Fp6(z0, z1, z2), new Fp6(z3, z4, z5));
  }

  add(o) {
      return new Fp12(this.a.add(o.a), this.b.add(o.b));
  }

  divide(o) {
    let e = o.inverse();
    return this.multiply(e);
  }

  multiply(o) {
      let a2 = o.a, b2 = o.b;
      let a1 = this.a,   b1 = this.b;

      let a1a2 = a1.multiply(a2);
      let b1b2 = b1.multiply(b2);

      let ra = a1a2.add(b1b2.mulByNonResidue());
      let rb = a1.add(b1).multiply(a2.add(b2)).subtract(a1a2).subtract(b1b2);

      return new Fp12(ra, rb);
  }

  subtract(o) {
    return new Fp12(this.a.subtract(o.a), this.b.subtract(o.b));
  }

  inverse() {
      let t0 = this.a.square();
      let t1 = this.b.square();

      let t2 = t0.subtract(t1.mulByNonResidue());
     
      let t3 = t2.inverse();

      let ra = this.a.multiply(t3);
      let rb = this.b.multiply(t3).negate();

      return new Fp12(ra, rb);
  }

  negate() {
      return new Fp12(a.negate(), b.negate());
  }

  isZero() {
      return this.eq(Fp12._0);
  }

  frobeniusMap(power) {

      let ra = this.a.frobeniusMap(power);
      let rb = this.b.frobeniusMap(power).multiply(Fp12.FROBENIUS_COEFFS_B[power.mod(12)]);

      return new Fp12(ra, rb);
  }

  cyclotomicSquared() {
      
      let z0 = this.a.a;
      let z4 = this.a.b;
      let z3 = this.a.c;
      let z2 = this.b.a;
      let z1 = this.b.b;
      let z5 = this.b.c;

      let t0, t1, t2, t3, t4, t5, tmp;

      tmp = z0.multiply(z1);
      t0 = z0.add(z1).multiply(z0.add(Fp6.NON_RESIDUE.multiply(z1))).subtract(tmp).subtract(Fp6.NON_RESIDUE.multiply(tmp));
      t1 = tmp.add(tmp);
      // t2 + t3*y = (z2 + z3*y)^2 = b^2
      tmp = z2.multiply(z3);
      t2 = z2.add(z3).multiply(z2.add(Fp6.NON_RESIDUE.multiply(z3))).subtract(tmp).subtract(Fp6.NON_RESIDUE.multiply(tmp));
      t3 = tmp.add(tmp);
      // t4 + t5*y = (z4 + z5*y)^2 = c^2
      tmp = z4.multiply(z5);
      t4 = z4.add(z5).multiply(z4.add(Fp6.NON_RESIDUE.multiply(z5))).subtract(tmp).subtract(Fp6.NON_RESIDUE.multiply(tmp));
      t5 = tmp.add(tmp);

      // for A

      // z0 = 3 * t0 - 2 * z0
      z0 = t0.subtract(z0);
      z0 = z0.add(z0);
      z0 = z0.add(t0);
      // z1 = 3 * t1 + 2 * z1
      z1 = t1.add(z1);
      z1 = z1.add(z1);
      z1 = z1.add(t1);

      // for B

      // z2 = 3 * (xi * t5) + 2 * z2
      tmp = Fp6.NON_RESIDUE.multiply(t5);
      z2 = tmp.add(z2);
      z2 = z2.add(z2);
      z2 = z2.add(tmp);

      // z3 = 3 * t4 - 2 * z3
      z3 = t4.subtract(z3);
      z3 = z3.add(z3);
      z3 = z3.add(t4);

      // for C

      // z4 = 3 * t2 - 2 * z4
      z4 = t2.subtract(z4);
      z4 = z4.add(z4);
      z4 = z4.add(t2);

      // z5 = 3 * t3 + 2 * z5
      z5 = t3.add(z5);
      z5 = z5.add(z5);
      z5 = z5.add(t3);
      
      return new Fp12(new Fp6(z0, z4, z3), new Fp6(z2, z1, z5));
  }

  cyclotomicExp(pow) {

      let res = Fp12._1;

      for (let i = pow.bitLength() - 1; i >=0; i--) {
          res = res.cyclotomicSquared();

          if (ExNumber.testBit(pow, i)) {
              res = res.multiply(this);
          }
      }

      return res;
  }

  unitaryInverse() {

      let ra = this.a;
      let rb = this.b.negate();

      return new Fp12(ra, rb);
  }

  negExp(exp) {
      return this.cyclotomicExp(exp).unitaryInverse();
  }

  eq(o) {
      if (this == o) return true;
      if (!(o instanceof Fp12)) return false;

      let fp12 =  o;

      if (this.a != null ? !this.a.eq(fp12.a) : fp12.a != null) return false;
      return !(this.b != null ? !this.b.eq(fp12.b) : fp12.b != null);

  }

  toString() {
      return '[' + this.a.toString()+' ' + this.b.toString()+ ']'
      ;
  }

  static get FROBENIUS_COEFFS_B () {
    let r = new Array(12);
    r[0] = new Fp2(bigInt.one, bigInt.zero)

    r[1] = new Fp2(bigInt("8376118865763821496583973867626364092589906065868298776909617916018768340080"),
    bigInt("16469823323077808223889137241176536799009286646108169935659301613961712198316"))

    r[2] = new Fp2(bigInt("21888242871839275220042445260109153167277707414472061641714758635765020556617"), bigInt.zero)

    r[3] = new Fp2(bigInt("11697423496358154304825782922584725312912383441159505038794027105778954184319"),
bigInt("303847389135065887422783454877609941456349188919719272345083954437860409601"))

    r[4] = new Fp2(bigInt("21888242871839275220042445260109153167277707414472061641714758635765020556616"), bigInt.zero)

    r[5] = new Fp2(bigInt("3321304630594332808241809054958361220322477375291206261884409189760185844239"),
bigInt("5722266937896532885780051958958348231143373700109372999374820235121374419868"))

    r[6] = new Fp2(bigInt("21888242871839275222246405745257275088696311157297823662689037894645226208582"), bigInt.zero)

    r[7] = new Fp2(bigInt("13512124006075453725662431877630910996106405091429524885779419978626457868503"),
bigInt("5418419548761466998357268504080738289687024511189653727029736280683514010267"))

    r[8] = new Fp2(bigInt("2203960485148121921418603742825762020974279258880205651966"), bigInt.zero)

    r[9] = new Fp2(bigInt("10190819375481120917420622822672549775783927716138318623895010788866272024264"),
bigInt("21584395482704209334823622290379665147239961968378104390343953940207365798982"))

    r[10] = new Fp2(bigInt("2203960485148121921418603742825762020974279258880205651967"), bigInt.zero)

    r[11] = new Fp2(bigInt("18566938241244942414004596690298913868373833782006617400804628704885040364344"),
bigInt("16165975933942742336466353786298926857552937457188450663314217659523851788715"))
    return r;

} 

}


class Field2 {
  constructor (p, re, im, reduce) {
    this.poly_coeffs = [1, 0];
    this.degree = this.poly_coeffs.length;
    if(arguments.length === 1) {
      this.p = p
      this.re = _0
      this.im = _0
    }
    if(arguments.length === 2) {
      if (bigInt.isInstance(re)) {
        this.p = p;
        this.re = re; //no  reduction!!!//
        this.im = _0;
      } else if (re instanceof CryptoRandom) {
        this.p = p;
        let rand = re;
        do {
            this.re =  ExNumber.construct(this.p.bitLength(), rand);
        } while (this.re.compareTo(this.p) >= 0);
        do {
            this.im =  ExNumber.construct(this.p.bitLength(), rand);
        } while (this.im.compareTo(this.p) >= 0);
      }
    }
    if(arguments.length === 4) {
      this.p = p;
      if (reduce) {
        this.re = ExNumber.mod(re, this.p);
        this.im = ExNumber.mod(im, this.p);
      } else {
        this.re = re;
        this.im = im;
      }
    }
  }

  zero() {
    return this.re.isZero() && this.im.isZero();
  }

  one() {
    return this.re.compareTo(_1) === 0 && this.im.isZero();
  }

  eq(u) {
    if (!(u instanceof Field2)) {
        return false;
    }
    return this.re.equals(u.re) && this.im.equals(u.im) ;
  }

  neg() {
      return new Field2(this.p, (ExNumber.signum(this.re) !== 0) ? this.p.subtract(this.re) : this.re, (ExNumber.signum(this.im) !== 0) ? this.p.subtract(this.im) : this.im, false);
  }

  add (v) {
      if (v instanceof Field2) {
  
        if (!this.p.eq( v.p )) {
            throw new Error("Operands are in different finite fields");
        }
        let r = this.re.add(v.re);
        
        if (r.compareTo(this.p) >= 0) {
            r = r.subtract(this.p);
        }
        let i = this.im.add(v.im);
        
        if (i.compareTo(this.p) >= 0) {
            i = i.subtract(this.p);
        }
        return new Field2(this.p, r, i, false);
      } else if (bigInt.isInstance(v)) {
        let s = this.re.add(v);
        
        if (s.compareTo(this.p) >= 0) {
            s = s.subtract(this.p);
        }
        return new Field2(this.p, s, this.im, false);
      }
  }

  subtract(v) {
    if (v instanceof Field2) {
      if (this.p !== v.p) {
          throw new Error("Operands are in different finite fields");
      }
      let r = this.re.subtract(v.re);
      
      if (ExNumber.signum(r) < 0) {
          r = r.add(this.p);
      }
      let i = this.im.subtract(v.im);
      
      if (ExNumber.signum(i) < 0) {
          i = i.add(this.p);
      }
      return new Field2(this.p, r, i, false);
    } else if (bigInt.isInstance(v)) {
        
      let r = this.re.subtract(v);
      if (r.signum() < 0) {
          r = r.add(this.p);
      }
      return new Field2(this.p, r, this.im, false);
    }
  }

  twice  (k) {
    let r = this.re;
    let i = this.im;
    while (k-- > 0) {
        r = r.shiftLeft(1);
        if (r.compareTo(this.p) >= 0) {
            r = r.subtract(this.p);
        }
        i = i.shiftLeft(1);
        if (i.compareTo(this.p) >= 0) {
            i = i.subtract(this.p);
        }
    }
    return new Field2(this.p, r, i, false);
  }

  halve () {
    return new Field2(this.p,
        (ExNumber.testBit(this.re, 0) ? this.re.add(this.p) : this.re).shiftRight(1),
        (ExNumber.testBit(this.im, 0) ? this.im.add(this.p) : this.im).shiftRight(1),
        false);
  }

  divide(v) {
    if (v instanceof Field2) {
      return this.multiply(v.inverse());
    } else if (bigInt.isInstance(v)) {
      //v = v.mod(this.p);

      let nr = this.re.multiply( v.modInv(this.p) );
      let ni = this.im.multiply( v.modInv(this.p) );
      return new Field2(this.p, nr, ni, true);
    }
    return null;
  }

  inverse() {
    const d = this.re.multiply(this.re).add(this.im.multiply(this.im)).modInv(this.p);
    return new Field2(this.p, this.re.multiply(d), this.p.subtract(this.im).multiply(d), true);
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

      return new Field2(this.p,
          re2.subtract(im2),
          mix.subtract(re2).subtract(im2),
          true);
    }

    else if (bigInt.isInstance(v) ) {
      return new Field2(this.p, this.re.multiply(v), this.im.multiply(v), true);
    }
    else if (v instanceof Number) {
      let newre = this.re.multiply(bigInt(v.toString()));
      while ( ExNumber.signum(newre) < 0) {
          newre = newre.add(this.p);
      }
      while (newre.compareTo(this.p) >= 0) {
          newre = newre.subtract(this.p);
      }
      let newim = this.im.multiply(bigInt(v.toString()));
      while (ExNumber.signum(newim) < 0) {
          newim = newim.add(this.p);
      }
      while (newim.compareTo(this.p) >= 0) {
          newim = newim.subtract(this.p);
      }
      return new Field2(this.p, newre, newim, false);
    } else {
      throw new Error("Incorrect type argument");
    }
  }

  square() {
    if (this.zero() || this.one()) {
        return this;
    }
    if (ExNumber.signum(this.im) === 0) {
        return new Field2(this.p,
            this.re.multiply(this.re), _0, true);
    }
    if ( ExNumber.signum(this.re) === 0) {
        return new Field2(this.p,
            this.im.multiply(this.im).negate(), _0, true);
    }

    return new Field2(this.p,
        this.re.add(this.im).multiply(this.re.subtract(this.im)),
        this.re.multiply(this.im).shiftLeft(1),
        true);
  }

  cube () {
    let re2 = this.re.multiply(this.re);
    let im2 = this.im.multiply(this.im);
    return new Field2(this.p,
        this.re.multiply(re2.subtract(im2.add(im2).add(im2))),
        this.im.multiply(re2.add(re2).add(re2).subtract(im2)),
        true);
  }



  mulI () {
    return new Field2(this.p, (ExNumber.signum(this.im) !== 0) ? this.p.subtract(this.im) : this.im, this.re, false);
  }

  divideI () {
    return new Field2(this.p, this.im, (ExNumber.signum(this.re) !== 0) ? this.p.subtract(this.re) : this.re, false);
  }

  mulV () {
    let r = this.re.subtract(this.im);
    if (ExNumber.signum(r) < 0) {
        r = r.add(this.p);
    }
    let i = this.re.add(this.im);
    if (i.compareTo(this.p) >= 0) {
        i = i.subtract(this.p);
    }
    return new Field2(this.p, r, i, false);
  }

  divV () {
    let qre = this.re.add(this.im);
    if (qre.compareTo(this.p) >= 0) {
        qre = qre.subtract(this.p);
    }
    let qim = this.im.subtract(this.re);
    if (ExNumber.signum(qim) < 0) {
        qim = qim.add(this.p);
    }
    return new Field2(this.p, (ExNumber.testBit(qre, 0) ? qre.add(this.p) : qre).shiftRight(1),
        (ExNumber.testBit(qim, 0) ? qim.add(this.p) : qim).shiftRight(1), false);
  }

  exp (k) {
    let P = this;
    if (ExNumber.signum(k) < 0) {
        k = k.neg();
        P = P.inverse();
    }
    let e = ExNumber.toByteArray(k);

    var mP = new Array(16);
    mP[0] = new Field2(this.p, bigInt('1'));
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

    let r = this.exp( this.p.multiply(this.p).add(_7).divide(16) );
    let r2 = r.square();
    if (r2.subtract(this).zero()) {
        return r;
    }
    if (r2.add(this).zero()) {
        return r.mulI();
    }
    r2 = r2.mulI();

    const invSqrtMinus2 = this.p.subtract(_2).modPow(this.p.subtract(_1).subtract(this.p.add(_1).divide(4)), this.p); // 1/sqrt(-2) = (-2)^{-(p+1)/4}
    const sqrtI = new Field2(this.p, invSqrtMinus2, this.p.subtract(invSqrtMinus2), false); // sqrt(i) = (1 - i)/sqrt(-2)

    r = r.multiply(sqrtI);
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
    return '['+this.re.toString()+','+this.im.toString()+']';
  }
}

class Field12 {

  constructor (bn, k) {
      
      this.poly_coeffs = [bigInt(82), bigInt.zero, bigInt.zero, bigInt.zero, bigInt.zero, 
        bigInt.zero, bigInt(-18), bigInt.zero, bigInt.zero, bigInt.zero, bigInt.zero, bigInt.zero];
      this.degree = this.poly_coeffs.length;

      if (arguments.length === 1) {
          let f = bn;
          this.bn = f.bn;
          this.v = new Array(6);
          for (let i = 0; i < 6; i++) {
              this.v[i] = f.v[i];
          }
      }
      if (arguments.length === 2) {
          if (bigInt.isInstance(k)) {
              this.bn = bn;
              this.v = new Array(6);
              this.v[0] = new Field2(bn.p, k);
              for (let i = 1; i < 6; i++) {
                  this.v[i] = new Field2(bn.p);
              }
          } else if (k instanceof Array) {
              this.bn = bn;
              this.v = k;
          } else {
              let rand = k;
              this.bn = bn;
              this.v = new Array(6);
              for (let i = 0; i < 6; i++) {
                  this.v[i] = new Field2(bn.p, rand);
              }
          }
      }
  }

  zero() {
      return this.v[0].zero() && this.v[1].zero() && this.v[2].zero() &&
              this.v[3].zero() && this.v[4].zero() && this.v[5].zero();
  }

  one() {
      return this.v[0].one() && this.v[1].zero() && this.v[2].zero() &&
              this.v[3].zero() && this.v[4].zero() && this.v[5].zero();
  }

  eq(o) {
    if (!(o instanceof Field12)) {
        return false;
    }

    return this.v[0].eq(o.v[0]) &&
        this.v[1].eq(o.v[1]) &&
        this.v[2].eq(o.v[2]) &&
        this.v[3].eq(o.v[3]) &&
        this.v[4].eq(o.v[4]) &&
        this.v[5].eq(o.v[5]);
  }

  neg () {
      let w = new Array(6);
      for (let i = 0; i < 6; i++) {
          w[i] = this.v[i].neg();
      }
      return new Field12(this.bn, w);
  }

  add(k) {
      if (this.bn.p !== k.bn.p) {
          throw new Error("Operands are in different finite fields");
      }
      let w = new Array(6);
      for (let i = 0; i < 6; i++) {
          w[i] = this.v[i].add(k.v[i]);
      }
      return new Field12(this.bn, w);
  }

  subtract(k) {
      if (this.bn.p !== k.bn.p) {
          throw new Error("Operands are in different finite fields");
      }
      let w = new Array(6);
      for (let i = 0; i < 6; i++) {
          w[i] = this.v[i].subtract(k.v[i]);
      }
      return new Field12(this.bn, w);
  }
  
  divide(k) {
    if (bigInt.isInstance(k) || k instanceof Field2) {
      let w = new Array(6);
      for (let i = 0; i < 6; i++) {
          w[i] = this.v[i].divide(k);
      }
      return new Field12(this.bn, w);
    } else if (k instanceof Field12) {
      return this.multiply(k.inverse());
    }
  }

  split() {
    this.s = [
      new Field2(this.bn.p, this.v[0].re),
      new Field2(this.bn.p, this.v[0].im),
      new Field2(this.bn.p, this.v[1].re),
      new Field2(this.bn.p, this.v[1].im),
      new Field2(this.bn.p, this.v[2].re),
      new Field2(this.bn.p, this.v[2].im),
      new Field2(this.bn.p, this.v[3].re),
      new Field2(this.bn.p, this.v[3].im),
      new Field2(this.bn.p, this.v[4].re),
      new Field2(this.bn.p, this.v[4].im),
      new Field2(this.bn.p, this.v[5].re),
      new Field2(this.bn.p, this.v[5].im),
    ]
  }

  join(s) {

    let ar = new Array(6);

    for (let i=0; i<ar.length; i++) {
      ar[i] = new Field2(this.bn.p, s[i*2].re, s[i*2+1].re, false);
    }

    return new Field12(this.bn, ar);
  }


  multiply(k) {
    if (bigInt.isInstance(k) || k instanceof Field2) {
      let w = new Array(6);
      for (let i = 0; i < 6; i++) {
          w[i] = this.v[i].multiply(k);
      }
      return new Field12(this.bn, w);
    } else if (k instanceof Field12) {

        if (!this.bn.p.equals(k.bn.p)) {
            throw new Error("Operands are in different finite fields");
        }
        if (this.one() || k.zero()) {
            return k;
        }
        if (this.zero() || k.one()) {
            return this;
        }
      
        let b = new Array(this.degree * 2 -1 ).fill(new Field2(this.bn.p, _0));

        this.split();
        k.split();

        for (let i = 0; i < this.degree; i++) {
          for (let j = 0; j < this.degree; j++) {
            b[i + j] = b[i + j].add(this.s[i].multiply(k.s[j]));
          }
        }

        let exp; let top;
        while (b.length > this.degree) {
          exp = b.length - this.degree - 1;
          top = b.pop();
          for (let i = 0; i < this.degree; i++) {
            b[exp + i] = b[exp + i].subtract(top.multiply( this.poly_coeffs[i]) );
          }
        }

        return this.join(b);
      } 
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

  inverse() {
    const deg = (p) => {
      let d = p.length - 1
      while (p[d].eq(new Field2(this.bn.p, _0)) && d > 0) 
          d -= 1
      return d;
    }

    const poly_div = (a, b) => {
      let dega = deg(a)
      let degb = deg(b)
      let temp = a.slice();
      let o = new Array(a.length).fill(new Field2(this.bn.p,_0));
      for (let i = dega - degb; i > -1; i--) {
        o[i] = o[i].add( temp[degb + i].divide( b[degb] ) )
        for (let c =0; c < degb + 1; c++) {
            temp[c + i] = temp[c + i].subtract( o[c] );
        }
      }
      return o.slice(0, deg(o) + 1);
    }

    let lm = new Array(this.degree + 1).fill(new Field2(this.bn.p, _0));
    lm[0] = new Field2(this.bn.p, _1);
    let hm = new Array(this.degree + 1).fill(new Field2(this.bn.p, _0));
    this.split();
    let low = this.s.slice();
    low.push(new Field2(this.bn.p, _0));
    let high = this.poly_coeffs.map((e) => new Field2(this.bn.p, e) ).slice();
    high.push(new Field2(this.bn.p, _1));

    let r;
    let nm; 
    let neww;

    while (deg(low)) {
      r = poly_div(high, low);
      r = r.concat(new Array(this.degree + 1 - r.length).fill(new Field2(this.bn.p, _0)));
      
      nm = hm.slice();
      neww = high.slice();

      for (let i = 0; i < this.degree + 1; i++) {
        for (let j = 0; j < this.degree + 1 - i; j++) {
          nm[i + j] = nm[i + j].subtract(lm[i].multiply(r[j]));
          neww[i + j] = neww[i + j].subtract(low[i].multiply(r[j]));
        }
      }
      
      let t1 = nm.slice();
      let t2 = neww.slice();
      let t3 = lm.slice();
      let t4 = low.slice();

      lm = t1;
      low = t2;
      hm = t3;
      high = t4;
    }

    return this.join(lm.slice(0, this.degree)).divide(low[0].re);
  }

  exp(k) {
    let w = this;
    for (let i = k.bitLength()-2; i >= 0; i--) {
        w = w.multiply(w);
        if (ExNumber.testBit(k, i)) {
            w = w.multiply(this);
        }
    }
    return w;
  }

  finExp() {
    return this.exp((this.bn.p.pow(12).subtract(_1)).divide(this.bn.n));
  }

  toString() {
    return '['+this.v[0].re.toString()+', '+this.v[0].im.toString()+', '+
    this.v[1].re.toString()+', '+this.v[1].im.toString()+', '+
    this.v[2].re.toString()+', '+this.v[2].im.toString()+', ' +
    this.v[3].re.toString()+', '+this.v[3].im.toString()+', '+
    this.v[4].re.toString()+', '+this.v[4].im.toString()+', '+
    this.v[5].re.toString()+', '+this.v[5].im.toString()+']';
  }
}

export { Field, Fp2, Fp6, Fp12, Field2, Field12, Parameters }