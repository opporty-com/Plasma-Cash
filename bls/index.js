'use strict';

import CryptoRandom from './pairing/Rnd'
import { Point, Point2 } from './pairing/Points' 
import { Field2, Field4, Field6, Field12 } from './pairing/Fields' 
import Parameters from './pairing/Parameters'
import { Curve, Curve2 } from './pairing/Curves'
import Pairing from './pairing/Pairing'
import bigInt from 'big-integer'

const rng = new CryptoRandom();
const bn = new Parameters(192);
const E  = new Curve(bn);
const Et = new Curve2(E);
const pair = new Pairing(Et);
let Q = E.pointFactory(rng);

class SecretKey {
    
    init() {
        let s = new Array(2);
        rng.nextBytes(s);
        this.s = bigInt(s[0]); 
    }

    getPublicKey() {
		let pk = new PublicKey();
		pk.init(this.s);
        return pk;
    }

    sign(H) {
		let sig = new Signature();
		sig.sH = H.multiply(this.s);
		if (this.id)
			sig.id = this.id;
        return sig;
    }

    getMasterSecretKey(k) 
    {
        if (k <= 1) throw Error("bad k "+ k); 
        let msk = new Array(k);
        msk[0] = this;
        for (let i = 1; i < k; i++) {
            msk[i] = new SecretKey();
            msk[i].init();
        }
        return msk;
	}
	
	share(n, k)
	{
		let msk = this.getMasterSecretKey(k);
		let secVec = new Array(n);
		let ids = new Array(n);
		for (let i = 0; i < n; i++) {
			let id = i + 1;
			ids[i] = id;
			secVec[i] = new SecretKey();
			secVec[i].s = Polynomial.eval(msk, id);
			secVec[i].id = id;
		}

		return secVec;
	}

	recover(vec) 
	{
		let s = Polynomial.lagrange(vec);
		this.s = s;
		this.id = 0;
	}
}

class Signature {
	recover(signVec) 
	{
		this.sH = Polynomial.lagrange(signVec);
		return this;
	}
}

class PublicKey {
    //G2 sQ;
	init(s)
	{
		this.sQ = Q.multiply(s);
	}

	verify(sign, H) 
	{
		let a = pair.ate(H, this.sQ);
        let b = pair.ate(sign.sH, Q);
		return(a.eq(b));
	}
}

class Polynomial {
    static init(s, k)
    {
        if (k < 2) throw Error("bls:Polynomial:init:bad k "+ k) ;
        this.c = new Array(k);
        c[0] = s;
        for (let  i = 1; i < c.length; i++) {
            let s = new Array(2);
            rng.nextBytes(s);
            c[i] = bigInt(s[0]);
        }
    }
	static eval(msk, x) {
		let s = bigInt.zero;
		for (let i =0 ; i < msk.length; i++) {
			s = s.add(msk[i].s.multiply(x ** i));
		}	
		return s;    
	}

	static calcDelta(S)
	{
		let k = S.length;
		if (k < 2) throw Error("bad size"+k);
		let delta = new Array(k);
		let a = bigInt(S[0]);
		for (let i = 1; i < k; i++) {
			a = a.multiply(bigInt(S[i]));
		}
		for (let i = 0; i < k; i++) {
			let b = bigInt(S[i]);
			for (let j = 0; j < k; j++) {
				if (j != i) {
					let v = bigInt(S[j]).subtract(S[i]);
					if (v == 0) throw Error("S has same id "+ i + ' '+j);
					b = b.multiply(v);
				}
			}
			delta[i] = a.divide(b);
		}
		
		return delta;
	}

	static lagrange(vec) {
		let S = new Array(vec.length);
		for (let i = 0; i < vec.length; i++) {
			S[i] = vec[i].id;
		}
		let delta = Polynomial.calcDelta(S);
		let r;
		if (vec[0].s) {
			r = bigInt.zero;
		} else {
			r = new Point2(Et);
		}
		for (let i = 0; i < delta.length; i++) {
			if (vec[i].s) {
				r = r.add(vec[i].s.multiply(delta[i]));
			} else {
				r = r.add(vec[i].sH.multiply(delta[i]));
			}
		}
		return r;
	}
}



class BLSSigner {
	
	static sign(Et, H,s) {
        return H.multiply(s);
	}
	
    static verify(pair, Q, H, sQ, sH) {
        let a = pair.ate(H, sQ);
        let b = pair.ate(sH, Q);
        return(a.eq(b));
    }
}


const br = [192, 256];

console.log('-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-')
console.log(' BLS Signature over EC pairings')
console.log('  Q - fixed global ')
console.log('  s - secret key ')
console.log('  sQ - public key ')
console.log('  H - message hash on G1 ')
console.log('  sH - signature ')
console.log('  e: G1 x G2 -> Fp12')
console.log('  sign(H, s) -> sH')
console.log('  verify(H, sQ, sH) -> e(sQ, H(m)) = e(Q, s H(m)<br><br>')
console.log('-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-')

let H = Et.pointFactory(rng);

for (let b of br) {

    console.time('sign');
    const s = bigInt(5);
    const Q = E.pointFactory(rng);
    const sQ = Q.multiply(s);
    const sH = BLSSigner.sign(Et,  H,  s);
    const sH2 = BLSSigner.sign(Et, H, 4);
    console.log('\x1b[37m', ' Q ('+b+') = (' + (Q.x)+ ', ' +(Q.y)+ ', ' +(Q.z)+')');
    console.log('\x1b[37m', ' sQ('+b+') = (' + (sQ.x)+ ', ' +(sQ.y)+ ', ' +(sQ.z)+')');
    console.log('\x1b[37m', ' H ('+b+') = (' + (H.x.re)+ ', ' +(H.y.re)+ ', ' +(H.z.re)+')');
    console.log('\x1b[37m', ' sH('+b+') = (' + (sH.x.re)+ ', ' +(sH.y.re)+ ', ' +(sH.z.re)+')');
    console.log('\x1b[33m', ' Verify(Q,sQ,H,sH) = ' + BLSSigner.verify(pair, Q,H,sQ,sH)+'');
    console.log('\x1b[31m', ' Verify(Q,sQ,H,s2H) = ' + BLSSigner.verify(pair, Q,H,sQ,sH2)+'');

    console.timeEnd('sign');
 
    console.log('\x1b[32m','-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-')
}
/*
 * Start testing threshold signature (k, n) - (3, 5)
 */
const n = 5;
const k = 3;
let prv0 = new SecretKey();

prv0.init();
let sig0 = new Signature(); 
sig0 = prv0.sign(H);

let pub0 = prv0.getPublicKey(pub0);
let vec = prv0.share(5, 3);

let signVec = new Array(n);
for (let i = 0; i < n; i++) {
	signVec[i] = vec[i].sign(H);

	let pub = vec[i].getPublicKey();
	if (pub == pub0) {
		throw new Error("error pub key");
	}
	if (!pub.verify(signVec[i], H)) {
		throw Error("verify error");
	}
}

// 3-n
let prvVec = new Array(3);
prvVec[0] = vec[0];
prvVec[1] = vec[1];
prvVec[2] = vec[2];

let prv = new SecretKey();
prv.recover(prvVec);
if (!prv.s.equals(prv0.s)) {
	throw Error("Error wrong shares");
}

// n-n
prv = new SecretKey();
prv.recover(vec);
if (!prv.s.equals(prv0.s)) {
	throw Error("Error wrong shares");
}

// 2-n (n = 5)
prvVec = new Array(2);
prvVec[0] = vec[0];
prvVec[1] = vec[1];
prv = new SecretKey();
prv.recover(prvVec);
if (prv.s.equals(prv0.s)) {
	throw Error("Error shares 2-5 equal original key!");
}

let sign = new Array(3);
sign[0] = signVec[0];
sign[1] = signVec[1];
sign[2] = signVec[2];

let sig = new Signature();
sig.recover(sign);

if (!sig.sH.eq(sig0.sH)) {
	throw Error('Error: can\'t restore signature!');
}

// 2-5 recover doesn't work
sign = new Array(2);
sign[0] = signVec[0];
sign[1] = signVec[1];

sig.recover(sign);

if (sig.sH.eq(sig0.sH)) {
	throw Error('Error: unlikely we can restore 2-n signature!');
}
