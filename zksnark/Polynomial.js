import { Field2 } from './pairing/Fields'
import Parameters from './pairing/Parameters'
import bigInt from 'big-integer'

const bn = new Parameters(128);

const bn2 = {
  p: bn.n,
  _0: bigInt(0),
  _1: bigInt(1),
  _5: bigInt(5)
  
};

bn2.Fp2_1 = new Field2(bn2, bn2._1)

class Polynomial {

  static interpolation(x, y) {
    function conv(x, y) {
      // x, y :: number[]
      let result = [];
      for (let k = 0; k < x.length + y.length - 1; k++) {
        let sum = 0;
        for (let i = 0; i < x.length; i++) {
          let j = k - i;
          if (j >= 0 && j < y.length) {
            sum += x[i] * y[j];
          }
        }
    
        result[k] = sum;
      }
    
      return result;
    }
    
    let result = new Array(x.length).fill(0);
  
    for (let i = 0; i < x.length; i++) {
  
      let basis = [1];
      for (let j = 0; j < x.length; j++) {
  
        if (i != j) {
          if (x[i] == x[j]) {
            throw new Error("All x-values must be distinct");
          }
  
          // basis = conv(basis, [1, -x[j]]) / (x[i] - x[j])
          basis = conv( basis, [ 1, -x[j]  ] ).map(function(z) {
            return z / (x[i] - x[j]);
          });
        }
      }
  
      // result += y[i] * basis
      result = result.map(function(r, k) {
        return y[i] * basis[k];
      });
  
    }
    return result.reverse();
  }

  // calculate coefficients for Li polynomial
  static interpolation(i, x) {
    let coefficients = new Array(x.length).fill(new Field2(bn2, bn2._0));

    let denom = new Field2(bn2, bn2._1);
    for (let j=x.length; j--;) {
      if (i != j) {
        //.log(denom.bn)
        denom = denom.multiply( x[i].subtract(x[j]) );
      }
    }

    coefficients[0] = denom.inverse();   
    let new_coefficients;

    for (let k = 0; k < x.length; k++) {
      if (k != i) {
        new_coefficients = new Array(x.length).fill(new Field2(bn2, bn2._0));
        for (let j= (k < i) ? k+1 : k; j--;) {
          new_coefficients[j+1] = new_coefficients[j+1].add( coefficients[j]);
          new_coefficients[j] = new_coefficients[j].subtract(x[k].multiply(coefficients[j]));
        }
        coefficients = new_coefficients;
      }
    }

    return coefficients;
  }

  static interpolationOverField(x, y) {
    let polynomial = new Array(x.length).fill( new Field2(bn2, bn2._0) );
    let coefficients;
    for (let i=0; i<x.length; ++i) {
      coefficients = Polynomial.interpolation(i, x, y);

      for (let k=0; k<x.length; ++k) {
        polynomial[k] = polynomial[k].add( y[i].multiply(coefficients[k]) );
      }
    }
    return polynomial;
  }

  static add(a, b, subtract = false) {
    let o;
    if (a.length > b.length)
      o = new Array(a.length).fill(new Field2(bn2, bn2._0));
    else 
      o = new Array(b.length).fill(new Field2(bn2, bn2._0));

    for (let i = 0; i < a.length; i++) {
      o[i] = o[i].add(a[i]);
    }  

    for (let k = 0; k < b.length; k++) {
      o[k] = o[k].add(subtract ? b[k].neg() : b[k]);
    }

    return o;
  }

  static sub(a, b) {
    return Polynomial.add(a, b, true);
  }

  static mul(a, b) {
    let o = new Array(a.length + b.length-1).fill(new Field2(bn2, bn2._0));
    for (let i =0; i<a.length; i++) 
      for (let j =0; j<b.length; j++) {
        o[i+j] = o[i+j].add( a[i].multiply( b[j] ) );
      }

    return o
  }

  static add2(a, b, subtract = false) {
    let o;
    if (a.length > b.length)
      o = new Array(a.length).fill(0);
    else 
      o = new Array(b.length).fill(0);

    for (let i = 0; i < a.length; i++) {
      o[i] = o[i] + (a[i]);
    }  

    for (let k = 0; k < b.length; k++) {
      o[k] = o[k] + b[k];
    }

    return o;
  }

  static sub2(a, b) {
    let o;
    if (a.length > b.length)
      o = new Array(a.length).fill(0);
    else 
      o = new Array(b.length).fill(0);

    for (let i = 0; i < a.length; i++) {
      o[i] = o[i] + (a[i]);
    }  

    for (let k = 0; k < b.length; k++) {
      o[k] = o[k] + ( - b[k]);
    }

    return o;
  }

  static mul2(a, b) {
    let o = new Array(a.length + b.length-1).fill(0);
    for (let i =0; i<a.length; i++)
      for (let j =0; j<b.length; j++) {
        o[i+j] = o[i+j] + ( a[i] * ( b[j] ) );
      }

    return o
  }

  static div(a, b) {
    let o = new Array(a.length - b.length+1).fill(new Field2(bn2, bn2._0));
    let remainder = a;
    let leading_fac;
    while (remainder.length >= b.length) {
      leading_fac = remainder[remainder.length-1].multiply( b[b.length-1].inverse() );
      let pos = remainder.length - b.length;
      o[pos] = leading_fac;
      let d = new Array(pos).fill(new Field2(bn2, bn2._0)).concat(leading_fac);
      remainder = Polynomial.sub(remainder, Polynomial.mul(b, d) );
      remainder.pop();
    }
    return { quot:o, remainder };
  }

  static  degree( p) {
    for (let i = p.length - 1; i >= 0; --i) {
        if (p[i] != 0) return i;
    }
    return -Infinity;
  }
  static  degree2( p) {
    for (let i = p.length - 1; i >= 0; --i) {
        if (!p[i].zero()) return i;
    }
    return -Infinity;
  }

  static polyShiftRight (p, places) {
      if (places <= 0) return p;
      let pd = Polynomial.degree(p);
 
      let d = p;
      for (let i = pd; i >= 0; --i) {
          d[i + places] = d[i];
          d[i] = 0;
      }
      return d;
  }

  static polyShiftRight2 (p, places) {
    if (places <= 0) return p;
    let pd = Polynomial.degree(p);

    let d = p;
    for (let i = pd; i >= 0; --i) {
        d[i + places] = d[i];
        d[i] = new Field2(bn2, bn2._0);
    }
    return d;
}

   static  polyLongDiv(n, d) {
      if (n.length != d.length) {
          throw new Error("Numerator and denominator vectors must have the same size");
      }
      let nd = Polynomial.degree(n);
      let dd = Polynomial.degree(d);
      if (dd < 0) {
          throw new Error("Divisor must have at least one one-zero coefficient");
      }
      if (nd < dd) {
          throw new Error("The degree of the divisor cannot exceed that of the numerator");
      }
      let n2 = n;
      let q = new Array(n.length).fill(0);
      let d2;
      while (nd >= dd) {
          let p = d.slice();
          d2 = Polynomial.polyShiftRight(p, nd - dd);
          if (d2[nd]==0) throw new Error('division by zero');

          q[nd - dd] = n2[nd] / d2[nd];

          d2 = Polynomial.mul2(d2, [q[nd - dd]]);
          n2 = Polynomial.sub2(n2, d2);
          nd = Polynomial.degree(n2);
         
      }
      return {q, r:n2};
  }

  static polyLongDivField(n, d) {
    if (n.length != d.length) {
        throw new Error("Numerator and denominator vectors must have the same size");
    }
    let nd = Polynomial.degree2(n);
    let dd = Polynomial.degree2(d);
    if (dd < 0) {
        throw new Error("Divisor must have at least one one-zero coefficient");
    }
    if (nd < dd) {
        throw new Error("The degree2 of the divisor cannot exceed that of the numerator");
    }
    let n2 = n;
    let q = new Array(n.length).fill( new Field2(bn2, bn2._0) );
    let d2;
    while (nd >= dd) {
        
        let p = d.slice();
        d2 = Polynomial.polyShiftRight2(p, nd - dd);
       
        if (d2[nd].zero()) {
          throw new Error('division by zero')
        } else
          q[nd - dd] = n2[nd] .multiply( d2[nd].inverse());

        d2 = Polynomial.mul(d2, [q[nd - dd]]);
        n2 = Polynomial.sub(n2, d2);
        nd = Polynomial.degree2(n2);
       
    }
    return {q, r:n2};
 }

  static div2(a, b) {
    let o = new Array(a.length - b.length+1).fill(0);
    let remainder = a;
    let leading_fac;
    while (remainder.length >= b.length) {
      leading_fac = remainder[remainder.length-1] / ( b[b.length-1]);
      let pos = remainder.length - b.length;
      o[pos] = leading_fac;
      let d = new Array(pos).fill(0).concat(leading_fac);
      remainder = Polynomial.sub2(remainder, Polynomial.mul2(b, d) );
      remainder.pop();
    }
    return { quot:o, remainder };
  }

  static evaluate(poly, x) {
    let sum = 0;
    for (let i=0; i< poly.length; i++) {
        sum += poly[i] * ( x**i );
    }
    return sum;
  }

  static evaluateField(poly, x) {
    let sum = new Field2(bn2,bn2._0);
    for (let i=0; i< poly.length; i++) {
        sum = sum.add( poly[i] .multiply ( x.exp(bigInt(i)))  );
    }
    return sum;
  }

  static evaluateFieldOverPrime(poly, x, _p) {
    let sum = new Field2({p:_p, _0: bigInt("0")}, bigInt("0") );
    for (let i=0; i< poly.length; i++) {
        sum = sum.add( poly[i].re .multiply ( x.exp(bigInt(i)) ) );
    }
    return sum;
  }


  static evaluateNum(poly, x) {
    let sum = bigInt(0);
    for (let i=0; i< poly.length; i++) {
        sum = sum.add( poly[i].re * ( x.re ** (bigInt(i)) ) );
    }
    return sum;
  }
}

export  { Polynomial, bn, bn2 };