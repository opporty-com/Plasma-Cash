'use strict';

import CryptoRandom from './Rnd'
import { Curve, Curve2 } from './Curves'
import { Field2, Field4, Field6, Field12} from './Fields'
import bigInt from 'big-integer'
import ExNumber from './ExNumber'

class Point {
  constructor(E, x, y, z) {

      this.preComp = null;
      if (arguments.length === 1) {
          
          if (E instanceof Curve) {
              this.E = E;
              // (1,1,0)
              this.x = E.bn._1;
              this.y = E.bn._1;
              this.z = E.bn._0;
          }
          
          if (E instanceof Point) {
              let Q = E;
              this.E = Q.E;
              this.x = Q.x;
              this.y = Q.y;
              this.z = Q.z;
          }
      }

      if (arguments.length === 3) {
          if (bigInt.isInstance(x) && bigInt.isInstance(y)) {
              this.E = E;
              let p = E.bn.p;
              this.x = ExNumber.mod(x, p);
              this.y = ExNumber.mod(y, p);
              this.z = E.bn._1;
          } else if (bigInt.isInstance(x)) {
              let yBit = y;
              this.E = E;
              let p = E.bn.p;
              this.x = ExNumber.mod(x, p);
              if (x.signum() === 0) throw new Error("The given point does not belong to the given elliptic curve");
              else {
                  this.y = E.bn.sqrt(new ExNumber(x.multiply(x).multiply(x).add(E.b)).mod(p));
                  if (this.y === null) throw new Error("The given point does not belong to the given elliptic curve");
                  if (ExNumber.testBit(this.y, 0) !== ((yBit & 1) === 1)) this.y = p.subtract(y);
              }
              this.z = E.bn._1;
              console.assert(!E.contains(this));
          } else if (bigInt.isInstance(y)) {
              let xTrit = x;
              this.E = E;
              let p = E.bn.p;
              this.y = ExNumber.mod(y, p);
              if (y.signum() === 0) throw new Error("The given point does not belong to the given elliptic curve");
              else {
                  this.x = E.bn.cbrt(new ExNumber(y.multiply(y).subtract(E.b)).mod(p));
                  if (this.x === null) throw new Error("The given point does not belong to the given elliptic curve");
                  
                  if (this.x.mod(E.bn._3).intValue() !== xTrit) {
                      let zeta = E.bn.zeta;
                      this.x = new ExNumber(zeta.multiply(x)).mod(p);
                      if (this.x.mod(E.bn._3).intValue() !== xTrit) {
                          this.x = new ExNumber(zeta.multiply(x)).mod(p);
                          if (this.x.mod(E.bn._3).intValue() !== xTrit) throw new Error("The given point does not belong to the given elliptic curve");
                      }
                  }
              }
              this.z = E.bn._1;
              console.assert(!E.contains(this));
          }
      }

      if (arguments.length === 4) {
          this.E = E;
          this.x = x;
          this.y = y;
          this.z = z;
      }

  }


  toString() {
    return ('('+this.x.toString()+','+this.y.toString()+','+this.z.toString()+')');
  }

  randomize(rand) {
      if (rand instanceof CryptoRandom) return this.E.pointFactory(rand);
  }

  zero() {
      return ExNumber.signum(this.z) === 0;
  }

  eq(Q) {
      if (!(Q instanceof Point && this.same(Q))) return false;
      let P = Q;
      if (ExNumber.signum(this.z) === 0 || ExNumber.signum(P.z) === 0) return this.z.eq(P.z);
      let p = this.E.bn.p;
      let z2 = this.z.multiply(this.z).mod(p), z3 = this.z.multiply(z2).mod(p),
          pz2 = P.z.multiply(P.z).mod(p), pz3 = P.z.multiply(pz2).mod(p);
      return ExNumber.signum(this.x.multiply(pz2).subtract(P.x.multiply(z2)).mod(p)) === 0 &&  ExNumber.signum(this.y.multiply(pz3).subtract(P.y.multiply(z3)).mod(p)) === 0;
  }

  same(Q) {
      return this.E.bn === Q.E.bn;
  }

  norm() {
      if (ExNumber.signum(this.z) === 0 || this.z.compareTo(this.E.bn._1) === 0) return this;
      let p = this.E.bn.p;
      let zinv = null;
      try {
          zinv = this.z.modInv(p);
      } catch (a) {
          throw Error(a);
      }
      let zinv2 = zinv.multiply(zinv);
      return new Point(this.E, this.x.multiply(zinv2).mod(p), this.y.multiply(zinv).multiply(zinv2).mod(p), this.E.bn._1);
  }

  isNormal () {
      return (ExNumber.signum(this.z) === 0 || this.z.compareTo(E.bn._1) === 0);
  }

  neg () {
      return new Point(this.E, this.x, (ExNumber.signum(this.y) !== 0) ? this.E.bn.p.subtract(this.y) : this.y, this.z);
  }

  opposite (P) {
      if (!this.same(P)) return false;
      if (ExNumber.signum(this.z) === 0 || P.zero()) return this.z.compareTo(P.z) === 0;
      let p = E.bn.p;
      let z2 = this.z.multiply(this.z);
      let z3 = this.z.multiply(z2).mod(p);
      let pz2 = P.z.multiply(P.z);
      let pz3 = P.z.multiply(pz2).mod(p);
      return this.x.multiply(pz2).subtract(P.x.multiply(z2)).mod(p).signum() === 0 &&
              this.y.multiply(pz3).add(P.y.multiply(z3)).mod(p).signum() === 0;
  }

  add(Q) {
      console.assert(this.same(Q));
      if (this.zero()) return Q;
      if (Q.zero()) return this;
      
      let p = this.E.bn.p;
      let X1 = this.x, Y1 = this.y, Z1 = this.z, U1 = this.x, S1 = this.y, Z1Z1;
      let X2 = Q.x, Y2 = Q.y, Z2 = Q.z, U2 = Q.x, S2 = Q.y, Z2Z2, H, I, J, R, V, X3, Y3, Z3;
      let Z1is1 = (Z1.compareTo(this.E.bn._1) === 0);
      let Z2is1 = (Z2.compareTo(this.E.bn._1) === 0);
      if (!Z1is1) {
          Z1Z1 = Z1.multiply(Z1).mod(p);
          U2 = X2.multiply(Z1Z1).mod(p);
          S2 = Y2.multiply(Z1).multiply(Z1Z1).mod(p);
      }
      if (!Z2is1) {
          Z2Z2 = Z2.multiply(Z2).mod(p);
          U1 = X1.multiply(Z2Z2).mod(p);
          S1 = Y1.multiply(Z2).multiply(Z2Z2).mod(p);
      }
      if (U1.compareTo(U2) === 0)
          if (S1.compareTo(S2) === 0) return this.twice(1);
          else return this.E.infinity;
      H = U2.subtract(U1);
      I = H.shiftLeft(1);
      I = I.multiply(I).mod(p);
      J = H.multiply(I)
      R = S2.subtract(S1).shiftLeft(1);
      V = U1.multiply(I)
      X3 = R.multiply(R).subtract(J).subtract(V.shiftLeft(1)).mod(p);
      Y3 = R.multiply(V.subtract(X3)).subtract(S1.multiply(J).shiftLeft(1)).mod(p);
      if (Z2is1)
          if (Z1is1) Z3 = H.shiftLeft(1).mod(p);
          else Z3 = Z1.multiply(H).shiftLeft(1).mod(p);
      else
          if (Z1is1) Z3 = Z2.multiply(H).shiftLeft(1).mod(p);
          else {
              Z3 = Z1.add(Z2);
              Z3 = Z3.multiply(Z3).subtract(Z1Z1).subtract(Z2Z2).multiply(H).mod(p)
          }
      return new Point(this.E, X3, Y3, Z3);
  }

  subtract(Q) {
      return this.add(Q.neg());
  }

  twice(n) {
      if (this.zero()) return this;
      
      let p = this.E.bn.p;
      let A, B, C, S, M, X = this.x, Y = this.y, Z = this.z;
      while (n-- > 0) {
          A = X.multiply(X);
          B = Y.multiply(Y).mod(p);
          C = B.multiply(B);
          S = X.add(B);
          S = S.multiply(S).subtract(A).subtract(C).shiftLeft(1).mod(p);
          M = A.multiply(this.E.bn._3).mod(p);
          X = M.multiply(M).subtract(S.shiftLeft(1)).mod(p);
          if (Z.compareTo(this.E.bn._1) === 0) Z = Y.shiftLeft(1);
          else Z = Y.multiply(Z).shiftLeft(1).mod(p);
          Y = M.multiply(S.subtract(X)).subtract(C.shiftLeft(3)).mod(p);
      }
      return new Point(this.E, X, Y, Z);
  }

  multiply(k) {
      if(this.preComp === null) {
          
          if(k.compareTo(this.E.bn._1) === 0) {
              return this;
          }
          let bn = this.E.bn;
          let P = this.norm();
          
          if (ExNumber.signum(k) < 0) {
              k = k.negate();
              P = P.neg();
          }
          let r = bn.u.shiftLeft(1).add(this.E.bn._1);
          let t = bn.u.multiply(this.E.bn._3).add(this.E.bn._1).multiply(bn.u.shiftLeft(1));
          
          let halfn = bn.n.shiftRight(1);
          let kr = k.multiply(r);
          if (kr.mod(bn.n).compareTo(halfn) <= 0) kr = kr.divide(bn.n);
          else kr = kr.divide(bn.n).add(this.E.bn._1);
          let kt = k.multiply(t);
          if (kt.mod(bn.n).compareTo(halfn) <= 0) kt = kt.divide(bn.n);
          else kt = kt.divide(bn.n).add(this.E.bn._1);
          let sr = k.subtract(kr.multiply(r).add(kt.multiply(t.add(r))));
          let st = kr.multiply(t).subtract(kt.multiply(r));
          let Y = new Point(this.E, P.x.multiply(bn.zeta), P.y, P.z);
          return P.simul(sr, st, Y);
      } else {
          k = k.mod(this.E.bn.n);
          let A = this.E.infinity;
          for (let i = 0, w = 0; i < this.preComp.length; i++, w >>>= 8) {
              if ((i&3) === 0) {
                  w = k.intValue();
                  k = k.shiftRight(32);
              }
              A = A.add(this.preComp[i][w & 0xff]);
          }
          return A;
      }
  }

  simul(ks, kr, Y) {

      console.assert(this.same(Y));
      if (this.preComp === null) {
          let hV = new Array(16);
          let P = this.norm();
          Y = Y.norm();
          if (ExNumber.signum(ks) < 0) {
              ks = ks.negate();
              P = P.neg();
          }
          if (ExNumber.signum(kr) < 0) {
              kr = kr.negate();
              Y = Y.neg();
          }
          hV[0] = this.E.infinity;
          hV[1] = P;
          hV[2] = Y;
          hV[3] = P.add(Y);
          for (let i=4; i<16; i+=4) {
              hV[i] = hV[i>>2].twice(1);
              hV[i+1] = hV[i].add(hV[1]);
              hV[i+2] = hV[i].add(hV[2]);
              hV[i+3] = hV[i].add(hV[3]);
          }
          let t = Math.max(kr.bitLength(), ks.bitLength());
          let R = this.E.infinity;
          for (let i = (((t+1)>>1)<<1)-1; i>=0; i-=2) {
              let j = (ExNumber.testBit(kr, i)?8:0) | (ExNumber.testBit(ks, i)?4:0) | (ExNumber.testBit(kr, i-1)?2:0) | (ExNumber.testBit(ks, i-1)?1:0);
              R = R.twice(2).add(hV[j]);
          }
          return R;
      } else R = this.multiply(ks).add(Y.multiply(ks));
      return R;
  }

  getSerializedTable() {
      if (this.preComp === null) {
          let length = Math.floor((this.E.bn.n.bitLength() + 3)/4);
          this.preComp = new Array(length);
          for (let i = 0; i < length; i++) this.preComp[i] = new Array(256);
          let P = this.norm();
          let preCompi = this.preComp[0];
          preCompi[0] = this.E.infinity;
          preCompi[1] = P;
          for (let i = 1, j = 2; i <= 127; i++, j += 2) {
              preCompi[j] = preCompi[i].twice(1).norm();
              preCompi[j+1] = preCompi[j].add(P).norm();
          }
          for (let i = 1; i < this.preComp.length; i++) {
              let preComph = preCompi;
              preCompi = this.preComp[i];
              preCompi[0] = preComph[0];
              for (let j = 1; j < 256; j++) {
                  preCompi[j] = preComph[j].twice(8).norm();
              }
          }
      }
  }

  toByteArray(formFlags) {
      let len = Math.floor((this.E.bn.p.bitLength() + 7)/8);
      let resLen = 1, pc = 0;
      let P = this.norm();
      let osX = null, osY = null;
      if (!P.zero()) {
          osX = ExNumber.toByteArray(P.x);
          resLen += len;
          if ((formFlags & 2) !== 0) {
              pc |= 2 | (ExNumber.testBit(P.y, 0) ? 1 : 0);
          }
          if ((formFlags & 4) !== 0) {
              pc |= 4;
              osY = ExNumber.toByteArray(P.y);
              resLen += len;
          }
      }
      let buf = new Uint8Array(resLen);
      for (let i = 0; i < buf.length; i++) {
          buf[i] = 0;
      }
      buf[0] = pc;
      if (osX !== null) {
          if (osX.length <= len) {
              Point.arrayCopy(osX,0,buf,1+len-osX.length,osX.length);
          } else {
              Point.arrayCopy(osX,1,buf,1,len);
          }
      }
      if (osY !== null) {
          if (osY.length <= len) {
              Point.arrayCopy(osY,0,buf,1+2*len-osY.length,osY.length);
          } else {
              Point.arrayCopy(osY,1,buf,1+len,len);
          }
      }
      return buf;
  }
}


class Point2 {

  constructor (E, x, y, z) {

      if (arguments.length === 1) {
  
          if (E instanceof Curve2) {
              this.E = E;
              
              this.x = E.Fp2_1;
              this.y = E.Fp2_1;
              this.z = E.Fp2_0;
          }

          if (E instanceof Point2) {
              let Q = E;
              this.E = Q.E;
              this.x = Q.x;
              this.y = Q.y;
              this.z = Q.z;
          }
      }
      if(arguments.length === 3) {

          if ((x instanceof Field2) && (y instanceof Field2)) {
              this.E = E;
              this.x = x;
              this.y = y;
              this.z = E.Fp2_1;

              if (!E.contains(this)) {
                  throw new Error("pointNotOnCurve");
              }
          }

          else if (!(y instanceof Field2)) {
              let yBit = y;
              this.E = E;
              this.x = x;
              if (this.x.zero()) {
                  throw new Error("pointNotOnCurve");
              } else {
                  this.y = this.x.cube().add(this.E.bt).sqrt();
                  if (this.y === null) {
                      throw new Error("pointNotOnCurve");
                  }
                  if (ExNumber.testBit(this.y.re, 0) !== ((yBit & 1) === 1)) {
                      this.y = this.y.neg();
                  }
              }
              this.z = this.E.Fp2_1;
          }
          else if (!(x instanceof Field2)) {
              let xTrit = x;
              this.E = E;
              this.y = y;
              if (this.y.zero()) {
                  throw new Error(pointNotOnCurve);
              } else {
                  this.x = this.y.square().subtract(this.E.bt).cbrt();
                  if (this.x === null) {
                      throw new Error(pointNotOnCurve);
                  }
                  
                  if (this.x.re.mod(this.E.E.bn._3).intValue() !== xTrit) {
                      let zeta = this.E.E.bn.zeta;
                      this.x = this.x.multiply(zeta);
                      if (this.x.re.mod(this.E.E.bn._3).intValue() !== xTrit) {
                          this.x = this.x.multiply(zeta);
                          if (this.x.re.mod(this.E.E.bn._3).intValue() !== xTrit) {
                              throw new Error(pointNotOnCurve);
                          }
                      }
                  }
              }
              this.z = this.E.Fp2_1;
          }
      }
      if (arguments.length === 4) {
          this.E = E;
          this.x = x;
          this.y = y;
          this.z = z;
      }
  }

  toString() {
    return ('('+this.x.toString()+','+this.y.toString()+','+this.z.toString()+')');
  }

  frobex (k) {
      if (!this.z.one()) {
          throw new Error("Error");
      }
      let bn = this.E.E.bn;
      switch (k) {
          case 1:
              return (bn.b === 3) ?
                  new Point2(this.E, this.x.mulI().conj().multiply(bn.zeta), this.y.mulV().conj().multiply(bn.zeta0sigma), this.z) :
                  new Point2(this.E, this.x.conj().mulI().multiply(bn.zeta), this.y.conj().mulV().multiply(bn.zeta1sigma), this.z);
          case 2:
              return new Point2(this.E, this.x.multiply(bn.zeta1).neg(), this.y.neg(), this.z);
          case 3:
              return (bn.b === 3) ?
                  new Point2(this.E, this.x.mulI().conj(), this.y.mulV().conj().multiply(bn.zeta0sigma).neg(), this.z) :
                  new Point2(this.E, this.x.conj().mulI(), this.y.conj().mulV().multiply(bn.zeta1sigma).neg(), this.z);
          default:
              return null;
      }
  }

  zero() {
      return this.z.zero();
  }

  eq(Q) {
      if (!(Q instanceof Point2) || !this.same(Q)) {
          return false;
      }
      let P = Q;
      if (this.z.zero() || P.zero()) {
          return this.z.eq(P.z);
      } else {
          let z2 = this.z.square();
          let z3 = this.z.multiply(z2);
          let pz2 = P.z.square();
          let pz3 = P.z.multiply(pz2);
          return this.x.multiply(pz2).eq(P.x.multiply(z2)) &&
              this.y.multiply(pz3).eq(P.y.multiply(z3));
      }
  }

  same(Q) {
      return this.E.E.bn === Q.E.E.bn;
  }

  norm () {
      if (this.z.zero() || this.z.one()) {
          return this;
      }
      let zinv = this.z.inverse(), zinv2 = zinv.square(), zinv3 = zinv.multiply(zinv2);
      return new Point2(this.E, this.x.multiply(zinv2), this.y.multiply(zinv3), this.E.Fp2_1);
  }

  randomize (rand) {
      return this.E.pointFactory(rand);
  }

  neg() {
      return new Point2(this.E, this.x, this.y.neg(), this.z);
  }

  opposite(P) {
      return this.eq(P.neg());
  }

  add(Q) {
      // console.log(Q);
      try {
      if (this.zero()) {
          return Q;
      }
      } catch (e) {
        console.log(this)
        console.log(e)
      }
      if (Q.zero()) {
          return this;
      }
      
      let Fp2_1 = this.E.E.bn.Fp2_1;
      let X1 = this.x, Y1 = this.y, Z1 = this.z, X2 = Q.x, Y2 = Q.y, Z2 = Q.z, Z1Z1 = Fp2_1, Z2Z2 = Fp2_1, U1 = this.x, U2 = Q.x, S1 = this.y, S2 = Q.y, H, I, J, R, V, X3, Y3, Z3;
      let Z1is1 = Z1.one();
      let Z2is1 = Z2.one();
      if (!Z1is1) {
          Z1Z1 = Z1.square();
          U2 = X2.multiply(Z1Z1);
          S2 = Y2.multiply(Z1).multiply(Z1Z1);
      }
      if (!Z2is1) {
          Z2Z2 = Z2.square();
          U1 = X1.multiply(Z2Z2);
          S1 = Y1.multiply(Z2).multiply(Z2Z2);
      }
      if (U1.eq(U2)) {
          if (S1.eq(S2)) {
              return this.twice(1);
          } else {
            console.log('inifinity')
              return this.E.infinity;
          }
      }
      H = U2.subtract(U1);
      I = H.twice(1).square();
      J = H.multiply(I);
      R = S2.subtract(S1).twice(1);
      V = U1.multiply(I);
      X3 = R.square().subtract(J).subtract(V.twice(1));
      Y3 = R.multiply(V.subtract(X3)).subtract(S1.multiply(J).twice(1));
      if (Z2is1) {
          if (Z1is1) {
              Z3 = H.twice(1);
          } else {
              Z3 = Z1.multiply(H).twice(1);
          }
      } else {
          if (Z1is1) {
              Z3 = Z2.multiply(H).twice(1);
          } else {
              Z3 = Z1.add(Z2).square().subtract(Z1Z1).subtract(Z2Z2).multiply(H)
          }
      }
      return new Point2(this.E, X3, Y3, Z3);
  }

  twice (n) {
      if (this.zero()) return this;
      
      let A, B, C, S, M, X = this.x, Y = this.y, Z = this.z;
      while (n-- > 0) {
          A = X.square();
          B = Y.square();
          C = B.square();
          S = X.add(B).square().subtract(A).subtract(C).twice(1);
          M = A.multiply(new Number(3));
          X = M.square().subtract(S.twice(1));
          Z = Y.multiply(Z).twice(1);
          Y = M.multiply(S.subtract(X)).subtract(C.twice(3));
      }
      return new Point2(this.E, X, Y, Z);
  }

  multiply (k) {
      
      let P = this.norm();
      if (!bigInt.isInstance(k)) {
          k = bigInt(k);
      }
      if (ExNumber.signum(k) < 0) {
          k = k.negate();
          P = P.neg();
      }

      if (!bigInt.isInstance(k)) {
          k = bigInt(k);
      }
      let e = ExNumber.toByteArray(k);
      let mP = new Array(16);
      mP[0] = this.E.infinity;
      mP[1] = P;
      for (let i = 1; i <= 7; i++) {
          mP[2*i    ] = mP[  i].twice(1);
          mP[2*i + 1] = mP[2*i].add(P);
      }
      let A = this.E.infinity;
      for (let i = 0; i < e.length; i++) {
          let u = e[i] & 0xff;
          A = A.twice(4).add(mP[u >>> 4]).twice(4).add(mP[u & 0xf]);
      }
      return A.norm();
      
  }

  simul (kP, P, kQ, Q, kR, R, kS, S) {
      let hV = new Array(16);
      P = P.norm();
      if (ExNumber.signum(kP) < 0) {
          kP = kP.negate(); P = P.neg();
      }
      Q = Q.norm();
      if (ExNumber.signum(kQ) < 0) {
          kQ = kQ.negate(); Q = Q.neg();
      }
      R = R.norm();
      if (ExNumber.signum(kR) < 0) {
          kR = kR.negate(); R = R.neg();
      }
      S = S.norm();
      if (ExNumber.signum(kS) < 0) {
          kS = kS.negate(); S = S.neg();
      }
      hV[0] = this.E.infinity;
      hV[1] = P; hV[2] = Q; hV[4] = R; hV[8] = S;
      for (let i = 2; i < 16; i <<= 1) {
          for (let j = 1; j < i; j++) {
              hV[i + j] = hV[i].add(hV[j]);
          }
      }
      let t = Math.max(Math.max(kP.bitLength(), kQ.bitLength()), Math.max(kR.bitLength(), kS.bitLength()));
      let V = this.E.infinity;
      for (let i=t-1; i>=0; i--) {
          let j = (ExNumber.testBit(kS, i)?8:0) | (ExNumber.testBit(kR, i)?4:0) | (new ExNumber.testBit(kQ, i) ?   2 : 0) | (new ExNumber.testBit(kP, i)?1:0);
          V = V.twice(2).add(hV[j]);
      }
      return V.norm();
  }


}

export {Point, Point2}