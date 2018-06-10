import bigInt from 'big-integer'

class ExNumber {

    constructor(n, b) {
        if (typeof n === 'number'){
            this.randomN(n, b);
        } else if (typeof n === 'string' ) {
            if (typeof b === 'number') {
                this.n = bigInt(n, b);
            }
            this.n = bigInt(n);
        } else
            this.n = n; 
    }

    mod(p) {
        if (this.n < 0) {
            if (typeof p === 'number') {
                return p-(this.n.negate().mod(5));
            } else
                return p.subtract(this.n.negate().mod(p));
        }
        return this.n.mod(p);

    }

    randomN(nbits, b) {
        this.n = bigInt.randBetween(bigInt.zero, bigInt(2).pow(nbits) );
    }

    toByteArray() {
        let ar = this.n.toArray(256).value;
        for (let b in ar) {
            if (ar[b]>128) ar[b]=-256+ar[b];
        }
        return ar;
    }

    neg() {
        return bigInt.zero.subtract(this.n);
    }

    intValue() {
        return this.n.toJSNumber() | 0;
    }

    signum() {
        if (this.n.isZero()) {
            return 0;
        } else if (this.n.isNegative()) {
            return -1;
        } else {
            return 1;
        }
    }
    testBit(n) {
        return ( !this.n.and( bigInt.one.shiftLeft(n) ).isZero() );
    }

    int() {
        return this.n;
    }
}

export default ExNumber;