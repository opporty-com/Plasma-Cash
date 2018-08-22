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

  console.log(`A ${A}`);
  console.log(`B ${B}`);
  console.log(`C ${C}`);
  console.log(`r ${r}`);

  console.log(`Ap ${Ap}`);
  console.log(`Bp ${Bp}`);
  console.log(`Cp ${Cp}`);
  console.log(`Z ${Z}` );
  console.log(`Z[1]`, Z[1]);

  var res = evalAll(Ap, 1);
  let evalf5 = Polynomial.evaluateField(Ap[1], new Field2(bn2, bigInt("1") ) );
  console.log(`evalf5 ${Ap[1]} ${evalf5}`)

  console.log(`Aeval1 ${res}`);
  res = evalAll(Bp, 1);
  console.log(`Beval1 ${res}`);
  res = evalAll(Cp, 1);
  console.log(`Ceval1 ${res}`);
   res = evalAll(Ap, 2);
  console.log(`Aeval2 ${res}`);
  res = evalAll(Bp, 2);
  console.log(`Beval2 ${res}`);
  res = evalAll(Cp, 2);
  console.log(`Ceval2 ${res}`);

  //r[4] = 2;

  const { sol } = linearCombination(r, Ap, Bp, Cp);
  
  console.log(`sol ${sol}` );

  console.log( `Z cofactor ${Z}` );
  Z.push(new Field2(bn2, bn2._0))
  Z.push(new Field2(bn2, bn2._0))
  let H =  Polynomial.polyLongDivField(sol, Z) ;
  console.log(`H ${H.q} + ${H.r}`);

  let back = Polynomial.add( Polynomial.mul(H.q,Z), H.r);
  console.log(`Zback ${back}`)

  const E  = new Curve(bn);
  const Et = new Curve2(E);
  const ts = new TrustedSetup(E, Et);

  const {pk,vk} = ts.createkey( Ap, Bp, Cp, Z );
  const proof = ts.prover(Ap, Bp, Cp, Z, pk, r);


  console.log(`pA ${proof.pA}` );
  console.log(`pB ${proof.pB}` );
  console.log(`pB2 ${proof.pB2}`);
  console.log(`pC ${proof.pC}` );
  console.log(`pH ${proof.pH}` );
  console.log(`pZ ${vk.pZ}` );

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

/*
let vk = [
  [0,1],
  [0,1],
  [1,0],
  [0,0],
  [0,0],
  [0,0]
];

let wk = [
  [0,0],
  [0,0],
  [0,0],
  [1,0],
  [0,1],
  [0,0]
];

let yk = [
  [0,0],
  [0,0],
  [0,0],
  [0,0],
  [1,0],
  [0,1]
]

let c = [
  1,
  2,
  3,
  4,
  12,
  36
];

let s = 1;

let vs = bigInt(0);
let m = 6;
for (let k = 0; k<m; k++) {
  vs = vs.add(bigInt(c[k]*vk[k][s]));
}

console.log('vs= ',vs)

let f5 = new Field2(bn, bigInt("15615256399876043922"));

console.log(`f5 => ${f5}`);
console.log(`f5+10=9 => ${f5.add(bigInt(10))}`)
console.log('p',bn.p);

//console.log('Polynomial lagrange => ', Polynomial.lagrange([1,0,1,0]))




let i2 = Polynomial.interpolationOverField(
  [ new Field2(bn, bigInt("1")),
    new Field2(bn, bigInt("2")),
    new Field2(bn, bigInt("3")),
    new Field2(bn, bigInt("4"))],
  [  
    new Field2(bn, bigInt("1")),
    new Field2(bn, bigInt("0")),
    new Field2(bn, bigInt("1")),
    new Field2(bn, bigInt("0"))
  ]
);

console.log(`Polynomial over field => ${i2}`);

let evalf5 = Polynomial.evaluateField(i2, new Field2(bn, bigInt("1") ))

console.log(` evaluate  P(4) => ${evalf5}`  );

let divv = Polynomial.div2([ 2, 3, 8 ],[ 1, 2 ]);
let divv3 = Polynomial.polyLongDiv([ 2, 3, 8 ],[ 1, 2, 0 ]);

let back3 = Polynomial.add2(Polynomial.mul2(divv3.q, [1,2]), divv3.r);

console.log(`8x2+3x+2/2x+1=>  ${divv.quot} + ${divv.remainder} ` );
console.log(`8x2+3x+2/2x+1=>  ${divv3.q} + ${divv3.r} ` );
console.log(`back ${back3}`)
let back = Polynomial.mul2( divv.quot , [ 1, 2 ]  );
back = Polynomial.add2(back, divv.remainder);
console.log(`back ${back}`  )
let divv2 = Polynomial.polyLongDivField(Zglob,[
  new Field2(bn, bigInt("1")),
  new Field2(bn, bigInt("2")),
  new Field2(bn, bigInt("2")),
  new Field2(bn, bigInt("2")),
  new Field2(bn, bigInt("2")),
  new Field2(bn, bn._0),
  new Field2(bn, bn._0)
]);

console.log(`8x2+3x+2/2x+1=>  ${divv2.q} + ${divv2.r} `);

let back2 = Polynomial.mul( divv2.q , 
  [
    new Field2(bn, bigInt("1")),
    new Field2(bn, bigInt("2")),
    new Field2(bn, bigInt("2")),
    new Field2(bn, bigInt("2")),
    new Field2(bn, bigInt("2")),
    new Field2(bn, bn._0),
    new Field2(bn, bn._0)
  ]
  );
back2 = Polynomial.add(back2, divv2.r);
console.log(`back2 ${back2}`)
*/