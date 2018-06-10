'use strict';

import CryptoRandom from './pairing/Rnd'
import { Point, Point2 } from './pairing/Points' 
import { Field2, Field4, Field6, Field12 } from './pairing/Fields' 
import Parameters from './pairing/Parameters'
import { Curve, Curve2 } from './pairing/Curves'
import Pairing from './pairing/Pairing'
import bigInt from 'big-integer'
import ExNumber from './pairing/ExNumber'

const rng = new CryptoRandom();

class BLSSigner {
    static sign(Et, H,s) {
        return H.multiply(s);
    }
    static verify(pair, Q, H, sQ, sH) {
        let a = pair.tate(sQ, H);
        let b = pair.tate(Q, sH);
        return(a.eq(b));
    }
}

const br = [192, 256];

/*
const m5 = new BigInteger('5');
m5 = m5.negate();
m5 = m5.add(new BigInteger('10')).subtract(new BigInteger('2')).
multiply(new BigInteger('2')).subtract(new BigInteger('1')).square().divide(new BigInteger('5')).shiftLeft(1).shiftRight(1);
console.log(m5.equals(new BigInteger('5'))); 
m5 = m5.modPow(new BigInteger('501'), new BigInteger('3'));
console.log('modpow501mod3',m5);
console.log('bitLength', m5.bitLength() )
console.log('byteArr', new BigInteger('514').toByteArray() )
console.log('intValue', new BigInteger('2147483649').intValue() )
console.log('compareTo', new BigInteger('5').compareTo(new BigInteger('4')) );
console.log('signum', new BigInteger('-5').signum() );
console.log('7mod3', new BigInteger('7').mod(new BigInteger('3')))
console.log('3modinv11', new BigInteger('3').modInverse(new BigInteger('11')))
console.log('6testbit1', new BigInteger('6').testBit(new BigInteger('1')))
console.log('6testbit2', new BigInteger('6').testBit(new BigInteger('2')))
console.log('6testbit3', new BigInteger('6').testBit(new BigInteger('3')))
const five = new MyNumber('5');
let m25 = five.negate().add(bigInt(10)).subtract(bigInt(2)).
multiply(bigInt(2)).subtract(bigInt(1)).square().divide(bigInt(5)).shiftLeft(1).shiftRight(1);
console.log('equals',m25.equals(bigInt(5)));
m25 = m25.modPow(bigInt(501), bigInt(3));
console.log('modpow501mod3',m25);
console.log('bitlength',m25.bitLength());
console.log('byteArr',bigInt(514).toArray(256));
console.log('intValue', new MyNumber('2147483649').intValue()  )
console.log('compareTo', bigInt(5).compare(bigInt(4)) );
console.log('signum', new MyNumber('-5').signum() );
console.log('7mod3', bigInt('7').mod(bigInt(3)))
console.log('3modinv11', bigInt('3').modInv(bigInt(11)))
console.log('6testbit1', new MyNumber(bigInt('6')).testBit(1)   )
console.log('6testbit2', new MyNumber(bigInt('6')).testBit(2)   )
console.log('6testbit3', new MyNumber(bigInt('6')).testBit(3)   )
console.log('-2mod16',new BigInteger('-17').mod(new BigInteger('5')).toString(10));
console.log('-2mod16',new ExNumber(bigInt('-17')).mod(bigInt('5')).toString(10));

var numBits = 256; // caveat: maybe using larger values is better
console.log("Testing E(F_p) arithmetic...");
let iterations = 1;
for (var i = 0; i < br.length; i++) {
    var bn = new Parameters(br[i]);
    var E = new Curve(bn);
    var rand = new CryptoRandom();
    for (var j = 0; j < iterations; j++) {
        console.log("test #" + j);
        var x = E.G.randomize(rand);
        var y = E.G.randomize(rand);
        var z = E.G.randomize(rand);
        var ecZero = E.G.E.infinity;
        var m = new ExNumber(numBits, rand).int();
        var n = new ExNumber(numBits, rand).int();
        if (iterations === 1) {
            console.log("\nchecking cloning/comparison/pertinence");
        }
        if (!x.eq(x)) {
            throw new Error("Comparison failure");
        }
        if (!x.same(x)) {
            throw new Error("Inconsistent pertinence self-comparison");
        }
        if (!x.E.contains(x)) {
            throw new Error("Inconsistent curve pertinence");
        }

        if (iterations === 1) {
            console.log(" done.\nchecking addition properties");
        }
        if (!x.add(y).eq(y.add(x))) {
            throw new Error("x + y != y + x");
        }
        if (!x.add(ecZero).eq(x)) {
            throw new Error("x + 0 != x");
        }
        if (!x.add(x.neg()).zero()) {
            throw new Error("x + (-x) != 0");
        }
        if (!x.add(y).add(z).eq(x.add(y.add(z)))) {
            throw new Error("(x + y) + z != x + (y + z)");
        }
        if (!x.neg().neg().eq(x)) {
            throw new Error("-(-x) != x");
        }

        if (iterations === 1) {
            console.log(" done.\nchecking scalar multiplication properties");
        }
        if (!x.multiply(bigInt("0")).eq(ecZero)) {
            throw new Error("0*x != 0");
        }
        if (!x.multiply(bigInt("1")).eq(x)) {
            throw new Error("1*x != x");
        }
        if (!x.multiply(bigInt("2")).eq(x.twice(1))) {
            throw new Error("2*x != twice x");
        }
        if (!x.multiply(bigInt("2")).eq(x.add(x))) {
            throw new Error("2*x != x + x");
        }
        if (!x.multiply(bigInt("-1")).eq(x.neg())) {
            throw new Error("(-1)*x != -x");
        }
        if (!x.multiply(m.negate()).eq(x.neg().multiply(m))) {
            throw new Error("(-m)*x != m*(-x)");
        }
        if (!x.multiply(m.negate()).eq(x.multiply(m).neg())) {
            throw new Error("(-m)*x != -(m*x)");
        }
        if (!x.multiply(m.add(n)).eq(x.multiply(m).add(x.multiply(n)))) {
            throw new Error("(m + n)*x != m*x + n*x");
        }
        var w = x.multiply(n).multiply(m);
        if (!w.eq(x.multiply(m).multiply(n))) {
            throw new Error("m*(n*x) != n*(m*x)");
        }
        if (!w.eq(x.multiply(m.multiply(n)))) {
            throw new Error("m*(n*x) != (m*n)*x");
        }
    }
}
var numBits = 256; 
    console.log("Testing E'(F_{p^2}) arithmetic...");
    for (var i = 0; i < br.length; i++) {
        var bn = new Parameters(br[i]);
        var E = new Curve(bn);
        var Et = new Curve2(E);
        var rand = new CryptoRandom();
        for (var j = 0; j < iterations; j++) {
            console.log("test #" + j);
            var x = Et.Gt.randomize(rand);
            var y = Et.Gt.randomize(rand);
            var z = Et.Gt.randomize(rand);
            var ecZero = Et.Gt.E.infinity;
            var m = new ExNumber(numBits, rand).int();
            var n = new ExNumber(numBits, rand).int();
            if (iterations === 1) {
                console.log("\nchecking cloning/comparison/pertinence");
            }
            if (!x.eq(x)) {
                throw new Error("Comparison failure");
            }
            if (!x.same(x)) {
                throw new Error("Inconsistent pertinence self-comparison");
            }
            if (!x.E.contains(x)) {
                throw new Error("Inconsistent curve pertinence");
            }
            // check addition properties:
            if (iterations === 1) {
                console.log(" done.\nchecking addition properties");
            }
            if (!x.twice(1).eq(x.add(x))) {
                throw new Error("2*x != x + x");
            }
            if (!x.add(y).eq(y.add(x))) {
                throw new Error("x + y != y + x");
            }
            if (!x.add(ecZero).eq(x)) {
                throw new Error("x + 0 != x");
            }
            if (!x.add(x.neg()).zero()) {
                throw new Error("x + (-x) != 0");
            }
            if (!x.add(y).add(z).eq(x.add(y.add(z)))) {
                throw new Error("(x + y) + z != x + (y + z)");
            }
            if (!x.neg().neg().eq(x)) {
                throw new Error("-(-x) != x");
            }
            // check scalar multiplication properties:
            if (iterations === 1) {
                console.log(" done.\nchecking scalar multiplication properties");
            }
            if (!x.multiply(bigInt("0")).eq(ecZero)) {
                throw new Error("0*x != 0");
            }
            if (!x.multiply(bigInt("1")).eq(x)) {
                throw new Error("1*x != x");
            }
            let xxx = x.multiply(bigInt("2"));
            let xx2 = x.twice(1);
            console.log('x',xxx.x.toString(),xxx.y.toString(),xxx.z.toString() )
            console.log('twice x',xx2.x.toString(),xx2.y.toString(),xx2.z.toString() )

            if (!x.multiply(bigInt("2")).eq(x.twice(1))) {
                throw new Error("2*x != twice x");
            }
            if (!x.multiply(bigInt("2")).eq(x.add(x))) {
                throw new Error("2*x != x + x");
            }
            if (!x.multiply(bigInt("-1")).eq(x.neg())) {
                throw new Error("(-1)*x != -x");
            }
            if (!x.multiply(m.negate()).eq(x.neg().multiply(m))) {
                throw new Error("(-m)*x != m*(-x)");
            }
            if (!x.multiply(m.negate()).eq(x.multiply(m).neg())) {
                throw new Error("(-m)*x != -(m*x)");
            }
            if (!x.multiply(m.add(n)).eq(x.multiply(m).add(x.multiply(n)))) {
                throw new Error("(m + n)*x != m*x + n*x");
            }
            var w = x.multiply(n).multiply(m);
            if (!w.eq(x.multiply(m).multiply(n))) {
                throw new Error("m*(n*x) != n*(m*x)");
            }
            if (!w.eq(x.multiply(m.multiply(n)))) {
                throw new Error("m*(n*x) != (m*n)*x");
            }
            if (!x.multiply(bn.p).eq(x.norm().frobex(1))) {
                console.log("x^p    = " + x.multiply(bn.p));
                console.log("Phi(x) = " + x.norm().frobex(1));
                throw new Error("inconsistent Frobenius");
            }
            if (!x.multiply(bn.p).multiply(bn.p).eq(x.norm().frobex(2))) {
                throw new Error("inconsistent Frobenius");
            }
            if (!x.multiply(bn.p).multiply(bn.p).multiply(bn.p).eq(x.norm().frobex(3))) {
                throw new Error("inconsistent Frobenius");
            }
        }
    }
let pairType = 'tate';
for (var i = 0; i < br.length; i++) {
    var bn = new Parameters(br[i]);
    var E = new Curve(bn);
    var Et = new Curve2(E);
    var pair = new Pairing(Et);
    var Q = Et.Gt;
    var nQ = Q.multiply(bn.n).norm();
    var tQ = Q.multiply(bn.t.subtract(bn._1)).norm();
    var pQ = Q.multiply(bn.p).norm();
    var fbx = Q.frobex(1);
    var p2Q = Q.multiply(bn.p.pow(2)).norm();
    var fbx2 = Q.frobex(2);
    var p3Q = Q.multiply(bn.p.pow(3)).norm();
    var fbx3 = Q.frobex(3);
    console.log("n*Q = [(" + nQ.x.re + ", " + nQ.x.im + ") : (" + nQ.y.re + ", " + nQ.y.im + ") : (" + nQ.z.re + ", " + nQ.z.im + ")]");
    console.log("(t-1)*Q = [(" + tQ.x.re + ", " + tQ.x.im + ") : (" + tQ.y.re + ", " + tQ.y.im + ") : (" + tQ.z.re + ", " + tQ.z.im + ")]");
    console.log("p*Q = [(" + pQ.x.re + ", " + pQ.x.im + ") : (" + pQ.y.re + ", " + pQ.y.im + ") : (" + pQ.z.re + ", " + pQ.z.im + ")]");
    console.log("frobex(Q) = [(" + fbx.x.re + ", " + fbx.x.im + ") : (" + fbx.y.re + ", " + fbx.y.im + ") : (" + fbx.z.re + ", " + fbx.z.im + ")]");
    console.log("frobex(Q) in E' = " + Et.contains(Q.frobex(1)));
    console.log("p^2*Q = [(" + p2Q.x.re + ", " + p2Q.x.im + ") : (" + p2Q.y.re + ", " + p2Q.y.im + ") : (" + p2Q.z.re + ", " + p2Q.z.im + ")]");
    console.log("frobex(Q) = [(" + fbx2.x.re + ", " + fbx2.x.im + ") : (" + fbx2.y.re + ", " + fbx2.y.im + ") : (" + fbx2.z.re + ", " + fbx2.z.im + ")]");
    console.log("frobex(Q) in E' = " + Et.contains(Q.frobex(2)));
    console.log("p^3*Q = [(" + p3Q.x.re + ", " + p3Q.x.im + ") : (" + p3Q.y.re + ", " + p3Q.y.im + ") : (" + p3Q.z.re + ", " + p3Q.z.im + ")]");
    console.log("frobex(Q) = [(" + fbx3.x.re + ", " + fbx3.x.im + ") : (" + fbx3.y.re + ", " + fbx3.y.im + ") : (" + fbx3.z.re + ", " + fbx3.z.im + ")]");
    console.log("frobex(Q) in E' = " + Et.contains(Q.frobex(3)));
    Q = Q.multiply(bn._6);
    if (!Q.multiply(bn.p).eq(Q.norm().frobex(1))) {
        throw new Error("inconsistent Frobenius");
    }
    switch (pairType) {
        case "tate":
            var g = pair.tate(E.G, Et.Gt);
            break;
        case "ate":
            var g = pair.ate(Et.Gt, E.G);
            break;
        case "eta":
            var g = pair.eta(E.G, Et.Gt);
            break;
        case "opt":
    var g = pair.opt(Et.Gt, E.G);
            break;
        default:
            throw new Error("Invalid pairing type.");
    }
    console.log("(JSField12)((" + g.v[0].re + "," + g.v[0].im + "),(" + g.v[1].re + "," + g.v[1].im + "),(" + g.v[2].re + "," + g.v[2].im + "),(" +
                    g.v[3].re + "," + g.v[3].im + "),(" + g.v[4].re + "," + g.v[4].im + "),(" + g.v[5].re + "," + g.v[5].im + "))");
    if (g.zero()) {
        throw new Error("degeneracy error!");
    }
    //if (!g.exp(bn.n).isOne()) {
    //    throw new Error("G_T order error!");
    //}
    
    switch (pairType) {
        case "tate":
            var a = pair.tate(E.G.twice(1).norm(), Et.Gt);
            var b = pair.tate(E.G, Et.Gt.twice(1).norm());
            break;
        case "ate":
            var a = pair.ate(Et.Gt.twice(1), E.G);
            var b = pair.ate(Et.Gt, E.G.twice(1));
            break;
        case "eta":
            var a = pair.eta(E.G.twice(1).norm(), Et.Gt);
            var b = pair.eta(E.G, Et.Gt.twice(1).norm());
            break;
        case "opt":
            var a = pair.opt(Et.Gt.twice(1), E.G);
            var b = pair.opt(Et.Gt, E.G.twice(1));
            break;
        default:
            throw new Error("Invalid pairing type.");
    }
    var c = g.square();
    console.log("bilinear? " + (a.eq(b) && b.eq(c)));
    if (!(a.eq(b) && b.eq(c)) || a.one()) {
        console.log(">>>> a = " + a);
        console.log(">>>> b = " + b);
        console.log(">>>> c = " + c);
        throw new Error("Bilinearity error!");
    }
    for (var j = 0; j < 10; j++) {
        var m = new ExNumber(br[i], rng).int();
        switch (pairType) {
            case "tate":
                a = pair.tate(E.G.multiply(m), Et.Gt);
                b = pair.tate(E.G, Et.Gt.multiply(m));
                break;
            case "ate":
                a = pair.ate(Et.Gt.multiply(m), E.G);
                b = pair.ate(Et.Gt, E.G.multiply(m));
                break;
            case "eta":
                a = pair.eta(E.G.multiply(m), Et.Gt);
                b = pair.eta(E.G, Et.Gt.multiply(m));
                break;
            case "opt":
                a = pair.opt(Et.Gt.multiply(m), E.G);
                b = pair.opt(Et.Gt, E.G.multiply(m));
                break;
            default:
                throw new Error("Invalid pairing type.");
        }
        c = g.exp(m);
        console.log("bilinear? " + (a.eq(b) && b.eq(c)));
        if (!(a.eq(b) && b.eq(c)) || a.one()) {
            console.log(">>>> a = " + a);
            console.log(">>>> b = " + b);
            console.log(">>>> c = " + c);
            throw new Error("Bilinearity error!");
        }
    }
}*/


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

console.log(rng)
console.log(rng.nextBytes(10));

for (let b of br) {
    console.time('t'+b)
    const bn = new Parameters(b);
    const E  = new Curve(bn);
    const Et = new Curve2(E);
    const pair = new Pairing(Et);
    
    const s = bigInt(5);
    let H = Et.pointFactory(rng);
    const Q = E.pointFactory(rng);
    const sQ = Q.multiply(s);
    const sH = BLSSigner.sign(Et,  H,  s);
    const sH2 = BLSSigner.sign(Et, H, 4);
    
    console.log('\x1b[37m', ' Q ('+b+') = (' + (Q.x)+ ', ' +(Q.y)+ ', ' +(Q.z)+')');
    console.log('\x1b[37m', ' sQ('+b+') = (' + (sQ.x)+ ', ' +(sQ.y)+ ', ' +(sQ.z)+')');
    console.log('\x1b[37m', ' H ('+b+') = (' + (H.x.re)+ ', ' +(H.y.re)+ ', ' +(H.z.re)+')');
    console.log('\x1b[37m', ' sH('+b+') = (' + (sH.x.re)+ ', ' +(sH.y.re)+ ', ' +(sH.z.re)+')');

    console.log( '\x1b[33m', ' Verify(Q,sQ,H,sH) = ' + BLSSigner.verify(pair, Q,H,sQ,sH)+'');
    console.timeEnd('t'+b)

    console.log('\x1b[31m', ' Verify(Q,sQ,H,s2H) = ' + BLSSigner.verify(pair, Q,H,sQ,sH2)+'');
    
    console.log('\x1b[32m','-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-+*+-')
}
