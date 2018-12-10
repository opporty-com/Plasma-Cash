'use strict';

import { Curve, Curve2 } from './Curves'
import { Field2, Field12 } from './Fields'
import bigInt from 'big-integer'
import ExNumber from './ExNumber'

class Point {
  constructor(E, x, y) {
    this.preComp = null;
    if (arguments.length === 1) {
        
        if (E instanceof Curve) {
            this.E = E;
            // (1,1,0)
            this.x = E.bn._1;
            this.y = E.bn._1;
            this.inf = true;
        }
        
        if (E instanceof Point) {
            let Q = E;
            this.E = Q.E;
            this.x = Q.x;
            this.y = Q.y;
            this.inf = Q.inf;
        }
    }

    if (arguments.length === 3) {
        if (x instanceof Field2 && y instanceof Field2) {
            this.E = E;
            this.x = x;
            this.y = y;
            this.inf = false;
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
        }

    }

    if (bigInt.isInstance(this.x)) {
      this.x = new Field2(E.bn.p, this.x);
    }
    if (bigInt.isInstance(this.y)) {
      this.y = new Field2(E.bn.p, this.y);
    }

  }

  toString() {
    return ('('+this.x.toString()+','+this.y.toString()+')');
  }

  zero() {
    return this.inf;
  }

  eq(Q) {
    if (!(Q instanceof Point && this.same(Q))) return false;
    return this.x.eq(Q.x) && this.y.eq(Q.y);
  }

  same(Q) {
    return this.E.bn === Q.E.bn;
  }

  neg() {
    if (this.y.zero()) {
      return new Point(this.E, this.x, this.y);
    }

    return new Point(this.E, this.x , this.y.neg());
  }

  add(Q) {
    if (this.zero()) return Q;
    if (Q.zero()) return this;
    const _2 = bigInt('2');
    const X1 = this.x, Y1 = this.y;
    const X2 = Q.x, Y2 = Q.y;
    let m;
    if (X1.eq(X2) && (Y1.eq(Y2))) {
      return this.double(Q);
    } else if (X1.eq(X2)) {
      return this.E.infinity;
    } else {
      m = Y2.subtract(Y1).divide(X2.subtract(X1));
    }
    let nx = m.exp(_2).subtract(X1).subtract(X2);
    let ny = m.neg().multiply(nx).add(m.multiply(X1)).subtract(Y1);
    return new Point(this.E, nx, ny);
  }

  subtract(Q) {
      return this.add(Q.neg());
  }

  double() {
    let X = this.x;
    let Y = this.y;
   
    const _2 = new Field2(this.E.bn.p, bigInt(2));
    const _3 = new Field2(this.E.bn.p, bigInt(3));

    let m = _3.multiply(X).multiply(X).divide(_2.multiply(Y));
    
    let newx = m.exp(bigInt(2)).subtract(_2.multiply(X));
    let newy = m.neg().multiply(newx).add(m.multiply(X)).subtract(Y);

    return new Point(this.E, newx, newy)
  }

  twice(n) {
    if (this.zero()) return this;
    let P = new Point(this.E, this.x,this.y);
    
    for (let i = 0; i< n; i++) {
      P = P.double();
    }

    return  P;
  }

  multiply(n) {
    if (n.isZero()) {
      return this.E.infinity;
    }
    if (n.equals(1)) {
      return this;
    } else if (n.mod(2).isZero()) {
      const P = this.double().multiply( n.divide(2) );
      
      return P;
    } else {
      const P = this.add(this.double().multiply( n.divide(2) ));
      
      return P;
    }
  }

  toF12() {
    if (this.eq(this.E.infinity)) {
      return this.E.infinity;
    }

    let x = this.x;
    let y = this.y;

    let nx = new Field12(this.E.bn, [
      new Field2(this.E.bn.p, x.re, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
    ]);

    let ny = new Field12(this.E.bn, [
      new Field2(this.E.bn.p, y.re, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
    ]);

    return new Point12(this.E, nx, ny);
  }
}


class Point2 extends Point {
  constructor (E, x, y) {
    super(E, x, y);

    if (arguments.length === 1) {
        if (E instanceof Curve2) {
            this.E = E;
            this.x = E.Fp2_1;
            this.y = E.Fp2_1;
            this.inf = true;
        }

        if (E instanceof Point2) {
            let Q = E;
            this.E = Q.E;
            this.x = Q.x;
            this.y = Q.y;
            this.inf = Q.inf;
        }
    }
    if(arguments.length === 3) {

        if ((x instanceof Field2) && (y instanceof Field2)) {
            this.E = E;
            this.x = x;
            this.y = y;
            this.inf = false;

            if (!E.contains(this)) {
                throw new Error("pointNotOnCurve");
            }
        }

    }
  }

  add(Q) {
    if (this.zero()) return Q;
    if (Q.zero()) return this;
    const _2 = bigInt('2');
    let X1 = this.x, Y1 = this.y;
    let X2 = Q.x, Y2 = Q.y;
    let m;
    if (X1.eq(X2) && (Y1.eq(Y2))) {
      return this.double(Q);
    } else if (X1.eq(X2)) {
      return this.E.infinity;
    } else {
      m = Y2.subtract(Y1).divide(X2.subtract(X1));
      
    }
    let nx = m.exp(_2).subtract(X1).subtract(X2);
    let ny = m.neg().multiply(nx).add(m.multiply(X1)).subtract(Y1);
    return new Point2(this.E, nx, ny);
  }

  twice(n) {
    if (this.zero()) return this;
    let P = new Point2(this.E, this.x, this.y);
    
    for (let i = 0; i< n; i++) {
      P = P.double();
    }

    return  P;
  }

  double() {
    let X = this.x;
    let Y = this.y;
   
    const _2 = new Field2(this.E.bn.p, bigInt(2));
    const _3 = new Field2(this.E.bn.p, bigInt(3));

    let m = _3.multiply(X).multiply(X).divide(_2.multiply(Y));
    
    let newx = m.exp(bigInt(2)).subtract(_2.multiply(X));
    let newy = m.neg().multiply(newx).add(m.multiply(X)).subtract(Y);

    return new Point2(this.E, newx, newy)
  }

  toF12() {
    if (this.eq(this.E.infinity)) {
      return this.E.infinity;
    }

    let _x = this.x;
    let _y = this.y;

    let xre = new Field2(this.E.bn.p, _x.re);
    let yre = new Field2(this.E.bn.p, _y.re);
    let xim = new Field2(this.E.bn.p, _x.im);
    let yim = new Field2(this.E.bn.p, _y.im);

    let xcoeffs = xre.subtract(xim.multiply(bigInt(9)));
    let ycoeffs = yre.subtract(yim.multiply(bigInt(9)));

    let w = new Field12(this.E.bn, [
      new Field2(this.E.bn.p, bigInt.zero, bigInt.one, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
    ]);

    let nx = new Field12(this.E.bn, [
      new Field2(this.E.bn.p, xcoeffs.re, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, _x.im, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
    ]);

    let ny = new Field12(this.E.bn, [
      new Field2(this.E.bn.p, ycoeffs.re, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, _y.im, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
      new Field2(this.E.bn.p, bigInt.zero, bigInt.zero, false),
    ]);

    nx = nx.multiply(w).multiply(w);
    ny = ny.multiply(w).multiply(w).multiply(w);

    return new Point12(this.E, nx, ny);
  }

  toString() {
    return ('('+this.x.toString()+','+this.y.toString()+')');
  }
}


class Point12 extends Point2 {
  constructor (E, x, y) {
    super(E, x, y);

    if (arguments.length === 1) {
        if (E instanceof Curve2) {
            this.E = E;
            this.x = E.Fp12_1;
            this.y = E.Fp12_1;
            this.inf = true;
        }

        if (E instanceof Point2) {
            let Q = E;
            this.E = Q.E;
            this.x = Q.x;
            this.y = Q.y;
            this.inf = Q.inf;
        }
    }
    if(arguments.length === 3) {

        if ((x instanceof Field12) && (y instanceof Field12)) {
            this.E = E;
            this.x = x;
            this.y = y;
            this.inf = false;

        }

    }
  }

  add(Q) {
    if (this.zero()) return Q;
    if (Q.zero()) return this;
    const _2 = bigInt('2');
    let X1 = this.x, Y1 = this.y;
    let X2 = Q.x, Y2 = Q.y;
    let m;
    if (X1.eq(X2) && (Y1.eq(Y2))) {
      return this.double(Q);
    } else if (X1.eq(X2)) {
      return this.E.infinity;
    } else {
      m = Y2.subtract(Y1).divide(X2.subtract(X1));
      
    }
    let nx = m.multiply(m).subtract(X1).subtract(X2);
    let ny = m.neg().multiply(nx).add(m.multiply(X1)).subtract(Y1);
    return new Point12(this.E, nx, ny);
  }

  twice(n) {
    if (this.zero()) return this;
    let P = new Point12(this.E, this.x,this.y);
    
    for (let i = 0; i< n; i++) {
      P = P.double();
    }

    return  P;
  }

  double() {
    let X = this.x;
    let Y = this.y;
   
    let _3 = new Field12(this.E.bn, bigInt(3));
    let _2 = new Field12(this.E.bn, bigInt(2));

    let m = _3.multiply(X).multiply(X).divide(_2.multiply(Y));

    let newx = m.multiply(m).subtract(_2.multiply(X));
    let newy = m.neg().multiply(newx).add(m.multiply(X)).subtract(Y);

    return new Point12(this.E, newx, newy)
  }

  toString() {
    return ('('+this.x.toString()+', '+this.y.toString()+')');
  }
}

export { Point, Point2, Point12 }