import { Polynomial, bn, bn2 } from './Polynomial'
import Parameters from './pairing/Parameters'
import { Field2 } from './pairing/Fields'
import bigInt from 'big-integer'
import { builtinModules } from 'module';


class QAP {

  static transposeMatrix(a) {
    return Object.keys(a[0]).map(function(c) {
        return a.map(function(r) { return new Field2(bn2, bigInt( r[c] )); });
    });
  }

  static fromR1CS(Aold, Bold, Cold) {
    Aold = QAP.transposeMatrix(Aold);
    Bold = QAP.transposeMatrix(Bold);
    Cold = QAP.transposeMatrix(Cold);
    let xarr = [];
    for (let x = 1; x <= Aold[0].length; x++) {
      xarr.push(new Field2(bn2 , bigInt(x) ));
    }

    let Ap = []; let Bp = []; let Cp = []; let Z = [];
    for (let a of Aold) {
      //console.log(`lagrange a ${xarr} ${a}`, xarr[0].bn.p == bn.n);
      Ap.push( Polynomial.interpolationOverField(xarr, a) );
      //console.log(`Ap ${Ap}`);
    }
    for (let b of Bold) {
      Bp.push( Polynomial.interpolationOverField(xarr, b) );
    }
    for (let c of Cold) {
      Cp.push( Polynomial.interpolationOverField(xarr, c) );
    }
    
    Z.push(new Field2(bn2, bn2._1));
  
    for (let i = 1; i<= Aold[0].length; i++) {
      let val =  new Field2(bn2, bn2.p.subtract(i)   );
      
      //console.log('Zi', i, val.toString())
      Z = Polynomial.mul(Z, [val, new Field2(bn2, bn2._1)]);
    }
  
    return {Ap, Bp, Cp, Z};
  }

}

export default QAP;