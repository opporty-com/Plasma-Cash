'use strict';

import CryptoRandom from './pairing/Rnd'
import { Curve, Curve2 } from './pairing/Curves'
import { Field2 } from './pairing/Fields'

import bigInt from 'big-integer'
import R1CS from './R1CS'
import QAP from './QAP'
import { Polynomial, bn, bn2 } from './Polynomial'
import TrustedSetup from './TrustedSetup'

const rng = new CryptoRandom();

function evalAll(polymatrix, x) {
  let res = [];
  for (let i=0; i< polymatrix.length; i++) {
    res.push(Polynomial.evaluateField(polymatrix[i], new Field2(bn2, bigInt(x))));
  }
  return res;
}

function linearCombination(r, new_A, new_B, new_C) {
  let Apoly = [];
  for (let i=1; i < r.length; i++) {
    Apoly = Polynomial.add(Apoly, Polynomial.mul([r[i]], new_A[i]));
  }
  let Bpoly = []
  for (let i=1; i < r.length; i++) {
    Bpoly = Polynomial.add(Bpoly, Polynomial.mul([r[i]], new_B[i]));
  }
  let Cpoly = []
  for (let i=1; i < r.length; i++) {
    Cpoly = Polynomial.add(Cpoly, Polynomial.mul([r[i]], new_C[i]));
  }
  
  let o = Polynomial.sub(Polynomial.mul(Apoly, Bpoly), Cpoly)
  
  return { Apoly, Bpoly, Cpoly, sol:o }
}

function toR1CS(code, input_vars)
{
  const { inputs, body } = R1CS.extractCode(code);

  let flatcode = R1CS.convertToFlat(body);

  console.log('Flattened code')
  console.dir(flatcode);

  const {A, B, C} = R1CS.fromFlatcode(inputs, flatcode);
  const r = R1CS.evaluateCode(inputs, input_vars, flatcode);
  const {Ap, Bp, Cp, Z } = QAP.fromR1CS(A, B, C);
 
  res = evalAll(Bp, 1);
  res = evalAll(Cp, 1);
  res = evalAll(Ap, 2);
  res = evalAll(Bp, 2);
  res = evalAll(Cp, 2);

  const { sol } = linearCombination(r, Ap, Bp, Cp);
  
  Z.push(new Field2(bn2, bn2._0))
  Z.push(new Field2(bn2, bn2._0))
  let H =  Polynomial.polyLongDivField(sol, Z) ;

  let back = Polynomial.add( Polynomial.mul(H.q,Z), H.r);

  const E  = new Curve(bn);
  const Et = new Curve2(E);
  const ts = new TrustedSetup(E, Et);

  const {pk,vk} = ts.createkey( Ap, Bp, Cp, Z );
  const proof = ts.prover(Ap, Bp, Cp, Z, pk, r);

  const result = ts.verify(proof,vk, r.slice(0,2));
  console.log ('Verifiable or NOT? => ', result);
}

/*
let P = new Polynomial([ 2,3,4,5 ], 7);
let e = P.evaluate(2);
P.toString();
console.log('P(2)', e);
console.log('Phidings', P.hidings(2) );

var field = new PrimeField(7);
console.log('field7 5+4=', field.add(5, 4)); 

let kf = new KnowledgeCoefficient(1, 2, [2,3,4,5], 7);
kf.respond(4);
kf.toString();
let hid = kf.generateHidings(2, 4);
let Ps = kf.evaluatePolynomial(hid.hidings);
let Pas = kf.evaluatePolynomial(hid.hidingsalpha);
console.log('Ps', Ps);
console.log('Pas', Pas);
*/

toR1CS(`
function qeval(x) {
    let y = x**3
    return y + x + 5
}
`, [3]);