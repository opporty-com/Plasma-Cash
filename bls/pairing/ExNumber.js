class ExNumber {
    constructor(n) {
        if (typeof n === 'string' ) {
            this.n = bigInt(n);
        } else
            this.n = n; 
    }

    negate() {
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
}

export default ExNumber;