import Pairing from './pairing/Pairing'
import CryptoRandom from './pairing/Rnd'
import ExNumber from './pairing/ExNumber'
import { Polynomial, bn, bn2 } from './Polynomial'
import { Field12 } from './pairing/Fields';
import { Field2 } from './pairing/Fields'
import bigInt from 'big-integer'
import { Point , Point2 } from './pairing/Points';

function linearCombinationOne(r, A) {
  let Apoly = [];

  for (let i=0; i < r.length; i++) {
    Apoly = Polynomial.add(Apoly, Polynomial.mul([r[i]], A[i]));
  }

  return Apoly;
}

function linearCombinationThree(r, A, E, G, flag) {
  let f
  if (flag)
   f = new Point(E);
  else 
   f = new Point2(E);

  for (let i = 0; i < r.length && i<A.length; i++) {
    f = f.add( A[i].multiply(r[i].re)   ) ;
  }

  return f;
}

class TrustedSetup {
  constructor (E, Et) {
    this.E = E;
    this.Et = Et;
    this.pair = new Pairing(Et);
    this.rng = new CryptoRandom();
  }

  createkey(A, B, C, Z, input) {
    let t = new Field2(bn2, bigInt(54));
    let alphaA = new Field2(bn2, this.rng);
    let alphaB = new Field2(bn2, bigInt(54));
    let alphaC = new Field2(bn2, bigInt(12));
    let beta = new Field2(bn2, bigInt(12));
    let gamma = new Field2(bn2, bigInt(34));
    let rA  = new Field2(bn2, bigInt(333));
    let rB  = new Field2(bn2, bigInt(332));
    let rC  = rA.multiply(rB);

    let d = A.length;

    console.log('B',B);

    let At = [], Bt = [], Ct = [], Zt = [];

    Zt = Polynomial.evaluateField(Z, t);
    let pZ = this.Et.kG( Zt.re ).multiply(rC.re);

    for (let x = 0; x < d; x++) {
      At[x] = Polynomial.evaluateField(A[x], t).re;
      Bt[x] = Polynomial.evaluateField(B[x], t).re;
      Ct[x] = Polynomial.evaluateField(C[x], t).re;
    }

    let pkA = [] , pkB = [], pkC = [];
    let pkA2 = [] , pkB2 = [], pkC2 = [], pkK = [];
    for (let x = 0; x < d; x++) {
      pkA[x] =   this.E.G.multiply(At[x]).multiply(rA.re) ;
      pkB[x] =   this.Et.kG(Bt[x] ).multiply(rB.re);
      pkC[x] =   this.E.G.multiply(Ct[x]).multiply(rC.re) ;
      pkA2[x] =  this.E.G.multiply(At[x]).multiply(alphaA.re).multiply(rA.re) ;
      pkB2[x] =  this.E.G.multiply(Bt[x]).multiply(alphaB.re).multiply(rB.re) ;
      pkC2[x] =  this.E.G.multiply(Ct[x]).multiply(alphaC.re).multiply(rC.re) ;
      pkK[x] = this.E.G.multiply( beta.multiply(
        (rA.multiply( At[x] )).add( 
        (rB.multiply( Bt[x] )).add(
        (rC.multiply( Ct[x] ))))).re); 
    }

    let pkH = [];
    let ti = new Field2(bn2, bn2._1);
    for (let i = 0; i <= d; ++i)
    {
        pkH[i] = this.E.G.multiply(ti.re);
        ti = ti.multiply(t);
    }

    let vkA = this.Et.kG(alphaA.re);
    let vkB = this.E.G.multiply(alphaB.re);
    let vkC = this.Et.kG(alphaC.re);
    let vkG = this.Et.kG(gamma.re);
    let vkBG1 = this.E.G.multiply(gamma.multiply(beta).re);
    let vkBG2 = this.Et.kG(gamma.multiply(beta).re);

    let vkIC = [];
    for (let x = 1 ; x<=1; x++) {
      vkIC[x] = pkA[x];
      pkA[x] = new Point(this.E);
      pkA2[x] = new Point(this.E);
    }
    console.log(`~~~~~ Setup ~~~~~~~`);
    console.log(`t = ${t}`);
    console.log(`alphaA = ${alphaA}`);
    console.log(`alphaB = ${alphaB}`);
    console.log(`alphaC = ${alphaC}`);

    let result = { 
      pk: {pkA, pkB, pkC, pkA2, pkB2, pkC2, pkK, pkH}, 
      vk: { pZ, vkA, vkB, vkC, vkG, vkBG1, vkBG2, vkIC} 
    };

    console.log(`result `);
    console.dir(result);

    return result;

  }

  prover(A, B, C, Z, pk, r) {

    let Ares = linearCombinationOne(r, A);
    let Bres = linearCombinationOne(r, B);
    let Cres = linearCombinationOne(r, C);

    console.log('Ares.t', Ares.length);
    console.log('Z', Z.length);

    let s1 = new Field2(bn2, bigInt(25));
    let s2 = new Field2(bn2, bigInt(25));
    let s3 = new Field2(bn2, bigInt(25));



    let o = Polynomial.sub(Polynomial.mul(Ares, Bres), Cres);
    let H2 =  Polynomial.polyLongDivField(o, Z) ;

    let pA = linearCombinationThree(r, pk.pkA, this.E, this.E.G, true);
    let pB = linearCombinationThree(r, pk.pkB, this.Et, this.Et.Gt, false);
    let pC = linearCombinationThree(r, pk.pkC, this.E, this.E.G, true);
    let pK = linearCombinationThree(r, pk.pkK, this.E, this.E.G, true);

    let pA2 = linearCombinationThree(r, pk.pkA2, this.E, this.E.G, true);
    let pB2 = linearCombinationThree(r, pk.pkB2, this.E, this.E.G, true);
    let pC2 = linearCombinationThree(r, pk.pkC2, this.E, this.E.G, true);

    let pH = linearCombinationThree(H2.q, pk.pkH, this.E, this.E.G, true);

    //let pH = this.E.G.multiply( Hs.re );
    console.log(`~~~~~ Prover ~~~~~~~`);

    return {pA, pB, pC, pA2, pB2, pC2, pK, pH };
  }

  verify(proof, vk, input) {

    let pAvkA = this.pair.ate(proof.pA, vk.vkA);
    let PA2G2 = this.pair.ate(proof.pA2, this.Et.Gt);
    let pBvkB = this.pair.ate(vk.vkB, proof.pB);
    let PB2G2 = this.pair.ate(proof.pB2, this.Et.Gt);
    let pCvkC = this.pair.ate(proof.pC, vk.vkC);
    let PC2G2 = this.pair.ate(proof.pC2, this.Et.Gt);

    console.log(`~~~~~ Verifier ~~~~~~~`);

    console.log(input);

    let vkx = new Point(this.E);


    for (let i=1; i<input.length; i++) {
      vkx = vkx.add( vk.vkIC[i].multiply(input[i].re));
    }

    console.log('vkx', vkx);

    let f1 = pAvkA.eq(PA2G2);
    let f2 = pBvkB.eq(PB2G2);
    let f3 = pCvkC.eq(PC2G2);

    console.log('e(pA, vkA) == e(pA\', G2)', f1 );
    console.log('e(vkB, pB) == e(pB\', G2)', f2 );
    console.log('e(pC, vkC) == e(pC\', G2)', f3 );

    console.log('Check validity of knowledge commitments for A, B, C => ', f1 && f2 && f3);

    let pkKvkG = this.pair.ate(proof.pK, vk.vkG);
    let pApCvkGB2 = this.pair.ate(proof.pA.add(vkx).add(proof.pC), vk.vkBG2);
    let pvkBG1pB =this.pair.ate(vk.vkBG1, proof.pB);

    let f4 = pkKvkG.eq(pApCvkGB2.multiply(pvkBG1pB));

    console.log('Check same coefficients were used => ', f4);

    let ab = this.pair.ate(proof.pA.add(vkx), proof.pB);
    let hz = this.pair.ate(proof.pH, vk.pZ);
    let hc = hz.multiply(this.pair.ate(proof.pC, this.Et.Gt));
    let abhc = ab.multiply(hc.inverse());
    let Fp12one = new Field12(bn, bn._1);
    let f5 = Fp12one.eq(abhc);

    console.log('e(a,b) /  e(c, G2) = e(h, z)  ',  f5 );
    return  f1 && f2 && f3 && f5;
  }
}


export default TrustedSetup;