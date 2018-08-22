import Pairing from './pairing/Pairing'
import CryptoRandom from './pairing/Rnd'
import ExNumber from './pairing/ExNumber'
import { Polynomial, bn, bn2 } from './Polynomial'
import { Field12 } from './pairing/Fields';
import { Curve, Curve2 } from './pairing/Curves'
import { Field2 } from './pairing/Fields'
import bigInt from 'big-integer'

const E  = new Curve(bn);
const Et = new Curve2(E);

let pair = new Pairing(Et);
let rng = new CryptoRandom();

    let aa = bigInt("39496560418996979");
    let bb =  bigInt("2");
    let cc =  bigInt("39496560418996977");

    let a1 = pair.ate( E.G.multiply(aa), Et.Gt.multiply(bb)  );
    let a2 = pair.ate( E.G.multiply(cc), Et.Gt  );
    console.log('equality', a1.eq(a2) )
    console.log('p',bn2.p)
    console.log('n', ExNumber.intValue(E.bn.n));